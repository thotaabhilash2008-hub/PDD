# BloodLink AI - REST API Specifications & Deployment Guide

This document provides specifications for the REST APIs, configuration parameters, and detailed deployment blueprints for staging and national production systems.

---

## 1. REST API Documentation

### A. Emergency Blood Match
* **Endpoint:** `POST /api/match`
* **Description:** Finds compatible donors and blood bank reserves, scoring them based on distance and historical metrics.
* **Request Header:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "bloodGroup": "O_NEGATIVE",
  "latitude": 17.3850,
  "longitude": 78.4867
}
```
* **Success Response (200 OK):**
```json
{
  "requestedGroup": "O_NEGATIVE",
  "matchedDonors": [
    {
      "donorId": "d1",
      "name": "Aarav Sharma",
      "phone": "+91 98765 43210",
      "bloodGroup": "O_NEGATIVE",
      "distanceKm": 2.1,
      "estTravelTimeMin": 9,
      "responseLikelihoodPct": 92,
      "matchScore": 98,
      "status": "Eligible"
    }
  ],
  "matchedBloodBanks": [
    {
      "bankId": "b1",
      "name": "Red Cross Central Repo",
      "distanceKm": 3.5,
      "stockAvailable": 12,
      "estimatedArrivalMin": 11,
      "confidenceScore": 95
    }
  ]
}
```

---

### B. Raise Emergency Request
* **Endpoint:** `POST /api/requests`
* **Description:** Creates an active emergency request in the logistics queue, automatically computing priority categorization and triggering real-time Socket.IO broadcasts.
* **Request Body:**
```json
{
  "patientCondition": "Severe hemorrhage due to road accident",
  "bloodGroup": "O_NEGATIVE",
  "volumeMl": 900,
  "hospitalName": "Apollo Hospital, Jubilee Hills",
  "latitude": 17.4251,
  "longitude": 78.4098
}
```
* **Success Response (201 Created):**
```json
{
  "id": "r-17094038190",
  "patientCondition": "Severe hemorrhage due to road accident",
  "bloodGroup": "O_NEGATIVE",
  "volumeMl": 900,
  "priority": "CRITICAL",
  "status": "MATCHING",
  "hospitalName": "Apollo Hospital, Jubilee Hills",
  "latitude": 17.4251,
  "longitude": 78.4098,
  "createdAt": "2026-06-07T15:10:00.000Z"
}
```

---

### C. Voice Emergency Assistant Parser
* **Endpoint:** `POST /api/voice-assistant`
* **Description:** Natural Language Processing parser extracts structured values (blood group, urgency, region) from spoke transcript sentences.
* **Request Body:**
```json
{
  "transcript": "Need O-negative blood near Jubilee Hills immediately",
  "language": "en"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "parsed": {
    "bloodGroup": "O_NEGATIVE",
    "urgency": "CRITICAL",
    "location": "Jubilee Hills, Hyderabad",
    "rawTranscript": "Need O-negative blood near Jubilee Hills immediately",
    "confidence": 0.94
  }
}
```

---

### D. Fraud & Duplicate Detector
* **Endpoint:** `POST /api/fraud-check`
* **Description:** Analyzes request metrics against spam indicators, duplicate intervals, and invalid telephone formats.
* **Request Body:**
```json
{
  "phone": "+91 99999 99999",
  "locationText": "Dummy Test Location",
  "userId": "user-404"
}
```
* **Success Response (200 OK):**
```json
{
  "trustScore": 35,
  "isSuspicious": true,
  "reasons": [
    "Location contains placeholder words",
    "Suspicious high rate of submissions from device ID"
  ]
}
```

---

## 2. Production Deployment Guide

### System Prerequisites
Ensure the target server environment has:
- **Node.js:** v18.0.0 or higher
- **PostgreSQL Database:** v14.0 or higher
- **Python:** v3.9 or higher (with `pip`, `venv` setup)

### Step 1: Environment Variables Setup
Create `.env` file in root and populate:
```bash
# Database Conn
DATABASE_URL="postgresql://postgres:secure_password@localhost:5432/bloodlink_db?schema=public"

# Express Port Config
PORT=4000
NODE_ENV=production

# Security Token Key
JWT_SECRET="national_secure_secret_key"
```

### Step 2: Database Initialization (Prisma ORM)
Navigate to database package directory and initialize relations:
```bash
npm install prisma -g
npx prisma db push
npx prisma generate
```

### Step 3: Run Python ML Service
Prepare Python virtual environment and run AI training script:
```bash
cd ai
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Linux
source venv/bin/activate

pip install numpy pandas scikit-learn
python donor_response.py
python demand_forecast.py
```

### Step 4: Express APIs Backend Bootstrapping
Install and run Backend Service using PM2 process manager:
```bash
cd backend
npm install
npm run build
pm2 start dist/server.js --name "bloodlink-backend-api"
```

### Step 5: Frontend Web Server Deployment
Compile the React-TS frontend static assets:
```bash
cd frontend
npm install
npm run build
```
This yields optimized HTML/JS/CSS files in the `frontend/dist` directory. Serve this build folder using Nginx, AWS S3 static website hosting, or Netlify/Vercel.

#### Example Nginx Virtual Host Configuration:
```nginx
server {
    listen 80;
    server_name bloodlink-network.gov.in;

    location / {
        root /var/www/bloodlink/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
