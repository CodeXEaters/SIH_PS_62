from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.permit import PermitStatus, PermitType


class PermitBase(BaseModel):
    permit_type: PermitType = Field(default=PermitType.SCIENTIFIC_RESEARCH)
    issuing_authority: str = Field(default="NCPOR / Ministry of Earth Sciences")
    expedition_id: Optional[str] = None
    station_id: Optional[int] = None
    issue_date: datetime
    expiry_date: datetime
    conditions: Optional[str] = None
    responsible_officer: str
    notes: Optional[str] = None


class PermitCreate(PermitBase):
    permit_number: Optional[str] = None
    status: PermitStatus = Field(default=PermitStatus.APPROVED)


class PermitUpdate(BaseModel):
    permit_type: Optional[PermitType] = None
    issuing_authority: Optional[str] = None
    expedition_id: Optional[str] = None
    station_id: Optional[int] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[PermitStatus] = None
    conditions: Optional[str] = None
    responsible_officer: Optional[str] = None
    notes: Optional[str] = None


class PermitStatusUpdate(BaseModel):
    status: PermitStatus
    notes: Optional[str] = None


class PermitResponse(PermitBase):
    id: int
    permit_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PermitSummaryResponse(BaseModel):
    total: int
    approved: int
    expiring_soon: int
    expired: int
    pending: int
    suspended: int
