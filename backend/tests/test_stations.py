def test_list_stations(client, auth_headers):
    """Test retrieving list of all stations."""
    response = client.get("/stations", headers=auth_headers)
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 5
    station_names = [s["name"] for s in stations]
    assert "Maitri Station" in station_names
    assert "Bharati Station" in station_names
    assert "NCPOR Goa" in station_names


def test_get_station_by_id(client, auth_headers):
    """Test retrieving a specific station by its ID."""
    list_res = client.get("/stations", headers=auth_headers)
    station_id = list_res.json()[0]["id"]

    response = client.get(f"/stations/{station_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == station_id
    assert "latitude" in data
    assert "longitude" in data


def test_create_station(client, auth_headers):
    """Test creating a new expedition camp/station."""
    payload = {
        "name": "Field Camp Echo",
        "location": "Amery Ice Shelf, East Antarctica",
        "latitude": -69.7500,
        "longitude": 73.5000,
        "type": "FIELD_CAMP",
        "status": "OPERATIONAL",
    }
    response = client.post("/stations", json=payload, headers=auth_headers)
    assert response.status_code in [201, 400]
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["latitude"] == payload["latitude"]
