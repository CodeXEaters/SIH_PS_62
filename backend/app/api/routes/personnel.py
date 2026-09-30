from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.personnel import Personnel
from app.models.station import Station
from app.models.user import User, UserRole
from app.schemas.personnel import (
    PersonnelCreate,
    PersonnelUpdate,
    PersonnelStatusUpdate,
    PersonnelReadinessUpdate,
    PersonnelReadinessSummary,
    PersonnelResponse,
)
from app.core.security import get_current_user, require_roles
from app.services.personnel_service import PersonnelService

router = APIRouter()


@router.get("", response_model=List[PersonnelResponse])
def list_personnel(
    station_id: Optional[int] = Query(None, description="Filter personnel by station ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g. ACTIVE, ON_MISSION)"),
    team: Optional[str] = Query(None, description="Filter by team"),
    readiness: Optional[str] = Query(None, description="Filter by readiness status (READY, LIMITED, NOT_READY, CLEARANCE_EXPIRED)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all personnel, optionally filtered by station_id, status, team, or readiness."""
    query = db.query(Personnel)
    if station_id is not None:
        query = query.filter(Personnel.station_id == station_id)
    if status_filter:
        query = query.filter(Personnel.status == status_filter)
    if team:
        query = query.filter(Personnel.team == team)
    if readiness:
        query = query.filter(Personnel.readiness_status == readiness.upper())

    results = query.all()
    for p in results:
        PersonnelService.evaluate_readiness(p, db)
    return results


@router.get("/readiness/summary", response_model=PersonnelReadinessSummary)
def get_readiness_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregate personnel readiness and medical clearance statistics."""
    return PersonnelService.get_readiness_summary(db)


@router.get("/readiness", response_model=List[PersonnelResponse])
def get_personnel_readiness(
    station_id: Optional[int] = Query(None, description="Filter personnel by station ID"),
    status: Optional[str] = Query(None, description="Filter by readiness status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve personnel readiness records."""
    query = db.query(Personnel)
    if station_id is not None:
        query = query.filter(Personnel.station_id == station_id)
    if status:
        query = query.filter(Personnel.readiness_status == status.upper())
    results = query.all()
    for p in results:
        PersonnelService.evaluate_readiness(p, db)
    return results


@router.post("", response_model=PersonnelResponse, status_code=status.HTTP_201_CREATED)
def create_personnel(
    personnel_in: PersonnelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.STATION_MANAGER)),
):
    """Create a new personnel record with health clearance and readiness parameters."""
    station = db.query(Station).filter(Station.id == personnel_in.station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {personnel_in.station_id} does not exist",
        )
    if personnel_in.user_id:
        user_exists = db.query(User).filter(User.id == personnel_in.user_id).first()
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {personnel_in.user_id} does not exist",
            )

    personnel = Personnel(**personnel_in.model_dump())
    if not personnel.last_check_in:
        personnel.last_check_in = datetime.now(timezone.utc)
    db.add(personnel)
    db.commit()
    db.refresh(personnel)
    PersonnelService.evaluate_readiness(personnel, db)
    return personnel


@router.get("/{id}", response_model=PersonnelResponse)
def get_personnel(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single personnel by ID with live readiness calculation."""
    personnel = db.query(Personnel).filter(Personnel.id == id).first()
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with id {id} not found",
        )
    PersonnelService.evaluate_readiness(personnel, db)
    return personnel


@router.put("/{id}", response_model=PersonnelResponse)
@router.patch("/{id}", response_model=PersonnelResponse)
def update_personnel(
    id: int,
    personnel_in: PersonnelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.STATION_MANAGER)),
):
    """Update personnel details and re-evaluate readiness."""
    personnel = db.query(Personnel).filter(Personnel.id == id).first()
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with id {id} not found",
        )

    update_data = personnel_in.model_dump(exclude_unset=True)
    if "station_id" in update_data and update_data["station_id"] is not None:
        station = db.query(Station).filter(Station.id == update_data["station_id"]).first()
        if not station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station with id {update_data['station_id']} does not exist",
            )

    for field, value in update_data.items():
        setattr(personnel, field, value)

    PersonnelService.evaluate_readiness(personnel)
    db.commit()
    db.refresh(personnel)
    return personnel


@router.patch("/{id}/status", response_model=PersonnelResponse)
def patch_personnel_status(
    id: int,
    status_in: PersonnelStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update personnel operational status (e.g. ACTIVE, ON_MISSION, REST)."""
    personnel = db.query(Personnel).filter(Personnel.id == id).first()
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with id {id} not found",
        )

    personnel.status = status_in.status
    personnel.last_check_in = datetime.now(timezone.utc)
    db.commit()
    db.refresh(personnel)
    return personnel


@router.patch("/{id}/readiness", response_model=PersonnelResponse)
def patch_personnel_readiness(
    id: int,
    readiness_in: PersonnelReadinessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.STATION_MANAGER)),
):
    """Mutate medical clearance and operational readiness status."""
    personnel = PersonnelService.update_readiness(db=db, personnel_id=id, payload=readiness_in)
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel with id {id} not found",
        )
    return personnel
