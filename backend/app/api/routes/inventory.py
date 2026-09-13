from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.inventory import Inventory
from app.models.inventory_transfer import InventoryTransfer
from app.models.station import Station
from app.models.user import User, UserRole
from app.schemas.inventory import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
    InventoryTransferResponse,
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


@router.get("/transfers", response_model=List[InventoryTransferResponse])
def list_inventory_transfers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all logged inter-station inventory transfers."""
    transfers = db.query(InventoryTransfer).order_by(InventoryTransfer.timestamp.desc()).all()
    results = []
    for trf in transfers:
        results.append(
            InventoryTransferResponse(
                id=trf.transfer_code,
                item=trf.item_name,
                quantity=f"{trf.quantity:,.0f} {trf.unit}",
                from_location=trf.from_location,
                to_location=trf.to_location,
                status=trf.status,
                timestamp=trf.timestamp.strftime("%d %b %Y, %H:%M UTC") if trf.timestamp else "Scheduled",
                officer=trf.authorizing_officer,
                notes=trf.notes,
            )
        )
    return results


@router.get("/{id}", response_model=InventoryResponse)
def get_inventory_item(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single inventory item by ID."""
    item = db.query(Inventory).filter(Inventory.id == id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with id {id} not found"
        )
    return item


@router.put("/{id}", response_model=InventoryResponse)
def update_inventory_item(
    id: int,
    item_in: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Update inventory item quantity, thresholds, or consumption."""
    item = db.query(Inventory).filter(Inventory.id == id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with id {id} not found"
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
