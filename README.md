# DHRUV — Integrated Polar Expedition Logistics & Asset Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000.svg?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

**Smart India Hackathon 2026 &bull; MVP / Functional Prototype**

---

## 🏔 Executive Overview

### What is DHRUV?
**DHRUV** is a unified digital command and operations platform designed for Indian Antarctic research expeditions under the National Centre for Polar and Ocean Research (**NCPOR**). It connects expedition planning, cargo logistics, inventory, personnel rosters, expedition assets, field traverses, telemetry tracking, explainable operational intelligence, risk scoring, and emergency response workflows into a single full-stack operational architecture.

### Why DHRUV Exists
Antarctic expeditions face some of the most unforgiving operational environments on Earth. Operating across permanent stations, seasonal field camps, maritime transit vessels, and high-plateau traverse routes requires precise coordination of:
- **Remote Stations & Camps** separated by thousands of kilometers of ice and harsh weather.
- **Critical Cargo & Cold-Chain Logistics** where a missing part or spoiled medical supply cannot simply be reordered.
- **Specialized Vehicles & Generators** operating near freezing failure limits.
- **Personnel Safety & Roster Clearances** requiring continuous check-in and deployment monitoring.
- **Intermittent High-Latitude Connectivity** demanding resilient offline capability and deterministic synchronization.

Historically, polar logistics rely on fragmented spreadsheets, disconnected communication logs, and siloed station-level inventories. This fragmentation creates blind spots, increases human error during resupply transfers, and delays critical decisions during polar emergencies.

### Who It Is For
- **Expedition Directors & Operations Leads (NCPOR Goa)**: Real-time situational awareness across all stations, voyages, and active field traverses.
- **Logistics & Supply Chain Coordinators (Cape Town Transit Hub & Stations)**: Manifest verification, QR code chain-of-custody tracking, and cargo delay mitigation.
- **Station Commanders & Base Engineers (Maitri & Bharati)**: Local inventory thresholds, fuel burn-rate monitoring, and preventative asset maintenance scheduling.
- **Medical & Field Safety Officers**: Personnel clearances, survivor readiness, and emergency SOS incident dispatch.

---

## ⚠️ Important Data Disclaimer

> [!IMPORTANT]
> **Synthetic Demonstration Data**: All operational records, station telemetry, personnel names, cargo consignments, inventory stock levels, and incident reports used in this platform and demonstration are **synthetic demo data** modeled on a realistic Antarctic expedition scenario (the 46th Indian Scientific Expedition to Antarctica — **ISEA-46**). They are **not** live or classified NCPOR operational records.

### Single Source of Truth Architecture
- **PostgreSQL 16** serves as the **single source of truth** for all operational and demonstration data.
- **FastAPI** provides the canonical REST API endpoints, business logic validation, and intelligence calculations.
- **Next.js Frontend** consumes the backend services through typed service layers and does **not** maintain duplicate mock datasets.
- **Dexie / IndexedDB** provides client-side offline caching of previously fetched real API data to support uninterrupted operations during simulated network dropouts.

---

## 🔄 Core Integrated Workflow

DHRUV unifies previously isolated operational stages into a continuous operational loop:

```text
Expedition Planning (ISEA-46 Milestones & Stages)
        ↓
Personnel Deployment + Asset Staging + Station Readiness
        ↓
Cargo Preparation & Packaging (NCPOR Goa / Cape Town Hub)
        ↓
QR Code Scanning & Manifest Verification (Camera / Upload / Manual)
        ↓
Chain of Custody Tracking & Transit Logging (MV Vasundhara / Il-76TD)
        ↓
Station Inventory & Fuel Burn Monitoring (Maitri & Bharati Farms)
        ↓
Explainable Intelligence: Risk Scoring, Delay Prediction & Anomaly Scans
        ↓
Deduplicated Alerts & System Recommendations
        ↓
Human-in-the-Loop Verification for Critical Actions
        ↓
Emergency Dispatch & Incident Coordination (EMG-2026-001)
        ↓
Real-Time Updated Operational Picture (Operations Map & Command Center)
        ↓
Analytics, Readiness Metrics & Fuel Consumption Reports
```

---

## 🎯 Product Features

