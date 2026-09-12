import uuid
import pytest
from fastapi.testclient import TestClient
from app.models.alert import AlertSeverity, AlertType, AlertStatus


def test_create_alert(client: TestClient, auth_headers: dict):
    payload = {
        "alert_type": AlertType.LOW_BATTERY.value,
        "severity": AlertSeverity.HIGH.value,
        "title": "Low Battery Warning: Rover-01",
        "message": "Battery dropped below 18% during traverse.",
        "entity_type": "TRANSPORT",
        "entity_id": 999,
    }
    response = client.post("/alerts", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["status"] == AlertStatus.ACTIVE.value
    assert data["severity"] == AlertSeverity.HIGH.value
    assert data["id"] is not None


def test_alert_deduplication(client: TestClient, auth_headers: dict):
    # Generating unique entity_id to prevent collision with other tests
    test_entity_id = 8888
    payload = {
        "alert_type": AlertType.SIGNAL_LOST.value,
        "severity": AlertSeverity.CRITICAL.value,
        "title": "Initial Signal Lost",
        "message": "No ping for 15 minutes.",
        "entity_type": "MISSION",
        "entity_id": test_entity_id,
    }
    res1 = client.post("/alerts", json=payload, headers=auth_headers)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    # Second alert with same alert_type, entity_type, entity_id
    payload2 = {
        "alert_type": AlertType.SIGNAL_LOST.value,
        "severity": AlertSeverity.CRITICAL.value,
        "title": "Updated Signal Lost",
        "message": "No ping for 30 minutes now.",
        "entity_type": "MISSION",
        "entity_id": test_entity_id,
    }
    res2 = client.post("/alerts", json=payload2, headers=auth_headers)
    assert res2.status_code == 201
    assert res2.json()["id"] == id1  # Deduplicated to same alert ID
    assert res2.json()["title"] == "Updated Signal Lost"


def test_get_and_list_alerts(client: TestClient, auth_headers: dict):
    # Query list
    res = client.get("/alerts", headers=auth_headers)
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

    # Query active alerts
    res_active = client.get("/alerts/active", headers=auth_headers)
    assert res_active.status_code == 200
    active = res_active.json()
    assert all(a["status"] in ["ACTIVE", "ACKNOWLEDGED"] for a in active)


def test_alert_lifecycle_acknowledge_and_resolve(client: TestClient, auth_headers: dict):
    payload = {
        "alert_type": AlertType.WEATHER_BLIZZARD.value,
        "severity": AlertSeverity.MEDIUM.value,
        "title": "Severe Katabatic Winds",
        "message": "Wind speed approaching 55 knots.",
    }
    create_res = client.post("/alerts", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    alert_id = create_res.json()["id"]

    # Acknowledge
    ack_res = client.patch(f"/alerts/{alert_id}/acknowledge", headers=auth_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == AlertStatus.ACKNOWLEDGED.value
    assert ack_res.json()["acknowledged_at"] is not None

    # Resolve
    resolve_res = client.patch(f"/alerts/{alert_id}/resolve", headers=auth_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == AlertStatus.RESOLVED.value
    assert resolve_res.json()["resolved_at"] is not None


def test_create_alert_invalid_station(client: TestClient, auth_headers: dict):
    payload = {
        "alert_type": AlertType.MAINTENANCE_ALERT.value,
        "severity": AlertSeverity.LOW.value,
        "title": "Faulty Sensor",
        "message": "Station temp sensor failed.",
        "station_id": 999999,
    }
    response = client.post("/alerts", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]
