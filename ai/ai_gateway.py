# ai/ai_gateway.py
import os
import sys
import json
import math
import numpy as np
import pandas as pd
import pickle

# Set directory paths
AI_DIR = os.path.dirname(os.path.abspath(__file__))

# Import the existing modules
sys.path.append(AI_DIR)
from route_opt import CityLogisticsGraph
from donor_response import train_donor_response_model
from demand_forecast import train_forecast_model

# Local helper functions for compatibility and distance
COMPATIBILITY_MATRIX = {
    "O_NEGATIVE": ["O_NEGATIVE", "O_POSITIVE", "A_NEGATIVE", "A_POSITIVE", "B_NEGATIVE", "B_POSITIVE", "AB_NEGATIVE", "AB_POSITIVE"],
    "O_POSITIVE": ["O_POSITIVE", "A_POSITIVE", "B_POSITIVE", "AB_POSITIVE"],
    "A_NEGATIVE": ["A_NEGATIVE", "A_POSITIVE", "AB_NEGATIVE", "AB_POSITIVE"],
    "A_POSITIVE": ["A_POSITIVE", "AB_POSITIVE"],
    "B_NEGATIVE": ["B_NEGATIVE", "B_POSITIVE", "AB_NEGATIVE", "AB_POSITIVE"],
    "B_POSITIVE": ["B_POSITIVE", "AB_POSITIVE"],
    "AB_NEGATIVE": ["AB_NEGATIVE", "AB_POSITIVE"],
    "AB_POSITIVE": ["AB_POSITIVE"]
}

def is_compatible(donor_bg: str, recipient_bg: str) -> bool:
    return recipient_bg in COMPATIBILITY_MATRIX.get(donor_bg, [])

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def get_donor_response_model():
    model_path = os.path.join(AI_DIR, "donor_response_rf.pkl")
    if not os.path.exists(model_path):
        print("Training donor response model...", file=sys.stderr)
        # We need to temporarily run training from the correct directory
        current_cwd = os.getcwd()
        os.chdir(AI_DIR)
        train_donor_response_model()
        os.chdir(current_cwd)
    with open(model_path, "rb") as f:
        return pickle.load(f)

def get_demand_forecast_model():
    model_path = os.path.join(AI_DIR, "demand_forecast_model.pkl")
    if not os.path.exists(model_path):
        print("Training demand forecast model...", file=sys.stderr)
        current_cwd = os.getcwd()
        os.chdir(AI_DIR)
        train_forecast_model()
        os.chdir(current_cwd)
    with open(model_path, "rb") as f:
        return pickle.load(f)

