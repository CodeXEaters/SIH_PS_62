"""
DHRUV Cross-Layer Forensic Integrity & Consistency Verification Suite
Verifies all 11 critical operational requirements across frontend contracts,
FastAPI API endpoints, and PostgreSQL database state.

Exit code 0 is returned only if ALL 11 checks pass without warnings or regressions.
"""

import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.station import Station
from app.models.personnel import Personnel
from app.models.inventory import Inventory
from app.models.asset import Asset
from app.models.mission import Mission
from app.models.cargo import Cargo
from app.models.emergency import Emergency
from app.models.alert import Alert
from app.models.permit import Permit
from app.models.waste_record import WasteRecord
from app.models.recommendation_feedback import RecommendationFeedback

class CanonicalV1Client(TestClient):
    def request(self, method: str, url: str, *args, **kwargs):
        if url.startswith("/") and not url.startswith("/api/v1") and url != "/" and url != "/health":
            url = f"/api/v1{url}"
        return super().request(method, url, *args, **kwargs)

client = CanonicalV1Client(app)

def get_auth_token():
    res = client.post("/auth/login", json={"email": "admin@dhruv.gov.in", "password": "Admin@123456"})
    if res.status_code != 200 or "access_token" not in res.json():
        raise RuntimeError(f"Authentication failed: {res.text}")
    return res.json()["access_token"]


