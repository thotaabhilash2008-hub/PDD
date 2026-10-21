# BloodLink AI - System Architecture & UML Diagrams

This document outlines the technical architecture, data structures, workflows, and diagrams for the **BloodLink AI** national healthcare infrastructure.

---

## 1. System Architecture Diagram
The platform is designed as a secure, containerized multi-tier microservice architecture. 

```mermaid
graph TD
    %% Tiers
    subgraph Client Tier (Web Apps)
        A["React Dashboard (SPA)"]
        B["iOS/Android (React Native)"]
    end

    subgraph API Gateway & Service Tier
        C["Express.js Web Server"]
        D["Socket.io WebSocket Node"]
    end

    subgraph AI/ML Processing Container
        E["Python ML Daemon (Flask/FastAPI)"]
        F["RandomForest & XGBoost Predictors"]
    end

    subgraph Data & Storage Layer
        G[("PostgreSQL DB (Prisma Client)")]
        H[("IPFS / Ledger Database")]
    end

    %% Client Interactions
    A -->|REST API Requests| C
    A <-->|Real-time streams| D
    B -->|REST API Requests| C
    B <-->|Biometrics Sync| D

    %% Server Internal
    C -->|gRPC / REST calls| E
    E -->|Loads Models| F
    C -->|Query / Mutate| G
    C -->|Publish Blocks| H
```

---

## 2. Entity Relationship Diagram (ERD)
The schema is modeled with relational constraints matching standard healthcare directory standards.

```mermaid
erDiagram
    USER ||--o| DONOR_PROFILE : "has donor attributes"
    USER ||--o| HOSPITAL_STAFF : "is hospital employee"
    USER ||--o| BLOOD_BANK_STAFF : "is blood bank employee"
    USER ||--o{ BLOOD_REQUEST : "makes recipient request"
    
    DONOR_PROFILE ||--o{ DONOR_RESPONSE : "submits response"
    DONOR_PROFILE ||--o{ WEARABLE_LOG : "uploads vitals"
    
    HOSPITAL ||--o{ HOSPITAL_STAFF : "employs"
    HOSPITAL ||--o{ BLOOD_REQUEST : "raises emergency"
    HOSPITAL ||--o{ BLOOD_INVENTORY : "stores"
    HOSPITAL ||--o{ STOCK_TRANSFER : "receives transfer"

    BLOOD_BANK ||--o{ BLOOD_BANK_STAFF : "employs"
    BLOOD_BANK ||--o{ BLOOD_INVENTORY : "stores"
    BLOOD_BANK ||--o{ STOCK_TRANSFER : "sends transfer"

    BLOOD_REQUEST ||--o{ DONOR_RESPONSE : "triggers matches"
    BLOOD_REQUEST ||--o{ BLOCKCHAIN_BLOCK : "records events"
```

---

## 3. UML Sequence Diagram: Emergency Matching & Dispatch
This sequence details the interactions when a clinical user raises an urgent whole blood request.

```mermaid
sequenceDiagram
    autonumber
    actor Hospital as Hospital Coordinator
    participant Server as Express API Gateway
    participant AI as AI Engine (Python)
    participant WS as Socket.IO Node
    actor Donor as Available Donors
    participant Drone as Autonomous Drone Service

    Hospital->>Server: Raise Emergency Request (O-Negative, Jubilee Hills)
    activate Server
    Server->>Server: Categorize priority & execute Fraud Check (Trust: 98%)
    Server->>AI: Trigger matchDonors() & routeOpt()
    activate AI
    AI-->>Server: Ranked matches list & ETA route predictions
    deactivate AI
    Server-->>Hospital: Returns Matching Scores & Probability Dashboard
    
    Server->>WS: Broadcast Alert Event
    activate WS
    WS->>Donor: Push notification ("Urgent call: O- within 15 mins")
    activate Donor
    Donor->>WS: Accept Request (Coordinate stream active)
    deactivate Donor
    deactivate WS

    Server->>Drone: Dispatch blood bank inventory transfer payload
    activate Drone
    Drone-->>Server: Flight GPS path coordinate stream
    Drone-->>Hospital: Landing success & delivery confirmation
    deactivate Drone
    Server->>Server: Write final transfusion usage block to Blockchain ledger
    deactivate Server
```

---

## 4. UML Class Diagram
The software classes modeling the AI Logistics services.

```mermaid
classDiagram
    class MatchingEngine {
        +Record compatibilityMatrix
        +calculateDistance(lat1, lon1, lat2, lon2) float
        +matchDonors(bloodGroup, lat, lng, donors) List
    }
    
    class RouteOptimizer {
        +Map logisticsGraph
        +optimizeRoute(startNode, endNode, trafficMods, closedEdges) RouteResult
    }
    
    class DonorResponseModel {
        +RandomForestClassifier clf
        +train(dataset) EvaluationReport
        +predictProbability(distance, responseRate, daysSinceDonation) float
    }

    class FraudDetector {
        +float threshold
        +inspectRequest(ip, user, phone, loc) TrustReport
    }

    MatchingEngine ..> RouteOptimizer : "uses ETA prediction"
    MatchingEngine ..> DonorResponseModel : "scores likelihood"
```

---

## 5. User Flow Diagrams
Onboarding and Emergency Response loops.

```mermaid
graph TD
    A[Start Onboarding] --> B[Enter Identity Details]
    B --> C[KYC Validation Check]
    C -->|Success| D[Vitals Check via Apple Watch]
    C -->|Failure| E[Re-upload ID / Contact Support]
    D -->|Vitals Normal| F[Active Donor Status Enabled]
    D -->|Vitals Elevated/Sick| G[Temporary Deferral Alert]
    F --> H[Await Emergency Call Alert]
    H --> I{Emergency Raised?}
    I -->|Yes| J[Accept Dispatch Alert]
    I -->|No| H
    J --> K[Drone/Donor En-route Tracker]
    K --> L[Transfusion Completed & Reward Points Distributed]
```
