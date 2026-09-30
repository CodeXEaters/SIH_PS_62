from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.permit import (
    PermitCreate,
    PermitUpdate,
    PermitStatusUpdate,
    PermitResponse,
    PermitSummaryResponse,
)
from app.services.permit_service import PermitService

router = APIRouter()


@router.get("", response_model=List[PermitResponse])
def list_permits(
    status: Optional[str] = Query(None, description="Filter by permit status (APPROVED, EXPIRING, EXPIRED, etc.)"),
    station_id: Optional[int] = Query(None, description="Filter by station ID"),
    permit_type: Optional[str] = Query(None, description="Filter by permit type"),
    expedition_id: Optional[str] = Query(None, description="Filter by expedition ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all permits with optional filtering by status, station, or type."""
    return PermitService.list_permits(
        db=db,
        status=status,
        station_id=station_id,
        permit_type=permit_type,
        expedition_id=expedition_id,
    )


@router.get("/expiring", response_model=List[PermitResponse])
def get_expiring_permits(
    days: int = Query(30, description="Window in days to check for impending expiry"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve permits that are currently expired or expiring within the specified window."""
    return PermitService.get_expiring_permits(db=db, days_ahead=days)


@router.get("/summary", response_model=PermitSummaryResponse)
def get_permit_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve compliance summary statistics for all permits."""
    return PermitService.get_permit_summary(db=db)


@router.post("", response_model=PermitResponse, status_code=status.HTTP_201_CREATED)
def create_permit(
    payload: PermitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new permit and evaluate compliance thresholds."""
    return PermitService.create_permit(db=db, payload=payload)


@router.get("/{id}", response_model=PermitResponse)
def get_permit_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details of a single permit by ID."""
    permit = PermitService.get_permit(db=db, permit_id=id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    return permit


@router.put("/{id}", response_model=PermitResponse)
@router.patch("/{id}", response_model=PermitResponse)
def update_permit(
    id: int,
    payload: PermitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update permit details and re-evaluate compliance status."""
    permit = PermitService.update_permit(db=db, permit_id=id, payload=payload)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    return permit


@router.patch("/{id}/status", response_model=PermitResponse)
def update_permit_status(
    id: int,
    payload: PermitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mutate permit status (e.g. SUSPENDED, APPROVED) with mandatory audit notes."""
    permit = PermitService.update_permit_status(db=db, permit_id=id, payload=payload)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    return permit
