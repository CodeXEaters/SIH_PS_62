import uuid
from datetime import datetime, timedelta, timezone
import pytest


def test_create_valid_mission(client, auth_headers):
    """Test 1: Create and schedule a valid polar expedition mission."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    stations = client.get("/stations", headers=auth_headers).json()
    assert len(personnel) >= 1
    assert len(stations) >= 2

    lead_id = personnel[0]["id"]
    orig_id = stations[0]["id"]
    dest_id = stations[1]["id"]

    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=7)
    name = f"Larsemann Glaciological Traverse {uuid.uuid4().hex[:6]}"

    payload = {
        "mission_name": name,
        "mission_type": "SCIENTIFIC_SURVEY",
        "origin": stations[0]["name"],
        "destination": stations[1]["name"],
        "team_lead_id": lead_id,
        "origin_station_id": orig_id,
        "destination_station_id": dest_id,
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
        "status": "PLANNED",
        "risk_level": "LOW",
    }
    response = client.post("/missions", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["mission_name"] == name
    assert data["mission_type"] == "SCIENTIFIC_SURVEY"
    assert data["team_lead_id"] == lead_id
    assert data["origin_station_id"] == orig_id
    assert data["destination_station_id"] == dest_id
    assert data["status"] == "PLANNED"


def test_create_mission_invalid_team_lead_rejected(client, auth_headers):
    """Test 2: Reject mission creation with non-existent personnel lead ID."""
    stations = client.get("/stations", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=3)

    payload = {
        "mission_name": f"Invalid Lead Mission {uuid.uuid4().hex[:6]}",
        "mission_type": "RECONNAISSANCE",
        "origin": "Maitri Station",
        "destination": "Schirmacher Oasis",
        "team_lead_id": 999999,  # Non-existent
        "origin_station_id": stations[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
    }
    response = client.post("/missions", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "Personnel team lead with id 999999 does not exist" in response.json()["detail"]


def test_create_mission_invalid_station_rejected(client, auth_headers):
    """Test 3: Reject mission referencing non-existent station ID."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=2)

    payload = {
        "mission_name": f"Invalid Station Mission {uuid.uuid4().hex[:6]}",
        "mission_type": "LOGISTICS_RESUPPLY",
        "origin": "Unknown Depot",
        "destination": "Bharati Base",
        "team_lead_id": personnel[0]["id"],
        "origin_station_id": 999999,  # Non-existent
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
    }
    response = client.post("/missions", json=payload, headers=auth_headers)
    assert response.status_code == 404
    assert "station with id 999999 does not exist" in response.json()["detail"]


def test_list_missions_and_filtering(client, auth_headers):
    """Test 4: List missions with status and type filters."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=5)

    name = f"Deep Ice Recon {uuid.uuid4().hex[:6]}"
    client.post("/missions", json={
        "mission_name": name,
        "mission_type": "RECONNAISSANCE",
        "origin": "Bharati",
        "destination": "Prydz Bay Sea Ice Edge",
        "team_lead_id": personnel[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
        "status": "ACTIVE",
        "risk_level": "HIGH",
    }, headers=auth_headers)

    # Filter by RECONNAISSANCE
    res = client.get("/missions?mission_type=RECONNAISSANCE", headers=auth_headers)
    assert res.status_code == 200
    recon = res.json()
    assert len(recon) >= 1
    assert any(m["mission_name"] == name for m in recon)

    # Filter by risk_level HIGH
    res_high = client.get("/missions?risk_level=HIGH", headers=auth_headers)
    assert res_high.status_code == 200
    high_risk = res_high.json()
    assert len(high_risk) >= 1
    assert all(m["risk_level"] == "HIGH" for m in high_risk)


def test_get_mission_by_id(client, auth_headers):
    """Test 5: Retrieve a single mission by ID."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=4)

    name = f"Emergency Traverse {uuid.uuid4().hex[:6]}"
    create_res = client.post("/missions", json={
        "mission_name": name,
        "mission_type": "EMERGENCY_RESCUE",
        "origin": "Maitri",
        "destination": "Wohlthat Mountains Field Team",
        "team_lead_id": personnel[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
        "risk_level": "CRITICAL",
    }, headers=auth_headers)
    assert create_res.status_code == 201
    m_id = create_res.json()["id"]

    res = client.get(f"/missions/{m_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == m_id

    # 404 check
    assert client.get("/missions/999999", headers=auth_headers).status_code == 404


def test_mission_status_transitions(client, auth_headers):
    """Test 6: Valid mission lifecycle transitions and terminal state enforcement."""
    personnel = client.get("/personnel", headers=auth_headers).json()
    start = datetime.now(timezone.utc)
    ret = start + timedelta(days=6)

    create_res = client.post("/missions", json={
        "mission_name": f"Lifecycle Mission {uuid.uuid4().hex[:6]}",
        "mission_type": "LOGISTICS_RESUPPLY",
        "origin": "Maitri Station",
        "destination": "Field Camp Alpha",
        "team_lead_id": personnel[0]["id"],
        "start_time": start.isoformat(),
        "expected_return": ret.isoformat(),
        "status": "PLANNED",
    }, headers=auth_headers)
    m_id = create_res.json()["id"]

    # 1. PLANNED -> ACTIVE
    patch1 = client.patch(f"/missions/{m_id}/status", json={"status": "ACTIVE"}, headers=auth_headers)
    assert patch1.status_code == 200
    assert patch1.json()["status"] == "ACTIVE"

    # 2. ACTIVE -> DELAYED with risk update
    patch2 = client.patch(f"/missions/{m_id}/status", json={"status": "DELAYED", "risk_level": "HIGH"}, headers=auth_headers)
    assert patch2.status_code == 200
    assert patch2.json()["status"] == "DELAYED"
    assert patch2.json()["risk_level"] == "HIGH"

    # 3. DELAYED -> ACTIVE
    patch3 = client.patch(f"/missions/{m_id}/status", json={"status": "ACTIVE"}, headers=auth_headers)
    assert patch3.status_code == 200
    assert patch3.json()["status"] == "ACTIVE"

    # 4. ACTIVE -> COMPLETED (terminal)
    patch4 = client.patch(f"/missions/{m_id}/status", json={"status": "COMPLETED"}, headers=auth_headers)
    assert patch4.status_code == 200
    assert patch4.json()["status"] == "COMPLETED"

    # 5. Cannot transition out of COMPLETED
    patch5 = client.patch(f"/missions/{m_id}/status", json={"status": "ACTIVE"}, headers=auth_headers)
    assert patch5.status_code == 400
    assert "Invalid mission status transition" in patch5.json()["detail"]
