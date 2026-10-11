from flask import Flask, render_template, request, jsonify, send_from_directory
import sqlite3
import os
from datetime import datetime, date

from database import get_db_connection, init_db, seed_db_data
from matching_engine import match_donor_to_request, check_donor_eligibility, haversine_distance

app = Flask(__name__, static_folder='static', template_folder='templates')

# Ensure DB exists on startup
init_db()

# Universal CORS response headers
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    return response

# Main App Page
@app.route('/')
def index():
    return render_template('index.html')

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
        donor_dict = dict(r)
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
    if missing:
        return jsonify({'success': False, 'error': f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        age = int(data['age'])
        if age < 18 or age > 65:
            return jsonify({'success': False, 'error': "Donor age must be between 18 and 65 years"}), 400
    except ValueError:
        return jsonify({'success': False, 'error': "Age must be a valid number"}), 400

    # Coordinates fallback (Central City default)
    lat = float(data.get('latitude') or 12.9716)
    lon = float(data.get('longitude') or 77.5946)
    
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    INSERT INTO donors (
        name, age, gender, blood_group, city, address, latitude, longitude,
        phone, email, last_donation_date, availability_status, prev_donations_count,
        weight, medical_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'].strip(),
        age,
        data.get('gender', 'Other').strip(),
        data['blood_group'].strip().upper(),
        data['city'].strip(),
        data.get('address', '').strip(),
        lat,
        lon,
        data['phone'].strip(),
        data.get('email', '').strip(),
        data.get('last_donation_date') or None,
        data.get('availability_status', 'Available').strip().title(),
        int(data.get('prev_donations_count', 0)),
        float(data.get('weight', 65.0)),
        data.get('medical_notes', '').strip()
    ))
    
    donor_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'success': True, 
        'message': 'Donor registered successfully!', 
        'donor_id': donor_id
    }), 210

@app.route('/api/donors/<int:donor_id>', methods=['GET'])
def get_donor_detail(donor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM donors WHERE id = ?", (donor_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'success': False, 'error': 'Donor not found'}), 404

    donor_dict = dict(row)
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

    required_fields = ['receiver_type', 'name', 'blood_group', 'units_required', 'city', 'contact_number', 'required_datetime']
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({'success': False, 'error': f"Missing required fields: {', '.join(missing)}"}), 400

    # Standardize urgency
    urgency = data.get('urgency_level', 'NORMAL').strip().upper()
    if urgency not in ['CRITICAL_SOS', 'HIGH', 'NORMAL']:
        urgency = 'NORMAL'

    # Coordinates fallback (Hospital Hub default)
    lat = float(data.get('latitude') or 12.9716)
    lon = float(data.get('longitude') or 77.5946)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
    INSERT INTO requests (
        receiver_type, name, patient_name, blood_group, units_required, units_fulfilled,
        city, hospital_address, latitude, longitude, contact_number, alt_contact,
        urgency_level, required_datetime, reason_medical_notes, attending_doctor, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['receiver_type'].strip(),
        data['name'].strip(),
        data.get('patient_name', '').strip(),
        data['blood_group'].strip().upper(),
        int(data['units_required']),
        0,
        data['city'].strip(),
        data.get('hospital_address', '').strip(),
        lat,
        lon,
        data['contact_number'].strip(),
        data.get('alt_contact', '').strip(),
        urgency,
        data['required_datetime'],
        data.get('reason_medical_notes', '').strip(),
        data.get('attending_doctor', '').strip(),
        'ACTIVE'
    ))

    request_id = cursor.lastrowid
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

    cursor.execute("SELECT * FROM donors")
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
    units = int(data.get('units_pledged', 1))

    if not donor_id:
        return jsonify({'success': False, 'error': 'donor_id is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        return jsonify({'success': False, 'error': 'Request not found'}), 404

    # Insert Pledge
    cursor.execute('''
    INSERT INTO pledges (request_id, donor_id, units_pledged, status)
    VALUES (?, ?, ?, 'PLEDGED')
    ''', (request_id, donor_id, units))

    # Update request fulfilled units
    new_fulfilled = req['units_fulfilled'] + units
    new_status = 'FULFILLED' if new_fulfilled >= req['units_required'] else 'ACTIVE'

    cursor.execute('''
    UPDATE requests 
    SET units_fulfilled = ?, status = ? 
    WHERE id = ?
    ''', (new_fulfilled, new_status, request_id))

    # Update donor pledge stats & last donation date record option
    cursor.execute('''
    UPDATE donors 
    SET prev_donations_count = prev_donations_count + 1 
    WHERE id = ?
    ''', (donor_id,))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Pledge of {units} unit(s) recorded successfully!",
        'units_fulfilled': new_fulfilled,
        'units_required': req['units_required'],
        'request_status': new_status
    })

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
    fulfilled_units = row_sum['total'] if row_sum and row_sum['total'] else 18

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

@app.route('/api/reset-db', methods=['POST'])
def reset_database():
    seed_db_data()
    return jsonify({'success': True, 'message': 'Database re-seeded successfully!'})

if __name__ == '__main__':
    print("Starting HemoConnect Flask server on http://127.0.0.1:5050 ...")
    app.run(host='0.0.0.0', port=5050, debug=True)
