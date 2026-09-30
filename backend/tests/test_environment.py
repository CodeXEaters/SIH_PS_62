from app.models.environmental_observation import WeatherCondition, SeaIceCondition, ObservationSourceType


def test_get_current_environment(client, auth_headers):
    response = client.get("/api/v1/environment/current", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    # Check structure
    sample = data[0]
    assert "temperature" in sample
    assert "wind_speed" in sample
    assert "sea_ice_concentration" in sample
    assert sample["is_simulated"] is True
    assert sample["source_type"] == ObservationSourceType.SIMULATED.value


def test_record_observation_and_hazard_alert(client, auth_headers):
    # Record a severe blizzard observation
    payload = {
        "station_id": 1,
        "latitude": -69.4072,
        "longitude": 76.1914,
        "temperature": -35.0,
        "wind_speed": 48.5,
        "wind_direction": "SW",
        "visibility": 0.4,
        "pressure": 978.0,
        "weather_condition": WeatherCondition.BLIZZARD.value,
        "sea_ice_condition": SeaIceCondition.FAST_ICE.value,
        "sea_ice_concentration": 90.0,
        "source_type": ObservationSourceType.SIMULATED.value,
        "is_simulated": True,
    }
    response = client.post("/api/v1/environment/observations", json=payload, headers=auth_headers)
    assert response.status_code == 201
    obs_data = response.json()
    assert obs_data["id"] is not None
    assert obs_data["wind_speed"] == 48.5

    # Check that environmental alerts includes our trigger
    alerts_resp = client.get("/api/v1/environment/alerts", headers=auth_headers)
    assert alerts_resp.status_code == 200
    assert len(alerts_resp.json()) >= 1


def test_environmental_risk_engine(client, auth_headers):
    response = client.get("/api/v1/environment/risk?station_id=1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "level" in data
    assert data["level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(data["factors"]) >= 0
    assert len(data["recommendations"]) >= 1
    assert data["is_simulated"] is True


def test_environmental_forecast(client, auth_headers):
    response = client.get("/api/v1/environment/forecast?station_id=1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    sample = data[0]
    assert "temperature" in sample
    assert "wind_speed" in sample
    assert sample["is_simulated"] is True


def test_environmental_history(client, auth_headers):
    response = client.get("/api/v1/environment/history?station_id=1&limit=10", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
