from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.cargo_event import CargoEventType
from app.models.cargo import CargoStatus


class CargoEventBase(BaseModel):
    event_type: CargoEventType
    location: str = Field(..., min_length=1, description="Physical location of the event")
    station_id: Optional[int] = Field(None, description="Optional associated station ID")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude")
    remarks: Optional[str] = Field(None, description="Operational notes or observations")


class CargoScanRequest(BaseModel):
    qr_code: str = Field(..., min_length=1, description="Scanned QR code identity (e.g. DHRUV:CARGO:CRG-2026-001)")
    location: str = Field(..., min_length=1, description="Location where the scan occurred")
    station_id: Optional[int] = Field(None, description="ID of polar station if applicable")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    event_type: Optional[CargoEventType] = Field(default=CargoEventType.SCANNED, description="Type of event represented by the scan")
    remarks: Optional[str] = None


class CargoEventCreate(CargoEventBase):
    cargo_id: int


class CargoEventResponse(CargoEventBase):
    id: int
    cargo_id: int
    timestamp: datetime
    updated_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CargoScanResponse(BaseModel):
    message: str
    cargo_id: int
    cargo_code: str
    status: CargoStatus
    current_location: str
    event: CargoEventResponse

    model_config = ConfigDict(from_attributes=True)


class CargoTimelineResponse(BaseModel):
    cargo_id: int
    cargo_code: str
    cargo_name: str
    current_status: CargoStatus
    current_location: str
    events: List[CargoEventResponse]

    model_config = ConfigDict(from_attributes=True)