def handle_match(data):
    request_blood_group = data.get("requestBloodGroup")
    req_lat = float(data.get("reqLat"))
    req_lng = float(data.get("reqLng"))
    donors = data.get("donors", [])

    model = get_donor_response_model()
    results = []

    def standard_bg(bg):
        # Maps "O+" to "O_POSITIVE", etc.
        bg = bg.replace("+", "_POSITIVE").replace("-", "_NEGATIVE")
        return bg

    req_bg_std = standard_bg(request_blood_group)

    for donor in donors:
        donor_bg_std = standard_bg(donor["bloodGroup"])
        
        # Call local compatibility check
        compatible = is_compatible(donor_bg_std, req_bg_std)

        # Check last donation frequency cooldown
        meets_cooldown = True
        if donor.get("lastDonationDate"):
            from datetime import datetime
            try:
                last_date = datetime.fromisoformat(donor["lastDonationDate"].replace("Z", "+00:00"))
                diff_days = (datetime.now(last_date.tzinfo) - last_date).days
                meets_cooldown = diff_days >= donor.get("donationFrequencyDays", 90)
            except Exception as e:
                print(f"Error parsing date: {e}", file=sys.stderr)

        if not (compatible and donor.get("healthStatus") == "Eligible" and donor.get("isAvailable") and meets_cooldown):
            continue

        distance = calculate_distance(req_lat, req_lng, float(donor["latitude"]), float(donor["longitude"]))
        
        # Calculate features for ML model:
        # ['distance_km', 'past_response_rate', 'days_since_last_donation', 'hour_of_day', 'is_weekend', 'donor_level']
        days_since_last = 120 # Default
        if donor.get("lastDonationDate"):
            try:
                last_date = datetime.fromisoformat(donor["lastDonationDate"].replace("Z", "+00:00"))
                days_since_last = (datetime.now(last_date.tzinfo) - last_date).days
            except Exception:
                pass
        
        from datetime import datetime
        now = datetime.now()
        hour_of_day = now.hour
        is_weekend = 1 if now.weekday() >= 5 else 0
        
        # Donor level encoding: Bronze=1, Silver=2, Gold=3, Platinum=4
        level_map = {"Bronze": 1, "Silver": 2, "Gold": 3, "Platinum": 4}
        donor_level = level_map.get(donor.get("donorLevel", "Bronze"), 1)
        
        features = pd.DataFrame([[
            distance,
            donor.get("historicalResponseRate", 0.8),
            days_since_last,
            hour_of_day,
            is_weekend,
            donor_level
        ]], columns=['distance_km', 'past_response_rate', 'days_since_last_donation', 'hour_of_day', 'is_weekend', 'donor_level'])

        # Predict probability of response
        prob = float(model.predict_proba(features)[0, 1])
        response_pct = int(round(prob * 100))

        # Calculate matching score combining distance (35%), ML prediction (45%), KYC status (10%), blood group bonus (10%)
        dist_factor = max(0, 100 - (distance * 5))
        kyc_factor = 100 if donor.get("kycVerified") else 50
        bg_bonus = 10 if donor["bloodGroup"] in ["O-", "O_NEGATIVE"] else 0

        match_score = int(round(
            (dist_factor * 0.35) +
            (response_pct * 0.45) +
            (kyc_factor * 0.10) +
            bg_bonus
        ))
        match_score = min(100, max(0, match_score))

        # Travel time based on 35 km/h average speed in city + 10 mins prep
        travel_time = int(round((distance / 35.0) * 60 + 10))

        results.append({
            "donorId": donor["id"],
            "name": donor["name"],
            "phone": donor["phone"],
            "bloodGroup": donor["bloodGroup"],
            "distanceKm": round(distance, 2),
            "estTravelTimeMin": travel_time,
            "responseLikelihoodPct": response_pct,
            "matchScore": match_score,
            "status": donor["healthStatus"]
        })

    # Sort by match score descending
    results.sort(key=lambda x: x["matchScore"], reverse=True)
    return results

def handle_route(data):
    start = data.get("startNode")
    end = data.get("endNode")
    traffic_input = data.get("traffic", {}) # format {"N2->N3": 3.2}
    closures_input = data.get("closures", []) # format ["N8->N4"]

    graph = CityLogisticsGraph()
    
    # Format traffic modifiers as {(source, target): value}
    traffic = {}
    for key, val in traffic_input.items():
        parts = key.split("->")
        if len(parts) == 2:
            traffic[(parts[0], parts[1])] = float(val)
            traffic[(parts[1], parts[0])] = float(val)

    # Format closures as {(source, target)}
    closures = set()
    for item in closures_input:
        parts = item.split("->")
        if len(parts) == 2:
            closures.add((parts[0], parts[1]))
            closures.add((parts[1], parts[0]))

    route_details = graph.optimize_route(start, end, live_traffic_modifiers=traffic, closed_edges=closures)
    return route_details

def handle_forecast(data):
    month = int(data.get("month", 6))
    outbreak_severity = float(data.get("outbreakSeverity", 0.0))
    festival_season = int(data.get("festivalSeason", 0))
    accidents_logged = float(data.get("accidentsLogged", 45.0))
    demand_lag_1 = float(data.get("demandLag1", 350.0))
    demand_lag_2 = float(data.get("demandLag2", 350.0))
    supply_lag_1 = float(data.get("supplyLag1", 360.0))

    model = get_demand_forecast_model()
    
    features = pd.DataFrame([[
        month, outbreak_severity, festival_season, accidents_logged,
        demand_lag_1, demand_lag_2, supply_lag_1
    ]], columns=['month', 'outbreak_severity', 'festival_season', 'accidents_logged', 'demand_lag_1', 'demand_lag_2', 'supply_lag_1'])

    # The model predicts the deficit (supply - demand)
    predicted_deficit = float(model.predict(features)[0])

    # Let's derive estimated demand and supply based on features
    # (Matches demand/supply logic in generator to make it realistic)
    base_demand = 350.0
    est_demand = (
        base_demand
        + (outbreak_severity * 120)
        + ((accidents_logged - 45.0) * 4)
        + np.sin(2 * np.pi * (month * 30) / 365.25) * 50
    )
    est_demand = max(50.0, est_demand)
    
    # predicted deficit = supply - demand => supply = deficit + demand
    est_supply = est_demand + predicted_deficit
    est_supply = max(50.0, est_supply)

    return {
        "predictedDeficit": round(predicted_deficit, 1),
        "predictedDemand": int(round(est_demand)),
        "predictedSupply": int(round(est_supply))
    }

