from flask import Flask, render_template, request, jsonify, send_from_directory, g
import sqlite3
import os
import re
import json
import math
import time
import threading
from datetime import datetime, date
from functools import lru_cache
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen

from database import get_db_connection, init_db
from matching_engine import match_donor_to_request, check_donor_eligibility, haversine_distance

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from google.auth.credentials import AnonymousCredentials
except ImportError:
    firebase_admin = None
    firebase_auth = None
    AnonymousCredentials = None

app = Flask(__name__, static_folder='static', template_folder='templates')
FIREBASE_PROJECT_ID = 'hemoconnect-85f9d'

# Ensure DB exists on startup
init_db()

BLOOD_GROUPS = {'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'}
REQUEST_URGENCY_MAP = {
    'NORMAL': 'NORMAL', 'URGENT': 'HIGH', 'EMERGENCY': 'CRITICAL_SOS',
    'HIGH': 'HIGH', 'CRITICAL_SOS': 'CRITICAL_SOS'
}
PHOTON_BASE_URL = 'https://photon.komoot.io'
_photon_lock = threading.Lock()
_photon_last_request = 0.0

def is_valid_person_name(value):
    if not isinstance(value, str):
        return False
    name = value.strip()
    return bool(name) and any(char.isalpha() for char in name) and all(char.isalpha() or char == ' ' for char in name)

def is_valid_indian_mobile(value):
    return isinstance(value, str) and bool(re.fullmatch(r'[6-9][0-9]{9}', value.strip()))

def parse_whole_number(value):
    text = str(value or '')
    return int(text) if re.fullmatch(r'[0-9]+', text) else None

def parse_coordinates(data, required=False):
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    if latitude in (None, '') and longitude in (None, ''):
        if required:
            raise ValueError('Select and confirm an address with a map location.')
        return None, None
    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        raise ValueError('The selected map location is invalid.')
    if not math.isfinite(latitude) or not math.isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError('The selected map location is outside valid coordinates.')
    return latitude, longitude

def photon_address(feature):
    properties = feature.get('properties') or {}
    coordinates = (feature.get('geometry') or {}).get('coordinates') or []
    if len(coordinates) != 2:
        return None
    try:
        longitude, latitude = float(coordinates[0]), float(coordinates[1])
    except (TypeError, ValueError):
        return None
    if not math.isfinite(latitude) or not math.isfinite(longitude) or not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return None

    street = properties.get('street')
    house_number = properties.get('housenumber')
    street_line = ' '.join(part for part in (house_number, street) if part)
    parts = [properties.get('name'), street_line, properties.get('locality'), properties.get('suburb'), properties.get('district'), properties.get('city'), properties.get('postcode'), properties.get('state'), properties.get('country')]
    formatted = []
    seen = set()
    for part in parts:
        if part and str(part).strip() and str(part).strip().casefold() not in seen:
            cleaned = str(part).strip()
            formatted.append(cleaned)
            seen.add(cleaned.casefold())
    if not formatted:
        return None
    city = next((properties.get(key) for key in ('city', 'municipality', 'town', 'village', 'district', 'county') if properties.get(key)), '')
    return {
        'address': ', '.join(formatted),
        'city': city,
        'latitude': latitude,
        'longitude': longitude
    }

@lru_cache(maxsize=256)
def photon_request(path, query_string):
    global _photon_last_request
    url = f'{PHOTON_BASE_URL}{path}?{query_string}'
    with _photon_lock:
        wait = max(0.0, 1.0 - (time.monotonic() - _photon_last_request))
        if wait:
            time.sleep(wait)
        _photon_last_request = time.monotonic()
        http_request = UrlRequest(url, headers={
            'Accept': 'application/geo+json, application/json',
            'User-Agent': 'HemoConnect/1.0'
        })
        with urlopen(http_request, timeout=6) as response:
            return json.loads(response.read().decode('utf-8'))

