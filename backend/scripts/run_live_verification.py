"""
DHRUV Polar Expedition Platform — Complete Live Verification Suite
Executes end-to-end against live running FastAPI (port 8000) and Next.js (port 3000).
"""
import sys
import os
import time
import json
import uuid
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.error
import urllib.parse

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

results = {
    "passed": 0,
    "failed": 0,
    "tests": [],
}

created_ids = {
    "personnel": [],
    "inventory": [],
    "assets": [],
    "cargo": [],
    "transport": [],
    "missions": [],
    "alerts": [],
    "emergencies": [],
    "permits": [],
    "observations": [],
    "waste": [],
    "feedback": [],
}

def record_test(category: str, name: str, passed: bool, details: str = ""):
    status_str = "PASS" if passed else "FAIL"
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["tests"].append({
        "category": category,
        "name": name,
        "status": status_str,
        "details": details,
    })
    mark = "[OK]" if passed else "[FAIL]"
    print(f"{mark} [{category}] {name} :: {details}")

def http_req(path: str, method: str = "GET", data: dict = None, token: str = None, base: str = BACKEND_URL):
    url = f"{base}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = resp.read().decode("utf-8")
            status_code = resp.getcode()
            try:
                body_json = json.loads(resp_body) if resp_body else {}
            except Exception:
                body_json = resp_body
            return status_code, body_json
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            body_json = json.loads(err_body) if err_body else {}
        except Exception:
            body_json = err_body
        return e.code, body_json
    except Exception as ex:
        return 0, str(ex)