def handle_voice_parse(data):
    transcript = data.get("transcript", "")
    normalized = transcript.lower()
    
    # Blood Group detection
    detected_blood_group = "O_NEGATIVE"
    if "o positive" in normalized or "o+" in normalized:
        detected_blood_group = "O_POSITIVE"
    elif "o negative" in normalized or "o-" in normalized:
        detected_blood_group = "O_NEGATIVE"
    elif "a positive" in normalized or "a+" in normalized:
        detected_blood_group = "A_POSITIVE"
    elif "a negative" in normalized or "a-" in normalized:
        detected_blood_group = "A_NEGATIVE"
    elif "b positive" in normalized or "b+" in normalized:
        detected_blood_group = "B_POSITIVE"
    elif "b negative" in normalized or "b-" in normalized:
        detected_blood_group = "B_NEGATIVE"
    elif "ab positive" in normalized or "ab+" in normalized:
        detected_blood_group = "AB_POSITIVE"
    elif "ab negative" in normalized or "ab-" in normalized:
        detected_blood_group = "AB_NEGATIVE"

    # Urgency detection
    urgency = "HIGH"
    if any(keyword in normalized for keyword in ["immediate", "critical", "urgent", "emergency", "jaldi", "twaraga", "now"]):
        urgency = "CRITICAL"
    elif any(keyword in normalized for keyword in ["whenever", "routine", "later", "low"]):
        urgency = "LOW"
    elif any(keyword in normalized for keyword in ["medium", "normal", "moderate"]):
        urgency = "MEDIUM"

    # Location detection
    location = "Hyderabad General Area"
    if "secunderabad" in normalized:
        location = "Secunderabad Hub"
    elif "begumpet" in normalized:
        location = "Begumpet Junction"
    elif "jubilee hills" in normalized:
        location = "Jubilee Hills Checkpost"
    elif "gachibowli" in normalized:
        location = "Gachibowli Ring"
    elif "banjara hills" in normalized:
        location = "Banjara Hills Rd 1"
    elif "nampally" in normalized:
        location = "Nampally Station"
    elif "charminar" in normalized:
        location = "Charminar Area"
    elif "hitech city" in normalized:
        location = "Hitech City Gate"

    # Extraction confidence score
    confidence = 0.70
    if detected_blood_group != "O_NEGATIVE" or urgency != "HIGH" or location != "Hyderabad General Area":
        confidence = 0.95

    return {
        "success": True,
        "parsed": {
            "bloodGroup": detected_blood_group,
            "urgency": urgency,
            "location": location,
            "rawTranscript": transcript,
            "confidence": confidence
        }
    }

def handle_fraud_check(data):
    phone = data.get("phone", "")
    location_text = data.get("locationText", "")
    patient_condition = data.get("patientCondition", "")
    
    trust_score = 100
    reasons = []

    # 1. Phone check
    if not phone or len(phone.strip()) < 10:
        trust_score -= 30
        reasons.append("Invalid or blank phone number format")
    
    # 2. Location check
    suspicious_words = ["test", "dummy", "fake", "placeholder", "nowhere", "asdf"]
    if any(word in location_text.lower() for word in suspicious_words):
        trust_score -= 25
        reasons.append("Location details contain dummy/placeholder text")

    # 3. Patient Condition check
    if len(patient_condition.strip()) < 5:
        trust_score -= 15
        reasons.append("Patient condition detail is extremely brief or missing context")
    elif any(word in patient_condition.lower() for word in suspicious_words):
        trust_score -= 20
        reasons.append("Patient condition contains dummy/placeholder text")

    # Limit score
    trust_score = max(10, trust_score)

    return {
        "trustScore": trust_score,
        "isSuspicious": trust_score < 70,
        "reasons": reasons if reasons else ["Integrity verification successful"]
    }

def main():
    try:
        # Read from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"error": "Empty input"}))
            return
            
        payload = json.loads(input_data)
        action = payload.get("action")
        data = payload.get("data", {})

        if action == "match":
            res = handle_match(data)
        elif action == "route":
            res = handle_route(data)
        elif action == "forecast":
            res = handle_forecast(data)
        elif action == "voice-parse":
            res = handle_voice_parse(data)
        elif action == "fraud-check":
            res = handle_fraud_check(data)
        else:
            res = {"error": f"Unknown action: {action}"}

        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
