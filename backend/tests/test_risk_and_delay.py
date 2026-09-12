import pytest
from fastapi.testclient import TestClient


def test_mission_risk_evaluation(client: TestClient, auth_headers: dict):
    # Retrieve existing missions from seed
    missions = client.get("/missions", headers=auth_headers).json()
    assert len(missions) >= 1
    mission_id = missions[0]["id"]

    response = client.get(f"/intelligence/risk/mission/{mission_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["mission_id"] == mission_id
    assert 0.0 <= data["risk_score"] <= 100.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(data["key_drivers"]) >= 1
    assert "recommended_action" in data


def test_cargo_delay_prediction(client: TestClient, auth_headers: dict):
    # Retrieve existing cargo from seed
    cargo_list = client.get("/cargo", headers=auth_headers).json()
    assert len(cargo_list) >= 1
    cargo_id = cargo_list[0]["id"]

    response = client.get(f"/intelligence/delay/cargo/{cargo_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["cargo_id"] == cargo_id
    assert 0.0 <= data["delay_probability"] <= 1.0
    assert data["estimated_delay_hours"] >= 0.0
    assert len(data["key_drivers"]) >= 1
    assert "recommendation" in data


def test_risk_evaluation_invalid_mission(client: TestClient, auth_headers: dict):
    response = client.get("/intelligence/risk/mission/999999", headers=auth_headers)
    assert response.status_code in [400, 404, 500]


def test_delay_prediction_invalid_cargo(client: TestClient, auth_headers: dict):
    response = client.get("/intelligence/delay/cargo/999999", headers=auth_headers)
    assert response.status_code in [400, 404, 500]