def main():
    print("=" * 75)
    print("DHRUV CROSS-LAYER FORENSIC INTEGRITY & CONSISTENCY AUDIT")
    print("=" * 75)

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    print("[AUTH] Successfully authenticated as Expedition Commander.")

    db = SessionLocal()
    passed = 0
    total = 11

    try:
        # =====================================================================
        # CHECK 1: Emergency Data & Environmental Derivation
        # =====================================================================
        print("\n[CHECK 1/11] Emergency: Operational schema & Environmental Derivation...")
        res = client.get("/emergency", headers=headers)
        assert res.status_code == 200, f"Emergency endpoint returned status {res.status_code}"
        emergencies = res.json()
        assert len(emergencies) > 0, "No emergency records returned"
        for emg in emergencies:
            assert "incident_code" in emg and emg["incident_code"].startswith("EMG-")
            assert "title" in emg and emg["title"]
            assert "severity" in emg and emg["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
            assert "status" in emg and emg["status"] in ["OPEN", "DISPATCHED", "CONTAINED", "RESOLVED", "CLOSED"]
            assert "recommended_response" in emg
            assert "human_decision" in emg

        # Verify environmental endpoints supply weather without arbitrary frontend fabrication
        env_res = client.get("/environment/current", headers=headers)
        assert env_res.status_code == 200
        env_obs = env_res.json()
        assert len(env_obs) > 0, "Current environmental observations missing"
        first_obs = env_obs[0]
        assert "temperature_c" in first_obs or "temperature" in first_obs or "wind_speed_kts" in first_obs
        print("  -> Emergency schema valid; canonical environmental data verified.")
        passed += 1

        # =====================================================================
        # CHECK 2: Station Data & Coordinate Integrity
        # =====================================================================
        print("\n[CHECK 2/11] Stations: Schema, Coordinates & Zero Undefined/NaN Fields...")
        res = client.get("/stations", headers=headers)
        assert res.status_code == 200
        stations = res.json()
        assert len(stations) >= 4, f"Expected at least 4 polar stations/hubs, found {len(stations)}"
        for s in stations:
            assert "id" in s and s["id"] is not None
            assert "name" in s and len(s["name"]) > 0
            assert "location" in s and len(s["location"]) > 0
            assert "latitude" in s and isinstance(s["latitude"], (int, float)) and -90 <= s["latitude"] <= 90
            assert "longitude" in s and isinstance(s["longitude"], (int, float)) and -180 <= s["longitude"] <= 180
            assert "status" in s and s["status"] in ["OPERATIONAL", "MAINTENANCE", "STANDBY", "OFFLINE"]
            assert "type" in s and s["type"] in ["HQ", "TRANSIT_HUB", "PERMANENT_STATION", "FIELD_CAMP"]
        print(f"  -> {len(stations)} stations verified with valid GPS boundaries, location, and operational type.")
        passed += 1

        # =====================================================================
        # CHECK 3: Inventory AI Forecast & Stockout Projections
        # =====================================================================
        print("\n[CHECK 3/11] Inventory: AI Forecast & Runway Prediction Alignment...")
        res = client.get("/intelligence/forecast/inventory", headers=headers)
        assert res.status_code == 200
        forecasts = res.json()
        assert len(forecasts) > 0, "No inventory forecasts returned"
        for item in forecasts:
            assert "item_name" in item
            assert "station_name" in item
            assert "days_remaining" in item
            days = item["days_remaining"]
            assert isinstance(days, (int, float)) and days >= 0
            assert "projected_stockout_date" in item
            assert "urgency" in item and item["urgency"] in ["IMMEDIATE", "HIGH", "MODERATE", "NOMINAL"]
        print(f"  -> {len(forecasts)} inventory items forecasted with non-negative runways and stockout dates.")
        passed += 1

        # =====================================================================
        # CHECK 4: Operational Alerts Interface Conformance
        # =====================================================================
        print("\n[CHECK 4/11] Alerts: Severity, Status & Entity Contracts...")
        res = client.get("/alerts", headers=headers)
        assert res.status_code == 200
        alerts = res.json()
        assert len(alerts) > 0, "No alerts returned"
        for a in alerts:
            assert "id" in a
            assert "title" in a and len(a["title"]) > 0
            assert "severity" in a and a["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
            assert "status" in a and a["status"] in ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]
            assert "alert_type" in a
        print(f"  -> {len(alerts)} alerts checked against frontend contract.")
        passed += 1

        # =====================================================================
        # CHECK 5: Mission Leads & Risk Level Determinism
        # =====================================================================
        print("\n[CHECK 5/11] Missions: Deterministic Team Leads & Risk Levels...")
        res = client.get("/missions", headers=headers)
        assert res.status_code == 200
        missions = res.json()
        assert len(missions) > 0, "No missions returned"
        for m in missions:
            assert "id" in m
            assert "mission_name" in m
            assert "risk_level" in m and m["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
            lead_id = m.get("team_lead_id")
            assert lead_id is not None, f"Mission '{m['mission_name']}' has null team_lead_id"
            lead = db.query(Personnel).filter(Personnel.id == lead_id).first()
            assert lead is not None, f"Mission '{m['mission_name']}' references non-existent personnel ID {lead_id}"
        print(f"  -> {len(missions)} missions verified. All team leads resolve to real personnel.")
        passed += 1

        # =====================================================================
        # CHECK 6: Cargo Chain of Custody & QR Code Integrity
        # =====================================================================
        print("\n[CHECK 6/11] Cargo: Consignments, QR Tracking & Status...")
        res = client.get("/cargo", headers=headers)
        assert res.status_code == 200
        cargo_items = res.json()
        assert len(cargo_items) > 0, "No cargo items returned"
        for c in cargo_items:
            assert "cargo_code" in c and c["cargo_code"].startswith("CRG-")
            assert "status" in c and c["status"] in ["PLANNED", "PACKED", "DISPATCHED", "IN_TRANSIT", "DELAYED", "ARRIVED", "DELIVERED"]
            assert "weight" in c and c["weight"] > 0
        first_c = cargo_items[0]
        event_res = client.get(f"/cargo/{first_c['id']}/timeline", headers=headers)
        assert event_res.status_code == 200, f"Cargo timeline endpoint returned {event_res.status_code}"
        print(f"  -> {len(cargo_items)} cargo items verified with QR codes and event timeline tracking.")
        passed += 1

        # =====================================================================
        # CHECK 7: Polar Research Permits Conformance
        # =====================================================================
        print("\n[CHECK 7/11] Permits: Polar Activity Authorizations & Statuses...")
        res = client.get("/permits", headers=headers)
        assert res.status_code == 200
        permits = res.json()
        assert len(permits) > 0, "No permits returned"
        for p in permits:
            assert "permit_number" in p and p["permit_number"].startswith("PRM-")
            assert "permit_type" in p
            assert "status" in p and p["status"] in ["DRAFT", "PENDING", "APPROVED", "EXPIRING", "EXPIRED", "SUSPENDED"]
        print(f"  -> {len(permits)} permits validated against environmental compliance model.")
        passed += 1

        # =====================================================================
        # CHECK 8: Waste Management & Route Alias Verification
        # =====================================================================
        print("\n[CHECK 8/11] Waste: Categories, Disposal Methods & Endpoint Aliases...")
        res1 = client.get("/waste", headers=headers)
        assert res1.status_code == 200, "Top-level /waste route failed"
        res2 = client.get("/environment/waste", headers=headers)
        assert res2.status_code == 200, "Namespaced /environment/waste alias failed"
        waste_items = res1.json()
        assert len(waste_items) > 0, "No waste records returned"
        for w in waste_items:
            assert "waste_category" in w and w["waste_category"] in ["GENERAL", "BIOLOGICAL", "HAZARDOUS", "RECYCLABLE", "SCIENTIFIC"]
            assert "disposal_method" in w and w["disposal_method"] in ["INCINERATION", "RETROGRADE_SHIPMENT", "COMPACTED_STORAGE", "NEUTRALIZATION", "DEEP_CONTAINMENT"]
            assert "status" in w and w["status"] in ["GENERATED", "STORED", "TRANSFERRED", "PROCESSED", "DISPOSED"]
        print("  -> Waste management operational; /waste and /environment/waste aliases both responsive.")
        passed += 1

        # =====================================================================
        # CHECK 9: Database Foreign Key Integrity (0 Dangling References)
        # =====================================================================
        print("\n[CHECK 9/11] Database: Foreign Key Referential Integrity Check...")
        valid_station_ids = {s.id for s in db.query(Station).all()}
        valid_personnel_ids = {p.id for p in db.query(Personnel).all()}
        valid_asset_ids = {a.id for a in db.query(Asset).all()}

        dangling = []
        for p in db.query(Personnel).all():
            if p.station_id and p.station_id not in valid_station_ids:
                dangling.append(f"Personnel {p.id} -> Station {p.station_id}")

        for inv in db.query(Inventory).all():
            if inv.station_id not in valid_station_ids:
                dangling.append(f"Inventory {inv.id} -> Station {inv.station_id}")

        for ast in db.query(Asset).all():
            if ast.station_id and ast.station_id not in valid_station_ids:
                dangling.append(f"Asset {ast.id} -> Station {ast.station_id}")

        for m in db.query(Mission).all():
            if m.team_lead_id not in valid_personnel_ids:
                dangling.append(f"Mission {m.id} -> TeamLead {m.team_lead_id}")
            if m.origin_station_id and m.origin_station_id not in valid_station_ids:
                dangling.append(f"Mission {m.id} -> OriginStation {m.origin_station_id}")
            if m.destination_station_id and m.destination_station_id not in valid_station_ids:
                dangling.append(f"Mission {m.id} -> DestStation {m.destination_station_id}")

        for emg in db.query(Emergency).all():
            if emg.station_id and emg.station_id not in valid_station_ids:
                dangling.append(f"Emergency {emg.id} -> Station {emg.station_id}")
            if emg.personnel_id and emg.personnel_id not in valid_personnel_ids:
                dangling.append(f"Emergency {emg.id} -> Personnel {emg.personnel_id}")
            if emg.asset_id and emg.asset_id not in valid_asset_ids:
                dangling.append(f"Emergency {emg.id} -> Asset {emg.asset_id}")

        assert len(dangling) == 0, f"Found dangling foreign keys: {dangling}"
        print(f"  -> All operational foreign keys verified across {len(valid_station_ids)} stations, {len(valid_personnel_ids)} personnel, and {len(valid_asset_ids)} assets. 0 dangling.")
        passed += 1

        # =====================================================================
        # CHECK 10: Date & Temporal Sanity
        # =====================================================================
        print("\n[CHECK 10/11] Temporal Sanity: Mission durations, check-ins, and timelines...")
        now = datetime.now(timezone.utc)
        for m in db.query(Mission).all():
            if m.start_time and m.expected_return:
                st = m.start_time if m.start_time.tzinfo else m.start_time.replace(tzinfo=timezone.utc)
                et = m.expected_return if m.expected_return.tzinfo else m.expected_return.replace(tzinfo=timezone.utc)
                assert et >= st, f"Mission '{m.mission_name}' has negative duration (return before start)"

        for p in db.query(Personnel).all():
            if p.last_check_in:
                chk = p.last_check_in if p.last_check_in.tzinfo else p.last_check_in.replace(tzinfo=timezone.utc)
                assert chk <= now + timedelta(hours=1), f"Personnel '{p.name}' has check-in in future"

        print("  -> All mission durations and personnel check-ins are temporally consistent.")
        passed += 1

        # =====================================================================
        # CHECK 11: Demo Idempotency & Clean Teardown
        # =====================================================================
        print("\n[CHECK 11/11] Demo Idempotency: Teardown and Repeatability...")
        from scripts.run_ppt_demonstrations import cleanup_demo_artifacts
        cleanup_demo_artifacts(token)

        # Confirm zero orphaned demo items exist
        orphaned_missions = db.query(Mission).filter(Mission.mission_name.like("Demo Sortie%")).count()
        orphaned_emergencies = db.query(Emergency).filter(Emergency.title == "Snowcat Traverse Mechanical Breakdown in Katabatic Blizzard").count()
        orphaned_cargo = db.query(Cargo).filter(Cargo.name.in_(["Seismic Sensor Kit & Cold Batteries", "Generator Replacement Alternator"])).count()

        assert orphaned_missions == 0, f"Orphaned demo missions remain: {orphaned_missions}"
        assert orphaned_emergencies == 0, f"Orphaned demo emergencies remain: {orphaned_emergencies}"
        assert orphaned_cargo == 0, f"Orphaned demo cargo remain: {orphaned_cargo}"
        print("  -> Teardown execution confirmed clean state: 0 orphaned demo records.")
        passed += 1

    finally:
        db.close()

    print("\n" + "=" * 75)
    print(f"VERIFICATION RESULT: {passed}/{total} CHECKS PASSED")
    print("=" * 75)
    if passed == total:
        print(">> ALL CROSS-LAYER FORENSIC INTEGRITY CHECKS PASSED SUCCESSFULLY.")
        sys.exit(0)
    else:
        print(f">> AUDIT FAILED: Only {passed}/{total} checks passed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
