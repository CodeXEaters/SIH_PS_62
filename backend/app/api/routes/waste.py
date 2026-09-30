from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.waste import (
    WasteRecordCreate,
    WasteRecordUpdate,
    WasteRecordResponse,
    WasteSummaryResponse,
)
from app.services.waste_service import WasteService

router = APIRouter()


@router.get("", response_model=List[WasteRecordResponse])
def list_waste_records(
    station_id: Optional[int] = Query(None, description="Filter by station ID"),
    category: Optional[str] = Query(None, description="Filter by waste category (GENERAL, HAZARDOUS, etc.)"),
    hazardous: Optional[bool] = Query(None, description="Filter by hazardous boolean"),
    status: Optional[str] = Query(None, description="Filter by waste lifecycle status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve environmental waste management logs under Antarctic Treaty Madrid Protocol."""
    return WasteService.list_records(
        db=db,
        station_id=station_id,
        category=category,
        hazardous=hazardous,
        status=status,
    )


@router.get("/summary", response_model=WasteSummaryResponse)
def get_waste_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve aggregate environmental waste and retrograde compliance metrics."""
    return WasteService.get_summary(db=db)


@router.post("", response_model=WasteRecordResponse, status_code=status.HTTP_201_CREATED)
def create_waste_record(
    payload: WasteRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log generation of waste with category, containment details, and disposal method."""
    return WasteService.create_record(db=db, payload=payload)


@router.get("/{id}", response_model=WasteRecordResponse)
def get_waste_record(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single waste tracking record."""
    record = WasteService.get_record(db=db, record_id=id)
    if not record:
        raise HTTPException(status_code=404, detail="Waste record not found")
    return record


@router.put("/{id}", response_model=WasteRecordResponse)
@router.patch("/{id}", response_model=WasteRecordResponse)
def update_waste_record(
    id: int,
    payload: WasteRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update waste containment, processing, or retrograde shipment status."""
    record = WasteService.update_record(db=db, record_id=id, payload=payload)
    if not record:
        raise HTTPException(status_code=404, detail="Waste record not found")
    return record
