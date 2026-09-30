from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class ObservationSourceType(str, Enum):
    SIMULATED = "SIMULATED"
    STATION_SENSOR = "STATION_SENSOR"
    EXTERNAL_API = "EXTERNAL_API"
    SATELLITE = "SATELLITE"
    MANUAL = "MANUAL"


class WeatherCondition(str, Enum):
    CLEAR = "CLEAR"
    PARTLY_CLOUDY = "PARTLY_CLOUDY"
    OVERCAST = "OVERCAST"
    LIGHT_SNOW = "LIGHT_SNOW"
    HEAVY_SNOW = "HEAVY_SNOW"
    BLIZZARD = "BLIZZARD"
    WHITEOUT = "WHITEOUT"
    HIGH_WINDS = "HIGH_WINDS"
    FOG = "FOG"


class SeaIceCondition(str, Enum):
    OPEN_WATER = "OPEN_WATER"
    VERY_OPEN_PACK = "VERY_OPEN_PACK"
    OPEN_PACK = "OPEN_PACK"
    CLOSE_PACK = "CLOSE_PACK"
    VERY_CLOSE_PACK = "VERY_CLOSE_PACK"
    CONSOLIDATED_ICE = "CONSOLIDATED_ICE"
    FAST_ICE = "FAST_ICE"
    ICE_SHELF = "ICE_SHELF"


class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)  # Celsius (e.g., -28.5)
    wind_speed = Column(Float, nullable=False)    # Knots (e.g., 42.0)
    wind_direction = Column(String, nullable=False)  # e.g., "SSW"
    visibility = Column(Float, nullable=False)    # Kilometers (e.g., 1.5)
    pressure = Column(Float, nullable=False)      # hPa / mbar (e.g., 982.5)
    weather_condition = Column(String, nullable=False, index=True)  # WeatherCondition enum value
    sea_ice_condition = Column(String, nullable=False, index=True)  # SeaIceCondition enum value
    sea_ice_concentration = Column(Float, nullable=False)  # Percentage 0.0 - 100.0
    source_type = Column(String, nullable=False, default=ObservationSourceType.SIMULATED.value, index=True)
    confidence = Column(Float, default=0.95, nullable=False)
    is_simulated = Column(Boolean, default=True, nullable=False)

    station = relationship("Station", backref="environmental_observations")
