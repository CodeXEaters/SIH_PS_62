from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.transport import TransportType, TransportStatus


class TransportBase(BaseModel):
    transport_name: str = Field(..., min_length=1, description="Name or identifier of transport vessel/vehicle")
    type: TransportType
    capacity: float = Field(..., gt=0, description="Payload capacity in kilograms")
    status: TransportStatus = TransportStatus.AVAILABLE
    current_location: str = Field(..., min_length=1, description="Current geographical location or coordinates")
    destination: str = Field(..., min_length=1, description="Target destination or polar station")
    eta: Optional[datetime] = Field(None, description="Estimated time of arrival")
    current_station_id: Optional[int] = Field(None, description="ID of departure/current station if at a base")
    destination_station_id: Optional[int] = Field(None, description="ID of destination station if headed to a base")


class TransportCreate(TransportBase):
    pass


class TransportUpdate(BaseModel):
    transport_name: Optional[str] = None
    type: Optional[TransportType] = None
    capacity: Optional[float] = Field(None, gt=0)
    status: Optional[TransportStatus] = None
    current_location: Optional[str] = None
    destination: Optional[str] = None
    eta: Optional[datetime] = None
    current_station_id: Optional[int] = None
    destination_station_id: Optional[int] = None


class TransportStatusUpdate(BaseModel):
    status: TransportStatus
    current_location: Optional[str] = None
    destination: Optional[str] = None
    eta: Optional[datetime] = None
    current_station_id: Optional[int] = None
    destination_station_id: Optional[int] = None


class TransportResponse(TransportBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransportStatusResponse(BaseModel):
    id: int
    transport_name: str
    type: TransportType
    status: TransportStatus
    current_location: str
    destination: str
    eta: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
