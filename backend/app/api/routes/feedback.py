from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackSummaryResponse
from app.services.feedback_service import FeedbackService

router = APIRouter()


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def record_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record human operator acceptance, rejection, or alternative selection for an AI recommendation."""
    return FeedbackService.record_feedback(db=db, operator_id=current_user.id, payload=payload)


@router.get("", response_model=List[FeedbackResponse])
def list_feedback(
    recommendation_id: Optional[str] = Query(None, description="Filter by recommendation ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve operational recommendation decision audit trail."""
    return FeedbackService.list_feedback(db=db, recommendation_id=recommendation_id, limit=limit)


@router.get("/summary", response_model=FeedbackSummaryResponse)
def get_feedback_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregate decision metrics and acceptance rates for system learning."""
    return FeedbackService.get_summary(db=db)
