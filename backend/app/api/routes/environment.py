from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.environment import (
    EnvironmentalObservationCreate,
    EnvironmentalObservationResponse,
    EnvironmentalRiskResponse,
    EnvironmentalForecastItem,
)
from app.schemas.alert import AlertResponse
from app.services.environment_service import EnvironmentService

router = APIRouter()


@router.get("/current", response_model=List[EnvironmentalObservationResponse])
def get_current_environment(
    station_id: Optional[int] = Query(None, description="Optional station ID to filter current observation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the latest environmental and cryospheric observations across polar stations."""
    if station_id:
        obs = EnvironmentService.get_or_generate_latest(db, station_id)
        return [obs]
    return EnvironmentService.get_all_current(db)


@router.get("/history", response_model=List[EnvironmentalObservationResponse])
def get_environment_history(
    station_id: int = Query(..., description="Station ID to fetch chronological records for"),
    limit: int = Query(50, ge=1, le=200, description="Max observations to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical meteorological and sea-ice observations for trend analysis."""
    return EnvironmentService.get_history(db=db, station_id=station_id, limit=limit)


@router.post("/observations", response_model=EnvironmentalObservationResponse, status_code=status.HTTP_201_CREATED)
def record_observation(
    payload: EnvironmentalObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ingest a new environmental observation and trigger hazard alerts if thresholds exceeded."""
    return EnvironmentService.record_observation(db=db, payload=payload)


@router.get("/risk", response_model=EnvironmentalRiskResponse)
def get_environmental_risk(
    station_id: Optional[int] = Query(None, description="Station ID to evaluate environmental risk for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate deterministic environmental risk score (0-100), hazard factors, and mitigations."""
    return EnvironmentService.get_risk(db=db, station_id=station_id)


@router.get("/forecast", response_model=List[EnvironmentalForecastItem])
def get_environmental_forecast(
    station_id: int = Query(1, description="Station ID to fetch weather and ice forecast for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve 24-hour weather and sea-ice forecast projection."""
    return EnvironmentService.get_forecast(db=db, station_id=station_id)


@router.get("/alerts", response_model=List[AlertResponse])
def get_environmental_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve active meteorological and cryospheric hazard alerts."""
    return EnvironmentService.get_environmental_alerts(db)
