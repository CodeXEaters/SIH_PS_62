from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ExpeditionMilestone(BaseModel):
    id: str
    title: str
    location: str
    date: str
    status: str
    description: str


class ExpeditionResponse(BaseModel):
    id: str
    code: Optional[str] = None
    name: str
    short_name: str = Field(..., validation_alias="shortName", serialization_alias="shortName")
    season: str
    status: str
    start_date: str = Field(..., validation_alias="startDate", serialization_alias="startDate")
    end_date: str = Field(..., validation_alias="endDate", serialization_alias="endDate")
    leader: str
    vessel: str
    personnel_count: int = Field(..., validation_alias="personnelCount", serialization_alias="personnelCount")
    cargo_tonnage: float = Field(..., validation_alias="cargoTonnage", serialization_alias="cargoTonnage")
    active_missions_count: int = Field(..., validation_alias="activeMissionsCount", serialization_alias="activeMissionsCount")
    overall_readiness_pct: float = Field(..., validation_alias="overallReadinessPct", serialization_alias="overallReadinessPct")
    milestones: List[ExpeditionMilestone]

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )
