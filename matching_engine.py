import math
from datetime import datetime, date

# Blood Compatibility Rules Matrix
# recipient_group: list of compatible donor_groups
COMPATIBILITY_MATRIX = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth specified in decimal degrees.
    """
    if None in (lat1, lon1, lat2, lon2):
        return 5.0  # Default fallback distance in km if coordinates missing
        
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
        return 5.0

    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371.0 # Radius of earth in kilometers
    return round(c * r, 2)

def check_donor_eligibility(last_donation_date_str, age):
    """
    Check if a donor is eligible based on age (>=18) and last donation date (>= 56 days ago).
    Returns (is_eligible, days_since_last, days_until_eligible, message)
    """
    if age is None or int(age) < 18:
        return False, 0, 0, "Donor must be at least 18 years old"
        
    if not last_donation_date_str:
        return True, 999, 0, "Eligible (First-time donor or no recent record)"
        
    try:
        if isinstance(last_donation_date_str, str):
            last_date = datetime.strptime(last_donation_date_str.split('T')[0], "%Y-%m-%d").date()
        elif isinstance(last_donation_date_str, (date, datetime)):
            last_date = last_donation_date_str if isinstance(last_donation_date_str, date) else last_donation_date_str.date()
        else:
            return True, 999, 0, "Eligible"

        today = date.today()
        days_since = (today - last_date).days
        
        REQUIRED_GAP_DAYS = 56 # Standard 8-week gap for blood donation
        
        if days_since >= REQUIRED_GAP_DAYS:
            return True, days_since, 0, "Eligible for blood donation"
        else:
            days_until = REQUIRED_GAP_DAYS - days_since
            return False, days_since, days_until, f"Ineligible: Must wait {days_until} more days before next donation"
    except Exception as e:
        return True, 999, 0, "Eligible"

def get_compatibility_score(donor_bg, recipient_bg):
    """
    Calculates blood compatibility score (0 to 100) and description.
    """
    donor_bg = (donor_bg or '').strip().upper()
    recipient_bg = (recipient_bg or '').strip().upper()
    
    if not recipient_bg or not donor_bg:
        return 0, "Unknown Blood Group"

    valid_donors = COMPATIBILITY_MATRIX.get(recipient_bg, [])
    
    if donor_bg not in valid_donors:
        return 0, "Incompatible Blood Group"
        
    if donor_bg == recipient_bg:
        return 100, "Exact Match"
    elif donor_bg == 'O-':
        return 92, "Universal Donor (O-)"
    else:
        return 85, "Compatible Match"

def calculate_distance_score(distance_km):
    """
    Converts distance in KM to a score from 0 to 100.
    """
    if distance_km <= 2.0:
        return 100
    elif distance_km <= 5.0:
        return 95 - (distance_km - 2.0) * 3
    elif distance_km <= 15.0:
        return 86 - (distance_km - 5.0) * 2.5
    elif distance_km <= 30.0:
        return 61 - (distance_km - 15.0) * 1.5
    else:
        return max(10, 38.0 - (distance_km - 30.0) * 0.5)

def match_donor_to_request(donor, request):
    """
    Computes comprehensive match analytics between a donor and a blood request.
    Returns dictionary with match_score, breakdown, distance_km, eta_minutes, and recommendation.
    """
    recipient_bg = request.get('blood_group')
    donor_bg = donor.get('blood_group')
    
    # 1. Compatibility
    compat_score, compat_type = get_compatibility_score(donor_bg, recipient_bg)
    if compat_score == 0:
        return None # Incompatible blood type cannot be matched
        
    # 2. Distance & ETA
    d_lat = request.get('latitude')
    d_lon = request.get('longitude')
    u_lat = donor.get('latitude')
    u_lon = donor.get('longitude')
    
    dist_km = haversine_distance(d_lat, d_lon, u_lat, u_lon)
    dist_score = calculate_distance_score(dist_km)
    
    # Estimated transit time assuming average city transit speed (~25 km/h + 10 min prep)
    eta_minutes = int(math.ceil((dist_km / 25.0) * 60 + 10))
    
    # 3. Availability
    status = (donor.get('availability_status') or 'Available').strip().title()
    if status == 'Available':
        avail_score = 100
    elif status == 'On Call':
        avail_score = 70
    else: # Unavailable
        avail_score = 10
        
    # 4. Eligibility
    is_eligible, days_since, days_until, elig_msg = check_donor_eligibility(
        donor.get('last_donation_date'), 
        donor.get('age')
    )
    elig_score = 100 if is_eligible else 15
    
    # Combined Weighted Score Formula
    # Weights: Compatibility (35%), Distance (35%), Availability (20%), Eligibility (10%)
    raw_score = (compat_score * 0.35) + (dist_score * 0.35) + (avail_score * 0.20) + (elig_score * 0.10)
    
    # Urgency boost for SOS requests if donor is immediate available
    urgency = request.get('urgency_level', 'NORMAL')
    if urgency == 'CRITICAL_SOS' and status == 'Available' and is_eligible:
        raw_score = min(100, raw_score * 1.08)
        
    final_score = round(raw_score, 1)
    
    # Match badge label
    if final_score >= 88:
        badge = "PERFECT MATCH"
        badge_color = "emerald"
    elif final_score >= 75:
        badge = "HIGH MATCH"
        badge_color = "blue"
    elif final_score >= 60:
        badge = "GOOD MATCH"
        badge_color = "indigo"
    else:
        badge = "MODERATE MATCH"
        badge_color = "amber"

    return {
        'donor_id': donor.get('id'),
        'donor_name': donor.get('name'),
        'donor_phone': donor.get('phone'),
        'donor_email': donor.get('email'),
        'donor_age': donor.get('age'),
        'donor_blood_group': donor_bg,
        'donor_city': donor.get('city'),
        'donor_availability': status,
        'prev_donations_count': donor.get('prev_donations_count', 0),
        'is_eligible': is_eligible,
        'eligibility_msg': elig_msg,
        'days_until_eligible': days_until,
        'distance_km': dist_km,
        'eta_minutes': eta_minutes,
        'match_score': final_score,
        'badge': badge,
        'badge_color': badge_color,
        'compatibility_type': compat_type,
        'score_breakdown': {
            'compatibility': round(compat_score, 1),
            'distance': round(dist_score, 1),
            'availability': round(avail_score, 1),
            'eligibility': round(elig_score, 1)
        }
    }
