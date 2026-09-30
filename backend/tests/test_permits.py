from datetime import datetime, timezone, timedelta
from app.models.permit import PermitType, PermitStatus


def test_create_permit(client, auth_headers):
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=180)
    payload = {
        "permit_type": PermitType.SCIENTIFIC_RESEARCH.value,
        "issuing_authority": "National Centre for Polar and Ocean Research (NCPOR)",
        "station_id": 1,
        "issue_date": now.isoformat(),
        "expiry_date": expiry.isoformat(),
        "conditions": "Sample collection strictly non-destructive; GPS tags required",
        "responsible_officer": "Dr. Priya Nair",
        "notes": "44th ISEA Glaciological Core Drilling",
    }
    response = client.post("/api/v1/permits", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["permit_number"].startswith("PRM-")
    assert data["status"] == PermitStatus.APPROVED.value
    assert data["responsible_officer"] == "Dr. Priya Nair"


def test_list_permits_and_filters(client, auth_headers):
    response = client.get("/api/v1/permits", headers=auth_headers)
    assert response.status_code == 200
    permits = response.json()
    assert len(permits) >= 1

    # Filter by station_id
    filtered = client.get("/api/v1/permits?station_id=1", headers=auth_headers)
    assert filtered.status_code == 200
    for p in filtered.json():
        assert p["station_id"] == 1


def test_get_permit_by_id(client, auth_headers):
    list_resp = client.get("/api/v1/permits", headers=auth_headers)
    first_id = list_resp.json()[0]["id"]

    response = client.get(f"/api/v1/permits/{first_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == first_id


def test_update_permit_and_status(client, auth_headers):
    now = datetime.now(timezone.utc)
    payload = {
        "permit_type": PermitType.FLIGHT_OPERATIONS.value,
        "issuing_authority": "Ministry of Earth Sciences",
        "station_id": 2,
        "issue_date": now.isoformat(),
        "expiry_date": (now + timedelta(days=60)).isoformat(),
        "responsible_officer": "Wing Cdr. R. Sharma",
    }
    create_resp = client.post("/api/v1/permits", json=payload, headers=auth_headers)
    permit_id = create_resp.json()["id"]

    # Patch details
    patch_resp = client.patch(
        f"/api/v1/permits/{permit_id}",
        json={"conditions": "Daylight visual meteorological conditions only"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert "Daylight" in patch_resp.json()["conditions"]

    # Mutate status
    status_resp = client.patch(
        f"/api/v1/permits/{permit_id}/status",
        json={"status": PermitStatus.SUSPENDED.value, "notes": "Weather radar calibration pending"},
        headers=auth_headers,
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == PermitStatus.SUSPENDED.value


def test_expiring_permits_and_compliance_alerts(client, auth_headers):
    now = datetime.now(timezone.utc)
    # Create an already expired permit
    expired_payload = {
        "permit_type": PermitType.WASTE_MANAGEMENT.value,
        "issuing_authority": "Antarctic Treaty Secretariat",
        "station_id": 1,
        "issue_date": (now - timedelta(days=400)).isoformat(),
        "expiry_date": (now - timedelta(days=10)).isoformat(),
        "responsible_officer": "Officer K. Das",
    }
    create_resp = client.post("/api/v1/permits", json=expired_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    assert create_resp.json()["status"] == PermitStatus.EXPIRED.value

    # Check /expiring endpoint
    exp_resp = client.get("/api/v1/permits/expiring?days=30", headers=auth_headers)
    assert exp_resp.status_code == 200
    expired_ids = [p["id"] for p in exp_resp.json()]
    assert create_resp.json()["id"] in expired_ids


def test_permit_summary(client, auth_headers):
    response = client.get("/api/v1/permits/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "approved" in data
    assert "expired" in data
    assert data["total"] >= 1
