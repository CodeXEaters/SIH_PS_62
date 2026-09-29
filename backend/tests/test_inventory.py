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


def test_create_inventory_transfer(client, auth_headers):
    """Test executing an atomic inter-station inventory transfer."""
    stations = client.get("/stations", headers=auth_headers).json()
    st1_id = stations[0]["id"]
    st2_id = stations[1]["id"]

    # 1. Create stock at Station 1
    create_res = client.post(
        "/inventory",
        json={
            "item_name": "Emergency Cold Weather MRE Packs",
            "category": "RATIONS",
            "station_id": st1_id,
            "quantity": 100.0,
            "minimum_threshold": 20.0,
            "daily_consumption": 2.0,
            "unit": "BOX",
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # 2. Reject transfer to same station
    same_res = client.post(
        "/inventory/transfers",
        json={
            "item_id": item_id,
            "from_station_id": st1_id,
            "to_station_id": st1_id,
            "quantity": 10.0,
        },
        headers=auth_headers,
    )
    assert same_res.status_code == 400

    # 3. Reject transfer exceeding available stock
    excess_res = client.post(
        "/inventory/transfers",
        json={
            "item_id": item_id,
            "from_station_id": st1_id,
            "to_station_id": st2_id,
            "quantity": 999.0,
        },
        headers=auth_headers,
    )
    assert excess_res.status_code == 400

    # 4. Valid transfer of 30 units from Station 1 to Station 2
    trf_res = client.post(
        "/inventory/transfers",
        json={
            "item_id": item_id,
            "from_station_id": st1_id,
            "to_station_id": st2_id,
            "quantity": 30.0,
            "notes": "Emergency ration buffer transfer",
        },
        headers=auth_headers,
    )
    assert trf_res.status_code == 201
    transfer_data = trf_res.json()
    assert transfer_data["status"] == "COMPLETED"
    assert "30" in transfer_data["quantity"]

    # 5. Check origin stock was decremented to 70
    updated_st1 = client.get(f"/inventory/{item_id}", headers=auth_headers).json()
    assert updated_st1["quantity"] == 70.0

    # 6. Verify transfer appears in transfer list
    list_trf = client.get("/inventory/transfers", headers=auth_headers).json()
    assert any(t["id"] == transfer_data["id"] for t in list_trf)