### 1. Expedition Command Center & Operations Overview
- **Command Center Dashboard** (`/dashboard`): Global high-level KPIs covering Active Personnel, Tracked Cargo items, Operational Fleet Assets, Expedition Readiness percentage, and Active Traverses.
- **Expedition Overview** (`/expeditions/[id]`): Targeted mission status for the active expedition (ISEA-46), tracking stages (4 of 5 active), milestone deadlines, and station allocations.
- **Operational Timeline** (`/expeditions/[id]/timeline`): Chronological Gantt-style expedition stages spanning preparation, sea voyage, wintering handover, and return voyages.

### 2. Cargo Management & QR Chain of Custody
- **Manifest Registry** (`/cargo`): Full catalog of consignments with categories (Scientific, Medical, Fuel, Food, Equipment), weight metrics, handling flags, and priority classifications.
- **Cargo Detail & Lifecycle** (`/cargo/[id]`): Multi-stage lifecycle tracking (`PACKED` &rarr; `LOADED` &rarr; `DISPATCHED` &rarr; `IN_TRANSIT` &rarr; `ARRIVED` &rarr; `DELIVERED` or `DELAYED`).
- **QR Scanner Suite** (`/cargo/scanner`):
  - **Live Camera Scanner**: Hardware-accelerated camera feed scanning powered by `html5-qrcode`.
  - **QR Image Upload**: Direct parsing of digital packing slips or photographed QR labels.
  - **Manual Entry Fallback**: Immediate alphanumeric code lookup.
  - **Canonical Demonstration Cargo**: `CRG-2026-001` (Atmospheric Aerosol Sampling Filters) with QR payload `DHRUV:CARGO:CRG-2026-001`.
- **Chain of Custody** (`/cargo/chain-of-custody`): Immutable custody event timeline recording timestamp, handler designation, location, and custody verification hashes.
- **Delay Prediction**: Heuristic delay evaluation factoring weather hold events, transit mode, and transfer bottlenecks.

### 3. Personnel Roster & Medical Readiness
- **Official Expedition Roster** (`/personnel`): Comprehensive roster with roles, team assignments, base locations, and medical certifications.
- **Context-Aware Filtering**:
  - Command Center KPI links to `/personnel?status=active-deployed`, filtering directly to operational personnel (**Active + On Mission**).
  - Unfiltered direct navigation displays the full roster (**Active, On Mission, and At Station / Rest**).
  - Deep-linkable and refresh-persistent status filter synchronized with URL query parameters.
- **Personnel Dossiers** (`/personnel/[id]`): Detailed personnel records including blood group, emergency contacts, Antarctic expedition history, and assigned traverse missions.
- **Movement Logs** (`/personnel/movement`): Transfer history between Antarctic stations, transit vessels, and field camps.

### 4. Station Inventory & Fuel Management
- **Multi-Station Inventory** (`/inventory`): Tracking critical consumables across food rations, medical supplies, technical spare parts, and polar-grade fuels.
- **Threshold Alerts**: Visual alerts when stock levels fall below safety thresholds (e.g. low stock alerts on synthetic polar engine oil and LiFePO4 battery modules).
- **Inventory Transfers** (`/inventory/transfers`): Inter-station and vessel-to-station transfer orders (e.g. `TRF-2026-001` aviation fuel bunkering and `TRF-2026-002` traverse survival rations).
- **Consumption Forecasting** (`/inventory/forecast`): Days-of-supply remaining calculations based on daily consumption rates and seasonal resupply windows.
- **Weekly Fuel Logs**: Historical diesel burn tracking across Antarctic winter heating cycles.

### 5. Expedition Asset & Fleet Management
- **Asset Registry** (`/assets`): Complete fleet inventory across heavy snow vehicles (PistenBully 300, Hagglunds BV206), generators (Cummins 250kVA, Caterpillar 150kVA), satellite comms (Iridium Certus 700), and sensitive scientific instruments (Bruker FTIR spectrometer).
- **Health Scores & Condition**: Continuous status tracking (`OPERATIONAL`, `MAINTENANCE_REQUIRED`, `DEGRADED`, `OFFLINE`).
- **Preventative Maintenance** (`/assets/maintenance`): Overdue and upcoming maintenance schedules based on polar operating hours.
- **Asset Dossier** (`/assets/[id]`): Equipment specifications, assigned base, maintenance logs, and QR code tracking.

