def test_list_personnel(client, auth_headers):
    """Test listing personnel."""
    response = client.get("/personnel", headers=auth_headers)
    assert response.status_code == 200
    personnel = response.json()
    assert len(personnel) >= 10


def test_create_and_patch_personnel(client, auth_headers):
    """
    Test Step 7 requirement from Playbook:
    'create a scientist, assign to Bharati, change status to ON_MISSION, retrieve personnel by station'
    """
    # 1. Find Bharati Station ID
    stations = client.get("/stations", headers=auth_headers).json()
    bharati = next(s for s in stations if s["name"] == "Bharati Station")

    # 2. Create Scientist
    payload = {
        "name": "Dr. Tarun Verma",
        "designation": "Atmospheric Chemist",
        "team": "Atmospheric Science",
        "station_id": bharati["id"],
        "current_location": "Bharati Atmospheric Dome",
        "status": "ACTIVE",
        "medical_clearance": True,
        "emergency_contact": "+91-9988776655",
    }
    create_res = client.post("/personnel", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    person = create_res.json()
    person_id = person["id"]
    assert person["status"] == "ACTIVE"
    assert person["station_id"] == bharati["id"]

    # 3. Change status to ON_MISSION via PATCH /personnel/{id}/status
    patch_res = client.patch(
        f"/personnel/{person_id}/status",
        json={"status": "ON_MISSION"},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    updated_person = patch_res.json()
    assert updated_person["status"] == "ON_MISSION"

    # 4. Retrieve personnel by station
    filter_res = client.get(f"/personnel?station_id={bharati['id']}", headers=auth_headers)
    assert filter_res.status_code == 200
    bharati_personnel = filter_res.json()
    assert any(p["id"] == person_id for p in bharati_personnel)
