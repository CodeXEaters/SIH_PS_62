from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.cargo import CargoCategory, CargoPriority, CargoStatus
from app.models.user import User, UserRole
from app.schemas.cargo import (
    CargoCreate,
    CargoUpdate,
    CargoStatusUpdate,
    CargoResponse,
)
from app.services.cargo_service import CargoService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[CargoResponse])
def list_cargo(
    status_filter: Optional[CargoStatus] = Query(None, alias="status", description="Filter by cargo status"),
    priority: Optional[CargoPriority] = Query(None, description="Filter by priority level"),
    category: Optional[CargoCategory] = Query(None, description="Filter by cargo category"),
    origin_station_id: Optional[int] = Query(None, description="Filter by origin station ID"),
    destination_station_id: Optional[int] = Query(None, description="Filter by destination station ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all cargo packages with optional filters."""
    return CargoService.list_cargo(
        db=db,
        status_filter=status_filter,
        priority=priority,
        category=category,
        origin_station_id=origin_station_id,
        destination_station_id=destination_station_id,
    )


@router.post("", response_model=CargoResponse, status_code=status.HTTP_201_CREATED)
def create_cargo(
    cargo_in: CargoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Register a new cargo package. Auto-generates unique cargo code and QR identity."""
    return CargoService.create_cargo(db=db, cargo_in=cargo_in)


@router.get("/{id}", response_model=CargoResponse)
def get_cargo(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single cargo package by ID."""
    return CargoService.get_cargo_by_id(db=db, cargo_id=id)


@router.put("/{id}", response_model=CargoResponse)
def update_cargo(
    id: int,
    cargo_in: CargoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Update cargo package details."""
    return CargoService.update_cargo(db=db, cargo_id=id, cargo_in=cargo_in)


@router.patch("/{id}/status", response_model=CargoResponse)
def patch_cargo_status(
    id: int,
    status_in: CargoStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS, UserRole.FIELD_TEAM)),
):
    """Advance cargo package along the logistics lifecycle with state validation."""
    return CargoService.update_cargo_status(db=db, cargo_id=id, status_in=status_in)