def public_donor_record(row):
    donor = dict(row)
    owner_uid = donor.pop('owner_uid', None)
    has_coordinates = donor.get('latitude') is not None and donor.get('longitude') is not None
    sharing = donor.get('location_sharing') == 1 and donor.get('coordinates_confirmed') == 1 and has_coordinates
    donor.pop('address', None)
    donor['location_sharing'] = sharing
    donor['location_is_approximate'] = sharing and has_coordinates
    donor['can_manage_location_sharing'] = bool(owner_uid and getattr(g, 'firebase_user', {}).get('uid') == owner_uid)
    if sharing and has_coordinates:
        donor['latitude'] = round(float(donor['latitude']), 2)
        donor['longitude'] = round(float(donor['longitude']), 2)
    else:
        donor['latitude'] = None
        donor['longitude'] = None
    return donor

# Universal CORS response headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Hemo-Guest')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response

@app.before_request
def require_firebase_authentication():
    if not request.path.startswith('/api/') or request.path == '/api/auth/config' or request.method == 'OPTIONS':
        return None

    manages_location_sharing = bool(re.fullmatch(r'/api/donors/\d+/location-sharing', request.path))
    if request.path != '/api/auth/profile' and not manages_location_sharing and request.headers.get('X-Hemo-Guest') == 'true':
        return None

    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return jsonify({'success': False, 'error': 'Sign in is required.'}), 401

    if firebase_admin is None:
        return jsonify({'success': False, 'error': 'Firebase authentication is not configured on the server.'}), 503

    try:
        firebase_app = firebase_admin.get_app('hemoconnect-auth')
    except ValueError:
        try:
            firebase_app = firebase_admin.initialize_app(
                AnonymousCredentials(),
                options={'projectId': FIREBASE_PROJECT_ID},
                name='hemoconnect-auth'
            )
        except Exception as error:
            app.logger.error('Firebase Admin initialization failed (%s)', type(error).__name__)
            return jsonify({'success': False, 'error': 'Firebase authentication is not configured on the server.'}), 503

    if firebase_app.project_id != FIREBASE_PROJECT_ID:
        app.logger.error('Firebase Admin project mismatch (expected=%s, actual=%s)', FIREBASE_PROJECT_ID, firebase_app.project_id)
        return jsonify({'success': False, 'error': 'Firebase authentication is configured for the wrong project.'}), 503

    try:
        g.firebase_user = firebase_auth.verify_id_token(authorization[7:], app=firebase_app)
    except firebase_auth.ExpiredIdTokenError:
        app.logger.warning('Firebase ID token expired (project=%s)', FIREBASE_PROJECT_ID)
        return jsonify({'success': False, 'error': 'Your sign-in session expired. Please sign in again.'}), 401
    except firebase_auth.InvalidIdTokenError as error:
        app.logger.warning('Firebase ID token rejected (%s)', type(error).__name__)
        return jsonify({'success': False, 'error': 'Your sign-in session is invalid. Please sign in again.'}), 401
    except Exception as error:
        app.logger.error('Firebase ID token verification failed (%s)', type(error).__name__)
        return jsonify({'success': False, 'error': 'The server could not verify your sign-in. Please try again.'}), 503

    return None

# Main App Page
@app.route('/')
def index():
    firebase_config = {
        'apiKey': os.getenv('FIREBASE_API_KEY', ''),
        'authDomain': os.getenv('FIREBASE_AUTH_DOMAIN', ''),
        'projectId': FIREBASE_PROJECT_ID,
        'appId': os.getenv('FIREBASE_APP_ID', ''),
        'messagingSenderId': os.getenv('FIREBASE_MESSAGING_SENDER_ID', '')
    }
    return render_template('index.html', firebase_config=firebase_config)

@app.route('/api/auth/config')
def get_auth_config():
    return jsonify({'success': True, 'configured': firebase_admin is not None and bool(FIREBASE_PROJECT_ID)})

@app.route('/api/geocode/search')
def search_addresses():
    query = request.args.get('q', '').strip()
    if len(query) < 3 or len(query) > 120:
        return jsonify({'success': False, 'error': 'Enter at least 3 characters to search.'}), 400

    params = {'q': query, 'limit': 8, 'lang': 'en'}
    if request.args.get('latitude') or request.args.get('longitude'):
        try:
            latitude, longitude = parse_coordinates(request.args, required=True)
        except ValueError as error:
            return jsonify({'success': False, 'error': str(error)}), 400
        params.update({'lat': latitude, 'lon': longitude})

    try:
        payload = photon_request('/api/', urlencode(params))
    except Exception as error:
        app.logger.warning('Photon address search unavailable (%s)', type(error).__name__)
        return jsonify({'success': False, 'error': 'Address search is temporarily unavailable. You can try again or use the map pin.'}), 502

    results = [
        address for address in (photon_address(feature) for feature in payload.get('features', []))
        if address
    ]
    return jsonify({'success': True, 'results': results})

