from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.database import get_db
from app.models.asset import Asset
from app.models.station import Station
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
)
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[AssetResponse])
def list_assets(
    station_id: Optional[int] = Query(None, description="Filter assets by station ID"),
    asset_type: Optional[str] = Query(None, description="Filter by asset type (e.g. VEHICLE, GENERATOR)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g. OPERATIONAL, MAINTENANCE_REQUIRED)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all expedition assets, with optional filtering."""
    query = db.query(Asset)
    if station_id is not None:
        query = query.filter(Asset.station_id == station_id)
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    return query.all()


@router.get("/maintenance-alerts", response_model=List[AssetResponse])
def get_maintenance_alerts(
    station_id: Optional[int] = Query(None, description="Filter maintenance alerts by station ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve assets needing immediate attention:
    - health_score < 60
    - status == 'MAINTENANCE_REQUIRED' or 'IN_REPAIR'
    - next_maintenance <= today
    """
    today = date.today()
    query = db.query(Asset).filter(
        or_(
            Asset.health_score < 60.0,
            Asset.status.in_(["MAINTENANCE_REQUIRED", "IN_REPAIR"]),
            Asset.next_maintenance <= today
        )
    )
    if station_id is not None:
        query = query.filter(Asset.station_id == station_id)
    return query.all()


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Register a new asset with its QR code identity."""
    station = db.query(Station).filter(Station.id == asset_in.station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {asset_in.station_id} does not exist"
        )

    existing_qr = db.query(Asset).filter(Asset.qr_code == asset_in.qr_code).first()
    if existing_qr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset with QR code '{asset_in.qr_code}' already exists"
        )

    asset = Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{id}", response_model=AssetResponse)
def get_asset(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve an asset by ID."""
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with id {id} not found"
        )
    return asset


@router.put("/{id}", response_model=AssetResponse)
def update_asset(
    id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Update asset specifications, status, health score, or maintenance records."""
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with id {id} not found"
        )

    update_data = asset_in.model_dump(exclude_unset=True)
    if "station_id" in update_data and update_data["station_id"] is not None:
        station = db.query(Station).filter(Station.id == update_data["station_id"]).first()
        if not station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station with id {update_data['station_id']} does not exist"
            )

    if "qr_code" in update_data and update_data["qr_code"] != asset.qr_code:
        existing_qr = db.query(Asset).filter(Asset.qr_code == update_data["qr_code"]).first()
        if existing_qr:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Asset with QR code '{update_data['qr_code']}' already exists"
            )

    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset
