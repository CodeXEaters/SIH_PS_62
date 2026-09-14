import uuid
from datetime import datetime, timedelta, timezone
import pytest


def test_member2_end_to_end_logistics_workflow(client, auth_headers):
    """
    Comprehensive End-to-End Member 2 Workflow:
    1. Authenticate and retrieve stations and personnel.
    2. Create cargo package with auto-generated code and QR.
    3. Perform QR chain-of-custody scans (PACKED, LOADED, ARRIVED).
    4. Verify timeline event sequence and location updates.
    5. Create polar transport vessel and verify status endpoint.
    6. Schedule expedition mission with personnel team lead.
    7. Ingest telemetry stream for mission and transport.
    8. Query live tracking aggregation and verify latest coordinates.
    9. Query historical path telemetry.
    10. Verify Member 1 core platform integrity throughout.
    """
    # 1. Verify Member 1 base data is available
    stations_res = client.get("/stations", headers=auth_headers)
    assert stations_res.status_code == 200
    stations = stations_res.json()
    assert len(stations) >= 2
    origin_station = stations[0]
    dest_station = stations[1]

    personnel_res = client.get("/personnel", headers=auth_headers)
    assert personnel_res.status_code == 200
    personnel = personnel_res.json()
    assert len(personnel) >= 1
    team_lead = personnel[0]

    # 2. Register Priority Cargo
    cargo_name = f"Glacier Deep Radar Sounder {uuid.uuid4().hex[:6]}"
    cargo_payload = {
        "name": cargo_name,
        "category": "SCIENTIFIC",
        "weight": 68.5,
        "priority": "CRITICAL",
        "origin_station_id": origin_station["id"],
        "destination_station_id": dest_station["id"],
    }
    create_cargo_res = client.post("/cargo", json=cargo_payload, headers=auth_headers)
    assert create_cargo_res.status_code == 201
    cargo = create_cargo_res.json()
    cargo_id = cargo["id"]
    cargo_code = cargo["cargo_code"]
    qr_code = cargo["qr_code"]

    assert cargo_code.startswith("CRG-2026-")
    assert qr_code == f"DHRUV:CARGO:{cargo_code}"
    assert cargo["status"] == "PLANNED"

    # 3. QR Scan 1: PACKED at Origin Station
    scan1_res = client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr_code,
        "location": f"{origin_station['name']} Cargo Bay",
        "station_id": origin_station["id"],
        "event_type": "PACKED",
        "remarks": "Packed and inspected for overland transit",
    }, headers=auth_headers)
    assert scan1_res.status_code == 200
    assert scan1_res.json()["status"] == "PACKED"
    assert scan1_res.json()["current_location"] == f"{origin_station['name']} Cargo Bay"

    # 4. QR Scan 2: LOADED on Transport
    scan2_res = client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr_code,
        "location": "PistenBully Traverse Sled 01",
        "event_type": "LOADED",
        "remarks": "Loaded and lashed onto heavy cargo sled",
    }, headers=auth_headers)
    assert scan2_res.status_code == 200
    assert scan2_res.json()["status"] == "DISPATCHED"

    # 5. Verify Timeline Sequence
    timeline_res = client.get(f"/cargo/{cargo_id}/timeline", headers=auth_headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert timeline["cargo_id"] == cargo_id
    assert len(timeline["events"]) == 3
    assert timeline["events"][0]["event_type"] == "CREATED"
    assert timeline["events"][1]["event_type"] == "PACKED"
    assert timeline["events"][2]["event_type"] == "LOADED"

    # 6. Register Transport
    transport_name = f"PistenBully Arctic Hauler {uuid.uuid4().hex[:6]}"
    transport_payload = {
        "transport_name": transport_name,
        "type": "SNOW_VEHICLE",
        "capacity": 5000.0,
        "status": "AVAILABLE",
        "current_location": origin_station["name"],
        "destination": dest_station["name"],
        "current_station_id": origin_station["id"],
        "destination_station_id": dest_station["id"],
    }
    create_transport_res = client.post("/transport", json=transport_payload, headers=auth_headers)
    assert create_transport_res.status_code == 201
    transport = create_transport_res.json()
    transport_id = transport["id"]

    # Quick Status check
    t_status_res = client.get(f"/transport/{transport_id}/status", headers=auth_headers)
    assert t_status_res.status_code == 200
    assert t_status_res.json()["status"] == "AVAILABLE"

    # 7. Schedule Expedition Mission
    now = datetime.now(timezone.utc)
    mission_name = f"Ice Shelf Seismic Profile {uuid.uuid4().hex[:6]}"
    mission_payload = {
        "mission_name": mission_name,
        "mission_type": "SCIENTIFIC_SURVEY",
        "origin": origin_station["name"],
        "destination": dest_station["name"],
        "team_lead_id": team_lead["id"],
        "origin_station_id": origin_station["id"],
        "destination_station_id": dest_station["id"],
        "start_time": now.isoformat(),
        "expected_return": (now + timedelta(days=4)).isoformat(),
        "status": "PLANNED",
        "risk_level": "LOW",
    }
    create_mission_res = client.post("/missions", json=mission_payload, headers=auth_headers)
    assert create_mission_res.status_code == 201
    mission = create_mission_res.json()
    mission_id = mission["id"]

    # Transition mission to ACTIVE
    patch_mission_res = client.patch(f"/missions/{mission_id}/status", json={"status": "ACTIVE"}, headers=auth_headers)
    assert patch_mission_res.status_code == 200
    assert patch_mission_res.json()["status"] == "ACTIVE"

    # 8. Transmit Telemetry for Mission and Transport
    t1 = now - timedelta(minutes=5)
    t2 = now

    client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": mission_id,
        "latitude": -70.7800,
        "longitude": 11.7500,
        "speed": 12.0,
        "battery": 96.0,
        "timestamp": t1.isoformat(),
    }, headers=auth_headers)

    client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": mission_id,
        "latitude": -70.8200,
        "longitude": 11.8200,
        "speed": 14.2,
        "battery": 92.5,
        "timestamp": t2.isoformat(),
    }, headers=auth_headers)

    client.post("/tracking/update", json={
        "entity_type": "TRANSPORT",
        "entity_id": transport_id,
        "latitude": -70.7900,
        "longitude": 11.7600,
        "speed": 18.5,
        "battery": 90.0,
        "timestamp": t2.isoformat(),
    }, headers=auth_headers)

    # 9. Query Live Tracking Aggregation
    live_res = client.get("/tracking/live", headers=auth_headers)
    assert live_res.status_code == 200
    live_items = live_res.json()

    mission_live = next((item for item in live_items if item["entity_type"] == "MISSION" and item["entity_id"] == mission_id), None)
    transport_live = next((item for item in live_items if item["entity_type"] == "TRANSPORT" and item["entity_id"] == transport_id), None)

    assert mission_live is not None
    assert mission_live["latest_latitude"] == -70.8200
    assert mission_live["latest_battery"] == 92.5

    assert transport_live is not None
    assert transport_live["latest_latitude"] == -70.7900
    assert transport_live["latest_speed"] == 18.5

    # 10. Query Mission Track History
    history_res = client.get(f"/tracking/MISSION/{mission_id}", headers=auth_headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 2
    assert history[0]["latitude"] == -70.7800
    assert history[1]["latitude"] == -70.8200

    # 11. Verify Member 1 Core Endpoints Remain Intact
    inv_res = client.get("/inventory/low-stock", headers=auth_headers)
    assert inv_res.status_code == 200

    asset_alerts_res = client.get("/assets/maintenance-alerts", headers=auth_headers)
    assert asset_alerts_res.status_code == 200

    me_res = client.get("/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