### 6. Field Missions & Traverses
- **Traverse Monitoring** (`/missions`): Tracking surface convoys and glaciological traverses across Queen Maud Land and the Larsemann Hills.
- **Mission Profiles** (`/missions/[id]`): Route origins and destinations, traverse team leads, vehicle assignments, hazard levels, and real-time waypoint progression.

### 7. Operations Map & Telemetry
- **Interactive Geospatial Map** (`/operations/map`): Polar stereographic view rendered with MapLibre GL showing Antarctic stations, field camps, resupply sea routes, and active traverse entities.
- **Live Position Markers**: Location and status tracking for transport vessels (*MV Vasundhara*), polar aircraft (*Il-76TD*), and tracked snow vehicles (*PistenBully Traverse 01*).

### 8. Explainable Intelligence & Operational Risk
DHRUV implements deterministic, explainable algorithms rather than opaque black-box models, ensuring all operational recommendations can be validated by mission controllers:
- **Cargo Delay Prediction**: Evaluates historical transit legs, weather holds, and transport status to estimate delay probability and hours.
- **Telemetry Anomaly Detection**: Monitors GPS telemetry to flag telemetry blackouts (>15 min), severe battery drains, velocity violations, and unpredicted route deviations.
- **Multi-Factor Risk Scoring**: Combines station environmental severity, low inventory reserves, asset degradation, and active emergencies into a unified risk index.
- **What-If Simulation** (`/intelligence/what-if`): Interactive scenario modeling evaluating the operational impact of severe blizzards, generator failures, or delayed resupply voyages.

### 9. Emergency Response & Incident Coordination
- **Active Incidents** (`/emergency`): Centralized emergency handling for life-safety and structural threats.
- **Canonical Incident** (`EMG-2026-001`): *"Crevasse Breach & Frostbite Hazard during Plateau Traverse"*.
- **Automated Rescue Planning**: Haversine distance calculations determine the nearest base station and fastest operational rescue vehicle.
- **Human-in-the-Loop Governance**: Automated rescue plans require explicit human approval (`APPROVED` / `REJECTED`) with mandatory decision notes before dispatch orders are persisted to the audit log.

### 10. Reports & Analytics
- **Operational Analytics** (`/reports`): Aggregate metrics including cargo dispatch efficiency, station fuel burn distributions, readiness score breakdowns, and maintenance compliance.

---

## ❄️ Demonstration Scenario (ISEA-46)

The demonstration environment is configured with the canonical **46th Indian Scientific Expedition to Antarctica (ISEA-46)** dataset:

### Operational Bases & Stations
| Station Name | Location | Type | Role |
| :--- | :--- | :--- | :--- |
| **NCPOR Goa** | Vasco da Gama, Goa, India | Headquarters | Central command, procurement, and mission direction |
| **Cape Town Transit Hub** | Port of Cape Town, South Africa | Transit Hub | Maritime embarkation, cold-chain staging, and air bridge |
| **Maitri Station** | Schirmacher Oasis, East Antarctica | Permanent Base | Inland ice-margin station, main logistics & vehicle depot |
| **Bharati Station** | Larsemann Hills, East Antarctica | Permanent Base | Coastal marine & atmospheric laboratory facility |
| **Field Camp Alpha** | Queen Maud Land Deep Core Site | Field Camp | Deep ice-core drilling project camp |
| **Field Camp Echo** | Amery Ice Shelf, East Antarctica | Field Camp | Glaciological monitoring and seasonal survey camp |

### Key Demonstration Entities
- **Primary Cargo Consignment**: `CRG-2026-001` — Atmospheric Aerosol Sampling Filters (Delayed at Prydz Bay mooring due to katabatic winds; QR payload `DHRUV:CARGO:CRG-2026-001`).
- **Active Emergency Incident**: `EMG-2026-001` — Sledge crevasse breach with Stage-2 frostbite casualty near Sector 4 Ridge, requiring PistenBully medical evacuation.
- **Sample Inter-Station Transfers**:
  - `TRF-2026-001`: 3,200 L Aviation Turbine Fuel (Jet A-1) bunkered to Bharati Helipad.
  - `TRF-2026-002`: 600 Freeze-Dried Survival MRE Rations issued to Team Alpha Field Sledge.
  - `TRF-2026-003`: 50,000 L Polar Grade Diesel awaiting pipeline transfer to Bharati Fuel Farm.

