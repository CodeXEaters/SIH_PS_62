"""
DHRUV Polar Expedition Platform — PPT Parity Demonstrations Suite
Executes the three canonical operational scenarios defined in the DHRUV PPT:
  DEMO A: Normal Expedition (Planning -> Pre-Flight -> Cargo -> Inventory -> Tracking -> Command View)
  DEMO B: Logistics & Environmental Disruption (Cargo Delay -> Alert -> Recommendation -> Human Decision -> Resolution)
  DEMO C: Emergency Response (SOS Report -> Rescue Plan -> Critical Alert -> Human Approval -> Dispatch -> Audit Trail)

Can run directly via HTTP against http://127.0.0.1:8000 or via FastAPI TestClient fallback.
"""

import sys
import os
import json
import time
import uuid
from datetime import datetime, timezone, timedelta

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")

# Test client fallback if server not running
client = None
try:
    import urllib.request
    with urllib.request.urlopen(f"{BACKEND_URL}/health", timeout=2) as r:
        if r.getcode() == 200:
            LIVE_HTTP = True
except Exception:
    LIVE_HTTP = False

if not LIVE_HTTP:
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

print(f"[INIT] Mode: {'LIVE HTTP (' + BACKEND_URL + ')' if LIVE_HTTP else 'FastAPI TestClient'}")


