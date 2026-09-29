import uuid
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
    InventoryTransferCreate,
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


@router.post("/transfers", response_model=InventoryTransferResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_transfer(
    transfer_in: InventoryTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """
    Execute an atomic inter-station inventory transfer.
    Deducts stock from origin station, adds stock to destination station,
    and records an immutable transfer ledger entry.
    """
    if transfer_in.from_station_id == transfer_in.to_station_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin and destination stations must be distinct",
        )
    if transfer_in.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer quantity must be greater than zero",
        )

    from_station = db.query(Station).filter(Station.id == transfer_in.from_station_id).first()
    if not from_station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Origin station #{transfer_in.from_station_id} does not exist",
        )

    to_station = db.query(Station).filter(Station.id == transfer_in.to_station_id).first()
    if not to_station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination station #{transfer_in.to_station_id} does not exist",
        )

    source_item = db.query(Inventory).filter(
        Inventory.id == transfer_in.item_id,
        Inventory.station_id == transfer_in.from_station_id,
    ).first()
    if not source_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item #{transfer_in.item_id} not found at origin station",
        )

    if source_item.quantity < transfer_in.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory quantity. Available: {source_item.quantity}, Requested: {transfer_in.quantity}",
        )

    # 1. Deduct from origin
    source_item.quantity -= transfer_in.quantity
    source_item.last_updated = datetime.now(timezone.utc)

    # 2. Add to destination
    dest_item = db.query(Inventory).filter(
        Inventory.station_id == transfer_in.to_station_id,
        Inventory.item_name == source_item.item_name,
        Inventory.category == source_item.category,
    ).first()

    if dest_item:
        dest_item.quantity += transfer_in.quantity
        dest_item.last_updated = datetime.now(timezone.utc)
    else:
        dest_item = Inventory(
            item_name=source_item.item_name,
            category=source_item.category,
            station_id=transfer_in.to_station_id,
            quantity=transfer_in.quantity,
            minimum_threshold=source_item.minimum_threshold,
            daily_consumption=source_item.daily_consumption,
            unit=source_item.unit,
            expiry_date=source_item.expiry_date,
            last_updated=datetime.now(timezone.utc),
        )
        db.add(dest_item)

    # 3. Create transfer ledger record
    transfer_code = f"TRF-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:6].upper()}"
    transfer_record = InventoryTransfer(
        transfer_code=transfer_code,
        item_name=source_item.item_name,
        quantity=transfer_in.quantity,
        unit=source_item.unit,
        from_location=from_station.name,
        to_location=to_station.name,
        status="COMPLETED",
        authorizing_officer=current_user.full_name or current_user.email,
        notes=transfer_in.notes,
    )
    db.add(transfer_record)
    db.commit()
    db.refresh(transfer_record)

    return InventoryTransferResponse(
        id=transfer_record.transfer_code,
        item=transfer_record.item_name,
        quantity=f"{transfer_record.quantity:,.0f} {transfer_record.unit}",
        from_location=transfer_record.from_location,
        to_location=transfer_record.to_location,
        status=transfer_record.status,
        timestamp=transfer_record.timestamp.strftime("%d %b %Y, %H:%M UTC") if transfer_record.timestamp else "Completed",
        officer=transfer_record.authorizing_officer,
        notes=transfer_record.notes,
    )


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
