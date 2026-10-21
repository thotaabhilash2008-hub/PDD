# ai/donor_response.py
"""
Predictive Donor Response AI model.
Trains a Random Forest Classifier to predict the likelihood of a blood donor responding 
to an emergency blood alert based on distance, historical response rates, availability patterns,
and timing factors.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
import pickle

def generate_synthetic_data(num_samples=1000):
    """Generates synthetic historical data for training donor response predictor."""
    np.random.seed(42)
    
    # Features
    distance_km = np.random.uniform(0.5, 15.0, num_samples) # Distance from request (0.5 to 15 km)
    past_response_rate = np.random.uniform(0.1, 1.0, num_samples) # Historical response percentage (10% to 100%)
    days_since_last_donation = np.random.randint(90, 365, num_samples) # Days since last donation (90+ is eligible)
    hour_of_day = np.random.randint(0, 24, num_samples) # Alert hour
    is_weekend = np.random.randint(0, 2, num_samples) # Weekend vs weekday
    donor_level_encoded = np.random.choice([1, 2, 3, 4], size=num_samples) # Bronze=1, Silver=2, Gold=3, Platinum=4
    
    # Target variable (Likelihood of accepting request, 1=Accept, 0=Decline/Ignore)
    # Probability function based on logical health-logistics heuristics
    linear_comb = (
        -0.3 * distance_km 
        + 4.0 * past_response_rate 
        + 0.002 * days_since_last_donation 
        - 0.5 * np.abs(hour_of_day - 14) / 12  # Peak availability at 14:00 (2 PM)
        + 0.2 * donor_level_encoded
        - 0.3 * (is_weekend * (hour_of_day < 8)) # Low response on weekend early mornings
    )
    
    prob = 1 / (1 + np.exp(-linear_comb))
    will_respond = (np.random.rand(num_samples) < prob).astype(int)
    
    df = pd.DataFrame({
        'distance_km': distance_km,
        'past_response_rate': past_response_rate,
        'days_since_last_donation': days_since_last_donation,
        'hour_of_day': hour_of_day,
        'is_weekend': is_weekend,
        'donor_level': donor_level_encoded,
        'will_respond': will_respond
    })
    
    return df

def train_donor_response_model():
    print("Generating training dataset...")
    df = generate_synthetic_data(1500)
    
    X = df.drop(columns=['will_respond'])
    y = df['will_respond']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    print("\nModel Evaluation Results:")
    print(classification_report(y_test, y_pred))
    print(f"ROC AUC Score: {roc_auc_score(y_test, y_proba):.4f}")
    
    # Feature importances
    importances = model.feature_importances_
    for col, imp in zip(X.columns, importances):
        print(f"Feature: {col:<25} Importance: {imp:.4f}")
        
    # Save model
    with open("donor_response_rf.pkl", "wb") as f:
        pickle.dump(model, f)
    print("\nModel saved to donor_response_rf.pkl")

def predict_single_donor(distance, past_rate, last_donation_days, hour, is_wknd, level):
    """Loads model and returns probability score of response."""
    try:
        with open("donor_response_rf.pkl", "rb") as f:
            model = pickle.load(f)
    except FileNotFoundError:
        print("Model file not found. Running training first...")
        train_donor_response_model()
        with open("donor_response_rf.pkl", "rb") as f:
            model = pickle.load(f)
            
    features = np.array([[distance, past_rate, last_donation_days, hour, is_wknd, level]])
    prob = model.predict_proba(features)[0, 1]
    return prob

if __name__ == "__main__":
    train_donor_response_model()
    # Test single donor prediction
    prob = predict_single_donor(distance=2.4, past_rate=0.85, last_donation_days=110, hour=15, is_wknd=0, level=3)
    print(f"\nSimulated inference: Donor is {prob*100:.1f}% likely to respond within 15 minutes.")
