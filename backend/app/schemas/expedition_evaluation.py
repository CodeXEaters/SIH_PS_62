from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PlanEvaluationRequest(BaseModel):
    mission_name: str
    origin_station_id: int
    destination_station_id: int
    mission_type: str = "SCIENTIFIC_SURVEY"
    team_lead_id: int
    assigned_personnel_ids: List[int] = Field(default_factory=list)
    assigned_asset_ids: List[int] = Field(default_factory=list)
    assigned_cargo_ids: Optional[List[int]] = Field(default_factory=list)
    itinerary_tasks: Optional[List[str]] = Field(default_factory=list)
    start_time: datetime
    expected_return: datetime
    requires_permit: bool = False
    permit_id: Optional[int] = None


class PlanEvaluationCheckItem(BaseModel):
    category: str  # PERMIT, PERSONNEL, ASSET, ENVIRONMENT, CARGO, INVENTORY, RISK
    status: str    # PASS, WARNING, BLOCKED
    details: str


class PlanEvaluationResponse(BaseModel):
    overall_status: str  # PASS, WARNING, BLOCKED
    readiness_score: float = 100.0  # 0 to 100 scale
    risk_level: str = "LOW"         # LOW, MEDIUM, HIGH, CRITICAL
    checks: List[PlanEvaluationCheckItem]
    recommendations: List[str]
    evaluated_at: datetime
