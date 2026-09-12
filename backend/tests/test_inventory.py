def test_list_inventory(client, auth_headers):
    """Test retrieving inventory list."""
    response = client.get("/inventory", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 20


def test_inventory_low_stock_endpoint(client, auth_headers):
    """
    Test Step 8 integration requirement:
    'Member 3 reads quantity, minimum_threshold and daily_consumption directly from this module.'
    Endpoint: GET /inventory/low-stock
    """
    response = client.get("/inventory/low-stock", headers=auth_headers)
    assert response.status_code == 200
    low_stock_items = response.json()
    assert len(low_stock_items) > 0

    for item in low_stock_items:
        assert item["quantity"] <= item["minimum_threshold"]
        assert "daily_consumption" in item
        assert "unit" in item


def test_create_and_update_inventory(client, auth_headers):
    """Test creating and updating inventory stock levels."""
    stations = client.get("/stations", headers=auth_headers).json()
    station_id = stations[0]["id"]

    create_payload = {
        "item_name": "Synthetic Extreme Cold Lubricant",
        "category": "SPARE_PARTS",
        "station_id": station_id,
        "quantity": 50.0,
        "minimum_threshold": 10.0,
        "daily_consumption": 1.0,
        "unit": "L",
    }
    create_res = client.post("/inventory", json=create_payload, headers=auth_headers)
    assert create_res.status_code == 201
    item = create_res.json()
    item_id = item["id"]

    # Update stock quantity
    update_res = client.put(
        f"/inventory/{item_id}",
        json={"quantity": 8.0},  # Now drops below threshold
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["quantity"] == 8.0

    # Verify item now appears in low-stock query
    low_res = client.get("/inventory/low-stock", headers=auth_headers)
    assert any(i["id"] == item_id for i in low_res.json())
