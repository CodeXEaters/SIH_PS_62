from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.waste_record import WasteCategory, WasteStatus, DisposalMethod


class WasteRecordBase(BaseModel):
    station_id: int
    waste_category: WasteCategory = Field(default=WasteCategory.GENERAL)
    quantity: float = Field(..., gt=0.0, description="Quantity in designated unit")
    unit: str = Field(default="KG")
    disposal_method: DisposalMethod = Field(default=DisposalMethod.RETROGRADE_SHIPMENT)
    storage_location: str = Field(default="Station Waste Storage Vault")
    hazardous: bool = Field(default=False)
    responsible_personnel_id: Optional[int] = None
    notes: Optional[str] = None


class WasteRecordCreate(WasteRecordBase):
    status: WasteStatus = Field(default=WasteStatus.STORED)
    generated_at: Optional[datetime] = None


class WasteRecordUpdate(BaseModel):
    waste_category: Optional[WasteCategory] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    disposal_method: Optional[DisposalMethod] = None
    storage_location: Optional[str] = None
    hazardous: Optional[bool] = None
    status: Optional[WasteStatus] = None
    processed_at: Optional[datetime] = None
    responsible_personnel_id: Optional[int] = None
    notes: Optional[str] = None


class WasteRecordResponse(WasteRecordBase):
    id: int
    status: str
    generated_at: datetime
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WasteSummaryResponse(BaseModel):
    total_records: int
    total_quantity_kg: float
    hazardous_stored_kg: float
    retrograde_pending_kg: float
    category_breakdown: Dict[str, float]
    status_breakdown: Dict[str, int]
    compliance_status: str
