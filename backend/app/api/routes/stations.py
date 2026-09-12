from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.station import Station
from app.models.user import User, UserRole
from app.schemas.station import StationCreate, StationResponse
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[StationResponse])
def list_stations(
    type: Optional[str] = Query(None, description="Filter by station type (e.g. HQ, PERMANENT_STATION)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g. OPERATIONAL)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all stations, optionally filtered by type or status."""
    query = db.query(Station)
    if type:
        query = query.filter(Station.type == type)
    if status_filter:
        query = query.filter(Station.status == status_filter)
    return query.all()


@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(
    station_in: StationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS)),
):
    """Create a new station (Admin or Operations role required)."""
    existing = db.query(Station).filter(Station.name == station_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station with name '{station_in.name}' already exists"
        )
    station = Station(**station_in.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.get("/{station_id}", response_model=StationResponse)
def get_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single station by its ID."""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {station_id} not found"
        )
    return station
