import pytest
from fastapi.testclient import TestClient


def test_anomaly_detection_scan(client: TestClient, auth_headers: dict):
    response = client.post("/intelligence/anomalies/scan?generate_alerts=true", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "anomalies_detected" in data
    assert "alerts_generated" in data
    assert isinstance(data["anomalies"], list)


def test_inventory_forecast(client: TestClient, auth_headers: dict):
    response = client.get("/intelligence/forecast/inventory?generate_alerts=false", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Verify mathematical formula: days_remaining = quantity / daily_consumption
    first_item = data[0]
    expected_days = round(first_item["quantity"] / (first_item["daily_consumption"] if first_item["daily_consumption"] > 0 else 1.0), 1)
    assert abs(first_item["days_remaining"] - expected_days) < 0.2
    assert "is_critical" in first_item


def test_what_if_simulation(client: TestClient, auth_headers: dict):
    scenario = {
        "vessel_delay_days": 5,
        "aircraft_cancelled": True,
        "fuel_consumption_spike_pct": 30.0,
        "mission_traverse_extended_hours": 12.0,
        "station_transfer_delayed_days": 2,
    }
    response = client.post("/intelligence/what-if", json=scenario, headers=auth_headers)
    assert response.status_code == 200
    result = response.json()
    assert result["bharati_fuel_days_remaining"] >= 0.0
    assert result["maitri_fuel_days_remaining"] >= 0.0
    assert result["cargo_delays_count"] >= 3
    assert len(result["critical_supply_stockouts"]) >= 1
    assert 0.0 <= result["operational_risk_score"] <= 100.0
    assert len(result["recommended_action"]) > 10


def test_attention_stream(client: TestClient, auth_headers: dict):
    response = client.get("/intelligence/attention", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
