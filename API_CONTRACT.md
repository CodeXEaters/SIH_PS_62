# DHRUV API Specifications & Contract

**Base URL**: `http://localhost:8000`  
**Interactive Swagger Docs**: `http://localhost:8000/docs`  
**OpenAPI Specification**: `http://localhost:8000/openapi.json`

---

## Authentication & Security

All authenticated endpoints require the header:
```
Authorization: Bearer <access_token>
```

### Roles
- `ADMIN`: Full access to all endpoints.
- `OPERATIONS`: Stations, personnel, inventory, assets management.
- `LOGISTICS`: Inventory, assets, cargo & transport.
- `STATION_MANAGER`: Station-level operations, personnel roster.
- `FIELD_TEAM`: Status reporting and telemetry.
- `MEDICAL`: Medical personnel and supply tracking.
- `SCIENTIST`: Research instruments and field camp operations.

---

## Endpoints Specification

### 1. Health
- `GET /`
  - **Response 200**:
    ```json
    { "status": "ok", "message": "DHRUV backend is running" }
    ```

### 2. Authentication (`/auth`)
- `POST /auth/register`
  - **Body**:
    ```json
    {
      "email": "user@dhruv.gov.in",
      "password": "SecurePassword123",
      "full_name": "Dr. Tarun Verma",
      "role": "SCIENTIST"
    }
    ```
  - **Response 201**: User object (without password hash)

- `POST /auth/login`
  - Supports JSON `{ "email": "...", "password": "..." }` or Form data `username=...&password=...`
  - **Response 200**:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer"
    }
    ```

- `GET /auth/me`
  - Protected endpoint returning current user profile.

---

### 3. Stations (`/stations`)
- `GET /stations`
  - Query params: `type` (optional), `status` (optional)
  - **Response 200**: Array of stations.
- `POST /stations` (ADMIN, OPERATIONS)
  - **Body**:
    ```json
    {
      "name": "Field Camp Echo",
      "location": "Amery Ice Shelf, East Antarctica",
      "latitude": -69.7500,
      "longitude": 73.5000,
      "type": "FIELD_CAMP",
      "status": "OPERATIONAL"
    }
    ```
- `GET /stations/{id}`
  - **Response 200**: Station details.

---

### 4. Personnel (`/personnel`)
- `GET /personnel`
  - Query params: `station_id` (optional), `status` (optional), `team` (optional)
- `POST /personnel` (ADMIN, OPERATIONS, STATION_MANAGER)
  - **Body**:
    ```json
    {
      "name": "Dr. Priya Nair",
      "designation": "Lead Glaciologist",
      "team": "Atmospheric Science",
      "station_id": 4,
      "current_location": "Bharati Main Laboratory",
      "status": "ACTIVE",
      "medical_clearance": true,
      "emergency_contact": "+91-9876543210",
      "user_id": 6
    }
    ```
- `GET /personnel/{id}`
- `PUT /personnel/{id}`
- `PATCH /personnel/{id}/status`
  - **Body**:
    ```json
    {
      "status": "ON_MISSION"
    }
    ```

---

### 5. Inventory (`/inventory`)
- `GET /inventory`
  - Query params: `station_id` (optional), `category` (optional)
- `GET /inventory/low-stock` *(CRITICAL FOR MEMBER 3 INTEGRATION)*
  - Filters where `quantity <= minimum_threshold`.
  - **Response 200**:
    ```json
    [
      {
        "id": 3,
        "item_name": "Arctic Grade Diesel A-1 (Emergency Reserve)",
        "category": "FUEL",
        "station_id": 5,
        "quantity": 450.0,
        "minimum_threshold": 800.0,
        "daily_consumption": 90.0,
        "unit": "L",
        "expiry_date": null,
        "last_updated": "2026-09-12T08:15:00Z"
      }
    ]
    ```
- `POST /inventory` (ADMIN, OPERATIONS, LOGISTICS)
- `GET /inventory/{id}`
- `PUT /inventory/{id}`

---

### 6. Assets (`/assets`)
- `GET /assets`
  - Query params: `station_id`, `asset_type`, `status`
- `GET /assets/maintenance-alerts`
  - Returns assets where `health_score < 60` or `status in ['MAINTENANCE_REQUIRED', 'IN_REPAIR']` or `next_maintenance <= today`.
  - **Response 200**: Array of alert assets.
- `POST /assets` (ADMIN, OPERATIONS, LOGISTICS)
  - **Body**:
    ```json
    {
      "asset_name": "PistenBully 300 Polar Snow Groomer",
      "asset_type": "VEHICLE",
      "qr_code": "DHRUV:ASSET:VEH-PB300-01",
      "status": "OPERATIONAL",
      "station_id": 3,
      "location": "Maitri Hangar Bay 1",
      "health_score": 88.5
    }
    ```
- `GET /assets/{id}`
- `PUT /assets/{id}`