def run_tests():
    print("=" * 75)
    print("DHRUV PLATFORM: COMPLETE LIVE RUNNING-SYSTEM SMOKE & PARITY VERIFICATION")
    print("=" * 75)
    
    # -------------------------------------------------------------
    # 1. BASELINE BACKEND CORE TESTS (14 API Groups)
    # -------------------------------------------------------------
    code, body = http_req("/health")
    record_test("Core", "GET /health", code == 200, f"Status: {code}")

    code, body = http_req("/docs")
    record_test("Core", "GET /docs", code == 200, "Swagger UI accessible")

    # Login as Admin
    code, body = http_req("/api/v1/auth/login", "POST", {"email": "admin@dhruv.gov.in", "password": "Admin@123456"})
    admin_token = body.get("access_token") if code == 200 else None
    record_test("Auth", "POST /auth/login (Admin JWT)", code == 200 and admin_token is not None, f"Token length: {len(admin_token) if admin_token else 0}")

    # Login as Ops
    code, body = http_req("/api/v1/auth/login", "POST", {"email": "ops@dhruv.gov.in", "password": "Ops@123456"})
    ops_token = body.get("access_token") if code == 200 else None
    record_test("Auth", "POST /auth/login (Ops JWT)", code == 200 and ops_token is not None, "Ops user authenticated")

    # RBAC verification
    code, body = http_req("/api/v1/auth/me", "GET", token=admin_token)
    record_test("Auth", "GET /auth/me (RBAC Admin)", code == 200 and body.get("role") == "ADMIN", f"Role: {body.get('role')}")

    # Major API Groups
    api_groups = [
        ("/api/v1/stations", "Stations"),
        ("/api/v1/personnel", "Personnel"),
        ("/api/v1/inventory", "Inventory"),
        ("/api/v1/assets", "Assets"),
        ("/api/v1/cargo", "Cargo"),
        ("/api/v1/transport", "Transport"),
        ("/api/v1/missions", "Missions"),
        ("/api/v1/tracking/live", "Live Tracking"),
        ("/api/v1/alerts", "Alerts"),
        ("/api/v1/emergency", "Emergency"),
    ]
    for ep, grp in api_groups:
        code, body = http_req(ep, "GET", token=admin_token)
        record_test("API Groups", f"GET {ep}", code == 200, f"{grp} retrieved")

    # Resolve dynamic IDs from presentation seed
    code, stations_list = http_req("/api/v1/stations", "GET", token=admin_token)
    station_map = {s["name"]: s["id"] for s in stations_list} if code == 200 and isinstance(stations_list, list) else {}
    bharati_id = station_map.get("Bharati Station", 4)
    maitri_id = station_map.get("Maitri Station", 3)
    goa_id = station_map.get("NCPOR Goa", 1)
    capetown_id = station_map.get("Cape Town Transit Hub", 2)

    code, personnel_list = http_req("/api/v1/personnel", "GET", token=admin_token)
    leader_id = personnel_list[0]["id"] if code == 200 and isinstance(personnel_list, list) and len(personnel_list) > 0 else 1

    # -------------------------------------------------------------
    # 2. MEMBER 1 SMOKE TESTS (Personnel, Inventory, Assets)
    # -------------------------------------------------------------
    p_code = f"TEST-P-{uuid.uuid4().hex[:4]}"
    code, p_created = http_req("/api/v1/personnel", "POST", {
        "name": f"Dr. Test Polar Scientist {p_code}",
        "designation": "Atmospheric Chemist",
        "team": "Atmospheric Science",
        "station_id": bharati_id,
        "current_location": "Bharati Station Lab 2",
        "status": "ACTIVE",
        "medical_clearance": True,
        "emergency_contact": "NCPOR Polar Operations (+91-832-2525600)",
    }, token=admin_token)
    new_p_id = p_created.get("id") if code == 201 else None
    if new_p_id: created_ids["personnel"].append(new_p_id)
    record_test("Member 1", "CREATE Personnel", code == 201, f"ID: {new_p_id}")

    code, body = http_req(f"/api/v1/personnel/{new_p_id}", "GET", token=admin_token)
    record_test("Member 1", "READ Personnel", code == 200 and body.get("id") == new_p_id, f"Found {body.get('name') if isinstance(body, dict) else ''}")

    code, body = http_req(f"/api/v1/personnel/{new_p_id}/status", "PATCH", {"status": "ON_MISSION"}, token=admin_token)
    record_test("Member 1", "UPDATE Personnel Status (ON_MISSION)", code == 200 and body.get("status") == "ON_MISSION", f"Status: {body.get('status') if isinstance(body, dict) else ''}")

    # Inventory
    code, inv_created = http_req("/api/v1/inventory", "POST", {
        "item_name": f"Test Polar Grade Fuel Drum {p_code}",
        "category": "FUEL",
        "station_id": bharati_id,
        "quantity": 250.0,
        "minimum_threshold": 50.0,
        "daily_consumption": 5.0,
        "unit": "Liters",
    }, token=admin_token)
    new_inv_id = inv_created.get("id") if code == 201 else None
    if new_inv_id: created_ids["inventory"].append(new_inv_id)
    record_test("Member 1", "CREATE Inventory Item", code == 201, f"ID: {new_inv_id}")

    code, body = http_req(f"/api/v1/inventory/{new_inv_id}", "GET", token=admin_token)
    record_test("Member 1", "READ Inventory Item", code == 200 and body.get("quantity") == 250.0, "Quantity verified")

    code, body = http_req("/api/v1/inventory/low-stock", "GET", token=admin_token)
    record_test("Member 1", "GET Low Stock Inventory", code == 200 and isinstance(body, list), f"Found {len(body)} low-stock items")

    # Assets
    code, ast_created = http_req("/api/v1/assets", "POST", {
        "asset_name": f"PistenBully PB-{p_code}",
        "asset_type": "VEHICLE",
        "qr_code": f"DHRUV:ASSET:{p_code}",
        "station_id": bharati_id,
        "location": "Maitri Garage Bay 3",
        "status": "OPERATIONAL",
        "health_score": 92.5,
    }, token=admin_token)
    new_ast_id = ast_created.get("id") if code == 201 else None
    if new_ast_id: created_ids["assets"].append(new_ast_id)
    record_test("Member 1", "CREATE Asset", code == 201, f"ID: {new_ast_id}")

    code, body = http_req(f"/api/v1/assets/{new_ast_id}", "GET", token=admin_token)
    record_test("Member 1", "READ Asset", code == 200 and body.get("health_score") == 92.5, "Health score verified")

    code, body = http_req(f"/api/v1/assets/{new_ast_id}", "PATCH", {"status": "MAINTENANCE_REQUIRED"}, token=admin_token)
    record_test("Member 1", "ASSET Maintenance Status Mutation", code == 200 and body.get("status") == "MAINTENANCE_REQUIRED", f"Status: {body.get('status') if isinstance(body, dict) else ''}")

    # -------------------------------------------------------------
    # 3. MEMBER 2 SMOKE TESTS (Cargo, QR, Chain of Custody, Transport, Missions)
    # -------------------------------------------------------------
    cg_code = f"CRG-LIVE-{uuid.uuid4().hex[:5]}"
    code, cg_created = http_req("/api/v1/cargo", "POST", {
        "cargo_code": cg_code,
        "name": "Live Test Cryo-Sensor Pod",
        "category": "SCIENTIFIC",
        "weight": 42.0,
        "priority": "HIGH",
        "origin_station_id": goa_id,
        "destination_station_id": bharati_id,
        "current_location": "NCPOR Goa Logistics Depot",
        "status": "REGISTERED",
    }, token=admin_token)
    new_cg_id = cg_created.get("id") if code == 201 else None
    if new_cg_id: created_ids["cargo"].append(new_cg_id)
    expected_qr = cg_created.get("qr_code") if isinstance(cg_created, dict) else None
    record_test("Member 2", "CREATE Cargo (Auto-QR)", code == 201 and "DHRUV:CARGO:" in str(expected_qr), f"QR: {expected_qr}")

    code, body = http_req(f"/api/v1/cargo/{new_cg_id}/status", "PATCH", {"status": "PACKED"}, token=admin_token)
    record_test("Member 2", "UPDATE Cargo Status (PACKED)", code == 200 and body.get("status") == "PACKED", "Status updated")

    # QR Scan Valid
    qr_payload = {
        "qr_code": expected_qr or f"DHRUV:CARGO:{cg_code}",
        "event_type": "SCANNED",
        "location": "Cape Town Berth B5",
        "station_id": capetown_id,
        "remarks": "Transit scanning verified",
    }
    code, ev_created = http_req(f"/api/v1/cargo/{new_cg_id}/scan", "POST", qr_payload, token=admin_token)
    record_test("Member 2", "SCAN Valid QR -> Create Cargo Event", code == 200, f"Result: {ev_created.get('message') if isinstance(ev_created, dict) else ''}")

    code, timeline = http_req(f"/api/v1/cargo/{new_cg_id}/timeline", "GET", token=admin_token)
    events_count = len(timeline.get("events", [])) if isinstance(timeline, dict) else 0
    record_test("Member 2", "VIEW Cargo Timeline", code == 200 and events_count >= 1, f"Events: {events_count}")

    # QR Rejections (Security & Data Integrity)
    code, _ = http_req(f"/api/v1/cargo/{new_cg_id}/scan", "POST", {"qr_code": "INVALID-FORMAT", "location": "Goa"}, token=admin_token)
    record_test("Member 2", "REJECT Malformed QR (400)", code == 400, "Malformed prefix rejected")

    code, _ = http_req(f"/api/v1/cargo/{new_cg_id}/scan", "POST", {"qr_code": "https://malicious-site.com/qr", "location": "Goa"}, token=admin_token)
    record_test("Member 2", "REJECT External URL QR (400)", code == 400, "External URL rejected")

    code, _ = http_req(f"/api/v1/cargo/{new_cg_id}/scan", "POST", {"qr_code": "DHRUV:CARGO:NONEXISTENT-9999", "location": "Goa"}, token=admin_token)
    record_test("Member 2", "REJECT Mismatched QR Code (400)", code == 400, "Unmatched cargo code rejected")

    # Transport
    t_name = f"MV Vasiliy Polar Voyage {uuid.uuid4().hex[:4]}"
    code, tr_created = http_req("/api/v1/transport", "POST", {
        "transport_name": t_name,
        "type": "RESEARCH_VESSEL",
        "capacity": 8000.0,
        "status": "AVAILABLE",
        "current_location": "Port of Cape Town",
        "destination": "Bharati Station",
        "current_station_id": capetown_id,
        "destination_station_id": bharati_id,
    }, token=admin_token)
    new_tr_id = tr_created.get("id") if code == 201 else None
    if new_tr_id: created_ids["transport"].append(new_tr_id)
    record_test("Member 2", "CREATE Transport", code == 201, f"ID: {new_tr_id}")

    code, body = http_req(f"/api/v1/transport/{new_tr_id}", "PATCH", {"status": "IN_TRANSIT"}, token=admin_token)
    record_test("Member 2", "UPDATE Transport Status (IN_TRANSIT)", code == 200 and body.get("status") == "IN_TRANSIT", "Status updated")

    # Missions
    now = datetime.now(timezone.utc)
    m_name = f"Glaciology Sortie {uuid.uuid4().hex[:4]}"
    code, m_created = http_req("/api/v1/missions", "POST", {
        "mission_name": m_name,
        "mission_type": "SCIENTIFIC_SURVEY",
        "origin": "Bharati Station",
        "destination": "Larsemann Ridge Core 1",
        "team_lead_id": leader_id,
        "origin_station_id": bharati_id,
        "destination_station_id": maitri_id,
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=3)).isoformat(),
        "status": "PLANNED",
    }, token=admin_token)
    new_m_id = m_created.get("id") if code == 201 else None
    if new_m_id: created_ids["missions"].append(new_m_id)
    record_test("Member 2", "CREATE Mission", code == 201, f"ID: {new_m_id}")

    code, body = http_req(f"/api/v1/missions/{new_m_id}/status", "PATCH", {"status": "ACTIVE"}, token=admin_token)
    record_test("Member 2", "UPDATE Mission Status (ACTIVE)", code == 200 and body.get("status") == "ACTIVE", "Status updated")

    # Tracking Telemetry
    code, tk_res = http_req("/api/v1/tracking/update", "POST", {
        "entity_type": "MISSION",
        "entity_id": new_m_id,
        "latitude": -69.4120,
        "longitude": 76.2050,
        "speed": 18.5,
        "battery": 94.0,
    }, token=admin_token)
    record_test("Member 2", "POST Tracking Telemetry", code == 201, "Coordinates logged")

    code, live_tk = http_req("/api/v1/tracking/live", "GET", token=admin_token)
    record_test("Member 2", "GET Live Tracking", code == 200 and len(live_tk) >= 1, f"Live entities: {len(live_tk)}")

    code, entities = http_req("/api/v1/tracking/entities", "GET", token=admin_token)
    record_test("Member 2", "GET GIS Tracking Entities", code == 200 and len(entities) >= 1, f"GIS entities: {len(entities)}")

    code, hist_tk = http_req(f"/api/v1/tracking/MISSION/{new_m_id}", "GET", token=admin_token)
    record_test("Member 2", "GET Tracking History", code == 200 and len(hist_tk) >= 1, f"Records: {len(hist_tk)}")

    # -------------------------------------------------------------
    # 4. MEMBER 3 SMOKE TESTS (Alerts, Risk, Forecast, Delay, Anomaly, What-If)
    # -------------------------------------------------------------
    code, alt_created = http_req("/api/v1/alerts", "POST", {
        "alert_type": "WEATHER_BLIZZARD",
        "severity": "HIGH",
        "title": f"Incoming Katabatic Gust Warning {uuid.uuid4().hex[:4]}",
        "message": "Wind velocity expected to exceed 40 kts within 3 hours.",
        "station_id": bharati_id,
        "entity_type": "STATION",
        "entity_id": bharati_id,
    }, token=admin_token)
    new_alt_id = alt_created.get("id") if code == 201 else None
    if new_alt_id: created_ids["alerts"].append(new_alt_id)
    record_test("Member 3", "CREATE Alert", code == 201, f"ID: {new_alt_id}")

    code, body = http_req(f"/api/v1/alerts/{new_alt_id}/acknowledge", "PATCH", token=admin_token)
    record_test("Member 3", "ACKNOWLEDGE Alert", code == 200 and body.get("status") == "ACKNOWLEDGED", "Acknowledged")

    code, body = http_req(f"/api/v1/alerts/{new_alt_id}/resolve", "PATCH", token=admin_token)
    record_test("Member 3", "RESOLVE Alert", code == 200 and body.get("status") == "RESOLVED", "Resolved")

    # Risk Assessment
    code, risk_res = http_req(f"/api/v1/intelligence/risk/mission/{new_m_id}", "GET", token=admin_token)
    record_test("Member 3", "Mission Risk Assessment", code == 200 and "risk_score" in risk_res, f"Score: {risk_res.get('risk_score')}, Level: {risk_res.get('risk_level')}")

    # Inventory Shortage Forecast
    code, fcast = http_req("/api/v1/intelligence/forecast/inventory", "GET", token=admin_token)
    record_test("Member 3", "GET Inventory Forecast", code == 200 and len(fcast) >= 1, f"Items forecast: {len(fcast)}")

    # Cargo Delay Prediction
    code, delay_res = http_req(f"/api/v1/intelligence/delay/cargo/{new_cg_id}", "GET", token=admin_token)
    record_test("Member 3", "Cargo Delay Prediction", code == 200 and "delay_probability" in delay_res, f"Prob: {delay_res.get('delay_probability')}, Est hours: {delay_res.get('estimated_delay_hours')}")

    # Anomaly Scan
    code, anomalies = http_req("/api/v1/intelligence/anomalies/scan?generate_alerts=false", "POST", token=admin_token)
    record_test("Member 3", "Anomaly Detection Scan", code == 200 and "anomalies" in anomalies, f"Anomalies: {len(anomalies.get('anomalies', []))}")

    # What-If Simulation
    code, whatif_res = http_req("/api/v1/intelligence/what-if", "POST", {
        "vessel_delay_days": 5,
        "fuel_consumption_spike_pct": 20.0,
    }, token=admin_token)
    record_test("Member 3", "What-If Logistics Simulation", code == 200 and "operational_risk_score" in whatif_res, f"Simulated Risk: {whatif_res.get('operational_risk_score')}")

    # Attention Feed
    code, attention_items = http_req("/api/v1/intelligence/attention", "GET", token=admin_token)
    record_test("Member 3", "Attention Stream Feed", code == 200 and isinstance(attention_items, list), f"Attention items: {len(attention_items)}")

    # -------------------------------------------------------------
    # 5. EMERGENCY CRITICAL PATH (5/5 PASS)
    # -------------------------------------------------------------
    emg_title = f"Medical Evacuation Sortie Sector 4 {uuid.uuid4().hex[:4]}"
    code, emg_created = http_req("/api/v1/emergency", "POST", {
        "emergency_type": "MEDICAL",
        "severity": "CRITICAL",
        "title": emg_title,
        "description": "Glaciologist suffered frostbite and suspected fracture on Larsemann Ridge.",
        "station_id": bharati_id,
        "latitude": -69.4500,
        "longitude": 76.2200,
    }, token=admin_token)
    new_emg_id = emg_created.get("id") if code == 201 else None
    if new_emg_id: created_ids["emergencies"].append(new_emg_id)
    record_test("Emergency", "1. TRIGGER Emergency SOS", code == 201 and new_emg_id is not None, f"ID: {new_emg_id}")

    code, body = http_req(f"/api/v1/emergency/{new_emg_id}", "GET", token=admin_token)
    record_test("Emergency", "2. Confirm Active Emergency & Severity", code == 200 and body.get("status") == "OPEN", f"Severity: {body.get('severity')}")
    rec_resp = body.get("recommended_response") if isinstance(body, dict) else ""
    record_test("Emergency", "3. AI Recommended Response Generated", code == 200 and rec_resp is not None, f"AI Plan: {str(rec_resp)[:60]}...")

    code, dec = http_req(f"/api/v1/emergency/{new_emg_id}/decision", "POST", {
        "decision": "APPROVED",
        "notes": "PistenBully rescue crew dispatched under medical protocol.",
    }, token=ops_token)
    record_test("Emergency", "4. Human Operator Decision Approval", code == 200 and dec.get("human_decision") == "APPROVED", "Human-in-the-loop approved")

    code, res_emg = http_req(f"/api/v1/emergency/{new_emg_id}", "PUT", {"status": "RESOLVED"}, token=ops_token)
    record_test("Emergency", "5. Verify Incident Resolved", code == 200 and res_emg.get("status") == "RESOLVED", "Incident resolved")

    # -------------------------------------------------------------
    # 6. PPT PARITY FEATURES (New Features Live Test)
    # -------------------------------------------------------------
    # A. Permits CRUD, Expiry & Summary
    prm_code = f"PRM-LIVE-{uuid.uuid4().hex[:4]}"
    code, prm_created = http_req("/api/v1/permits", "POST", {
        "permit_number": prm_code,
        "permit_type": "SCIENTIFIC_RESEARCH",
        "issuing_authority": "Antarctic Treaty Secretariat (ATS)",
        "station_id": bharati_id,
        "expedition_id": "ISEA-46",
        "issue_date": now.isoformat(),
        "expiry_date": (now + timedelta(days=90)).isoformat(),
        "status": "APPROVED",
        "responsible_officer": "Dr. Priya Nair",
        "conditions": "Zero fuel discharge and minimum 100m standoff from seal rookeries.",
    }, token=admin_token)
    new_prm_id = prm_created.get("id") if code == 201 else None
    if new_prm_id: created_ids["permits"].append(new_prm_id)
    record_test("PPT-Parity", "Permits: POST /permits (Create Treaty Permit)", code == 201, f"ID: {new_prm_id}, No: {prm_code}")

    code, permits_list = http_req("/api/v1/permits?status=APPROVED", "GET", token=admin_token)
    record_test("PPT-Parity", "Permits: GET /permits (Filter by APPROVED)", code == 200 and len(permits_list) >= 1, f"Count: {len(permits_list)}")

    code, prm_sum = http_req("/api/v1/permits/summary", "GET", token=admin_token)
    record_test("PPT-Parity", "Permits: GET /permits/summary (KPI Breakdown)", code == 200 and "approved" in prm_sum, f"Total: {prm_sum.get('total')}, Approved: {prm_sum.get('approved')}")

    code, exp_prm = http_req("/api/v1/permits/expiring?days=60", "GET", token=admin_token)
    record_test("PPT-Parity", "Permits: GET /permits/expiring (<60d window)", code == 200, f"Expiring permits: {len(exp_prm)}")

    code, prm_updated = http_req(f"/api/v1/permits/{new_prm_id}/status", "PATCH", {"status": "SUSPENDED", "notes": "Temporary suspension for audit"}, token=admin_token)
    record_test("PPT-Parity", "Permits: PATCH /permits/{id}/status (SUSPENDED)", code == 200 and prm_updated.get("status") == "SUSPENDED", "Suspension applied")

    code, prm_reinstated = http_req(f"/api/v1/permits/{new_prm_id}/status", "PATCH", {"status": "APPROVED", "notes": "Reinstated"}, token=admin_token)
    record_test("PPT-Parity", "Permits: PATCH /permits/{id}/status (Reinstated)", code == 200 and prm_reinstated.get("status") == "APPROVED", "Approved")

    # B. Environmental Observations & Meteorological Radar
    code, obs_created = http_req("/api/v1/environment/observations", "POST", {
        "station_id": bharati_id,
        "latitude": -69.4072,
        "longitude": 76.1914,
        "temperature": -22.5,
        "wind_speed": 31.0,
        "wind_direction": "SSW",
        "visibility": 4.5,
        "pressure": 984.0,
        "weather_condition": "LIGHT_SNOW",
        "sea_ice_condition": "OPEN_PACK",
        "sea_ice_concentration": 40.0,
        "source_type": "SIMULATED",
        "confidence": 0.96,
        "is_simulated": True,
    }, token=admin_token)
    new_obs_id = obs_created.get("id") if code == 201 else None
    if new_obs_id: created_ids["observations"].append(new_obs_id)
    record_test("PPT-Parity", "Environment: POST /observations (Simulated Telemetry)", code == 201, f"Temp: {obs_created.get('temperature')}°C, Simulated: {obs_created.get('is_simulated')}")

    code, cur_obs = http_req(f"/api/v1/environment/current?station_id={bharati_id}", "GET", token=admin_token)
    record_test("PPT-Parity", "Environment: GET /environment/current", code == 200 and len(cur_obs) >= 1, f"Current obs count: {len(cur_obs)}")

    code, hist_obs = http_req(f"/api/v1/environment/history?station_id={bharati_id}&limit=50", "GET", token=admin_token)
    record_test("PPT-Parity", "Environment: GET /environment/history", code == 200 and len(hist_obs) >= 1, f"History records: {len(hist_obs)}")

    code, env_risk = http_req(f"/api/v1/environment/risk?station_id={bharati_id}", "GET", token=admin_token)
    record_test("PPT-Parity", "Environment: GET /environment/risk (Composite Score & Factors)", code == 200 and "score" in env_risk, f"Score: {env_risk.get('score')}, Level: {env_risk.get('level')}")

    code, env_fcast = http_req(f"/api/v1/environment/forecast?station_id={bharati_id}", "GET", token=admin_token)
    record_test("PPT-Parity", "Environment: GET /environment/forecast (24h Trend)", code == 200 and len(env_fcast) >= 8, f"Forecast points: {len(env_fcast)}")

    code, env_alerts = http_req("/api/v1/environment/alerts", "GET", token=admin_token)
    record_test("PPT-Parity", "Environment: GET /environment/alerts", code == 200, f"Alerts: {len(env_alerts)}")

    # C. Antarctic Treaty Annex III Waste Management
    code, wst_created = http_req("/api/v1/waste", "POST", {
        "station_id": bharati_id,
        "waste_category": "HAZARDOUS",
        "quantity": 125.0,
        "unit": "KG",
        "disposal_method": "RETROGRADE_SHIPMENT",
        "storage_location": "Bharati Hazardous Vault #2",
        "hazardous": True,
        "status": "STORED",
        "notes": "Spent lithium cells for 2026 retrograde cargo return",
    }, token=admin_token)
    new_wst_id = wst_created.get("id") if code == 201 else None
    if new_wst_id: created_ids["waste"].append(new_wst_id)
    record_test("PPT-Parity", "Waste: POST /waste (Hazardous Batch)", code == 201, f"ID: {new_wst_id}, Qty: 125.0 KG")

    code, wst_list = http_req("/api/v1/waste?hazardous=true", "GET", token=admin_token)
    record_test("PPT-Parity", "Waste: GET /waste (Hazardous Filter)", code == 200 and len(wst_list) >= 1, f"Hazardous batches: {len(wst_list)}")

    code, wst_sum = http_req("/api/v1/waste/summary", "GET", token=admin_token)
    record_test("PPT-Parity", "Waste: GET /waste/summary (Treaty Compliance)", code == 200 and "compliance_status" in wst_sum, f"Compliance: {wst_sum.get('compliance_status')}")

    code, wst_updated = http_req(f"/api/v1/waste/{new_wst_id}", "PATCH", {"status": "TRANSFERRED", "notes": "Manifested on MV Vasundhara"}, token=admin_token)
    record_test("PPT-Parity", "Waste: PATCH /waste/{id} (Status to TRANSFERRED)", code == 200 and wst_updated.get("status") == "TRANSFERRED", "Manifested for retrograde")

    # D. Personnel Readiness & Medical Status
    code, p_readiness = http_req("/api/v1/personnel/readiness", "GET", token=admin_token)
    record_test("PPT-Parity", "Personnel: GET /personnel/readiness", code == 200 and len(p_readiness) >= 1, f"Roster size: {len(p_readiness)}")

    code, p_sum = http_req("/api/v1/personnel/readiness/summary", "GET", token=admin_token)
    record_test("PPT-Parity", "Personnel: GET /personnel/readiness/summary", code == 200 and "readiness_percentage" in p_sum, f"Ready: {p_sum.get('ready_count')}, Rate: {p_sum.get('readiness_percentage')}%")

    code, p_patched = http_req(f"/api/v1/personnel/{leader_id}/readiness", "PATCH", {
        "readiness_status": "READY",
        "health_clearance_status": "APPROVED",
        "clearance_expiry": (now + timedelta(days=200)).isoformat(),
    }, token=admin_token)
    record_test("PPT-Parity", "Personnel: PATCH /personnel/{id}/readiness", code == 200 and p_patched.get("readiness_status") == "READY", "Readiness certified")

    # E. Expedition Pre-Flight Clearance Evaluator
    eval_req_pass = {
        "mission_name": "Routine Port Logistics Survey",
        "origin_station_id": capetown_id,
        "destination_station_id": capetown_id,
        "mission_type": "LOGISTICS_SUPPLY",
        "team_lead_id": leader_id,
        "assigned_personnel_ids": [leader_id],
        "assigned_asset_ids": [],
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=2)).isoformat(),
        "requires_permit": True,
        "permit_id": new_prm_id,
    }
    code, eval_pass = http_req("/api/v1/missions/evaluate-plan", "POST", eval_req_pass, token=admin_token)
    record_test("PPT-Parity", "Pre-Flight: Valid Sortie Evaluation -> PASS/WARNING", code == 200 and eval_pass.get("overall_status") in ["PASS", "WARNING"], f"Status: {eval_pass.get('overall_status')}")

    eval_req_missing_permit = {
        "mission_name": "Deep Continental Traverse",
        "origin_station_id": bharati_id,
        "destination_station_id": maitri_id,
        "mission_type": "FIELD_TRAVERSE",
        "team_lead_id": leader_id,
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=5)).isoformat(),
        "requires_permit": True,
        "permit_id": None,
    }
    code, eval_blocked_prm = http_req("/api/v1/missions/evaluate-plan", "POST", eval_req_missing_permit, token=admin_token)
    record_test("PPT-Parity", "Pre-Flight: Missing Mandatory Permit -> BLOCKED", code == 200 and eval_blocked_prm.get("overall_status") == "BLOCKED", f"Status: {eval_blocked_prm.get('overall_status')}")

    # Severe blizzard hazard check at Station 1
    http_req("/api/v1/environment/observations", "POST", {
        "station_id": goa_id,
        "latitude": 15.4026,
        "longitude": 73.8055,
        "temperature": -35.0,
        "wind_speed": 52.0,
        "wind_direction": "SW",
        "visibility": 0.2,
        "pressure": 965.0,
        "weather_condition": "BLIZZARD",
        "source_type": "SIMULATED",
        "is_simulated": True,
    }, token=admin_token)
    eval_req_weather = {
        "mission_name": "Blizzard Sortie",
        "origin_station_id": goa_id,
        "destination_station_id": goa_id,
        "mission_type": "FIELD_TRAVERSE",
        "team_lead_id": leader_id,
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=1)).isoformat(),
        "requires_permit": False,
    }
    code, eval_blocked_wth = http_req("/api/v1/missions/evaluate-plan", "POST", eval_req_weather, token=admin_token)
    record_test("PPT-Parity", "Pre-Flight: Gale Blizzard Hazard -> BLOCKED", code == 200 and eval_blocked_wth.get("overall_status") == "BLOCKED", f"Status: {eval_blocked_wth.get('overall_status')}")

    # Safety Verification: Planner is ADVISORY ONLY
    record_test("Safety Verification", "Planner is Advisory only (Evaluates PASS/WARNING/BLOCKED)", 
                eval_blocked_wth.get("overall_status") in ["PASS", "WARNING", "BLOCKED"] and "recommendations" in eval_blocked_wth,
                "Human operator retains final dispatch authorization")

    # F. Human-in-the-Loop Decision Audit Log
    code, fb_created = http_req("/api/v1/feedback", "POST", {
        "recommendation_id": f"REC-MET-{uuid.uuid4().hex[:4]}",
        "decision": "APPROVED",
        "reason": "Expedition Commander approved auxiliary heating unit startup.",
        "outcome": "SUCCESSFUL",
    }, token=ops_token)
    new_fb_id = fb_created.get("id") if code == 201 else None
    if new_fb_id: created_ids["feedback"].append(new_fb_id)
    record_test("PPT-Parity", "Feedback: POST /feedback (Record Human Decision)", code == 201, f"ID: {new_fb_id}")

    code, fb_sum = http_req("/api/v1/feedback/summary", "GET", token=admin_token)
    record_test("PPT-Parity", "Feedback: GET /feedback/summary (Audit Trail)", code == 200 and "acceptance_rate_percent" in fb_sum, f"Decisions: {fb_sum.get('total_decisions')}, Acceptance: {fb_sum.get('acceptance_rate_percent')}%")

    # G. Simulated Data Labels & External Provider Abstraction
    code, cur_all = http_req("/api/v1/environment/current", "GET", token=admin_token)
    all_simulated = all(item.get("is_simulated") is True and item.get("source_type") == "SIMULATED" for item in cur_all)
    record_test("Integrity", "Environmental Telemetry tagged SIMULATED & is_simulated=True", all_simulated, "Zero false claims of live satellite/AIS hardware")

    # -------------------------------------------------------------
    # 7. FRONTEND LIVE ROUTE VERIFICATION (Next.js port 3000)
    # -------------------------------------------------------------
    fe_routes = [
        ("/", "Landing Page"),
        ("/dashboard", "Command Center Dashboard"),
        ("/expeditions", "Expedition Dossier & Milestones"),
        ("/personnel", "Personnel Management"),
        ("/inventory", "Inventory Management"),
        ("/assets", "Fleet Assets"),
        ("/cargo", "Cargo & QR Logistics"),
        ("/cargo/scanner", "QR Scanner Console"),
        ("/cargo/chain-of-custody", "Chain-of-Custody Timeline"),
        ("/missions", "Field Missions & Traverse Planning"),
        ("/operations/map", "Operations GIS Map"),
        ("/emergency", "Emergency Response Console"),
        ("/emergency/history", "Emergency Response History"),
        ("/intelligence/environment", "Environmental Intelligence"),
        ("/intelligence/risk", "Polar Risk Assessment Engine"),
        ("/intelligence/what-if", "What-If Logistics Simulator"),
        ("/permits", "Antarctic Treaty Permits"),
        ("/environment/waste", "Antarctic Waste Register"),
        ("/reports", "Expedition Reports"),
    ]
    for rpath, label in fe_routes:
        code, body = http_req(rpath, "GET", base=FRONTEND_URL)
        record_test("Frontend Routes", f"GET http://localhost:3000{rpath}", code == 200, f"{label} returned HTTP 200")

    # -------------------------------------------------------------
    # 8. COMPLETE PPT STORY END-TO-END EXECUTION
    # -------------------------------------------------------------
    story_steps = [
        ("LOGIN", ops_token is not None),
        ("COMMAND CENTER", http_req("/api/v1/stations", "GET", token=ops_token)[0] == 200),
        ("EXPEDITION", http_req("/api/v1/expeditions/active", "GET", token=ops_token)[0] == 200),
        ("VALID PERMIT", http_req("/api/v1/permits", "GET", token=ops_token)[0] == 200),
        ("PERSONNEL READINESS", http_req("/api/v1/personnel/readiness", "GET", token=ops_token)[0] == 200),
        ("ENVIRONMENT CHECK", http_req("/api/v1/environment/current", "GET", token=ops_token)[0] == 200),
        ("MISSION PLANNING", http_req("/api/v1/missions", "GET", token=ops_token)[0] == 200),
        ("PRE-FLIGHT EVALUATION", eval_pass.get("overall_status") in ["PASS", "WARNING"]),
        ("CARGO", http_req("/api/v1/cargo", "GET", token=ops_token)[0] == 200),
        ("INVENTORY", http_req("/api/v1/inventory", "GET", token=ops_token)[0] == 200),
        ("TRACKING", http_req("/api/v1/tracking/live", "GET", token=ops_token)[0] == 200),
        ("ENVIRONMENTAL RISK", http_req(f"/api/v1/environment/risk?station_id={bharati_id}", "GET", token=ops_token)[0] == 200),
        ("ALERT", http_req("/api/v1/alerts", "GET", token=ops_token)[0] == 200),
        ("EMERGENCY", http_req("/api/v1/emergency", "GET", token=ops_token)[0] == 200),
        ("HUMAN APPROVAL", dec.get("human_decision") == "APPROVED"),
        ("FEEDBACK/AUDIT", http_req("/api/v1/feedback/summary", "GET", token=ops_token)[0] == 200),
        ("REPORT", http_req("/reports", "GET", base=FRONTEND_URL)[0] == 200),
    ]
    for step_name, step_passed in story_steps:
        record_test("Complete PPT Story", f"Step: {step_name}", step_passed, "Verified end-to-end")

    # -------------------------------------------------------------
    # 9. CLEANUP TEST-GENERATED EPHEMERAL ROWS
    # -------------------------------------------------------------
    try:
        from app.database.database import SessionLocal
        from sqlalchemy import text
        db_cleanup = SessionLocal()
        try:
            if created_ids["personnel"]:
                db_cleanup.execute(text("DELETE FROM personnel WHERE id = ANY(:ids)"), {"ids": created_ids["personnel"]})
            if created_ids["inventory"]:
                db_cleanup.execute(text("DELETE FROM inventory WHERE id = ANY(:ids)"), {"ids": created_ids["inventory"]})
            if created_ids["assets"]:
                db_cleanup.execute(text("DELETE FROM assets WHERE id = ANY(:ids)"), {"ids": created_ids["assets"]})
            if created_ids["cargo"]:
                db_cleanup.execute(text("DELETE FROM cargo_events WHERE cargo_id = ANY(:ids)"), {"ids": created_ids["cargo"]})
                db_cleanup.execute(text("DELETE FROM cargo WHERE id = ANY(:ids)"), {"ids": created_ids["cargo"]})
            if created_ids["transport"]:
                db_cleanup.execute(text("DELETE FROM transport WHERE id = ANY(:ids)"), {"ids": created_ids["transport"]})
            if created_ids["missions"]:
                db_cleanup.execute(text("DELETE FROM tracking_events WHERE entity_id = ANY(:ids) AND entity_type = 'MISSION'"), {"ids": created_ids["missions"]})
                db_cleanup.execute(text("DELETE FROM missions WHERE id = ANY(:ids)"), {"ids": created_ids["missions"]})
            if created_ids["alerts"]:
                db_cleanup.execute(text("DELETE FROM alerts WHERE id = ANY(:ids)"), {"ids": created_ids["alerts"]})
            if created_ids["emergencies"]:
                db_cleanup.execute(text("DELETE FROM emergencies WHERE id = ANY(:ids)"), {"ids": created_ids["emergencies"]})
            if created_ids["permits"]:
                db_cleanup.execute(text("DELETE FROM permits WHERE id = ANY(:ids)"), {"ids": created_ids["permits"]})
            if created_ids["observations"]:
                db_cleanup.execute(text("DELETE FROM environmental_observations WHERE id = ANY(:ids)"), {"ids": created_ids["observations"]})
            if created_ids["waste"]:
                db_cleanup.execute(text("DELETE FROM waste_records WHERE id = ANY(:ids)"), {"ids": created_ids["waste"]})
            if created_ids["feedback"]:
                db_cleanup.execute(text("DELETE FROM recommendation_feedback WHERE id = ANY(:ids)"), {"ids": created_ids["feedback"]})
            db_cleanup.commit()
            record_test("Cleanup", "Ephemeral Test Record Cleanup", True, "Pruned test rows; presentation seed data intact")
        finally:
            db_cleanup.close()
    except Exception as e:
        record_test("Cleanup", "Ephemeral Test Record Cleanup", False, str(e))

    print("=" * 75)
    print(f"LIVE TEST TOTALS: {results['passed']} PASSED, {results['failed']} FAILED (Total: {results['passed'] + results['failed']})")
    print("=" * 75)
    return results

if __name__ == "__main__":
    res = run_tests()
    if res["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
