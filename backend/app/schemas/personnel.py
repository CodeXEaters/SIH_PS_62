from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.personnel import ReadinessStatus, HealthClearanceStatus


class PersonnelBase(BaseModel):
    name: str
    designation: str
    team: str
    station_id: int
    current_location: str
    status: str = "ACTIVE"  # e.g., ACTIVE, ON_MISSION, REST, EVACUATING
    medical_clearance: bool = True
    emergency_contact: str
    user_id: Optional[int] = None
    last_check_in: Optional[datetime] = None

    # PPT Parity: Health & Readiness
    health_clearance_status: Optional[str] = HealthClearanceStatus.APPROVED.value
    clearance_expiry: Optional[datetime] = None
    readiness_status: Optional[str] = ReadinessStatus.READY.value
    medical_review_date: Optional[datetime] = None
    deployment_eligibility: Optional[str] = "FIT_FOR_DEPLOYMENT"
    restrictions_notes: Optional[str] = None


class PersonnelCreate(PersonnelBase):
    pass


class PersonnelUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    team: Optional[str] = None
    station_id: Optional[int] = None
    current_location: Optional[str] = None
    status: Optional[str] = None
    medical_clearance: Optional[bool] = None
    emergency_contact: Optional[str] = None
    user_id: Optional[int] = None
    last_check_in: Optional[datetime] = None
    health_clearance_status: Optional[str] = None
    clearance_expiry: Optional[datetime] = None
    readiness_status: Optional[str] = None
    medical_review_date: Optional[datetime] = None
    deployment_eligibility: Optional[str] = None
    restrictions_notes: Optional[str] = None


class PersonnelStatusUpdate(BaseModel):
    status: str


class PersonnelReadinessUpdate(BaseModel):
    health_clearance_status: Optional[str] = None
    clearance_expiry: Optional[datetime] = None
    readiness_status: Optional[str] = None
    medical_review_date: Optional[datetime] = None
    deployment_eligibility: Optional[str] = None
    restrictions_notes: Optional[str] = None


class PersonnelReadinessSummary(BaseModel):
    total: int
    ready: int
    limited: int
    not_ready: int
    clearance_expired: int
    # Compatibility aliases for frontend and reporting
    total_personnel: Optional[int] = None
    ready_count: Optional[int] = None
    limited_count: Optional[int] = None
    expired_count: Optional[int] = None
    unfit_count: Optional[int] = None
    readiness_percentage: Optional[float] = None


class PersonnelResponse(PersonnelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
