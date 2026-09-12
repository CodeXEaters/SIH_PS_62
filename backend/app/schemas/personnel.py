from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


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


class PersonnelStatusUpdate(BaseModel):
    status: str


class PersonnelResponse(PersonnelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
