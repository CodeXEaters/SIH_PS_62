from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.services.providers.base import TrackingDataProvider


class SimulatedTelemetryProvider(TrackingDataProvider):
    """
    Default simulated telemetry provider for missions and transports.
    Generates realistic polar GPS coordinates, speed, and battery metrics.
    """

    def get_telemetry(self, entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
        return {
            "entity_type": entity_type.upper(),
            "entity_id": entity_id,
            "latitude": -70.4500,
            "longitude": 12.1000,
            "speed": 14.5,
            "battery": 87.0,
            "timestamp": datetime.now(timezone.utc),
            "source": "SIMULATED_GPS",
            "is_simulated": True,
        }


class AISProvider(TrackingDataProvider):
    """
    Maritime Automatic Identification System (AIS) transponder ingestion interface.
    Used for tracking polar research vessels (e.g., MV Vasiliy Golovnin).
    """

    def get_telemetry(self, entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
        # Stub: Return simulated vessel telemetry in offline demo mode
        telem = SimulatedTelemetryProvider().get_telemetry(entity_type, entity_id)
        if telem:
            telem["source"] = "AIS_VHF_RECEIVER"
            telem["is_simulated"] = True
        return telem


class IoTProvider(TrackingDataProvider):
    """
    Asset IoT tracker interface (LoRaWAN / Iridium SBD beacon).
    Used for monitoring snowmobiles, rovers, and weather buoys.
    """

    def get_telemetry(self, entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
        telem = SimulatedTelemetryProvider().get_telemetry(entity_type, entity_id)
        if telem:
            telem["source"] = "IRIDIUM_SBD_BEACON"
            telem["is_simulated"] = True
        return telem
