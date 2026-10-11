import sqlite3
import os
from datetime import datetime, date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'hemoconnect.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Donors Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT DEFAULT 'Other',
        blood_group TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        phone TEXT NOT NULL,
        email TEXT,
        last_donation_date TEXT,
        availability_status TEXT DEFAULT 'Available',
        prev_donations_count INTEGER DEFAULT 0,
        weight REAL DEFAULT 65.0,
        medical_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Requests Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiver_type TEXT NOT NULL, -- 'Hospital', 'Individual', 'Authorized Representative'
        name TEXT NOT NULL, -- Hospital Name or Requester Name
        patient_name TEXT,
        blood_group TEXT NOT NULL,
        units_required INTEGER NOT NULL DEFAULT 1,
        units_fulfilled INTEGER DEFAULT 0,
        city TEXT NOT NULL,
        hospital_address TEXT,
        latitude REAL,
        longitude REAL,
        contact_number TEXT NOT NULL,
        alt_contact TEXT,
        urgency_level TEXT NOT NULL DEFAULT 'NORMAL', -- 'CRITICAL_SOS', 'HIGH', 'NORMAL'
        required_datetime TEXT NOT NULL,
        reason_medical_notes TEXT,
        attending_doctor TEXT,
        status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'FULFILLED', 'CANCELLED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Pledges Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pledges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        donor_id INTEGER NOT NULL,
        units_pledged INTEGER DEFAULT 1,
        status TEXT DEFAULT 'PLEDGED', -- 'PLEDGED', 'COMPLETED', 'CANCELLED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id),
        FOREIGN KEY (donor_id) REFERENCES donors(id)
    )
    ''')

    conn.commit()
    
    # Check if empty, then seed default data
    cursor.execute("SELECT COUNT(*) as count FROM donors")
    if cursor.fetchone()['count'] == 0:
        seed_db_data(conn)
    else:
        conn.close()

def seed_db_data(conn=None):
    close_at_end = False
    if conn is None:
        conn = get_db_connection()
        close_at_end = True
        
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pledges")
    cursor.execute("DELETE FROM requests")
    cursor.execute("DELETE FROM donors")

    today = date.today()
    
    # Sample Donors (Central Metro Area reference coords: Lat 12.9716, Lon 77.5946)
    

    cursor.executemany('''
    INSERT INTO donors (
        name, age, gender, blood_group, city, address, latitude, longitude,
        phone, email, last_donation_date, availability_status, prev_donations_count,
        weight, medical_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', donors_data)

    # Sample Requests
    req_time_emergency = (datetime.now() + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M")
    req_time_high = (datetime.now() + timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M")
    req_time_normal = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M")

    

    cursor.executemany('''
    INSERT INTO requests (
        receiver_type, name, patient_name, blood_group, units_required, units_fulfilled,
        city, hospital_address, latitude, longitude, contact_number, alt_contact,
        urgency_level, required_datetime, reason_medical_notes, attending_doctor, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', requests_data)

    conn.commit()
    if close_at_end:
        conn.close()
    print("HemoConnect Database initialized and seeded with sample data.")

if __name__ == '__main__':
    init_db()
