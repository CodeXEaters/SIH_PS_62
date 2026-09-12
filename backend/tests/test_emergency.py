import pytest
from fastapi.testclient import TestClient
from app.models.emergency import EmergencyType, EmergencySeverity, EmergencyStatus, EmergencyDecision


def test_create_emergency_generates_code_and_alert(client: TestClient, auth_headers: dict):
    # Fetch a station for reference
    stations = client.get("/stations", headers=auth_headers).json()
    station_id = stations[0]["id"]

    payload = {
        "title": "Severe Crevasse Fall During Glaciology Traverse",
        "emergency_type": EmergencyType.MEDICAL.value,
        "severity": EmergencySeverity.CRITICAL.value,
        "description": "Field glaciologist sustained compound fracture 18km East of Maitri station.",
        "station_id": station_id,
        "latitude": -70.78,
        "longitude": 11.75,
        "location_description": "Schirmacher Oasis Crevasse Field",
    }
    response = client.post("/emergency", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["incident_code"].startswith("EMG-2026-")
    assert data["status"] == EmergencyStatus.OPEN.value
    assert data["human_decision"] == EmergencyDecision.PENDING.value
    assert "DISPATCH PLAN" in data["recommended_response"]

    # Verify that an automatic CRITICAL Alert was generated in the alerts table
    alerts = client.get("/alerts", headers=auth_headers).json()
    emergency_alerts = [a for a in alerts if data["incident_code"] in a["message"]]
    assert len(emergency_alerts) >= 1
    assert emergency_alerts[0]["severity"] == "CRITICAL"


def test_get_and_list_emergencies(client: TestClient, auth_headers: dict):
    res_list = client.get("/emergency", headers=auth_headers)
    assert res_list.status_code == 200
    assert isinstance(res_list.json(), list)

    res_active = client.get("/emergency/active", headers=auth_headers)
    assert res_active.status_code == 200
    active = res_active.json()
    assert active is not None
    assert active["status"] in ["OPEN", "DISPATCHED", "CONTAINED"]


def test_emergency_human_decision_flow(client: TestClient, auth_headers: dict):
    # Create emergency
    payload = {
        "title": "Station Main Generator Power Interruption",
        "emergency_type": EmergencyType.GENERATOR_FAILURE.value,
        "severity": EmergencySeverity.HIGH.value,
        "description": "Substation 2 circuit trip in -35C Blizzard.",
    }
    create_res = client.post("/emergency", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    emergency_id = create_res.json()["id"]

    # Commander approves dispatch
    decision_payload = {
        "decision": EmergencyDecision.APPROVED.value,
        "notes": "Authorize secondary backup generator switchover and technical team dispatch.",
    }
    dec_res = client.post(f"/emergency/{emergency_id}/decision", json=decision_payload, headers=auth_headers)
    assert dec_res.status_code == 200
    updated = dec_res.json()
    assert updated["human_decision"] == EmergencyDecision.APPROVED.value
    assert updated["status"] == EmergencyStatus.DISPATCHED.value
    assert updated["decision_notes"] == decision_payload["notes"]


def test_create_emergency_invalid_station(client: TestClient, auth_headers: dict):
    payload = {
        "title": "Invalid SOS",
        "emergency_type": EmergencyType.EVACUATION.value,
        "description": "Testing rejection of non-existent base.",
        "station_id": 999999,
    }
    response = client.post("/emergency", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]
