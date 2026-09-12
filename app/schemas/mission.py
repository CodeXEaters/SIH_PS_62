from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.mission import MissionType, MissionStatus, MissionRiskLevel


class MissionBase(BaseModel):
    mission_name: str = Field(..., min_length=1, description="Expedition or traverse mission name")
    mission_type: MissionType
    origin: str = Field(..., min_length=1, description="Mission departure origin description")
    destination: str = Field(..., min_length=1, description="Mission destination or objective area")
    team_lead_id: int = Field(..., description="ID of expedition leader from personnel roster")
    origin_station_id: Optional[int] = Field(None, description="Optional ID of departure polar station")
    destination_station_id: Optional[int] = Field(None, description="Optional ID of destination polar station")
    start_time: datetime = Field(..., description="Scheduled or actual start timestamp")
    expected_return: datetime = Field(..., description="Scheduled expected return timestamp")
    status: MissionStatus = MissionStatus.PLANNED
    risk_level: MissionRiskLevel = MissionRiskLevel.LOW


class MissionCreate(MissionBase):
    pass


class MissionUpdate(BaseModel):
    mission_name: Optional[str] = None
    mission_type: Optional[MissionType] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    team_lead_id: Optional[int] = None
    origin_station_id: Optional[int] = None
    destination_station_id: Optional[int] = None
    start_time: Optional[datetime] = None
    expected_return: Optional[datetime] = None
    status: Optional[MissionStatus] = None
    risk_level: Optional[MissionRiskLevel] = None


class MissionStatusUpdate(BaseModel):
    status: MissionStatus
    risk_level: Optional[MissionRiskLevel] = None


class MissionResponse(MissionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