---

## 🏛 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│           Next.js 14 (App Router) • React 18 • Tailwind CSS           │
│   Command Center • QR Scanner • Operations Map • Emergency Hub        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND SERVICE LAYER                            │
│        Typed Domain Services (apiClient.ts) • Centralized Auth         │
│               Dexie / IndexedDB Client-Side Offline Cache             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / WebSocket (/ws)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND LAYER                           │
│              Python 3.11+ • Pydantic v2 • JWT Security                 │
│   Modular API Routers: /auth, /stations, /personnel, /inventory,       │
│      /assets, /cargo, /transport, /missions, /tracking, /emergency     │
│   Intelligence Engines: Anomaly Detection, Delay Predictor, Risk       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENCE LAYER (ORM)                          │
│                            SQLAlchemy 2.0                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PostgreSQL Connection Pool
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      DATABASE OF TRUTH (Postgres 16)                   │
│   Canonical Operational Seed: 6 Stations, 12 Personnel, 20 Inventory,  │
│         10 Assets, 5 Cargo Items, 3 Transports, 4 Missions             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com) 0.110+ | High-performance asynchronous Python web framework |
| **Backend Server** | [Uvicorn](https://www.uvicorn.org) 0.28+ | ASGI production server |
| **Database** | [PostgreSQL](https://www.postgresql.org) 16 | Relational single source of truth |
| **ORM** | [SQLAlchemy](https://www.sqlalchemy.org) 2.0+ | Object-relational mapping and schema management |
| **Data Validation** | [Pydantic](https://docs.pydantic.dev) v2 | Request/response schema validation and settings |
| **Authentication** | [Python-Jose](https://github.com/mpdavis/python-jose), [Passlib](https://passlib.readthedocs.io) | JWT bearer token security with Bcrypt password hashing |
| **Real-Time** | [WebSockets](https://websockets.readthedocs.io) | Real-time push for alerts and tracking telemetry |
| **Frontend Framework** | [Next.js](https://nextjs.org) 14.2 (App Router) | React framework with server and client components |
| **UI Library** | [React](https://react.dev) 18.3, [TypeScript](https://www.typescriptlang.org) 5.6 | Strict type-safe UI component architecture |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) 3.4, Lucide React | Clean, high-contrast operational aesthetic |
| **Offline Storage** | [Dexie.js](https://dexie.org) 4.0 (IndexedDB) | Client-side caching of real API data for offline resilience |
| **Data Visualization** | [Recharts](https://recharts.org) 2.13 | Charts for fuel logs, readiness, and cargo statistics |
| **Geospatial Map** | [MapLibre GL](https://maplibre.org) 4.7 | Polar coordinate situational awareness mapping |
| **QR Code Scanner** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) 2.3 | Live camera video feed decoding and image file parsing |
| **Analytics Utilities** | NumPy, pandas, scikit-learn | Heuristic calculation and tabular analysis support |
| **Containerization** | Docker, Docker Compose | Standardized local PostgreSQL container environment |

---

## 📂 Project Structure

```text
SIH_PS_62/
├── backend/
│   ├── app/
│   │   ├── ai/                      # Heuristic intelligence engines (delay, anomalies, risk)
│   │   ├── api/
│   │   │   ├── routes/              # FastAPI route controllers (cargo, personnel, emergency, etc.)
│   │   │   └── router.py            # Aggregated /api/v1 router
│   │   ├── core/                    # Security, password hashing, and token handling
│   │   ├── database/                # SQLAlchemy session, base models, seed.py, reset_demo_db.py
│   │   ├── models/                  # Declarative SQLAlchemy database models
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/                # Business logic and domain service operations
│   │   ├── websocket/               # Connection manager for /ws telemetry & alerts
│   │   ├── config.py                # Environment configuration settings
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/                       # Pytest unit and integration test suite
│   └── requirements.txt             # Python backend dependencies
│
├── frontend/
│   ├── public/                      # Static branding and icons
│   ├── scripts/                     # Operational utility scripts (e.g. reset-demo-db.js)
│   ├── src/
│   │   ├── app/                     # Next.js 14 App Router pages (dashboard, cargo, personnel, etc.)
│   │   ├── components/              # Reusable UI components, AppShell, navigation, modals
│   │   ├── context/                 # Application React context providers (Theme, etc.)
│   │   ├── lib/                     # Offline Dexie database schema and sync engine
│   │   ├── services/                # Typed frontend API service clients (cargo, personnel, etc.)
│   │   ├── store/                   # Zustand operational state management store
│   │   └── types/                   # TypeScript interfaces matching backend models
│   ├── package.json                 # Frontend scripts and npm dependencies
│   ├── tailwind.config.js           # Tailwind CSS theme configuration
│   └── tsconfig.json                # TypeScript compiler configuration
│
├── docs/                            # Deep-dive architecture and design specifications
├── docker-compose.yml               # Local PostgreSQL 16 container definition
├── API_CONTRACT.md                  # Canonical API endpoint specifications
├── DATABASE_CONTRACT.md             # Canonical database schema documentation
└── README.md                        # Master project documentation
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
Verify that your development machine satisfies the following prerequisites:
- **Git**: 2.30+
- **Python**: 3.11+ (Tested on Python 3.11 & 3.12)
- **Node.js**: 18.18+ or 20.x LTS
- **npm**: 9.x or 10.x
- **PostgreSQL 16**: Installed locally on port `5432` OR running via **Docker Desktop**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/CodeXEaters/SIH_PS_62.git
cd SIH_PS_62
```

---

### Step 2: Start the PostgreSQL Database

#### Option A: Using Docker Compose (Recommended)
```bash
docker compose up -d
docker compose ps
```
*This launches a PostgreSQL 16 container named `dhruv-postgres` exposed on port `5432` with user `dhruv_user`, password `dhruv_password`, and database `dhruv_db`.*

#### Option B: Using Local PostgreSQL Installation
If using your native PostgreSQL service, create the database and user matching `.env.example`:
```sql
CREATE USER dhruv_user WITH PASSWORD 'dhruv_password';
CREATE DATABASE dhruv_db OWNER dhruv_user;
GRANT ALL PRIVILEGES ON DATABASE dhruv_db TO dhruv_user;
```

---

### Step 3: Backend Setup

1. **Create and Activate Python Virtual Environment**:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in the repository root:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```
   *Default `.env` configuration:*
   ```env
   DATABASE_URL=postgresql://dhruv_user:dhruv_password@localhost:5432/dhruv_db
   SECRET_KEY=dhruv_polar_expedition_secret_key_super_secure_jwt_2026
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,*
   ```

4. **Seed the Canonical Demonstration Database**:
   Populate all 6 stations, 12 personnel, 20 inventory items, 10 assets, 5 cargo packages, transports, missions, and emergency incidents:
   ```bash
   # From the repository root with venv activated:
   python backend/app/database/seed.py
   ```

5. **Start the FastAPI Backend Server**:
   ```bash
   # From the repository root:
   python -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
   ```
   - **Root Health Check**: [http://localhost:8000/](http://localhost:8000/)
   - **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **OpenAPI JSON**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
   - **WebSocket Endpoints**: `ws://localhost:8000/ws/alerts` and `ws://localhost:8000/ws/tracking`

---

### Step 4: Frontend Setup

1. **Install Node.js Dependencies**:
   Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. **Launch the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

### Step 5: Deterministic Database Reset (When Needed)

If demo testing or automated test suites modify the demonstration database, restore the database back to its clean canonical seed state at any time:

```bash
# In frontend/ directory:
npm run reset-demo-db

# Or manually from the repository root:
# Windows PowerShell:
$env:DEMO_RESET="true"; python backend/app/database/reset_demo_db.py
# Linux / macOS:
DEMO_RESET=true python backend/app/database/reset_demo_db.py
```

---

## 🔑 Canonical Demonstration Credentials

The platform includes 6 seeded role-based user accounts for testing access controls and operational roles:

| Email | Password | Role | Description & Primary Access |
| :--- | :--- | :--- | :--- |
| `admin@dhruv.gov.in` | `Admin@123456` | `ADMIN` | System administrator with unrestricted platform access |
| `ops@dhruv.gov.in` | `Ops@123456` | `OPERATIONS` | Mission controller managing traverses, stations & emergencies |
| `logistics@dhruv.gov.in` | `Logistics@123456` | `LOGISTICS` | Cargo officer handling QR verification & transport fleets |
| `station_mgr@dhruv.gov.in` | `Station@123456` | `STATION_MANAGER` | Base commander managing station inventory & assets (Maitri) |
| `doctor@dhruv.gov.in` | `Doctor@123456` | `MEDICAL` | Chief medical officer managing clearances & casualty triage |
| `scientist@dhruv.gov.in` | `Scientist@123456` | `SCIENTIST` | Lead researcher operating instruments & glaciological traverses |

---

## 🧪 Automated Testing & Quality Gates

The codebase has undergone continuous verification across backend unit/integration tests, frontend TypeScript validation, linting, and production builds:

### Backend Automated Test Suite
Run the full pytest suite (78 tests covering authentication, RBAC, stations, cargo, inventory, emergency dispatch, and intelligence engines):
```bash
# From repository root with venv activated:
python -m pytest -q backend
```
*Expected result: `78 passed in ~7s`*

### Frontend Quality Checks
```bash
cd frontend

# 1. Type check
npx tsc --noEmit

# 2. ESLint code standard check
npm run lint

# 3. Production build test
npm run build
```
*Expected result: Production build compiles all 36 static/dynamic application routes with 0 errors.*

---

## 📡 Primary API Endpoints Overview

All REST endpoints are grouped under `/api/v1` and documented interactively at `/docs`:

| Resource | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/` | Core backend health probe |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT bearer token |
| **Auth** | `GET` | `/api/v1/auth/me` | Current authenticated user profile |
| **Stations** | `GET` | `/api/v1/stations` | List all operational polar stations and camps |
| **Personnel** | `GET` | `/api/v1/personnel` | List expedition personnel with status and clearances |
| **Personnel** | `GET` | `/api/v1/personnel/{id}` | Retrieve individual personnel dossier |
| **Cargo** | `GET` | `/api/v1/cargo` | List all tracked cargo consignments |
| **Cargo** | `GET` | `/api/v1/cargo/{id}` | Cargo detail (supports numeric ID or tracking code) |
| **Cargo** | `GET` | `/api/v1/cargo/{id}/timeline` | Chain-of-custody tracking events for a cargo item |
| **Inventory** | `GET` | `/api/v1/inventory` | Multi-station inventory items and stock levels |
| **Inventory** | `GET` | `/api/v1/inventory/low-stock` | Consumables below minimum safety thresholds |
| **Assets** | `GET` | `/api/v1/assets` | Fleet registry with health scores and maintenance state |
| **Missions** | `GET` | `/api/v1/missions` | Active and planned Antarctic field traverses |
| **Emergency** | `GET` | `/api/v1/emergency` | Active emergency incidents (e.g. `EMG-2026-001`) |
| **Emergency** | `POST` | `/api/v1/emergency/{id}/decision` | Human-in-the-loop approve/reject response plan |
| **Intelligence**| `GET` | `/api/v1/intelligence/cargo/{id}/delay-prediction` | Explainable delay prediction for cargo |
| **Intelligence**| `GET` | `/api/v1/intelligence/risk` | Composite operational risk score across stations |
| **Intelligence**| `GET` | `/api/v1/intelligence/anomalies` | Telemetry anomaly scan across active traverses |
| **Reports** | `GET` | `/api/v1/reports/summary` | Aggregate executive KPI metrics |
| **WebSockets** | `WS` | `/ws/alerts`, `/ws/tracking` | Live streaming telemetry and instant system alerts |

---

## 📜 License
This project is developed for the **Smart India Hackathon 2026**. Distributed under the MIT License. See [`LICENSE`](LICENSE) for more details.

