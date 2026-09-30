from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.environmental_observation import (
    ObservationSourceType,
    WeatherCondition,
    SeaIceCondition,
)


class EnvironmentalObservationBase(BaseModel):
    station_id: int
    latitude: float
    longitude: float
    temperature: float
    wind_speed: float
    wind_direction: str
    visibility: float
    pressure: float
    weather_condition: WeatherCondition = Field(default=WeatherCondition.CLEAR)
    sea_ice_condition: SeaIceCondition = Field(default=SeaIceCondition.OPEN_WATER)
    sea_ice_concentration: float = Field(default=0.0, ge=0.0, le=100.0)
    source_type: ObservationSourceType = Field(default=ObservationSourceType.SIMULATED)
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    is_simulated: bool = Field(default=True)


class EnvironmentalObservationCreate(EnvironmentalObservationBase):
    pass


class EnvironmentalObservationResponse(EnvironmentalObservationBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class EnvironmentalRiskResponse(BaseModel):
    station_id: Optional[int] = None
    score: float
    level: str
    factors: List[str]
    recommendations: List[str]
    timestamp: datetime
    is_simulated: bool = True


class EnvironmentalForecastItem(BaseModel):
    timestamp: datetime
    temperature: float
    wind_speed: float
    visibility: float
    weather_condition: str
    sea_ice_concentration: float
    source_type: str = "SIMULATED"
    is_simulated: bool = True


class EnvironmentalStationSummary(BaseModel):
    station_id: int
    station_name: str
    observation: Optional[EnvironmentalObservationResponse] = None
    risk: EnvironmentalRiskResponse
