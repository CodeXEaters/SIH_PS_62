import uuid
from datetime import datetime, timezone, timedelta
import pytest


def test_record_telemetry_mission_success(client, auth_headers):
    """Test 1: Ingest telemetry point for an active mission."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    mission_res = client.post("/missions", json={
        "mission_name": f"Telemetry Mission {uuid.uuid4().hex[:6]}",
        "mission_type": "SCIENTIFIC_SURVEY",
        "origin": "Maitri",
        "destination": "Schirmacher Oasis",
        "team_lead_id": personnel[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": (start + timedelta(days=2)).isoformat(),
        "status": "ACTIVE",
    }, headers=auth_headers)
    mission_id = mission_res.json()["id"]

    payload = {
        "entity_type": "MISSION",
        "entity_id": mission_id,
        "latitude": -70.7670,
        "longitude": 11.7330,
        "speed": 14.5,
        "battery": 88.0,
    }
    response = client.post("/tracking/update", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["entity_type"] == "MISSION"
    assert data["entity_id"] == mission_id
    assert data["latitude"] == -70.7670
    assert data["longitude"] == 11.7330
    assert data["speed"] == 14.5
    assert data["battery"] == 88.0


def test_record_telemetry_transport_success(client, auth_headers):
    """Test 2: Ingest telemetry point for transport and verify location sync."""
    transport_res = client.post("/transport", json={
        "transport_name": f"Tracked Snow Vehicle {uuid.uuid4().hex[:6]}",
        "type": "SNOW_VEHICLE",
        "capacity": 2500.0,
        "status": "IN_TRANSIT",
        "current_location": "Base Garage",
        "destination": "WayPoint 1",
    }, headers=auth_headers)
    transport_id = transport_res.json()["id"]

    payload = {
        "entity_type": "TRANSPORT",
        "entity_id": transport_id,
        "latitude": -69.4500,
        "longitude": 76.1200,
        "speed": 22.0,
        "battery": 94.5,
    }
    response = client.post("/tracking/update", json=payload, headers=auth_headers)
    assert response.status_code == 201

    # Verify transport current location was updated
    t_data = client.get(f"/transport/{transport_id}", headers=auth_headers).json()
    assert "-69.4500" in t_data["current_location"]


def test_record_telemetry_invalid_coordinates_rejected(client, auth_headers):
    """Test 3: Reject telemetry with out-of-bounds latitude/longitude."""
    # Latitude > 90
    bad_lat = {
        "entity_type": "MISSION",
        "entity_id": 1,
        "latitude": 95.0,
        "longitude": 10.0,
        "speed": 10.0,
        "battery": 50.0,
    }
    assert client.post("/tracking/update", json=bad_lat, headers=auth_headers).status_code == 422

    # Longitude < -180
    bad_lon = {
        "entity_type": "MISSION",
        "entity_id": 1,
        "latitude": -70.0,
        "longitude": -195.0,
        "speed": 10.0,
        "battery": 50.0,
    }
    assert client.post("/tracking/update", json=bad_lon, headers=auth_headers).status_code == 422


def test_record_telemetry_invalid_battery_or_speed_rejected(client, auth_headers):
    """Test 4: Reject telemetry with negative speed or battery > 100."""
    # Speed < 0
    bad_spd = {
        "entity_type": "MISSION",
        "entity_id": 1,
        "latitude": -70.0,
        "longitude": 10.0,
        "speed": -5.0,
        "battery": 50.0,
    }
    assert client.post("/tracking/update", json=bad_spd, headers=auth_headers).status_code == 422

    # Battery > 100
    bad_bat = {
        "entity_type": "MISSION",
        "entity_id": 1,
        "latitude": -70.0,
        "longitude": 10.0,
        "speed": 10.0,
        "battery": 105.0,
    }
    assert client.post("/tracking/update", json=bad_bat, headers=auth_headers).status_code == 422


def test_record_telemetry_nonexistent_entity_rejected(client, auth_headers):
    """Test 5: Reject telemetry referencing non-existent mission or transport ID."""
    res_miss = client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": 999999,
        "latitude": -70.0,
        "longitude": 10.0,
        "speed": 12.0,
        "battery": 75.0,
    }, headers=auth_headers)
    assert res_miss.status_code == 404
    assert "Mission with id 999999 not found" in res_miss.json()["detail"]

    res_trans = client.post("/tracking/update", json={
        "entity_type": "TRANSPORT",
        "entity_id": 999999,
        "latitude": -70.0,
        "longitude": 10.0,
        "speed": 12.0,
        "battery": 75.0,
    }, headers=auth_headers)
    assert res_trans.status_code == 404
    assert "Transport with id 999999 not found" in res_trans.json()["detail"]


def test_live_tracking_aggregation_latest_state(client, auth_headers):
    """Test 6: Live tracking returns the latest telemetry state per entity."""
    transport_res = client.post("/transport", json={
        "transport_name": f"Live Fleet Unit {uuid.uuid4().hex[:6]}",
        "type": "CARGO_AIRCRAFT",
        "capacity": 12000.0,
        "status": "IN_TRANSIT",
        "current_location": "En-Route",
        "destination": "Maitri",
    }, headers=auth_headers)
    t_id = transport_res.json()["id"]

    now = datetime.now(timezone.utc)
    # Point 1 (earlier)
    client.post("/tracking/update", json={
        "entity_type": "TRANSPORT",
        "entity_id": t_id,
        "latitude": -60.0,
        "longitude": 20.0,
        "speed": 350.0,
        "battery": 95.0,
        "timestamp": (now - timedelta(minutes=10)).isoformat(),
    }, headers=auth_headers)

    # Point 2 (latest)
    client.post("/tracking/update", json={
        "entity_type": "TRANSPORT",
        "entity_id": t_id,
        "latitude": -65.0,
        "longitude": 18.0,
        "speed": 360.0,
        "battery": 89.0,
        "timestamp": now.isoformat(),
    }, headers=auth_headers)

    live_res = client.get("/tracking/live", headers=auth_headers)
    assert live_res.status_code == 200
    live_items = live_res.json()
    assert len(live_items) >= 1

    matched = [item for item in live_items if item["entity_type"] == "TRANSPORT" and item["entity_id"] == t_id]
    assert len(matched) == 1
    assert matched[0]["latest_latitude"] == -65.0
    assert matched[0]["latest_battery"] == 89.0


def test_entity_tracking_history_chronological(client, auth_headers):
    """Test 7: Retrieve chronological track history for a specific entity."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    mission_res = client.post("/missions", json={
        "mission_name": f"Historical Track Mission {uuid.uuid4().hex[:6]}",
        "mission_type": "RECONNAISSANCE",
        "origin": "Bharati",
        "destination": "Depot 4",
        "team_lead_id": personnel[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": (start + timedelta(days=1)).isoformat(),
        "status": "ACTIVE",
    }, headers=auth_headers)
    m_id = mission_res.json()["id"]

    t1 = start - timedelta(minutes=30)
    t2 = start - timedelta(minutes=15)
    t3 = start

    client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": m_id,
        "latitude": -69.001,
        "longitude": 76.001,
        "speed": 10.0,
        "battery": 98.0,
        "timestamp": t1.isoformat(),
    }, headers=auth_headers)

    client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": m_id,
        "latitude": -69.010,
        "longitude": 76.020,
        "speed": 15.0,
        "battery": 92.0,
        "timestamp": t2.isoformat(),
    }, headers=auth_headers)

    client.post("/tracking/update", json={
        "entity_type": "MISSION",
        "entity_id": m_id,
        "latitude": -69.025,
        "longitude": 76.050,
        "speed": 18.0,
        "battery": 86.0,
        "timestamp": t3.isoformat(),
    }, headers=auth_headers)

    history_res = client.get(f"/tracking/MISSION/{m_id}", headers=auth_headers)
    assert history_res.status_code == 200
    points = history_res.json()
    assert len(points) == 3
    assert points[0]["latitude"] == -69.001
    assert points[1]["latitude"] == -69.010
    assert points[2]["latitude"] == -69.025
