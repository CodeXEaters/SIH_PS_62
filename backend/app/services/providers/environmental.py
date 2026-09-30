from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
import random

from app.services.providers.base import EnvironmentalDataProvider
from app.models.environmental_observation import (
    ObservationSourceType,
    WeatherCondition,
    SeaIceCondition,
)

# Canonical station baselines for realistic simulation
STATION_METADATA = {
    1: {"name": "Bharati", "lat": -69.4072, "lon": 76.1914, "base_temp": -18.0, "base_wind": 28.0, "ice_cond": SeaIceCondition.OPEN_PACK.value, "ice_conc": 45.0},
    2: {"name": "Maitri", "lat": -70.7667, "lon": 11.7333, "base_temp": -24.0, "base_wind": 36.0, "ice_cond": SeaIceCondition.FAST_ICE.value, "ice_conc": 85.0},
    3: {"name": "Dakshin Gangotri", "lat": -70.0800, "lon": 12.0000, "base_temp": -28.0, "base_wind": 44.0, "ice_cond": SeaIceCondition.ICE_SHELF.value, "ice_conc": 95.0},
    4: {"name": "Himadri", "lat": 78.9272, "lon": 11.9277, "base_temp": -12.0, "base_wind": 20.0, "ice_cond": SeaIceCondition.VERY_OPEN_PACK.value, "ice_conc": 25.0},
    5: {"name": "IndARC", "lat": 79.0000, "lon": 12.0000, "base_temp": -14.0, "base_wind": 22.0, "ice_cond": SeaIceCondition.OPEN_WATER.value, "ice_conc": 10.0},
    6: {"name": "Cape Town Hub", "lat": -33.9249, "lon": 18.4241, "base_temp": 16.0, "base_wind": 14.0, "ice_cond": SeaIceCondition.OPEN_WATER.value, "ice_conc": 0.0},
}


class SimulatedEnvironmentalProvider(EnvironmentalDataProvider):
    """
    Certified simulated data provider for offline Smart India Hackathon demonstrations.
    All outputs strictly labeled with is_simulated=True and source_type='SIMULATED'.
    """

    def get_latest_observation(self, station_id: int) -> Dict[str, Any]:
        meta = STATION_METADATA.get(station_id, {
            "name": f"Station-{station_id}",
            "lat": -70.0,
            "lon": 15.0,
            "base_temp": -20.0,
            "base_wind": 25.0,
            "ice_cond": SeaIceCondition.OPEN_PACK.value,
            "ice_conc": 50.0,
        })

        # Add minor deterministic variations
        now = datetime.now(timezone.utc)
        hour_factor = (now.hour % 6) - 3

        temp = round(meta["base_temp"] + (hour_factor * 0.8), 1)
        wind = round(max(5.0, meta["base_wind"] + (hour_factor * 2.5)), 1)
        visibility = round(max(0.5, 15.0 - (wind * 0.2)), 1)
        pressure = round(985.0 + (hour_factor * 1.2), 1)

        weather = WeatherCondition.CLEAR.value
        if wind > 40 or visibility < 1.0:
            weather = WeatherCondition.BLIZZARD.value
        elif wind > 30:
            weather = WeatherCondition.HIGH_WINDS.value
        elif visibility < 3.0:
            weather = WeatherCondition.FOG.value
        elif temp < -25:
            weather = WeatherCondition.LIGHT_SNOW.value

        return {
            "station_id": station_id,
            "timestamp": now,
            "latitude": meta["lat"],
            "longitude": meta["lon"],
            "temperature": temp,
            "wind_speed": wind,
            "wind_direction": "SSW" if meta["lat"] < 0 else "NNE",
            "visibility": visibility,
            "pressure": pressure,
            "weather_condition": weather,
            "sea_ice_condition": meta["ice_cond"],
            "sea_ice_concentration": meta["ice_conc"],
            "source_type": ObservationSourceType.SIMULATED.value,
            "confidence": 0.95,
            "is_simulated": True,
        }

    def get_forecast(self, station_id: int, hours_ahead: int = 24) -> List[Dict[str, Any]]:
        current = self.get_latest_observation(station_id)
        projections = []
        for h in range(1, hours_ahead + 1, 3):
            proj_time = current["timestamp"] + timedelta(hours=h)
            temp_delta = -1.5 if (proj_time.hour < 6 or proj_time.hour > 20) else 1.0
            projections.append({
                "timestamp": proj_time,
                "temperature": round(current["temperature"] + temp_delta, 1),
                "wind_speed": round(current["wind_speed"] + (h * 0.5 % 8), 1),
                "visibility": current["visibility"],
                "weather_condition": current["weather_condition"],
                "sea_ice_concentration": current["sea_ice_concentration"],
                "source_type": ObservationSourceType.SIMULATED.value,
                "is_simulated": True,
            })
        return projections


class ExternalWeatherProvider(EnvironmentalDataProvider):
    """
    Architecture stub for connecting external numerical weather prediction APIs
    (e.g., Open-Meteo, ECMWF, NOAA GFS). Configured for offline fallback.
    """

    def get_latest_observation(self, station_id: int) -> Dict[str, Any]:
        # Fall back to simulation in offline environment
        return SimulatedEnvironmentalProvider().get_latest_observation(station_id)

    def get_forecast(self, station_id: int, hours_ahead: int = 24) -> List[Dict[str, Any]]:
        return SimulatedEnvironmentalProvider().get_forecast(station_id, hours_ahead)


class SatelliteProvider(EnvironmentalDataProvider):
    """
    Architecture stub for Copernicus Sentinel-1 SAR synthetic aperture radar
    and MODIS thermal sea-ice imagery data ingestion.
    """

    def get_latest_observation(self, station_id: int) -> Dict[str, Any]:
        obs = SimulatedEnvironmentalProvider().get_latest_observation(station_id)
        obs["source_type"] = ObservationSourceType.SATELLITE.value
        obs["is_simulated"] = False  # Set to true during offline run
        return obs

    def get_forecast(self, station_id: int, hours_ahead: int = 24) -> List[Dict[str, Any]]:
        return SimulatedEnvironmentalProvider().get_forecast(station_id, hours_ahead)
