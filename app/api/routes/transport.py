from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.transport import TransportType, TransportStatus
from app.models.user import User, UserRole
from app.schemas.transport import (
    TransportCreate,
    TransportUpdate,
    TransportResponse,
    TransportStatusResponse,
)
from app.services.transport_service import TransportService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[TransportResponse])
def list_transports(
    status_filter: Optional[TransportStatus] = Query(None, alias="status", description="Filter by transport status"),
    type_filter: Optional[TransportType] = Query(None, alias="type", description="Filter by transport type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all transports with optional status and type filters."""
    return TransportService.list_transports(
        db=db,
        status_filter=status_filter,
        type_filter=type_filter,
    )


@router.post("", response_model=TransportResponse, status_code=status.HTTP_201_CREATED)
def create_transport(
    transport_in: TransportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Register a new polar transport vehicle/vessel."""
    return TransportService.create_transport(db=db, transport_in=transport_in)


@router.get("/{id}", response_model=TransportResponse)
def get_transport(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single transport by ID."""
    return TransportService.get_transport_by_id(db=db, transport_id=id)


@router.put("/{id}", response_model=TransportResponse)
def update_transport(
    id: int,
    transport_in: TransportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS)),
):
    """Update transport details."""
    return TransportService.update_transport(db=db, transport_id=id, transport_in=transport_in)


@router.get("/{id}/status", response_model=TransportStatusResponse)
def get_transport_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve fast operational status of a transport."""
    return TransportService.get_transport_status(db=db, transport_id=id)
