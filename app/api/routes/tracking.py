from typing import List
from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.tracking_event import TrackingEntityType
from app.models.user import User, UserRole
from app.schemas.tracking import (
    TrackingEventCreate,
    TrackingEventResponse,
    LiveTrackingItem,
)
from app.services.tracking_service import TrackingService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.post("/update", response_model=TrackingEventResponse, status_code=status.HTTP_201_CREATED)
def record_tracking_update(
    event_in: TrackingEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS, UserRole.FIELD_TEAM)),
):
    """Ingests a telemetry GPS and operational data update."""
    return TrackingService.record_telemetry(db=db, event_in=event_in)


@router.get("/live", response_model=List[LiveTrackingItem])
def get_live_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the latest live tracking state for all active missions and transports."""
    return TrackingService.get_live_tracking(db=db)


@router.get("/{entity_type}/{entity_id}", response_model=List[TrackingEventResponse])
def get_entity_tracking_history(
    entity_type: TrackingEntityType = Path(..., description="Type of entity: MISSION or TRANSPORT"),
    entity_id: int = Path(..., description="ID of the entity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve chronological telemetry history for a specific mission or transport."""
    return TrackingService.get_entity_tracking(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
    )
