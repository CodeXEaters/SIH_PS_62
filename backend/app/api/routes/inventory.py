from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.inventory import Inventory
from app.models.station import Station
from app.models.user import User, UserRole
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
)
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[InventoryResponse])
def list_inventory(
    station_id: Optional[int] = Query(None, description="Filter inventory by station ID"),
    category: Optional[str] = Query(None, description="Filter inventory by category (e.g. FUEL, RATIONS)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all inventory items, optionally filtered by station_id or category."""
    query = db.query(Inventory)
    if station_id is not None:
        query = query.filter(Inventory.station_id == station_id)
    if category:
        query = query.filter(Inventory.category == category)
    return query.all()


@router.get("/low-stock", response_model=List[InventoryResponse])
def get_low_stock_inventory(
    station_id: Optional[int] = Query(None, description="Filter low-stock items by station ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve inventory items where quantity <= minimum_threshold.
    Integration requirement: Member 3 reads quantity, minimum_threshold, and daily_consumption
    directly from this endpoint for shortage forecasting.
    """
    query = db.query(Inventory).filter(Inventory.quantity <= Inventory.minimum_threshold)
    if station_id is not None:
        query = query.filter(Inventory.station_id == station_id)
    return query.all()


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_in: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Create a new inventory item."""
    station = db.query(Station).filter(Station.id == item_in.station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with id {item_in.station_id} does not exist"
        )

    item = Inventory(**item_in.model_dump())
    item.last_updated = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single inventory item by ID."""
    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with id {inventory_id} not found"
        )
    return item


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory_item(
    inventory_id: int,
    item_in: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Update inventory item quantity, thresholds, or consumption."""
    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with id {inventory_id} not found"
        )

    update_data = item_in.model_dump(exclude_unset=True)
    if "station_id" in update_data and update_data["station_id"] is not None:
        station = db.query(Station).filter(Station.id == update_data["station_id"]).first()
        if not station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station with id {update_data['station_id']} does not exist"
            )

    for field, value in update_data.items():
        setattr(item, field, value)

    item.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item