@app.route('/api/geocode/reverse')
def reverse_geocode():
    try:
        latitude, longitude = parse_coordinates(request.args, required=True)
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    try:
        payload = photon_request('/reverse', urlencode({'lat': latitude, 'lon': longitude, 'lang': 'en'}))
    except Exception as error:
        app.logger.warning('Photon reverse lookup unavailable (%s)', type(error).__name__)
        return jsonify({'success': False, 'error': 'Could not find an address for this pin. Try moving it near a building or street.'}), 502

    features = payload.get('features', [])
    address = next((result for result in (photon_address(feature) for feature in features) if result), None)
    if not address:
        return jsonify({'success': False, 'error': 'No address was found for this pin. Move it closer to a mapped place.'}), 404
    return jsonify({'success': True, 'result': address})

@app.route('/api/auth/profile', methods=['POST'])
def save_auth_profile():
    user = g.firebase_user
    provider = user.get('firebase', {}).get('sign_in_provider', 'unknown')
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO user_profiles (firebase_uid, email, display_name, phone_number, sign_in_provider)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(firebase_uid) DO UPDATE SET
            email = excluded.email,
            display_name = excluded.display_name,
            phone_number = excluded.phone_number,
            sign_in_provider = excluded.sign_in_provider,
            updated_at = CURRENT_TIMESTAMP
    ''', (
        user['uid'],
        user.get('email'),
        user.get('name'),
        user.get('phone_number'),
        provider
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Static Assets fallback if needed
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# ==================== DONOR API ENDPOINTS ====================

@app.route('/api/donors', methods=['GET'])
def get_donors():
    blood_group = request.args.get('blood_group', '').strip().upper()
    city = request.args.get('city', '').strip()
    status = request.args.get('status', '').strip().title()
    search = request.args.get('search', '').strip().lower()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM donors WHERE 1=1"
    params = []

    if blood_group:
        query += " AND UPPER(blood_group) = ?"
        params.append(blood_group)
    if city:
        query += " AND LOWER(city) LIKE ?"
        params.append(f"%{city.lower()}%")
    if status:
        query += " AND availability_status = ?"
        params.append(status)
    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR phone LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    donors = []
    for r in rows:
        donor_dict = public_donor_record(r)
        is_eligible, days_since, days_until, elig_msg = check_donor_eligibility(
            donor_dict.get('last_donation_date'), 
            donor_dict.get('age')
        )
        donor_dict['is_eligible'] = is_eligible
        donor_dict['eligibility_msg'] = elig_msg
        donor_dict['days_until_eligible'] = days_until
        donors.append(donor_dict)

    return jsonify({'success': True, 'count': len(donors), 'donors': donors})

@app.route('/api/donors', methods=['POST'])
def register_donor():
    data = request.json or {}
    
    # Validation
    required_fields = ['name', 'age', 'blood_group', 'city', 'phone']
    missing = [f for f in required_fields if not data.get(f)]
    if not data.get('availability') and not data.get('availability_status'):
        missing.append('availability')
    if not data.get('address'):
        missing.append('address')
    if missing:
        return jsonify({'success': False, 'error': f"Missing required fields: {', '.join(missing)}"}), 400

    if data.get('address_confirmed') is not True:
        return jsonify({'success': False, 'error': 'Confirm the selected address before registering.'}), 400
    try:
        lat, lon = parse_coordinates(data, required=True)
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    age = parse_whole_number(data['age'])
    if age is None:
        return jsonify({'success': False, 'error': 'Age must be a whole number.'}), 400
    if age < 18:
        return jsonify({'success': False, 'error': 'Donors must be at least 18 years old.'}), 400
    if age > 120:
        return jsonify({'success': False, 'error': 'Donor age must be between 18 and 120 years.'}), 400
    if not is_valid_person_name(data['name']):
        return jsonify({'success': False, 'error': 'Name must contain letters and spaces only.'}), 400
    if not is_valid_indian_mobile(data['phone']):
        return jsonify({'success': False, 'error': 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'}), 400
    blood_group = str(data['blood_group']).strip().upper()
    if blood_group not in BLOOD_GROUPS:
        return jsonify({'success': False, 'error': 'Select a valid blood group.'}), 400
    city = str(data.get('city') or '').strip()
    if not city:
        return jsonify({'success': False, 'error': 'City or location is required.'}), 400

    availability_input = str(data.get('availability', data.get('availability_status', ''))).strip().lower()
    availability_status = {
        'yes': 'Available', 'no': 'Unavailable',
        'available': 'Available', 'on call': 'On Call', 'unavailable': 'Unavailable'
    }.get(availability_input)
    if not availability_status:
        return jsonify({'success': False, 'error': 'Select Yes or No for availability.'}), 400

    location_sharing = data.get('location_sharing') is True
    firebase_user = getattr(g, 'firebase_user', None)
    if location_sharing and not firebase_user:
        return jsonify({'success': False, 'error': 'Sign in to opt in to location sharing and manage this setting later.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    INSERT INTO donors (
        name, age, gender, blood_group, city, address, latitude, longitude,
        location_sharing, coordinates_confirmed, owner_uid,
        phone, email, last_donation_date, availability_status, prev_donations_count,
        weight, medical_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
    ''', (
        data['name'].strip(),
        age,
        data.get('gender', 'Other').strip(),
        blood_group,
        city,
        str(data['address']).strip(),
        lat,
        lon,
        int(location_sharing),
        1,
        firebase_user.get('uid') if firebase_user else None,
        data['phone'].strip(),
        data.get('email', '').strip(),
        data.get('last_donation_date') or None,
        availability_status,
        int(data.get('prev_donations_count', 0)),
        float(data.get('weight', 65.0)),
        data.get('medical_notes', '').strip()
    ))
    
    donor_id = cursor.fetchone()['id']
    conn.commit()
    conn.close()

    return jsonify({
        'success': True, 
        'message': 'Donor registered successfully!', 
        'donor_id': donor_id
    }), 210

