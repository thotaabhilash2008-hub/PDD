# ai/demand_forecast.py
"""
AI Blood Demand & Shortage Forecaster.
Utilizes statistical modeling (Ridge Regression with seasonal features) to forecast future blood unit
deficits/surpluses based on weather seasons, festivals, disease outbreaks (dengue/malaria), 
and accident rates.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

def generate_historical_demand_data(num_weeks=260): # ~5 years of weekly data
    """Generates synthetic weekly blood demand and shortage log data."""
    np.random.seed(101)
    
    dates = pd.date_range(start="2021-01-01", periods=num_weeks, freq="W")
    
    # Feature construction
    month = dates.month
    
    # Dengue/Malaria outbreak seasonality (monsoons in India: June to September)
    outbreak_season = np.where((month >= 6) & (month <= 9), 1, 0)
    outbreak_severity = outbreak_season * np.random.uniform(0.1, 1.0, num_weeks)
    
    # Festival seasons (October/November spike in travel & events -> accident rise + low donations)
    festival_season = np.where((month == 10) | (month == 11), 1, 0)
    
    # Average weekly accidents
    base_accidents = 45
    weekly_accidents = base_accidents + (festival_season * 25) + np.random.normal(0, 5, num_weeks)
    
    # Demand generation (Units needed)
    base_demand = 350
    demand = (
        base_demand 
        + (outbreak_severity * 120)       # Major epidemic blood demand (platelets etc)
        + ((weekly_accidents - 45) * 4)   # Accident emergencies
        + np.sin(2 * Math.PI * dates.dayofyear / 365.25) * 50 # Seasonal base curve
        + np.random.normal(0, 15, num_weeks)
    )
    demand = np.maximum(50, demand).astype(int)
    
    # Supply generation (Units donated)
    # Supply drops during festivals (people busy/traveling) and peak monsoons (rain/illness)
    base_supply = 360
    supply = (
        base_supply
        - (festival_season * 60)
        - (outbreak_season * 30)
        + np.random.normal(0, 20, num_weeks)
    )
    supply = np.maximum(50, supply).astype(int)
    
    # Shortage / Deficit (Negative is shortage)
    deficit = supply - demand
    
    df = pd.DataFrame({
        'date': dates,
        'month': month,
        'outbreak_severity': outbreak_severity,
        'festival_season': festival_season,
        'accidents_logged': weekly_accidents,
        'demand_units': demand,
        'supply_units': supply,
        'deficit_units': deficit
    })
    
    return df

# Simple helper since Python doesn't have Math.PI natively in local namespace unless imported
import math
class Math:
    PI = math.pi

def train_forecast_model():
    print("Generating historic logistics data...")
    df = generate_historical_demand_data(300)
    
    # Lag features to capture temporal dependencies (autocorrelation)
    df['demand_lag_1'] = df['demand_units'].shift(1)
    df['demand_lag_2'] = df['demand_units'].shift(2)
    df['supply_lag_1'] = df['supply_units'].shift(1)
    
    # Drop rows with NaN due to shift
    df = df.dropna()
    
    # Target is deficit_units (future shortage)
    features = [
        'month', 'outbreak_severity', 'festival_season', 
        'accidents_logged', 'demand_lag_1', 'demand_lag_2', 'supply_lag_1'
    ]
    
    X = df[features]
    y = df['deficit_units']
    
    # Train/Test Split (Time-based split: last 52 weeks as validation)
    split_idx = len(df) - 52
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print("Fitting Ridge Regression with Standard Scaling...")
    pipeline = make_pipeline(StandardScaler(), Ridge(alpha=1.0))
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Mean Absolute Error: {mae:.2f} units")
    print(f"R^2 Score: {r2:.4f}")
    
    # Save Model
    with open("demand_forecast_model.pkl", "wb") as f:
        pickle.dump(pipeline, f)
    print("Model serialized to demand_forecast_model.pkl")

if __name__ == "__main__":
    train_forecast_model()
