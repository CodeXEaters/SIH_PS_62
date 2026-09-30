from app.models.waste_record import WasteCategory, WasteStatus, DisposalMethod


def test_create_waste_record(client, auth_headers):
    payload = {
        "station_id": 1,
        "waste_category": WasteCategory.HAZARDOUS.value,
        "quantity": 300.0,
        "unit": "KG",
        "disposal_method": DisposalMethod.RETROGRADE_SHIPMENT.value,
        "storage_location": "Bharati Hazardous Compactor Vault 2",
        "hazardous": True,
        "notes": "Spent battery electrolytes and solvents",
    }
    response = client.post("/api/v1/environment/waste", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["quantity"] == 300.0
    assert data["hazardous"] is True
    assert data["status"] == WasteStatus.STORED.value


def test_list_waste_records_and_filters(client, auth_headers):
    response = client.get("/api/v1/environment/waste", headers=auth_headers)
    assert response.status_code == 200
    records = response.json()
    assert len(records) >= 1

    # Filter hazardous
    haz_resp = client.get("/api/v1/environment/waste?hazardous=true", headers=auth_headers)
    assert haz_resp.status_code == 200
    for r in haz_resp.json():
        assert r["hazardous"] is True


def test_update_waste_record(client, auth_headers):
    list_resp = client.get("/api/v1/environment/waste", headers=auth_headers)
    first_id = list_resp.json()[0]["id"]

    patch_resp = client.patch(
        f"/api/v1/environment/waste/{first_id}",
        json={"status": WasteStatus.TRANSFERRED.value, "notes": "Manifested for MV Vasiliy Golovnin"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == WasteStatus.TRANSFERRED.value


def test_waste_summary_and_compliance(client, auth_headers):
    response = client.get("/api/v1/environment/waste/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "total_quantity_kg" in data
    assert "hazardous_stored_kg" in data
    assert "compliance_status" in data
    assert data["total_records"] >= 1
