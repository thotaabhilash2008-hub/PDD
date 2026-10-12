import sqlite3
import os

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
        location_sharing INTEGER NOT NULL DEFAULT 0,
        coordinates_confirmed INTEGER NOT NULL DEFAULT 0,
        owner_uid TEXT,
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
        hospital_name TEXT,
        receiver_name TEXT,
        contact_person TEXT,
        patient_name TEXT,
        blood_group TEXT NOT NULL,
        units_required INTEGER NOT NULL DEFAULT 1,
        units_fulfilled INTEGER DEFAULT 0,
        city TEXT NOT NULL,
        hospital_address TEXT,
        location_address TEXT,
        latitude REAL,
        longitude REAL,
        coordinates_confirmed INTEGER NOT NULL DEFAULT 0,
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

    request_columns = {row['name'] for row in cursor.execute('PRAGMA table_info(requests)')}
    for column in ('hospital_name', 'receiver_name', 'contact_person'):
        if column not in request_columns:
            cursor.execute(f'ALTER TABLE requests ADD COLUMN {column} TEXT')

    cursor.execute('''
    UPDATE requests
    SET hospital_name = COALESCE(hospital_name,
            CASE WHEN receiver_type = 'Hospital' THEN NULLIF(name, '') END),
        receiver_name = COALESCE(receiver_name,
            CASE WHEN receiver_type != 'Hospital' THEN COALESCE(NULLIF(patient_name, ''), NULLIF(name, '')) END),
        contact_person = COALESCE(contact_person,
            CASE WHEN receiver_type = 'Hospital' THEN NULLIF(patient_name, '') END)
    WHERE hospital_name IS NULL OR receiver_name IS NULL OR contact_person IS NULL
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

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profiles (
        firebase_uid TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        phone_number TEXT,
        sign_in_provider TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    donor_columns = {row['name'] for row in cursor.execute('PRAGMA table_info(donors)')}
    if 'location_sharing' not in donor_columns:
        cursor.execute('ALTER TABLE donors ADD COLUMN location_sharing INTEGER NOT NULL DEFAULT 0')
    if 'coordinates_confirmed' not in donor_columns:
        cursor.execute('ALTER TABLE donors ADD COLUMN coordinates_confirmed INTEGER NOT NULL DEFAULT 0')
    if 'owner_uid' not in donor_columns:
        cursor.execute('ALTER TABLE donors ADD COLUMN owner_uid TEXT')

    request_columns = {row['name'] for row in cursor.execute('PRAGMA table_info(requests)')}
    if 'location_address' not in request_columns:
        cursor.execute('ALTER TABLE requests ADD COLUMN location_address TEXT')
    if 'coordinates_confirmed' not in request_columns:
        cursor.execute('ALTER TABLE requests ADD COLUMN coordinates_confirmed INTEGER NOT NULL DEFAULT 0')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_donors_location_sharing ON donors (location_sharing, coordinates_confirmed, latitude, longitude)')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
