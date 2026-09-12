from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.cargo import CargoCategory, CargoPriority, CargoStatus


class CargoBase(BaseModel):
    name: str = Field(..., min_length=1, description="Cargo package name or description")
    category: CargoCategory
    weight: float = Field(..., gt=0, description="Weight in kilograms (must be > 0)")
    priority: CargoPriority = CargoPriority.MEDIUM
    origin_station_id: int = Field(..., description="ID of departure polar station")
    destination_station_id: int = Field(..., description="ID of destination polar station")
    current_location: Optional[str] = Field(None, description="Current location description")


class CargoCreate(CargoBase):
    @field_validator("destination_station_id")
    @classmethod
    def validate_stations_differ(cls, v: int, info) -> int:
        origin = info.data.get("origin_station_id")
        if origin is not None and v == origin:
            raise ValueError("Origin and destination stations cannot be the same")
        return v


class CargoUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[CargoCategory] = None
    weight: Optional[float] = Field(None, gt=0)
    priority: Optional[CargoPriority] = None
    origin_station_id: Optional[int] = None
    destination_station_id: Optional[int] = None
    current_location: Optional[str] = None
    status: Optional[CargoStatus] = None


class CargoStatusUpdate(BaseModel):
    status: CargoStatus
    current_location: Optional[str] = None


class CargoResponse(CargoBase):
    id: int
    cargo_code: str
    status: CargoStatus
    current_location: str
    qr_code: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
