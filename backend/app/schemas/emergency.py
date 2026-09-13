from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.emergency import EmergencyType, EmergencySeverity, EmergencyStatus, EmergencyDecision


class EmergencyBase(BaseModel):
    title: str = Field(..., min_length=1, description="Short title describing the emergency incident")
    emergency_type: EmergencyType
    severity: EmergencySeverity = EmergencySeverity.CRITICAL
    description: str = Field(..., min_length=1, description="Comprehensive report of incident and condition")
    station_id: Optional[int] = Field(None, description="Nearby or originating polar station ID")
    mission_id: Optional[int] = Field(None, description="Associated mission ID if on traverse")
    personnel_id: Optional[int] = Field(None, description="Affected personnel ID or casualty")
    asset_id: Optional[int] = Field(None, description="Involved vehicle or equipment asset ID")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude of SOS incident")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude of SOS incident")
    location_description: Optional[str] = Field(None, description="Geographic reference or terrain context")


class EmergencyCreate(EmergencyBase):
    pass


class EmergencyUpdate(BaseModel):
    title: Optional[str] = None
    emergency_type: Optional[EmergencyType] = None
    severity: Optional[EmergencySeverity] = None
    status: Optional[EmergencyStatus] = None
    description: Optional[str] = None
    recommended_response: Optional[str] = None
    location_description: Optional[str] = None


class EmergencyDecisionRequest(BaseModel):
    decision: EmergencyDecision = Field(..., description="Operational decision: APPROVED, MODIFIED, REJECTED")
    notes: Optional[str] = Field(None, description="Commander authorization notes or modifications")


class EmergencyStatusUpdate(BaseModel):
    status: EmergencyStatus


class EmergencyResponse(EmergencyBase):
    id: int
    incident_code: str
    status: EmergencyStatus
    recommended_response: Optional[str] = None
    human_decision: EmergencyDecision
    decision_notes: Optional[str] = None
    decision_timestamp: Optional[datetime] = None
    reported_by: Optional[int] = None
    station_name: Optional[str] = None
    personnel_name: Optional[str] = None
    asset_name: Optional[str] = None
    mission_name: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
