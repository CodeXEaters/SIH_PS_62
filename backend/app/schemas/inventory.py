from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class InventoryBase(BaseModel):
    item_name: str
    category: str
    station_id: int
    quantity: float
    minimum_threshold: float
    daily_consumption: float
    unit: str
    expiry_date: Optional[date] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    station_id: Optional[int] = None
    quantity: Optional[float] = None
    minimum_threshold: Optional[float] = None
    daily_consumption: Optional[float] = None
    unit: Optional[str] = None
    expiry_date: Optional[date] = None


class InventoryResponse(InventoryBase):
    id: int
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)
