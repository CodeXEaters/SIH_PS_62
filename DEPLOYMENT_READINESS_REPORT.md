# DHRUV — Render Deployment Readiness & Audit Report

**Date:** 2026-09-30  
**Target Platform:** Render Cloud Platform ([render.com](https://render.com))  
**Target Repository:** [`https://github.com/CodeXEaters/SIH_PS_62.git`](https://github.com/CodeXEaters/SIH_PS_62.git)  
**Target Branch:** `main` (Head: `abc4776`)  
**Deployment Blueprint:** [`render.yaml`](file:///e:/DHRUV/render.yaml)  

---

> [!IMPORTANT]
> ### CLOUD-HOSTED SIH MVP STATUS NOTICE
> This system has successfully passed all verification gates (116/116 live tests, 99/99 pytest, 21/21 production smoke tests, 0 TS errors, 0 ESLint errors, and 45/45 Next.js routes compiled).
> 
> **However, this deployment constitutes a cloud-hosted SIH Evaluation MVP, NOT a fully hardened military/mission-critical production system.**
> Real-world polar deployment requires:
> 1. Dedicated, multi-region high-availability PostgreSQL with streaming replication and WAL archiving (beyond Render's basic tier).
> 2. Direct hardware uplinks to Iridium Edge/SBD modems and coastal AIS base stations rather than simulated telemetry feeds.
> 3. Hardware Security Module (HSM) / KMS key management for cryptographic credentials and JWT signing.
> 4. Physical air-gapped station local caching sidecars with periodic satellite store-and-forward batching.
> 5. Formal Antarctic Treaty Secretariat (ATS) electronic data exchange compliance validation.

---

## 1. Render Resources Specification

The repository provides a complete declarative Infrastructure-as-Code blueprint file: [`render.yaml`](file:///e:/DHRUV/render.yaml).

| Resource Name | Resource Type | Runtime / Engine | Region | Plan |
| :--- | :--- | :--- | :--- | :--- |
| **`dhruv-db`** | PostgreSQL Database | PostgreSQL 16 | `singapore` | Free / Starter |
| **`dhruv-backend`** | Web Service | `python` (3.11.9) | `singapore` | Starter |
| **`dhruv-frontend`** | Web Service | `node` (20.18.0) | `singapore` | Starter |

---

## 2. Directory Roots, Build & Start Commands

### Backend (`dhruv-backend`)
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`
- **Runtime Specification:** `.python-version` & `runtime.txt` set to `3.11.9`

### Frontend (`dhruv-frontend`)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/`
- **Runtime Specification:** `.node-version` set to `20.18.0`

---

## 3. Environment Variables Audit & Configuration

### Backend Environment Variables (`dhruv-backend`)

| Key | Render Configuration | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `fromDatabase: { name: dhruv-db, property: connectionString }` | Internal PostgreSQL connection URI. Automatically translated from `postgres://` to `postgresql://` in `app/config.py`. |
| `SECRET_KEY` | `generateValue: true`, `sync: false` | 64-character cryptographic JWT signing key. |
| `ALGORITHM` | `HS256` | JWT signature algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Session validity duration (24 hours). |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://dhruv-frontend.onrender.com` | Allowed CORS origins. Wildcard `*` is filtered out to preserve credentialed cookie/token security. |
| `PYTHON_VERSION` | `3.11.9` | Selected Python runtime. |

### Frontend Environment Variables (`dhruv-frontend`)

| Key | Render Configuration | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://dhruv-backend.onrender.com/api/v1` | Public HTTPS REST API base URL. |
| `NEXT_PUBLIC_WS_URL` | `wss://dhruv-backend.onrender.com/ws` | Public WSS secure WebSocket endpoint. |
| `NODE_VERSION` | `20.18.0` | Node.js engine version. |

> [!NOTE]
> Next.js inlines `NEXT_PUBLIC_*` variables into client-side JS bundles at **build time**. If the backend URL changes, trigger **Clear build cache & deploy** on `dhruv-frontend`.

---

## 4. Database Schema Initialization & Seed Procedure

### Automatic Startup Initialization
- DHRUV runs non-destructive schema initialization upon startup in [`app/main.py`](file:///e:/DHRUV/backend/app/main.py):
  1. `check_db_connection()` verifies database responsiveness.
  2. `Base.metadata.create_all(bind=engine)` creates any missing tables.
  3. `run_schema_migrations()` applies idempotent column additions (`ADD COLUMN IF NOT EXISTS`).
- **No data is dropped or truncated on startup.**

### Manual Canonical SIH Presentation Seeding
To populate the cloud PostgreSQL database with the SIH presentation dataset:
1. Open the Render Dashboard &rarr; **`dhruv-backend`** &rarr; **Shell**.
2. Execute:
   ```bash
   python scripts/seed.py
   ```
3. Seeding is **100% idempotent** (checks existing unique records before inserting). Resulting entities:
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

---

## 5. Security & Network Audit Findings

1. **Database Scheme Normalization:**
   - Render sets `DATABASE_URL` as `postgres://...`. SQLAlchemy 2.0 requires `postgresql://`.
   - **Resolution:** Added `@field_validator` in [`app/config.py`](file:///e:/DHRUV/backend/app/config.py) to automatically normalize connection strings without requiring manual intervention.
2. **CORS Hardening:**
   - Disallowed `allow_origins=["*"]` when `allow_credentials=True`.
   - **Resolution:** Added origin filtering in `app/config.py` that strips wildcard `*` if credentials are used, while honoring explicitly configured URLs.
3. **WebSocket Protocol Resolution:**
   - **Resolution:** Updated [`frontend/src/hooks/useWebSocket.ts`](file:///e:/DHRUV/frontend/src/hooks/useWebSocket.ts) to support `NEXT_PUBLIC_WS_URL` and convert `https://` to `wss://` cleanly.
4. **Hardcoded Path Audit:**
   - Checked repository for `E:\DHRUV`, `C:\Users\`, and raw localhost IP dependencies.
   - **Resolution:** All file paths are relative; localhost references are strictly fallbacks when environment variables are omitted.
5. **Secret Protection:**
   - Checked `.gitignore`: `.env` and `.env.*` are ignored. No secrets or private keys are tracked by Git.

---

## 6. Verification Quality Gates

All local quality gates were executed and passed cleanly:

| Gate | Command | Result | Duration |
| :--- | :--- | :--- | :--- |
| **Unit & Integration Tests** | `pytest -q` | **99 / 99 PASS** | 14.78s |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors** | 8.2s |
| **ESLint Audit** | `npm run lint` | **0 errors / 0 warnings** | 5.1s |
| **Production Build** | `npm run build` | **45 / 45 routes compiled** | 35.4s |
| **Live Verification Suite** | `python backend/scripts/run_live_verification.py` | **116 / 116 PASS** | 6.8s |
| **Production Smoke Suite** | `python scripts/production_smoke_test.py` | **21 / 21 PASS** | 2.1s |

---

## 7. Manual Actions Required by Evaluator / User in Render

When deploying via Render Blueprint:

1. **Create Blueprint:** In Render Dashboard, click **New +** &rarr; **Blueprint** &rarr; connect `CodeXEaters/SIH_PS_62`.
2. **Confirm Service Names:** If Render assigns customized domain names (e.g., `dhruv-backend-xyz.onrender.com`), ensure:
   - In `dhruv-frontend`: Set `NEXT_PUBLIC_API_URL` to `https://<backend-slug>.onrender.com/api/v1` and `NEXT_PUBLIC_WS_URL` to `wss://<backend-slug>.onrender.com/ws`.
   - In `dhruv-backend`: Set `ALLOWED_ORIGINS` to include `https://<frontend-slug>.onrender.com`.
3. **Execute Initial Seed:** In Render `dhruv-backend` Shell tab, run `python scripts/seed.py`.
4. **Run Smoke Test:** From your local machine, run:
   ```bash
   python scripts/production_smoke_test.py --base-url https://<backend-slug>.onrender.com
   ```
