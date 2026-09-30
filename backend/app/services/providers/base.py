from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime


class EnvironmentalDataProvider(ABC):
    """
    Abstract interface for environmental data ingestion.
    Allows swapping between SIMULATED (offline SIH demo), external APIs,
    satellite remote sensing, or station IoT sensors.
    """

    @abstractmethod
    def get_latest_observation(self, station_id: int) -> Dict[str, Any]:
        """Fetch the most recent meteorological and cryospheric observation."""
        pass

    @abstractmethod
    def get_forecast(self, station_id: int, hours_ahead: int = 24) -> List[Dict[str, Any]]:
        """Fetch future weather/ice projection."""
        pass


class TrackingDataProvider(ABC):
    """
    Abstract interface for position and telemetry ingestion.
    Allows swapping between SIMULATED, marine AIS, and asset IoT trackers.
    """

    @abstractmethod
    def get_telemetry(self, entity_type: str, entity_id: int) -> Optional[Dict[str, Any]]:
        pass
