from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class FeedbackDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ALTERNATIVE_SELECTED = "ALTERNATIVE_SELECTED"


class FeedbackOutcome(str, Enum):
    SUCCESSFUL = "SUCCESSFUL"
    MITIGATED = "MITIGATED"
    ESCALATED = "ESCALATED"
    PENDING_REVIEW = "PENDING_REVIEW"


class RecommendationFeedback(Base):
    __tablename__ = "recommendation_feedback"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String, index=True, nullable=False)  # e.g., "REC-EMG-102"
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    decision = Column(String, nullable=False, index=True)           # APPROVED, REJECTED, ALTERNATIVE_SELECTED
    reason = Column(Text, nullable=True)
    outcome = Column(String, nullable=True, default=FeedbackOutcome.SUCCESSFUL.value)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    operator = relationship("User")
