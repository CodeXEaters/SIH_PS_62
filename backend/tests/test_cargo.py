import pytest


def test_create_valid_cargo(client, auth_headers):
    """Test 1: Create a valid cargo package with auto-generated code and QR."""
    stations = client.get("/stations", headers=auth_headers).json()
    assert len(stations) >= 2
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    payload = {
        "name": "Atmospheric Aerosol Sampling Filters",
        "category": "SCIENTIFIC",
        "weight": 24.5,
        "priority": "HIGH",
        "origin_station_id": origin_id,
        "destination_station_id": dest_id,
        "current_location": stations[0]["name"],
    }
    response = client.post("/cargo", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["category"] == "SCIENTIFIC"
    assert data["weight"] == 24.5
    assert data["priority"] == "HIGH"
    assert data["status"] == "PLANNED"
    assert data["cargo_code"].startswith("CRG-2026-")
    assert data["qr_code"] == f"DHRUV:CARGO:{data['cargo_code']}"


def test_reject_invalid_origin_station(client, auth_headers):
    """Test 2: Reject cargo creation when origin station ID does not exist."""
    stations = client.get("/stations", headers=auth_headers).json()
    dest_id = stations[0]["id"]

    payload = {
        "name": "Deep Ice Drill Core Bit",
        "category": "EQUIPMENT",
        "weight": 85.0,
        "priority": "CRITICAL",
        "origin_station_id": 999999,  # Non-existent ID
        "destination_station_id": dest_id,
    }
    response = client.post("/cargo", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "Origin station" in response.json()["detail"]


def test_reject_invalid_destination_station(client, auth_headers):
    """Test 3: Reject cargo creation when destination station ID does not exist."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]

    payload = {
        "name": "Deep Ice Drill Core Bit",
        "category": "EQUIPMENT",
        "weight": 85.0,
        "priority": "CRITICAL",
        "origin_station_id": origin_id,
        "destination_station_id": 999999,  # Non-existent ID
    }
    response = client.post("/cargo", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "Destination station" in response.json()["detail"]


def test_reject_identical_origin_and_destination(client, auth_headers):
    """Bonus Test: Reject cargo when origin and destination are the same station."""
    stations = client.get("/stations", headers=auth_headers).json()
    station_id = stations[0]["id"]

    payload = {
        "name": "Invalid Route Cargo",
        "category": "FOOD",
        "weight": 10.0,
        "priority": "LOW",
        "origin_station_id": station_id,
        "destination_station_id": station_id,
    }
    response = client.post("/cargo", json=payload, headers=auth_headers)
    assert response.status_code == 422  # Pydantic validation error or 400


def test_get_cargo_by_id(client, auth_headers):
    """Test 4: Retrieve cargo by ID."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    create_res = client.post(
        "/cargo",
        json={
            "name": "Sterile Surgical Kits",
            "category": "MEDICAL",
            "weight": 15.0,
            "priority": "CRITICAL",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    )
    cargo_id = create_res.json()["id"]

    get_res = client.get(f"/cargo/{cargo_id}", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == cargo_id
    assert data["name"] == "Sterile Surgical Kits"
    assert data["category"] == "MEDICAL"


def test_list_cargo_and_filters(client, auth_headers):
    """Test 5: List cargo and apply priority/status filters."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    client.post(
        "/cargo",
        json={
            "name": "Arctic Aviation Fuel Barrel",
            "category": "FUEL",
            "weight": 200.0,
            "priority": "CRITICAL",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    )

    list_res = client.get("/cargo?priority=CRITICAL", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) > 0
    assert all(i["priority"] == "CRITICAL" for i in items)


def test_update_cargo(client, auth_headers):
    """Test 6: Update cargo weight and priority."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    create_res = client.post(
        "/cargo",
        json={
            "name": "Spare Caterpillar Generator Belt",
            "category": "EQUIPMENT",
            "weight": 5.0,
            "priority": "LOW",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    )
    cargo_id = create_res.json()["id"]

    update_res = client.put(
        f"/cargo/{cargo_id}",
        json={"weight": 7.5, "priority": "HIGH"},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["weight"] == 7.5
    assert updated_data["priority"] == "HIGH"


def test_update_cargo_status_lifecycle(client, auth_headers):
    """Test 7: Advance cargo along valid lifecycle states."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    create_res = client.post(
        "/cargo",
        json={
            "name": "Freeze-Dried Rations Carton",
            "category": "FOOD",
            "weight": 40.0,
            "priority": "MEDIUM",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    )
    cargo_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PLANNED"

    # Step: PLANNED -> PACKED
    res1 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "PACKED"}, headers=auth_headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "PACKED"

    # Step: PACKED -> DISPATCHED
    res2 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "DISPATCHED"}, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "DISPATCHED"

    # Step: DISPATCHED -> IN_TRANSIT
    res3 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "IN_TRANSIT"}, headers=auth_headers)
    assert res3.status_code == 200
    assert res3.json()["status"] == "IN_TRANSIT"

    # Step: IN_TRANSIT -> ARRIVED
    res4 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "ARRIVED"}, headers=auth_headers)
    assert res4.status_code == 200
    assert res4.json()["status"] == "ARRIVED"

    # Step: ARRIVED -> DELIVERED
    res5 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "DELIVERED"}, headers=auth_headers)
    assert res5.status_code == 200
    assert res5.json()["status"] == "DELIVERED"


def test_reject_invalid_status_transition(client, auth_headers):
    """Test 8: Reject nonsensical status transition (DELIVERED -> PLANNED or PLANNED -> DELIVERED)."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    create_res = client.post(
        "/cargo",
        json={
            "name": "Medical Ultrasound Probe",
            "category": "MEDICAL",
            "weight": 3.0,
            "priority": "HIGH",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    )
    cargo_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PLANNED"

    # Attempt illegal skip: PLANNED -> DELIVERED
    bad_res1 = client.patch(f"/cargo/{cargo_id}/status", json={"status": "DELIVERED"}, headers=auth_headers)
    assert bad_res1.status_code == 400
    assert "Invalid status transition" in bad_res1.json()["detail"]


def test_unique_cargo_code_and_qr_format(client, auth_headers):
    """Test 9 & 10: Verify unique cargo_code sequencing and exact QR payload format."""
    stations = client.get("/stations", headers=auth_headers).json()
    origin_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    res_a = client.post(
        "/cargo",
        json={
            "name": "Package Alpha",
            "category": "EQUIPMENT",
            "weight": 12.0,
            "priority": "LOW",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    ).json()

    res_b = client.post(
        "/cargo",
        json={
            "name": "Package Beta",
            "category": "EQUIPMENT",
            "weight": 14.0,
            "priority": "LOW",
            "origin_station_id": origin_id,
            "destination_station_id": dest_id,
        },
        headers=auth_headers
    ).json()

    assert res_a["cargo_code"] != res_b["cargo_code"]
    assert res_a["qr_code"] != res_b["qr_code"]

    # Verify format: CRG-2026-XXX
    assert res_a["cargo_code"].startswith("CRG-2026-")
    assert res_b["cargo_code"].startswith("CRG-2026-")

    # Verify QR format: DHRUV:CARGO:CRG-2026-XXX
    assert res_a["qr_code"] == f"DHRUV:CARGO:{res_a['cargo_code']}"
    assert res_b["qr_code"] == f"DHRUV:CARGO:{res_b['cargo_code']}"
