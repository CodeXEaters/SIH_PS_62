# DHRUV — Integrated Polar Expedition Logistics & Asset Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Tests](https://img.shields.io/badge/Tests-16%20Passed-brightgreen.svg?style=flat)]()

**Smart India Hackathon | 48-Hour Build Sprint**

---

## 🏔 Overview
DHRUV is a unified operational platform built for polar research stations (Maitri, Bharati, Field Camps, Cape Town Transit Hub, and NCPOR HQ). It coordinates logistics, inventory forecasting, asset maintenance, personnel deployment, and emergency response across extreme Antarctic environments.

This repository contains the backend core platform built by **Member 1 (Backend Lead & Core Platform)**.

---

## 👥 Architecture & Team Ownership
- **Member 1 (Core Platform)**: Project foundation, PostgreSQL 16 database, JWT authentication, Stations, Personnel, Inventory, Assets, Seed Data, and Integration Contracts.
- **Member 2 (Logistics & Tracking)**: Cargo lifecycle, QR scanning, transport assets, traverse missions, live GPS tracking simulator.
- **Member 3 (Intelligence & Safety)**: Predictive risk scoring, inventory shortage forecasting, delay prediction, anomaly detection, emergency dispatch, and WebSockets.

Detailed documentation:
- Database Schema & Ownership: [`DATABASE_CONTRACT.md`](DATABASE_CONTRACT.md) / [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)
- API Specifications: [`API_CONTRACT.md`](API_CONTRACT.md) / [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

---

## 🚀 Quickstart

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 16 (or Docker Desktop)
- Git

### 2. Start PostgreSQL 16 (via Docker Compose)
```bash
docker compose up -d
docker compose ps
```

### 3. Environment Setup
```bash
# Windows PowerShell
python -m venv venv
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt
```

### 4. Seed the Database
Populate 5 polar stations, 12 personnel, 20 inventory items (with low-stock demo items), 10 expedition assets (with maintenance alert items), and demo user credentials:
```bash
python backend/scripts/seed.py
```

### 5. Launch the FastAPI Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Endpoint: `http://localhost:8000/`
- Interactive Swagger UI: `http://localhost:8000/docs`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

---

## 🔑 Default Seed Credentials

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin@dhruv.gov.in` | `Admin@123456` | `ADMIN` | Full platform administration |
| `ops@dhruv.gov.in` | `Ops@123456` | `OPERATIONS` | Mission control & base management |
| `logistics@dhruv.gov.in` | `Logistics@123456` | `LOGISTICS` | Cargo & supply chain |
| `station_mgr@dhruv.gov.in` | `Station@123456` | `STATION_MANAGER` | Base commander (Maitri) |
| `doctor@dhruv.gov.in` | `Doctor@123456` | `MEDICAL` | Chief medical officer |
| `scientist@dhruv.gov.in` | `Scientist@123456` | `SCIENTIST` | Lead atmospheric researcher |

---

## 🧪 Automated Testing
Run the complete automated test suite:
```bash
pytest -v backend/tests
```
All 16 unit and integration test cases verify authentication, role-based access, station CRUD, personnel status patching, inventory low-stock queries, and asset maintenance alerts.