@app.route('/api/donors/<int:donor_id>/location-sharing', methods=['PATCH'])
def update_donor_location_sharing(donor_id):
    data = request.json or {}
    if not isinstance(data.get('location_sharing'), bool):
        return jsonify({'success': False, 'error': 'location_sharing must be true or false.'}), 400

    user_uid = g.firebase_user.get('uid')
    conn = get_db_connection()
    donor = conn.execute('SELECT owner_uid, coordinates_confirmed FROM donors WHERE id = ?', (donor_id,)).fetchone()
    if not donor:
        conn.close()
        return jsonify({'success': False, 'error': 'Donor not found.'}), 404
    if not donor['owner_uid'] or donor['owner_uid'] != user_uid:
        conn.close()
        return jsonify({'success': False, 'error': 'Only the donor account owner can change location sharing.'}), 403
    if data['location_sharing'] and donor['coordinates_confirmed'] != 1:
        conn.close()
        return jsonify({'success': False, 'error': 'Confirm a map location before sharing it.'}), 400

    conn.execute('UPDATE donors SET location_sharing = ? WHERE id = ?', (int(data['location_sharing']), donor_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'location_sharing': data['location_sharing']})

@app.route('/api/donors/<int:donor_id>', methods=['GET'])
def get_donor_detail(donor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM donors WHERE id = ?", (donor_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'success': False, 'error': 'Donor not found'}), 404

    donor_dict = public_donor_record(row)
    is_eligible, days_since, days_until, elig_msg = check_donor_eligibility(
        donor_dict.get('last_donation_date'), 
        donor_dict.get('age')
    )
    donor_dict['is_eligible'] = is_eligible
    donor_dict['days_since_last_donation'] = days_since
    donor_dict['days_until_eligible'] = days_until
    donor_dict['eligibility_msg'] = elig_msg
    donor_dict['lives_saved_estimate'] = donor_dict.get('prev_donations_count', 0) * 3

    return jsonify({'success': True, 'donor': donor_dict})

@app.route('/api/donors/<int:donor_id>/status', methods=['PATCH'])
def update_donor_status(donor_id):
    data = request.json or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM donors WHERE id = ?", (donor_id,))
    donor = cursor.fetchone()
    if not donor:
        conn.close()
        return jsonify({'success': False, 'error': 'Donor not found'}), 404

    if 'availability_status' in data:
        status = data['availability_status'].strip().title()
        if status in ['Available', 'On Call', 'Unavailable']:
            cursor.execute("UPDATE donors SET availability_status = ? WHERE id = ?", (status, donor_id))

    if data.get('record_donation') is True:
        today_str = date.today().strftime("%Y-%m-%d")
        cursor.execute('''
        UPDATE donors 
        SET last_donation_date = ?, prev_donations_count = prev_donations_count + 1 
        WHERE id = ?
        ''', (today_str, donor_id))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Donor status updated successfully'})


# ==================== RECEIVER & REQUEST ENDPOINTS ====================

@app.route('/api/requests', methods=['GET'])
def get_requests():
    urgency = request.args.get('urgency', '').strip().upper()
    blood_group = request.args.get('blood_group', '').strip().upper()
    status = request.args.get('status', 'ACTIVE').strip().upper()
    receiver_type = request.args.get('receiver_type', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM requests WHERE 1=1"
    params = []

    if status and status != 'ALL':
        query += " AND status = ?"
        params.append(status)
    if urgency:
        query += " AND urgency_level = ?"
        params.append(urgency)
    if blood_group:
        query += " AND UPPER(blood_group) = ?"
        params.append(blood_group)
    if receiver_type:
        query += " AND LOWER(receiver_type) LIKE ?"
        params.append(f"%{receiver_type.lower()}%")

    # Order by Critical Emergency first, then newer requests
    query += " ORDER BY CASE WHEN urgency_level = 'CRITICAL_SOS' THEN 1 WHEN urgency_level = 'HIGH' THEN 2 ELSE 3 END, id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    requests_list = [dict(r) for r in rows]
    return jsonify({'success': True, 'count': len(requests_list), 'requests': requests_list})

@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.json or {}

    is_emergency_sos = data.get('reason_medical_notes') == 'IMMEDIATE EMERGENCY SOS DISPATCH TRIGGERED BY FIRST RESPONDER'
    required_fields = ['receiver_type', 'blood_group', 'units_required', 'urgency_level']
    if not is_emergency_sos:
        required_fields.append('contact_number')
    missing = [f for f in required_fields if not data.get(f)]
    location = str(data.get('city') or data.get('location') or '').strip()
    if not location:
        missing.append('location')
    if missing:
        return jsonify({'success': False, 'error': f"Missing required fields: {', '.join(missing)}"}), 400

    receiver_type = str(data['receiver_type']).strip()
    if receiver_type not in {'Hospital', 'Individual'}:
        return jsonify({'success': False, 'error': 'Receiver type must be Hospital or Individual.'}), 400

    location_address = str(data.get('location_address') or data.get('address') or data.get('location') or '').strip()
    if not is_emergency_sos and (not location_address or data.get('address_confirmed') is not True):
        return jsonify({'success': False, 'error': 'Select and confirm a specific address before submitting.'}), 400
    try:
        latitude, longitude = parse_coordinates(data, required=not is_emergency_sos)
    except ValueError as error:
        return jsonify({'success': False, 'error': str(error)}), 400

    if receiver_type == 'Hospital':
        receiver_name = str(data.get('hospital_name') or data.get('name') or '').strip()
        contact_name = str(data.get('contact_person') or data.get('patient_name') or '').strip()
        if not receiver_name:
            return jsonify({'success': False, 'error': 'Hospital name is required.'}), 400
        if not contact_name and not is_emergency_sos:
            return jsonify({'success': False, 'error': 'Contact person is required for hospital requests.'}), 400
    else:
        contact_name = str(data.get('receiver_name') or data.get('individual_name') or data.get('patient_name') or data.get('name') or '').strip()
        receiver_name = contact_name
        if not contact_name:
            return jsonify({'success': False, 'error': 'Full name is required for individual requests.'}), 400

    if contact_name and not is_valid_person_name(contact_name):
        return jsonify({'success': False, 'error': 'Name must contain letters and spaces only.'}), 400
    contact_number = data.get('contact_number') or ''
    if contact_number and not is_valid_indian_mobile(contact_number):
        return jsonify({'success': False, 'error': 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'}), 400
    blood_group = str(data['blood_group']).strip().upper()
    if blood_group not in BLOOD_GROUPS:
        return jsonify({'success': False, 'error': 'Select a valid blood group.'}), 400
    units_required = parse_whole_number(data['units_required'])
    if units_required is None or units_required < 1:
        return jsonify({'success': False, 'error': 'Required blood units must be a positive whole number (minimum 1).'}), 400
    urgency_label = str(data['urgency_level']).strip().upper()
    urgency = REQUEST_URGENCY_MAP.get(urgency_label)
    if not urgency:
        return jsonify({'success': False, 'error': 'Select a valid urgency level.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    INSERT INTO requests (
        receiver_type, name, hospital_name, receiver_name, contact_person, patient_name,
        blood_group, units_required, units_fulfilled, city, hospital_address, location_address,
        coordinates_confirmed,
        latitude, longitude, contact_number, alt_contact,
        urgency_level, required_datetime, reason_medical_notes, attending_doctor, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
    ''', (
        receiver_type,
        receiver_name,
        receiver_name if receiver_type == 'Hospital' else None,
        receiver_name if receiver_type == 'Individual' else None,
        contact_name if receiver_type == 'Hospital' else None,
        contact_name,
        blood_group,
        units_required,
        0,
        location,
        location_address if receiver_type == 'Hospital' else '',
        location_address or None,
        int(latitude is not None and longitude is not None and data.get('address_confirmed') is True),
        latitude,
        longitude,
        contact_number.strip() if isinstance(contact_number, str) else '',
        data.get('alt_contact', '').strip(),
        urgency,
        data.get('required_datetime') or datetime.now().strftime('%Y-%m-%dT%H:%M'),
        data.get('reason_medical_notes', '').strip(),
        data.get('attending_doctor', '').strip(),
        'ACTIVE'
    ))

    request_id = cursor.fetchone()['id']
    conn.commit()
    conn.close()

    return jsonify({
        'success': True, 
        'message': 'Blood Request broadcasted successfully!', 
        'request_id': request_id,
        'urgency_level': urgency
    }), 201

@app.route('/api/requests/<int:request_id>', methods=['GET'])
def get_request_detail(request_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({'success': False, 'error': 'Request not found'}), 404

    request_dict = dict(row)

    # Fetch pledges
    cursor.execute('''
    SELECT p.*, d.name as donor_name, d.blood_group as donor_blood_group, d.phone as donor_phone 
    FROM pledges p 
    JOIN donors d ON p.donor_id = d.id 
    WHERE p.request_id = ?
    ''', (request_id,))
    pledges = [dict(p) for p in cursor.fetchall()]
    conn.close()

    request_dict['pledges'] = pledges
    return jsonify({'success': True, 'request': request_dict})


# ==================== INTELLIGENT MATCHING ENGINE ====================

@app.route('/api/requests/<int:request_id>/matches', methods=['GET'])
def get_request_donor_matches(request_id):
    """
    Executes the Intelligent Donor Matching Algorithm for a specific request.
    Prioritizes: Blood Compatibility + Distance + Availability + Eligibility + Urgency.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req_row = cursor.fetchone()
    if not req_row:
        conn.close()
        return jsonify({'success': False, 'error': 'Request not found'}), 404

    target_request = dict(req_row)

    if target_request.get('coordinates_confirmed') != 1 or target_request.get('latitude') is None or target_request.get('longitude') is None:
        conn.close()
        return jsonify({
            'success': True,
            'request': target_request,
            'total_matches': 0,
            'top_matches': [],
            'message': 'This request has no confirmed map location.'
        })

    cursor.execute('''
        SELECT * FROM donors
                WHERE location_sharing = 1 AND coordinates_confirmed = 1
                    AND latitude IS NOT NULL AND longitude IS NOT NULL
    ''')
    donor_rows = cursor.fetchall()
    conn.close()

    matches = []
    for d in donor_rows:
        donor_dict = dict(d)
        match_result = match_donor_to_request(donor_dict, target_request)
        if match_result: # Filtered if incompatible
            matches.append(match_result)

    # Sort matches by highest match_score descending, then nearest distance
    matches.sort(key=lambda x: (x['match_score'], -x['distance_km']), reverse=True)

    return jsonify({
        'success': True,
        'request': target_request,
        'total_matches': len(matches),
        'top_matches': matches[:15] # Top 15 compatible matches
    })



@app.route('/api/requests/<int:request_id>/pledge', methods=['POST'])
def pledge_donor_to_request(request_id):
    data = request.json or {}
    donor_id = data.get('donor_id')

    try:
        units = int(data.get('units_pledged', 1))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'Units must be a positive whole number.'}), 400

    if not donor_id:
        return jsonify({'success': False, 'error': 'donor_id is required'}), 400

    if units < 1:
        return jsonify({'success': False, 'error': 'Units must be at least 1.'}), 400

    conn = get_db_connection()

    try:
        cursor = conn.cursor()

        # Lock the request row in PostgreSQL to prevent concurrent overcounting.
        if getattr(conn, 'is_postgres', False):
            cursor.execute(
                "SELECT * FROM requests WHERE id = ? FOR UPDATE",
                (request_id,)
            )
        else:
            cursor.execute(
                "SELECT * FROM requests WHERE id = ?",
                (request_id,)
            )

        req = cursor.fetchone()

        if not req:
            conn.close()
            return jsonify({'success': False, 'error': 'Request not found'}), 404

        cursor.execute("SELECT id FROM donors WHERE id = ?", (donor_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Donor not found'}), 404

        if req['status'] != 'ACTIVE':
            conn.close()
            return jsonify({'success': False, 'error': 'This request is no longer active.'}), 409

        remaining = req['units_required'] - req['units_fulfilled']
        if units > remaining:
            conn.close()
            return jsonify({
                'success': False,
                'error': f'Only {remaining} unit(s) remain to be fulfilled.'
            }), 400

        cursor.execute('''
            INSERT INTO pledges (request_id, donor_id, units_pledged, status)
            VALUES (?, ?, ?, 'PLEDGED')
        ''', (request_id, donor_id, units))

        new_fulfilled = req['units_fulfilled'] + units
        new_status = (
            'FULFILLED'
            if new_fulfilled >= req['units_required']
            else 'ACTIVE'
        )

        cursor.execute('''
            UPDATE requests
            SET units_fulfilled = ?, status = ?
            WHERE id = ?
        ''', (new_fulfilled, new_status, request_id))

        cursor.execute('''
            UPDATE donors
            SET prev_donations_count = prev_donations_count + 1
            WHERE id = ?
        ''', (donor_id,))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Pledge of {units} unit(s) recorded successfully!',
            'units_fulfilled': new_fulfilled,
            'units_required': req['units_required'],
            'request_status': new_status
        })

    except Exception:
        conn.conn.rollback()
        raise

    finally:
        conn.close()


# ==================== PLATFORM STATS & RESET ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM donors")
    total_donors = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM donors WHERE availability_status = 'Available'")
    available_donors = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM donors WHERE UPPER(blood_group) = 'O-' AND availability_status = 'Available'")
    universal_donors = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM requests WHERE status = 'ACTIVE'")
    active_requests = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM requests WHERE urgency_level = 'CRITICAL_SOS' AND status = 'ACTIVE'")
    critical_sos = cursor.fetchone()['count']

    cursor.execute("SELECT SUM(units_fulfilled) as total FROM requests")
    row_sum = cursor.fetchone()
    fulfilled_units = row_sum['total'] if row_sum and row_sum['total'] else 0

    conn.close()

    return jsonify({
        'success': True,
        'stats': {
            'total_donors': total_donors,
            'available_donors': available_donors,
            'universal_o_minus_available': universal_donors,
            'active_requests': active_requests,
            'critical_sos_requests': critical_sos,
            'total_units_fulfilled': fulfilled_units,
            'avg_dispatch_mins': 14
        }
    })

if __name__ == '__main__':
    print("Starting HemoConnect Flask server on http://127.0.0.1:5050 ...")
    app.run(host='0.0.0.0', port=5050, debug=True)
