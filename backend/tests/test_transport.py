import uuid
import pytest


def test_create_valid_transport(client, auth_headers):
    """Test 1: Register a valid polar transport vessel."""
    stations = client.get("/stations", headers=auth_headers).json()
    cur_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    name = f"MV Vasundhara Vessel {uuid.uuid4().hex[:6]}"
    payload = {
        "transport_name": name,
        "type": "RESEARCH_VESSEL",
        "capacity": 250000.0,
        "status": "AVAILABLE",
        "current_location": stations[0]["name"],
        "destination": stations[1]["name"],
        "current_station_id": cur_id,
        "destination_station_id": dest_id,
    }
    response = client.post("/transport", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["transport_name"] == name
    assert data["type"] == "RESEARCH_VESSEL"
    assert data["capacity"] == 250000.0
    assert data["status"] == "AVAILABLE"
    assert data["current_station_id"] == cur_id
    assert data["destination_station_id"] == dest_id


def test_create_transport_invalid_capacity_rejected(client, auth_headers):
    """Test 2: Reject transport creation with zero or negative capacity."""
    payload = {
        "transport_name": f"Test Aircraft {uuid.uuid4().hex[:6]}",
        "type": "CARGO_AIRCRAFT",
        "capacity": -100.0,
        "current_location": "Cape Town Airport",
        "destination": "Maitri Blue Ice Runway",
    }
    response = client.post("/transport", json=payload, headers=auth_headers)
    assert response.status_code in (400, 422)


def test_create_transport_nonexistent_station_rejected(client, auth_headers):
    """Test 3: Reject transport creation referencing non-existent station ID."""
    payload = {
        "transport_name": f"Snow Cat {uuid.uuid4().hex[:6]}",
        "type": "SNOW_VEHICLE",
        "capacity": 4500.0,
        "current_location": "Unknown Location",
        "destination": "Bharati Base",
        "current_station_id": 999999,
    }
    response = client.post("/transport", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "station with id 999999 does not exist" in response.json()["detail"]


def test_list_transports_and_filtering(client, auth_headers):
    """Test 4: List transports and verify filtering by type and status."""
    name = f"Ilyushin Heavy Lifter {uuid.uuid4().hex[:6]}"
    client.post("/transport", json={
        "transport_name": name,
        "type": "CARGO_AIRCRAFT",
        "capacity": 48000.0,
        "status": "IN_TRANSIT",
        "current_location": "En-Route Maitri",
        "destination": "Maitri",
    }, headers=auth_headers)

    # Filter by CARGO_AIRCRAFT
    res = client.get("/transport?type=CARGO_AIRCRAFT", headers=auth_headers)
    assert res.status_code == 200
    aircrafts = res.json()
    assert len(aircrafts) >= 1
    assert all(a["type"] == "CARGO_AIRCRAFT" for a in aircrafts)

    # Filter by IN_TRANSIT
    res_status = client.get("/transport?status=IN_TRANSIT", headers=auth_headers)
    assert res_status.status_code == 200
    in_transit = res_status.json()
    assert len(in_transit) >= 1
    assert all(t["status"] == "IN_TRANSIT" for t in in_transit)


def test_get_transport_by_id(client, auth_headers):
    """Test 5: Retrieve a single transport by ID."""
    name = f"PistenBully Snow Groomer {uuid.uuid4().hex[:6]}"
    create_res = client.post("/transport", json={
        "transport_name": name,
        "type": "SNOW_VEHICLE",
        "capacity": 3200.0,
        "status": "AVAILABLE",
        "current_location": "Bharati Vehicle Garage",
        "destination": "Larsemann Hills Field Site",
    }, headers=auth_headers)
    assert create_res.status_code == 201
    t_id = create_res.json()["id"]

    res = client.get(f"/transport/{t_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == t_id

    # 404 on non-existent
    res_404 = client.get("/transport/999999", headers=auth_headers)
    assert res_404.status_code == 404


def test_update_transport_and_status(client, auth_headers):
    """Test 6: Update transport attributes and query status endpoint."""
    name = f"Eurocopter AS350 {uuid.uuid4().hex[:6]}"
    create_res = client.post("/transport", json={
        "transport_name": name,
        "type": "HELICOPTER",
        "capacity": 1400.0,
        "status": "STANDBY",
        "current_location": "Maitri Helipad",
        "destination": "Schirmacher Oasis Depot",
    }, headers=auth_headers)
    assert create_res.status_code == 201
    t_id = create_res.json()["id"]

    # Update transport
    update_res = client.put(f"/transport/{t_id}", json={
        "status": "IN_TRANSIT",
        "current_location": "Mid-Flight over Schirmacher Oasis",
    }, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "IN_TRANSIT"
    assert update_res.json()["current_location"] == "Mid-Flight over Schirmacher Oasis"

    # Query quick status endpoint
    status_res = client.get(f"/transport/{t_id}/status", headers=auth_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["id"] == t_id
    assert status_data["status"] == "IN_TRANSIT"
    assert status_data["type"] == "HELICOPTER"
