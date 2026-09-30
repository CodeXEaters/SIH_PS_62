from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.recommendation_feedback import RecommendationFeedback, FeedbackDecision, FeedbackOutcome
from app.schemas.feedback import FeedbackCreate, FeedbackSummaryResponse, FeedbackResponse


class FeedbackService:
    @classmethod
    def record_feedback(cls, db: Session, operator_id: Optional[int], payload: FeedbackCreate) -> RecommendationFeedback:
        feedback = RecommendationFeedback(
            recommendation_id=payload.recommendation_id,
            operator_id=operator_id,
            decision=payload.decision.value,
            reason=payload.reason,
            outcome=payload.outcome.value if payload.outcome else FeedbackOutcome.SUCCESSFUL.value,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback

    @classmethod
    def list_feedback(
        cls, db: Session, recommendation_id: Optional[str] = None, limit: int = 50
    ) -> List[RecommendationFeedback]:
        query = db.query(RecommendationFeedback)
        if recommendation_id:
            query = query.filter(RecommendationFeedback.recommendation_id == recommendation_id)
        return query.order_by(desc(RecommendationFeedback.timestamp)).limit(limit).all()

    @classmethod
    def get_summary(cls, db: Session) -> FeedbackSummaryResponse:
        records = db.query(RecommendationFeedback).order_by(desc(RecommendationFeedback.timestamp)).all()
        total = len(records)
        approved = sum(1 for r in records if r.decision == FeedbackDecision.APPROVED.value)
        rejected = sum(1 for r in records if r.decision == FeedbackDecision.REJECTED.value)
        alternative = sum(1 for r in records if r.decision == FeedbackDecision.ALTERNATIVE_SELECTED.value)

        rate = round((approved / total * 100.0), 1) if total > 0 else 100.0

        return FeedbackSummaryResponse(
            total_decisions=total,
            approved_count=approved,
            rejected_count=rejected,
            alternative_count=alternative,
            acceptance_rate_percent=rate,
            recent_audit_log=[FeedbackResponse.model_validate(r) for r in records[:10]],
        )
