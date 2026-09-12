from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.emergency import EmergencySeverity, EmergencyStatus, EmergencyType
from app.models.user import User, UserRole
from app.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdate,
    EmergencyDecisionRequest,
    EmergencyStatusUpdate,
    EmergencyResponse,
)
from app.services.emergency_service import EmergencyService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[EmergencyResponse])
def list_emergencies(
    status_filter: Optional[EmergencyStatus] = Query(None, alias="status", description="Filter by emergency status"),
    emergency_type: Optional[EmergencyType] = Query(None, description="Filter by emergency type"),
    severity: Optional[EmergencySeverity] = Query(None, description="Filter by severity level"),
    station_id: Optional[int] = Query(None, description="Filter by polar station ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all emergency incident records."""
    return EmergencyService.list_emergencies(
        db=db,
        status_filter=status_filter,
        emergency_type=emergency_type,
        severity=severity,
        station_id=station_id,
        limit=limit,
        offset=offset,
    )


@router.get("/active", response_model=Optional[EmergencyResponse])
def get_active_emergency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve current highest-priority active emergency incident for emergency command console."""
    return EmergencyService.get_active_emergency(db=db)


@router.post("", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
def create_emergency(
    emergency_in: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Declare a new emergency incident. Automatically triggers rescue route optimization and raises critical alerts."""
    return EmergencyService.create_emergency(db=db, emergency_in=emergency_in, reporter_id=current_user.id)


@router.get("/{id}", response_model=EmergencyResponse)
def get_emergency(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details of a specific emergency incident."""
    return EmergencyService.get_emergency_by_id(db=db, emergency_id=id)


@router.put("/{id}", response_model=EmergencyResponse)
def update_emergency(
    id: int,
    emergency_in: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.STATION_MANAGER, UserRole.MEDICAL)),
):
    """Update emergency incident details and containment notes."""
    return EmergencyService.update_emergency(db=db, emergency_id=id, emergency_in=emergency_in)


@router.post("/{id}/decision", response_model=EmergencyResponse)
def update_emergency_decision(
    id: int,
    decision_in: EmergencyDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.STATION_MANAGER)),
):
    """Human-in-the-loop operational decision: Approve, modify, or reject AI-recommended rescue dispatch."""
    return EmergencyService.update_decision(db=db, emergency_id=id, decision_in=decision_in, user_id=current_user.id)
