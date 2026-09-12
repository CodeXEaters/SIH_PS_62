# DHRUV Database Architecture & Ownership Contract

**Project**: DHRUV — Integrated Polar Expedition Logistics & Asset Management System  
**Sprint**: Smart India Hackathon | 48-Hour Build Sprint  
**Lead & Database Architect**: Member 1 (Backend Lead & Core Platform)

---

## 1. Domain Ownership Matrix

| Domain / Table | Owner | Purpose & Dependencies |
| :--- | :--- | :--- |
| `users` | **Member 1** | System authentication, passwords, RBAC permissions. Referenced by `personnel`. |
| `stations` | **Member 1** | Polar stations, bases & camps. Referenced by `personnel`, `inventory`, `assets`, `cargo`, `transport`, `missions`. |
| `personnel` | **Member 1** | Expedition team roster, clearances, status. Referenced by `missions`, `emergencies`. |
| `inventory` | **Member 1** | Resource stocks, consumption, thresholds. Consumed by Member 3 (Intelligence & Shortage Forecasting). |
| `assets` | **Member 1** | Vehicles, generators, comms, medical & science equipment with QR codes. Referenced by `tracking`, `emergencies`. |
| `cargo` | **Member 2** | Packages, priority, dispatch & delivery. References `stations(id)`. |
| `cargo_events` | **Member 2** | Chain-of-custody tracking & scans. References `cargo(id)`, `stations(id)`, `users(id)`. |
| `transport` | **Member 2** | Vessels, aircraft, snow vehicles. References `stations(id)`. |
| `missions` | **Member 2** | Traverses, field science operations. References `personnel(id)` (lead), `stations(id)`. |
| `tracking_events`| **Member 2** | Live GPS telemetry stream. Consumed by Member 3 (Anomaly Detection). |
| `alerts` | **Member 3** | Central alerts dashboard. References any entity (`entity_type`, `entity_id`). |
| `emergencies` | **Member 3** | SOS response coordination. References `personnel(id)`, `assets(id)`, `missions(id)`. |

---

## 2. Member 1 Schemas (Active & Implemented)

### `users`
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'OPERATIONS', -- ADMIN, OPERATIONS, LOGISTICS, STATION_MANAGER, FIELD_TEAM, MEDICAL, SCIENTIST
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_users_email ON users(email);
```

### `stations`
```sql
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    location VARCHAR NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    type VARCHAR NOT NULL,   -- HQ, TRANSIT_HUB, PERMANENT_STATION, FIELD_CAMP
    status VARCHAR NOT NULL -- OPERATIONAL, MAINTENANCE, STANDBY
);
CREATE INDEX ix_stations_name ON stations(name);
```

### `personnel`
```sql
CREATE TABLE personnel (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    designation VARCHAR NOT NULL,
    team VARCHAR NOT NULL,
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    current_location VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_MISSION, REST, EVACUATING
    medical_clearance BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_contact VARCHAR NOT NULL,
    last_check_in TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_personnel_station_id ON personnel(station_id);
CREATE INDEX ix_personnel_status ON personnel(status);
```

### `inventory`
```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR NOT NULL,
    category VARCHAR NOT NULL, -- FUEL, RATIONS, MEDICAL, SAFETY_GEAR, SPARE_PARTS
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    quantity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    minimum_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    daily_consumption DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unit VARCHAR NOT NULL,     -- L, KG, UNITS, PACKS, CYLINDERS
    expiry_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX ix_inventory_station_id ON inventory(station_id);
CREATE INDEX ix_inventory_category ON inventory(category);
```

### `assets`
```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_name VARCHAR NOT NULL,
    asset_type VARCHAR NOT NULL, -- VEHICLE, GENERATOR, COMMS, MEDICAL, SCIENTIFIC_INSTRUMENT
    qr_code VARCHAR UNIQUE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'OPERATIONAL', -- OPERATIONAL, MAINTENANCE_REQUIRED, IN_REPAIR, DECOMMISSIONED
    station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    location VARCHAR NOT NULL,
    last_maintenance DATE,
    next_maintenance DATE,
    health_score DOUBLE PRECISION NOT NULL DEFAULT 100.0 -- 0.0 to 100.0
);
CREATE INDEX ix_assets_station_id ON assets(station_id);
CREATE INDEX ix_assets_qr_code ON assets(qr_code);
```

---

## 3. Downstream Member Contracts (Planned)

### For Member 2 (Logistics & Tracking Engineer)
Member 2 will create the following tables on `feature/logistics`:
- `cargo`:
  - `origin_station_id` (FK -> `stations.id`)
  - `destination_station_id` (FK -> `stations.id`)
- `cargo_events`:
  - `cargo_id` (FK -> `cargo.id`)
  - `station_id` (FK -> `stations.id`, nullable)
  - `updated_by` (FK -> `users.id`, nullable)
- `transport`:
  - `current_station_id` / `destination_station_id` (FK -> `stations.id`, nullable)
- `missions`:
  - `team_lead_id` (FK -> `personnel.id`)
  - `origin_station_id` / `destination_station_id` (FK -> `stations.id`)
- `tracking_events`:
  - `entity_type` ('MISSION', 'TRANSPORT')
  - `entity_id` (Integer)

### For Member 3 (Intelligence & Safety Engineer)
Member 3 connects directly to Member 1 tables for predictive algorithms:
- **Inventory Shortage Forecasting**:
  - Consumes `inventory.quantity`, `inventory.minimum_threshold`, `inventory.daily_consumption`.
  - Calculates `days_remaining = quantity / daily_consumption`.
  - Generates alerts when `days_remaining <= 14`.
- **Emergency Response Optimization**:
  - Consumes `personnel` (available doctors & rescue team).
  - Consumes `assets` (available `VEHICLE` where `health_score >= 60.0`).
  - Consumes `stations` (coordinates for Haversine distance calculations).