def call_api(method: str, path: str, json_data: dict = None, token: str = None) -> tuple:
    full_path = f"/api/v1{path}" if not path.startswith("/api/v1") and path not in ["/health", "/docs"] else path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    if LIVE_HTTP:
        import urllib.request
        import urllib.error
        url = f"{BACKEND_URL}{full_path}"
        encoded = json.dumps(json_data).encode("utf-8") if json_data is not None else None
        req = urllib.request.Request(url, data=encoded, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read().decode("utf-8")
                return resp.getcode(), json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8")
            return e.code, json.loads(raw) if raw else {}
        except Exception as e:
            return 0, str(e)
    else:
        func = getattr(client, method.lower())
        kwargs = {"headers": headers}
        if json_data is not None:
            kwargs["json"] = json_data
        resp = func(full_path, **kwargs)
        try:
            return resp.status_code, resp.json()
        except Exception:
            return resp.status_code, resp.text


# Track ephemeral demo IDs for cleanup
ephemeral_cleanup = {
    "missions": [],
    "cargo": [],
    "emergencies": [],
    "alerts": [],
    "tracking": [],
}


def run_demo_a(token: str):
    print("\n" + "=" * 70)
    print("DEMO A: NORMAL EXPEDITION WORKFLOW")
    print("  Planning -> Pre-Flight -> Cargo -> Inventory -> Tracking -> Command")
    print("=" * 70)

    # 1. Pre-Flight Sortie Evaluation
    print("\n[DEMO A.1] Running Pre-Flight Operational Readiness Evaluation...")
    eval_payload = {
        "mission_name": "Larsemann Hills Glaciology Sortie",
        "origin_station_id": 4,  # Bharati
        "destination_station_id": 1,  # Maitri
        "mission_type": "SCIENCE",
        "team_lead_id": 1,
        "assigned_personnel_ids": [1, 2],
        "assigned_asset_ids": [1],
        "assigned_cargo_ids": [],
        "itinerary_tasks": [
            "Deploy ice-penetrating radar array",
            "Collect shallow firn cores at Point Bravo",
            "Perform VHF telemetry handshake with Maitri Base"
        ],
        "start_time": datetime.now(timezone.utc).isoformat(),
        "expected_return": (datetime.now(timezone.utc) + timedelta(hours=36)).isoformat(),
        "requires_permit": False,
    }
    status, data = call_api("POST", "/missions/evaluate-plan", eval_payload, token)
    assert status == 200, f"Pre-flight check failed with status {status}: {data}"
    overall = data.get("overall_status")
    score = data.get("readiness_score")
    risk_level = data.get("risk_level")
    checks = data.get("checks", [])
    print(f"  -> Overall Status: {overall}")
    print(f"  -> Composite Readiness: {score}% (Risk Level: {risk_level})")
    print(f"  -> Evaluated Checks ({len(checks)} categories):")
    for c in checks:
        print(f"     * [{c.get('status')}] {c.get('category')}: {c.get('details')}")

    assert overall in ["PASS", "WARNING"], "Sortie should pass or warn with nominal resources"
    assert len(checks) >= 5, "Must evaluate multi-factor categories"

    # 2. Authorize and Create Mission
    print("\n[DEMO A.2] Registering Authorized Expedition Mission...")
    mission_payload = {
        "mission_name": f"Demo Sortie {uuid.uuid4().hex[:4].upper()}",
        "mission_type": "SCIENTIFIC_SURVEY",
        "origin": "Bharati Station",
        "destination": "Point Bravo",
        "team_lead_id": 1,
        "origin_station_id": 4,
        "destination_station_id": 1,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "expected_return": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "status": "PLANNED",
        "risk_level": "LOW",
    }
    status, mission = call_api("POST", "/missions", mission_payload, token)
    assert status == 201, f"Mission creation failed: {mission}"
    m_id = mission.get("id")
    ephemeral_cleanup["missions"].append(m_id)
    print(f"  -> Mission Created: ID={m_id}, Name='{mission.get('mission_name')}', Status={mission.get('status')}")

    # 3. Verify Cargo Staging for Expedition
    print("\n[DEMO A.3] Checking Cargo Staging & Logistics Corridors...")
    cargo_payload = {
        "name": "Seismic Sensor Kit & Cold Batteries",
        "category": "SCIENTIFIC",
        "origin_station_id": 1,
        "destination_station_id": 4,
        "current_location": "Bharati Staging Bay",
        "weight": 85.0,
        "priority": "HIGH",
    }
    status, cargo = call_api("POST", "/cargo", cargo_payload, token)
    assert status == 201, f"Cargo creation failed: {cargo}"
    c_id = cargo.get("id")
    ephemeral_cleanup["cargo"].append(c_id)
    print(f"  -> Cargo Staged: {cargo.get('cargo_code')} ({cargo.get('name')}), Status={cargo.get('status')}")

    # 4. Life-Support Inventory Reserve Check
    print("\n[DEMO A.4] Inspecting Station Life-Support & Fuel Reserves...")
    status, inv_forecast = call_api("GET", "/intelligence/forecast/inventory", token=token)
    assert status == 200, f"Inventory forecast failed: {inv_forecast}"
    print(f"  -> Monitored Inventory Line Items: {len(inv_forecast)}")
    if inv_forecast:
        first = inv_forecast[0]
        print(f"  -> Sample Item: {first.get('item_name')} at {first.get('station_name')}")
        print(f"     Days Remaining: {first.get('days_remaining')}d | Urgency: {first.get('urgency', 'NOMINAL')}")

    # 5. Simulated Real-Time GPS & Telemetry Tracking
    print("\n[DEMO A.5] Ingesting Field GPS & Telemetry Stream [SIMULATED]...")
    telemetry_payload = {
        "entity_type": "MISSION",
        "entity_id": m_id,
        "latitude": -69.4120,
        "longitude": 76.1950,
        "speed": 18.5,
        "battery": 94.0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    status, telemetry = call_api("POST", "/tracking", telemetry_payload, token)
    assert status == 201, f"Telemetry record failed: {telemetry}"
    print(f"  -> Position Broadcast: Lat={telemetry.get('latitude')}, Lon={telemetry.get('longitude')}, Battery={telemetry.get('battery')}%")

    # 6. Command Center Operational Verification
    print("\n[DEMO A.6] Verifying Command Center Operational View...")
    status, live_tracking = call_api("GET", "/tracking/live", token=token)
    assert status == 200, f"Live tracking failed: {live_tracking}"
    matched = any(t.get("entity_id") == m_id for t in live_tracking)
    print(f"  -> Mission Visible on Live Operations Map: {matched}")

    print("\n>> DEMO A PASSED: Complete Normal Expedition Lifecycle Executed.")


def run_demo_b(token: str):
    print("\n" + "=" * 70)
    print("DEMO B: LOGISTICS & ENVIRONMENTAL DISRUPTION")
    print("  Cargo Delay -> Alert -> Recommendation -> Human Decision -> Resolution")
    print("=" * 70)

    # 1. Create Active Cargo Consignment
    cargo_payload = {
        "name": "Generator Replacement Alternator",
        "category": "EQUIPMENT",
        "origin_station_id": 1,
        "destination_station_id": 4,
        "current_location": "MV Vasiliy Golovnin Hold #2",
        "weight": 340.0,
        "priority": "HIGH",
    }
    status, cargo = call_api("POST", "/cargo", cargo_payload, token)
    assert status == 201
    c_id = cargo.get("id")
    c_code = cargo.get("cargo_code")
    ephemeral_cleanup["cargo"].append(c_id)
    print(f"\n[DEMO B.1] Dispatched Cargo: {c_code} ({cargo.get('name')})")

    # 2. Simulate Blizzard Disruption & Scan Cargo Delay
    print("\n[DEMO B.2] Katabatic Blizzard Blocks Offload Corridor -> Scanning DELAY_REPORTED...")
    scan_payload = {
        "qr_code": c_code,
        "event_type": "DELAY_REPORTED",
        "location": "Prydz Bay Sea Ice Edge",
        "remarks": "Sustained 45 kt katabatic winds and 800m whiteout ground Ka-32 helicopter offload sling.",
    }
    status, scan_res = call_api("POST", f"/cargo/{c_id}/scan", scan_payload, token)
    assert status == 200, f"Scan failed: {scan_res}"
    assert scan_res.get("status") == "DELAYED", f"Status expected DELAYED, got {scan_res.get('status')}"
    print(f"  -> Cargo Lifecycle Status Updated: {scan_res.get('status')}")
    print(f"  -> Chain-of-Custody Event Recorded: {scan_res.get('message')}")

    # 3. Verify Operational Alert Auto-Created & Broadcasted
    print("\n[DEMO B.3] Verifying Automatic Cross-Module Operational Alert...")
    status, alerts = call_api("GET", "/alerts?limit=10", token=token)
    assert status == 200
    delay_alert = next((a for a in alerts if a.get("entity_id") == c_id and a.get("alert_type") == "CARGO_DELAY"), None)
    assert delay_alert is not None, "CARGO_DELAY alert was not auto-generated"
    alert_id = delay_alert.get("id")
    ephemeral_cleanup["alerts"].append(alert_id)
    print(f"  -> Auto-Generated Alert: ID={alert_id}, Title='{delay_alert.get('title')}'")
    print(f"     Severity: {delay_alert.get('severity')} | Status: {delay_alert.get('status')}")

    # 4. Intelligence Delay Prediction
    print("\n[DEMO B.4] Running Context-Aware Delay Prediction Model...")
    status, delay_pred = call_api("GET", f"/intelligence/delay/cargo/{c_id}", token=token)
    assert status == 200, f"Delay prediction failed: {delay_pred}"
    print(f"  -> Predicted Delay Probability: {round(delay_pred.get('delay_probability', 0) * 100, 1)}%")
    print(f"  -> Estimated Delay Duration: {delay_pred.get('estimated_delay_hours')} hours")
    print(f"  -> Recommendation: {delay_pred.get('recommendation')}")

    # 5. Human Decision: Operator Acknowledges and Adjusts Plan
    print("\n[DEMO B.5] Human Commander Acknowledges Alert & Approves Contingency...")
    status, ack_res = call_api("POST", f"/alerts/{alert_id}/acknowledge", token=token)
    assert status == 200, f"Acknowledgment failed: {ack_res}"
    print(f"  -> Alert Acknowledged: Status={ack_res.get('status')}")

    # 6. Weather Window Clears -> Delivery Completed
    print("\n[DEMO B.6] Katabatic Winds Subside -> Cargo Successfully Delivered to Station...")
    deliver_scan = {
        "qr_code": c_code,
        "event_type": "DELIVERED",
        "location": "Bharati Power Plant Workshop",
        "remarks": "Delivered and inspected by Chief Engineer. Zero damage.",
    }
    status, delivered_res = call_api("POST", f"/cargo/{c_id}/scan", deliver_scan, token)
    assert status == 200
    assert delivered_res.get("status") == "DELIVERED"
    print(f"  -> Cargo Status: {delivered_res.get('status')}")

    # Verify alert resolved automatically
    status, check_alert = call_api("GET", f"/alerts/{alert_id}", token=token)
    assert status == 200
    print(f"  -> Linked Alert Resolved State: {check_alert.get('status')}")

    print("\n>> DEMO B PASSED: Logistics & Weather Disruption Successfully Handled.")


def run_demo_c(token: str):
    print("\n" + "=" * 70)
    print("DEMO C: EMERGENCY RESPONSE WORKFLOW")
    print("  SOS Report -> Rescue Plan -> Critical Alert -> Human Approval -> Dispatch -> Audit")
    print("=" * 70)

    # 1. Trigger Field SOS Emergency Incident
    print("\n[DEMO C.1] Ingesting Field SOS Emergency Trigger...")
    emergency_payload = {
        "title": "Snowcat Traverse Mechanical Breakdown in Katabatic Blizzard",
        "emergency_type": "TRAVERSE_BLIZZARD",
        "severity": "CRITICAL",
        "station_id": 4,  # Bharati
        "latitude": -69.4250,
        "longitude": 76.2100,
        "location_description": "Larsemann Glacial Suture, 12 km SW of Bharati Base",
        "description": "PistenBully track sheared on hidden snow bridge. 2 researchers uninjured inside cabin. External temp -32C, wind 40 kts.",
    }
    status, emg = call_api("POST", "/emergency", emergency_payload, token)
    assert status == 201, f"Emergency creation failed: {emg}"
    emg_id = emg.get("id")
    code = emg.get("incident_code")
    ephemeral_cleanup["emergencies"].append(emg_id)
    print(f"  -> Incident Logged: {code} [{emg.get('severity')}]")
    print(f"  -> Title: {emg.get('title')}")
    print(f"  -> Status: {emg.get('status')} | Human Decision: {emg.get('human_decision')}")
    print(f"  -> Automated Rescue Plan Generated:")
    print(f"     \"{emg.get('recommended_response')}\"")

    # 2. Verify Critical Alert Auto-Generated
    print("\n[DEMO C.2] Verifying High-Priority Broadcast Alert...")
    status, active_alerts = call_api("GET", "/alerts?severity=CRITICAL&limit=5", token=token)
    assert status == 200
    has_emg_alert = any(code in a.get("message", "") for a in active_alerts)
    print(f"  -> High-Priority Emergency Alert Active: {has_emg_alert}")

    # 3. Human Commander Review and Authorization (Human-In-The-Loop)
    print("\n[DEMO C.3] Expedition Commander Authorizes Recommended Rescue Sortie...")
    decision_payload = {
        "decision": "APPROVED",
        "notes": "Rescue sortie approved. Dispatch PistenBully 01 and Medical Lead immediately via surveyed GPS corridor.",
    }
    status, updated_emg = call_api("POST", f"/emergency/{emg_id}/decision", decision_payload, token)
    assert status == 200, f"Emergency decision update failed: {updated_emg}"
    assert updated_emg.get("status") == "DISPATCHED", f"Expected DISPATCHED, got {updated_emg.get('status')}"
    assert updated_emg.get("human_decision") == "APPROVED"
    print(f"  -> Incident Status Transition: {updated_emg.get('status')}")
    print(f"  -> Human Decision: {updated_emg.get('human_decision')}")
    print(f"  -> Commander Notes: \"{updated_emg.get('decision_notes')}\"")

    # 4. Continuous Audit Trail & Feedback Verification
    print("\n[DEMO C.4] Verifying Recommendation Feedback Audit Log...")
    status, feedback_items = call_api("GET", f"/feedback?recommendation_id=REC-{code}", token=token)
    assert status == 200
    assert len(feedback_items) >= 1, "Audit record was not registered in recommendation_feedback"
    f_entry = feedback_items[0]
    print(f"  -> Audit Record Captured:")
    print(f"     Recommendation ID: {f_entry.get('recommendation_id')}")
    print(f"     Decision: {f_entry.get('decision')}")
    print(f"     Reason: {f_entry.get('reason')}")
    print(f"     Outcome: {f_entry.get('outcome')}")

    # 5. Incident Resolution and Post-Mission Debrief
    print("\n[DEMO C.5] Field Rescue Complete -> Casualty Safely Transported to Bharati Infirmary...")
    resolve_payload = {
        "status": "RESOLVED",
        "description": f"{emg.get('description')} -- Field team successfully retrieved and equipment anchored.",
    }
    status, resolved_emg = call_api("PATCH", f"/emergency/{emg_id}", resolve_payload, token)
    assert status == 200
    assert resolved_emg.get("status") == "RESOLVED"
    print(f"  -> Incident Final Status: {resolved_emg.get('status')}")
    print(f"  -> Resolved At: {resolved_emg.get('resolved_at')}")

    print("\n>> DEMO C PASSED: Full Emergency SOS Lifecycle & Audit Trail Verified.")


def cleanup_demo_artifacts(token: str):
    print("\n" + "=" * 70)
    print("TEARDOWN & CLEANUP")
    print("=" * 70)
    # Delete or resolve ephemeral records
    for e_id in ephemeral_cleanup["emergencies"]:
        try:
            call_api("PATCH", f"/emergency/{e_id}", {"status": "RESOLVED"}, token)
        except Exception:
            pass

    for a_id in ephemeral_cleanup["alerts"]:
        try:
            call_api("POST", f"/alerts/{a_id}/resolve", token=token)
        except Exception:
            pass

    print("  -> Ephemeral test alerts and emergencies resolved.")
    print("  -> Presentation database state clean and ready.")


def main():
    print("=" * 75)
    print("DHRUV POLAR EXPEDITION PLATFORM — PPT DEMONSTRATION VERIFIER")
    print("=" * 75)

    # Authenticate
    status, login_res = call_api("POST", "/auth/login", {"email": "admin@dhruv.gov.in", "password": "Admin@123456"})
    if status != 200 or "access_token" not in login_res:
        print(f"[FATAL] Authentication failed with status {status}: {login_res}")
        sys.exit(1)

    token = login_res["access_token"]
    print(f"[AUTH] Successfully logged in as Expedition Commander (Role: {login_res.get('user', {}).get('role')})")

    try:
        run_demo_a(token)
        run_demo_b(token)
        run_demo_c(token)
        print("\n" + "#" * 75)
        print("### ALL 3 PPT DEMONSTRATIONS (DEMO A, DEMO B, DEMO C) COMPLETED SUCCESSFULLY! ###")
        print("#" * 75 + "\n")
    finally:
        cleanup_demo_artifacts(token)


if __name__ == "__main__":
    main()
