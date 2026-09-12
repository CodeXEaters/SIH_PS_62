from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AssetBase(BaseModel):
    asset_name: str
    asset_type: str  # e.g., VEHICLE, GENERATOR, COMMS, MEDICAL, SCIENTIFIC_INSTRUMENT
    qr_code: str
    status: str = "OPERATIONAL"  # e.g., OPERATIONAL, MAINTENANCE_REQUIRED, IN_REPAIR, DECOMMISSIONED
    station_id: int
    location: str
    last_maintenance: Optional[date] = None
    next_maintenance: Optional[date] = None
    health_score: float = 100.0


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    qr_code: Optional[str] = None
    status: Optional[str] = None
    station_id: Optional[int] = None
    location: Optional[str] = None
    last_maintenance: Optional[date] = None
    next_maintenance: Optional[date] = None
    health_score: Optional[float] = None


class AssetResponse(AssetBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
