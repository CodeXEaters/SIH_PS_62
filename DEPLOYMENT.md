# DHRUV Deployment Guide — Render Cloud Platform

This guide outlines the step-by-step procedure for deploying the **DHRUV Polar Expedition Platform** on [Render](https://render.com).

> [!IMPORTANT]
> **SIH DEMO DEPLOYMENT vs. REAL PRODUCTION DEPLOYMENT**
> - **SIH Demo Deployment:** Cloud-hosted evaluation environment for demonstration and jury testing. Utilizes Render's managed services, simulated environmental telemetry, and canonical seed data.
> - **Real Production Deployment:** Hardened enterprise deployment requiring private VPC peering, dedicated high-availability PostgreSQL instances, hardware security module (HSM) secrets management, physical Iridium/AIS satellite gateway uplinks, real sensor calibration, and strict Antarctic Treaty System (ATS) audited logging.

---

## Architecture Overview

```
                                  [ User Browser ]
                                     /         \
                      HTTPS (port 443)         WSS (port 443)
                                   /             \
                                  v               v
               +-------------------------------------------------+
               |             Render Global CDN / Edge            |
               +-------------------------------------------------+
                         /                               \
                        v                                 v
          +----------------------------+    +----------------------------+
          |  dhruv-frontend (Next.js)  |    |   dhruv-backend (FastAPI)  |
          |  https://...onrender.com   |    |   https://...onrender.com  |
          +----------------------------+    +----------------------------+
                                                          |
                                                    Internal TLS
                                                          v
                                            +----------------------------+
                                            |   dhruv-db (PostgreSQL)    |
                                            |   dhruv_db @ port 5432     |
                                            +----------------------------+
```

---

## A. Render Account Setup
1. Visit [https://render.com](https://render.com) and create an account (or sign in with GitHub).
2. Choose the **Individual** or **Team** tier according to your institutional needs.
3. Ensure your billing/payment profile is configured if provisioning resources beyond the free tier.

---

## B. GitHub Repository Connection
1. In your Render Dashboard, navigate to **Account Settings** &rarr; **Connected Accounts**.
2. Connect the GitHub account that owns or has access to:
   ```
   https://github.com/CodeXEaters/SIH_PS_62
   ```
3. Grant Render read/write access to the repository.

---

## C. Blueprint Deployment (Recommended)

The repository provides a unified Infrastructure-as-Code blueprint file: [`render.yaml`](file:///e:/DHRUV/render.yaml).

1. In the Render Dashboard, click **New +** &rarr; **Blueprint**.
2. Select your connected repository: `CodeXEaters/SIH_PS_62`.
3. Select branch: `main`.
4. Render will parse `render.yaml` and display the 3 managed resources to be provisioned:
   - **`dhruv-db`**: PostgreSQL Database (Region: Singapore).
   - **`dhruv-backend`**: Python FastAPI Web Service (Region: Singapore).
   - **`dhruv-frontend`**: Node.js Next.js Web Service (Region: Singapore).
5. Click **Apply**. Render will automatically provision the database and start building both services.

---

## D. PostgreSQL Database Configuration

- **Database Name:** `dhruv_db`
- **Username:** `dhruv_user`
- **Region:** `Singapore (Southeast Asia)`
- **Dialect Compatibility:** Render automatically sets `DATABASE_URL` with a `postgres://` prefix. The DHRUV backend includes an automatic converter in [`app/config.py`](file:///e:/DHRUV/backend/app/config.py) that seamlessly translates `postgres://` to `postgresql://` for SQLAlchemy 2.0+ compatibility.
- **Connection Security:** Internal connections between `dhruv-backend` and `dhruv-db` run over Render's private encrypted network (`connectionString`).

---

## E. Backend Environment Variables (`dhruv-backend`)

Configure these in the Render Dashboard (**dhruv-backend** &rarr; **Environment**):

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | *Linked automatically from `dhruv-db`* | PostgreSQL connection string |
| `SECRET_KEY` | *Generated random 64-char string* | JWT token cryptographic signature key |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours) | JWT token session validity window |
| `ALLOWED_ORIGINS` | `https://dhruv-frontend.onrender.com,http://localhost:3000` | Comma-separated CORS allowed origins |
| `PYTHON_VERSION` | `3.11.9` | Python runtime version |

> [!CAUTION]
> Never commit real secrets or `.env` files to GitHub. Render injects these variables securely at runtime.

---

## F. Frontend Environment Variables (`dhruv-frontend`)

Configure these in the Render Dashboard (**dhruv-frontend** &rarr; **Environment**):

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://dhruv-backend.onrender.com/api/v1` | Public HTTPS REST API base URL |
| `NEXT_PUBLIC_WS_URL` | `wss://dhruv-backend.onrender.com/ws` | Public WSS WebSocket base URL |
| `NODE_VERSION` | `20.18.0` | Node.js LTS runtime version |

> [!NOTE]
> Next.js inlines `NEXT_PUBLIC_*` variables at **build time**. If you change your backend URL or service name, trigger a manual **Clear build cache & deploy** on `dhruv-frontend`.

---

## G. Database Schema & Migrations

DHRUV uses idempotent schema initialization and non-destructive column migrations on startup.

- When `dhruv-backend` starts, its FastAPI lifespan event:
  1. Verifies connectivity with `check_db_connection()`.
  2. Runs `Base.metadata.create_all(bind=engine)` to create any missing tables.
  3. Executes `run_schema_migrations()` to add any incremental columns (`ADD COLUMN IF NOT EXISTS`).
- **No destructive actions are taken on startup.** Existing tables and records are preserved.

---

## H. Seed Procedure (Canonical SIH Demo Data)

To populate the cloud PostgreSQL database with the official presentation dataset:

### Option 1: Via Render Web Shell (Easiest)
1. In the Render Dashboard, open **dhruv-backend**.
2. Click on the **Shell** tab.
3. Run:
   ```bash
   python scripts/seed.py
   ```
4. Output will confirm the seeded entities:
   - Users: 6
   - Stations: 6
   - Personnel: 12
   - Inventory: 20
   - Assets: 10
   - Cargo: 5
   - Cargo Events: 7
   - Transport: 3
   - Missions: 4
   - Tracking Events: 4
   - Inventory Transfers: 3
   - Fuel Logs: 10
   - Alerts: 4
   - Emergencies: 1
   - Permits: 4
   - Environmental Observations: 6
   - Waste Records: 5
   - Recommendation Feedback: 4

> [!TIP]
> The seed utility is **completely idempotent**. Running it multiple times will not duplicate existing entities or corrupt sequences.

### Option 2: Locally against Remote Database
If Render external database connections are enabled:
```bash
DATABASE_URL="postgres://dhruv_user:...@dpg-...-a.singapore-postgres.render.com/dhruv_db" python backend/scripts/seed.py
```

---

## I. CORS Configuration

DHRUV enforces explicit, credential-safe CORS origin validation:
- The backend parses `ALLOWED_ORIGINS` from the environment.
- Wildcards (`*`) are disallowed when `allow_credentials=True` to comply with W3C fetch security standards.
- If your frontend domain differs (e.g. custom domain `https://dhruv.ncpor.res.in`), append it to `ALLOWED_ORIGINS` in `dhruv-backend`.

---

## J. WebSockets Configuration

Render web services natively support persistent HTTP/1.1 WebSocket upgrades:
- **Local:** `ws://localhost:8000/ws`
- **Render Production:** `wss://dhruv-backend.onrender.com/ws`
- Supported streaming channels:
  - `/ws/alerts` — Real-time emergency incidents and critical life-support alerts.
  - `/ws/tracking` — Live GPS and telemetry position updates for traverse convoys.

---

## K. Health Check & Monitoring

Render uses HTTP health checks to verify that services are healthy before routing live traffic:
- **Endpoint:** `GET /health`
- **Expected Status:** HTTP 200 OK
- **Response:** `{"status": "ok", "message": "DHRUV backend is running"}`
- **External Dependency Independence:** The health endpoint responds directly from memory and does not fail if external third-party services are unreachable.

---

## L. First Login & Verification

Once both services report green status:
1. Open your deployed frontend URL: `https://dhruv-frontend.onrender.com`.
2. Navigate to `/auth/login`.
3. Sign in using the canonical system administrator credentials:
   - **Email:** `admin@dhruv.gov.in`
   - **Password:** `Admin@123456`
4. Confirm redirect to `/dashboard` and verify that all KPI metrics load without errors.

---

## M. Troubleshooting

| Symptom | Likely Cause | Solution |
| :--- | :--- | :--- |
| **Backend fails build (`pip install`)** | Python version mismatch | Ensure `PYTHON_VERSION: 3.11.9` is set in environment or `.python-version`. |
| **Backend crash: `Can't load plugin: sqlalchemy.dialects:postgres`** | Raw `postgres://` connection string | Confirm `app/config.py` has the field validator converting to `postgresql://`. |
| **Frontend displays "Unavailable" for KPIs** | CORS rejection or invalid `NEXT_PUBLIC_API_URL` | 1. Check browser console network tab.<br>2. Ensure `ALLOWED_ORIGINS` includes frontend domain.<br>3. Verify `NEXT_PUBLIC_API_URL` ends in `/api/v1`. |
| **WebSockets fail to connect (`404` / `failed`)** | Plain `ws://` used instead of `wss://` | Confirm `NEXT_PUBLIC_WS_URL` uses `wss://` on HTTPS domains. |
| **Database connection timeout** | PostgreSQL instance sleeping on free tier | Wait 30 seconds for the database instance to wake up or upgrade to Starter tier. |

---

## N. Post-Deployment Smoke Test

To verify your live Render deployment without modifying production state:

```bash
python scripts/production_smoke_test.py --base-url https://dhruv-backend.onrender.com
```

This automated, 100% read-only suite validates 21 distinct system checkpoints:
1. `/health` and root responsiveness
2. Operator JWT authentication and `/auth/me` identity
3. Stations, personnel, inventory, assets, cargo, transport, missions, live tracking, alerts
4. Permits, environment observations, waste governance, intelligence attention feed, emergency status, executive reports
5. Live WebSocket handshake (`ping` &rarr; `pong`)
