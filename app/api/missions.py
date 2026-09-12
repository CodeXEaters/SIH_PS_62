from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.mission import MissionType, MissionStatus, MissionRiskLevel
from app.models.user import User, UserRole
from app.schemas.mission import (
    MissionCreate,
    MissionUpdate,
    MissionStatusUpdate,
    MissionResponse,
)
from app.services.mission_service import MissionService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[MissionResponse])
def list_missions(
    status_filter: Optional[MissionStatus] = Query(None, alias="status", description="Filter by mission status"),
    mission_type: Optional[MissionType] = Query(None, description="Filter by mission type"),
    risk_level: Optional[MissionRiskLevel] = Query(None, description="Filter by risk level"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all missions with optional status, type, and risk filters."""
    return MissionService.list_missions(
        db=db,
        status_filter=status_filter,
        mission_type=mission_type,
        risk_level=risk_level,
    )


@router.post("", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
def create_mission(
    mission_in: MissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS)),
):
    """Register and schedule a new polar mission or traverse."""
    return MissionService.create_mission(db=db, mission_in=mission_in)


@router.get("/{id}", response_model=MissionResponse)
def get_mission(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single mission by ID."""
    return MissionService.get_mission_by_id(db=db, mission_id=id)


@router.put("/{id}", response_model=MissionResponse)
def update_mission(
    id: int,
    mission_in: MissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS)),
):
    """Update mission details."""
    return MissionService.update_mission(db=db, mission_id=id, mission_in=mission_in)


@router.patch("/{id}/status", response_model=MissionResponse)
def patch_mission_status(
    id: int,
    status_in: MissionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.FIELD_TEAM)),
):
    """Update mission lifecycle status and optional risk level."""
    return MissionService.patch_mission_status(db=db, mission_id=id, status_in=status_in)
