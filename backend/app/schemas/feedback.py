from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.recommendation_feedback import FeedbackDecision, FeedbackOutcome


class FeedbackCreate(BaseModel):
    recommendation_id: str = Field(..., description="ID or reference of the AI recommendation")
    decision: FeedbackDecision = Field(..., description="Human operator decision")
    reason: Optional[str] = Field(None, description="Operational justification or rationale")
    outcome: Optional[FeedbackOutcome] = Field(default=FeedbackOutcome.SUCCESSFUL)


class FeedbackResponse(BaseModel):
    id: int
    recommendation_id: str
    operator_id: Optional[int] = None
    decision: str
    reason: Optional[str] = None
    outcome: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackSummaryResponse(BaseModel):
    total_decisions: int
    approved_count: int
    rejected_count: int
    alternative_count: int
    acceptance_rate_percent: float
    recent_audit_log: list[FeedbackResponse]
