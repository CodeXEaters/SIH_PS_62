from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.tracking_event import TrackingEntityType


class TrackingEventCreate(BaseModel):
    entity_type: TrackingEntityType
    entity_id: int = Field(..., description="Target entity identifier (Mission ID or Transport ID)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    speed: float = Field(..., ge=0.0, description="Current speed in km/h (>= 0)")
    battery: float = Field(..., ge=0.0, le=100.0, description="Remaining battery percentage (0.0 to 100.0)")
    timestamp: Optional[datetime] = Field(None, description="Optional telemetry observation timestamp (defaults to now)")


class TrackingEventResponse(BaseModel):
    id: int
    entity_type: TrackingEntityType
    entity_id: int
    latitude: float
    longitude: float
    speed: float
    battery: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class LiveTrackingItem(BaseModel):
    entity_type: TrackingEntityType
    entity_id: int
    entity_name: Optional[str] = None
    status: Optional[str] = None
    latest_latitude: float
    latest_longitude: float
    latest_speed: float
    latest_battery: float
    latest_timestamp: datetime
    event_id: int

    model_config = ConfigDict(from_attributes=True)
