def test_list_assets(client, auth_headers):
    """Test retrieving all assets."""
    response = client.get("/assets", headers=auth_headers)
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 10


def test_asset_maintenance_alerts(client, auth_headers):
    """Test retrieving assets with maintenance alerts."""
    response = client.get("/assets/maintenance-alerts", headers=auth_headers)
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0
    for asset in alerts:
        is_alert = (
            asset["health_score"] < 60.0 or
            asset["status"] in ["MAINTENANCE_REQUIRED", "IN_REPAIR"] or
            asset["next_maintenance"] is not None
        )
        assert is_alert


def test_create_and_get_asset(client, auth_headers):
    """Test registering an asset with QR code identity."""
    stations = client.get("/stations", headers=auth_headers).json()
    station_id = stations[0]["id"]

    payload = {
        "asset_name": "Snowcat Hydro-Trailer",
        "asset_type": "VEHICLE",
        "qr_code": "DHRUV:ASSET:TRAILER-TEST-99",
        "status": "OPERATIONAL",
        "station_id": station_id,
        "location": "Main Vehicle Yard",
        "health_score": 95.0,
    }
    create_res = client.post("/assets", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    asset = create_res.json()
    asset_id = asset["id"]
    assert asset["qr_code"] == payload["qr_code"]

    get_res = client.get(f"/assets/{asset_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["asset_name"] == payload["asset_name"]
