from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.alert import AlertSeverity, AlertStatus, AlertType
from app.models.user import User, UserRole
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import AlertService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status_filter: Optional[AlertStatus] = Query(None, alias="status", description="Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED)"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    alert_type: Optional[AlertType] = Query(None, description="Filter by alert type"),
    station_id: Optional[int] = Query(None, description="Filter by associated polar station ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all alerts with optional status, severity, type, and station filters."""
    return AlertService.list_alerts(
        db=db,
        status_filter=status_filter,
        severity=severity,
        alert_type=alert_type,
        station_id=station_id,
        limit=limit,
        offset=offset,
    )


@router.get("/active", response_model=List[AlertResponse])
def get_active_alerts(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve active and unacknowledged alerts for real-time operational picture."""
    return AlertService.get_active_alerts(db=db, limit=limit)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Raise a new alert in the central alerts system."""
    return AlertService.create_alert(db=db, alert_in=alert_in)


@router.get("/{id}", response_model=AlertResponse)
def get_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve alert details by ID."""
    return AlertService.get_alert_by_id(db=db, alert_id=id)


@router.patch("/{id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Acknowledge an active alert by an authorized operator."""
    return AlertService.acknowledge_alert(db=db, alert_id=id, user_id=current_user.id)


@router.patch("/{id}/resolve", response_model=AlertResponse)
def resolve_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an alert as resolved."""
    return AlertService.resolve_alert(db=db, alert_id=id, user_id=current_user.id)


@router.patch("/{id}/dismiss", response_model=AlertResponse)
def dismiss_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dismiss an alert."""
    return AlertService.dismiss_alert(db=db, alert_id=id, user_id=current_user.id)
