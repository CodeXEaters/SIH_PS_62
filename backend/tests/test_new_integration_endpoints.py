import pytest
from fastapi.testclient import TestClient


def test_reports_summary(client: TestClient, auth_headers: dict):
    response = client.get("/reports/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "expeditionReadinessPct" in data or "expedition_readiness_pct" in data
    assert "cargoTonnageTracked" in data or "cargo_tonnage_tracked" in data
    assert "criticalSupplyDaysMin" in data or "critical_supply_days_min" in data
    assert "totalMissionsCompleted" in data or "total_missions_completed" in data


def test_expeditions_active(client: TestClient, auth_headers: dict):
    response = client.get("/expeditions/active", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ISEA-46"
    assert "milestones" in data
    assert len(data["milestones"]) > 0


def test_tracking_entities(client: TestClient, auth_headers: dict):
    response = client.get("/tracking/entities", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    station_entities = [e for e in data if str(e.get("type")).upper() == "STATION"]
    assert len(station_entities) >= 2


def test_auth_logout(client: TestClient, auth_headers: dict):
    response = client.post("/auth/logout", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_what_if_camel_case_support(client: TestClient, auth_headers: dict):
    payload = {
        "vesselDelayDays": 3,
        "aircraftCancelled": True,
        "fuelConsumptionSpikePct": 25.0,
        "missionTraverseExtendedHours": 8.0,
        "stationTransferDelayedDays": 1,
    }
    response = client.post("/intelligence/what-if", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "bharatiFuelDaysRemaining" in data
    assert "operationalRiskScore" in data
    assert data["operationalRiskScore"] >= 0
