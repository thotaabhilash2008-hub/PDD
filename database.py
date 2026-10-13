
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "hemoconnect.db")
DATABASE_URL = os.environ.get("DATABASE_URL")


class DatabaseCursor:
    def __init__(self, cursor, is_postgres):
        self.cursor = cursor
        self.is_postgres = is_postgres

    def execute(self, sql, params=()):
        if self.is_postgres:
            sql = sql.replace("?", "%s")
        self.cursor.execute(sql, params)
        return self

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def __iter__(self):
        return iter(self.cursor)

    @property
    def lastrowid(self):
        return getattr(self.cursor, "lastrowid", None)


class DatabaseConnection:
    def __init__(self, conn, is_postgres):
        self.conn = conn
        self.is_postgres = is_postgres

    def cursor(self):
        return DatabaseCursor(self.conn.cursor(), self.is_postgres)

    def execute(self, sql, params=()):
        return self.cursor().execute(sql, params)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db_connection():
    if DATABASE_URL:
        import psycopg
        from psycopg.rows import dict_row

        conn = psycopg.connect(
            DATABASE_URL,
            row_factory=dict_row,
            prepare_threshold=None
        )
        return DatabaseConnection(conn, True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return DatabaseConnection(conn, False)


def init_db():
    is_pg = bool(DATABASE_URL)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Use database-specific auto-increment syntax.
    pk = "SERIAL PRIMARY KEY" if is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS donors (
            id {pk},
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT DEFAULT 'Other',
            blood_group TEXT NOT NULL,
            city TEXT NOT NULL,
            address TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            location_sharing INTEGER NOT NULL DEFAULT 0,
            coordinates_confirmed INTEGER NOT NULL DEFAULT 0,
            owner_uid TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            last_donation_date TEXT,
            availability_status TEXT DEFAULT 'Available',
            prev_donations_count INTEGER DEFAULT 0,
            weight DOUBLE PRECISION DEFAULT 65.0,
            medical_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS requests (
            id {pk},
            receiver_type TEXT NOT NULL,
            name TEXT NOT NULL,
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
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            coordinates_confirmed INTEGER NOT NULL DEFAULT 0,
            contact_number TEXT NOT NULL,
            alt_contact TEXT,
            urgency_level TEXT NOT NULL DEFAULT 'NORMAL',
            required_datetime TEXT NOT NULL,
            reason_medical_notes TEXT,
            attending_doctor TEXT,
            status TEXT DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS pledges (
            id {pk},
            request_id INTEGER NOT NULL REFERENCES requests(id),
            donor_id INTEGER NOT NULL REFERENCES donors(id),
            units_pledged INTEGER DEFAULT 1,
            status TEXT DEFAULT 'PLEDGED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            firebase_uid TEXT PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            phone_number TEXT,
            sign_in_provider TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Check existing columns for migrations.
    def columns(table):
        if is_pg:
            rows = cursor.execute("""
                SELECT column_name AS name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = ?
            """, (table,)).fetchall()
            return {row["name"] for row in rows}

        return {
            row["name"]
            for row in cursor.execute(f"PRAGMA table_info({table})").fetchall()
        }

    migrations = {
        "donors": {
            "location_sharing": "INTEGER NOT NULL DEFAULT 0",
            "coordinates_confirmed": "INTEGER NOT NULL DEFAULT 0",
            "owner_uid": "TEXT",
        },
        "requests": {
            "hospital_name": "TEXT",
            "receiver_name": "TEXT",
            "contact_person": "TEXT",
            "location_address": "TEXT",
            "coordinates_confirmed": "INTEGER NOT NULL DEFAULT 0",
        },
    }

    for table, definitions in migrations.items():
        existing = columns(table)
        for column, definition in definitions.items():
            if column not in existing:
                cursor.execute(
                    f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
                )

    cursor.execute("""
        UPDATE requests
        SET hospital_name = COALESCE(
                hospital_name,
                CASE WHEN receiver_type = 'Hospital'
                     THEN NULLIF(name, '') END
            ),
            receiver_name = COALESCE(
                receiver_name,
                CASE WHEN receiver_type != 'Hospital'
                     THEN COALESCE(NULLIF(patient_name, ''), NULLIF(name, ''))
                END
            ),
            contact_person = COALESCE(
                contact_person,
                CASE WHEN receiver_type = 'Hospital'
                     THEN NULLIF(patient_name, '') END
            )
        WHERE hospital_name IS NULL
           OR receiver_name IS NULL
           OR contact_person IS NULL
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_donors_location_sharing
        ON donors (location_sharing, coordinates_confirmed, latitude, longitude)
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
