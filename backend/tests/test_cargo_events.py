import pytest


def test_scan_cargo_valid_event(client, auth_headers):
    """Test 1: Valid QR scan logs event, updates location and advances status."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    # 1. Create cargo in PLANNED status
    cargo_payload = {
        "name": "High-Sensitivity Seismic Geophone Unit",
        "category": "SCIENTIFIC",
        "weight": 14.2,
        "priority": "HIGH",
        "origin_station_id": origin_id,
        "destination_station_id": dest_id,
    }
    cargo = client.post("/cargo", json=cargo_payload, headers=auth_headers).json()
    cargo_id = cargo["id"]
    qr_code = cargo["qr_code"]
    assert cargo["status"] == "PLANNED"

    # 2. Scan QR with PACKED event
    scan_payload = {
        "qr_code": qr_code,
        "location": "Cape Town Logistics Warehouse Bay 3",
        "station_id": origin_id,
        "event_type": "PACKED",
        "remarks": "Packed in thermal shockproof crate",
    }
    response = client.post(f"/cargo/{cargo_id}/scan", json=scan_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cargo_id"] == cargo_id
    assert data["status"] == "PACKED"
    assert data["current_location"] == "Cape Town Logistics Warehouse Bay 3"
    assert data["event"]["event_type"] == "PACKED"
    assert data["event"]["remarks"] == "Packed in thermal shockproof crate"


def test_scan_cargo_qr_mismatch_rejected(client, auth_headers):
    """Test 2: Reject scan when QR payload does not match cargo ID."""
    stations = client.get("/stations", headers=auth_headers).json()
    cargo = client.post("/cargo", json={
        "name": "Sterile Surgical Kits",
        "category": "MEDICAL",
        "weight": 6.5,
        "priority": "CRITICAL",
        "origin_station_id": stations[0]["id"],
        "destination_station_id": stations[1]["id"],
    }, headers=auth_headers).json()

    # Scan with mismatched QR
    mismatched_payload = {
        "qr_code": "DHRUV:CARGO:CRG-2026-999",
        "location": "Maitri Cargo Terminal",
    }
    response = client.post(f"/cargo/{cargo['id']}/scan", json=mismatched_payload, headers=auth_headers)
    assert response.status_code == 400
    assert "does not match" in response.json()["detail"]


def test_scan_cargo_nonexistent_station_rejected(client, auth_headers):
    """Test 3: Reject scan if referenced station ID does not exist."""
    stations = client.get("/stations", headers=auth_headers).json()
    cargo = client.post("/cargo", json={
        "name": "Spectroradiometer Calibration Cell",
        "category": "SCIENTIFIC",
        "weight": 3.2,
        "priority": "MEDIUM",
        "origin_station_id": stations[0]["id"],
        "destination_station_id": stations[1]["id"],
    }, headers=auth_headers).json()

    response = client.post(f"/cargo/{cargo['id']}/scan", json={
        "qr_code": cargo["qr_code"],
        "location": "Unknown Location",
        "station_id": 999999,
    }, headers=auth_headers)
    assert response.status_code == 404
    assert "station with id 999999 does not exist" in response.json()["detail"]


def test_cargo_timeline_chronological_order(client, auth_headers):
    """Test 4: Retrieve chronological chain-of-custody timeline."""
    stations = client.get("/stations", headers=auth_headers).json()
    cargo = client.post("/cargo", json={
        "name": "Automatic Weather Station Sensor Pod",
        "category": "EQUIPMENT",
        "weight": 42.0,
        "priority": "HIGH",
        "origin_station_id": stations[0]["id"],
        "destination_station_id": stations[1]["id"],
    }, headers=auth_headers).json()
    cargo_id = cargo["id"]
    qr = cargo["qr_code"]

    # Scan 1: Packed
    client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr,
        "location": "Cape Town Harbor Shed 4",
        "event_type": "PACKED",
    }, headers=auth_headers)

    # Scan 2: Loaded on vessel
    client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr,
        "location": "MV Vasundhara Hold 2",
        "event_type": "LOADED",
    }, headers=auth_headers)

    # Scan 3: Arrived at Maitri
    client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr,
        "location": "Maitri Station Helipad Depot",
        "event_type": "ARRIVED_AT_HUB",
    }, headers=auth_headers)

    # Fetch timeline
    response = client.get(f"/cargo/{cargo_id}/timeline", headers=auth_headers)
    assert response.status_code == 200
    timeline = response.json()
    assert timeline["cargo_id"] == cargo_id
    assert len(timeline["events"]) == 3
    assert timeline["events"][0]["event_type"] == "PACKED"
    assert timeline["events"][1]["event_type"] == "LOADED"
    assert timeline["events"][2]["event_type"] == "ARRIVED_AT_HUB"
    assert timeline["current_location"] == "Maitri Station Helipad Depot"


def test_scan_cargo_delay_reported(client, auth_headers):
    """Test 5: Log DELAY_REPORTED event and verify status transitions to DELAYED."""
    stations = client.get("/stations", headers=auth_headers).json()
    cargo = client.post("/cargo", json={
        "name": "Kerosene Aviation Fuel Drums",
        "category": "FUEL",
        "weight": 800.0,
        "priority": "CRITICAL",
        "origin_station_id": stations[0]["id"],
        "destination_station_id": stations[1]["id"],
    }, headers=auth_headers).json()
    cargo_id = cargo["id"]

    response = client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": cargo["qr_code"],
        "location": "Southern Ocean En-Route",
        "event_type": "DELAY_REPORTED",
        "remarks": "Severe blizzard category 3 delayed vessel docking",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DELAYED"
    assert data["event"]["remarks"] == "Severe blizzard category 3 delayed vessel docking"


def test_scan_terminal_delivered_cargo_rejected(client, auth_headers):
    """Test 6: Reject status-changing scan on cargo that is already DELIVERED."""
    stations = client.get("/stations", headers=auth_headers).json()
    cargo = client.post("/cargo", json={
        "name": "Medical Cryo-Preservation Unit",
        "category": "MEDICAL",
        "weight": 35.0,
        "priority": "HIGH",
        "origin_station_id": stations[0]["id"],
        "destination_station_id": stations[1]["id"],
    }, headers=auth_headers).json()
    cargo_id = cargo["id"]
    qr = cargo["qr_code"]

    # Step through: PLANNED -> PACKED -> DISPATCHED -> IN_TRANSIT -> ARRIVED -> DELIVERED
    client.patch(f"/cargo/{cargo_id}/status", json={"status": "PACKED"}, headers=auth_headers)
    client.patch(f"/cargo/{cargo_id}/status", json={"status": "DISPATCHED"}, headers=auth_headers)
    client.patch(f"/cargo/{cargo_id}/status", json={"status": "IN_TRANSIT"}, headers=auth_headers)
    client.patch(f"/cargo/{cargo_id}/status", json={"status": "ARRIVED"}, headers=auth_headers)
    client.patch(f"/cargo/{cargo_id}/status", json={"status": "DELIVERED"}, headers=auth_headers)

    # Attempt to change state via scan
    response = client.post(f"/cargo/{cargo_id}/scan", json={
        "qr_code": qr,
        "location": "Maitri Storage",
        "event_type": "PACKED",
    }, headers=auth_headers)
    assert response.status_code == 400
    assert "terminal state DELIVERED" in response.json()["detail"]
