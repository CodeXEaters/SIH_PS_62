from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.intelligence import (
    MissionRiskAssessmentResponse,
    CargoDelayPredictionResponse,
    AnomalyScanResponse,
    InventoryShortageForecastItem,
    WhatIfScenarioInput,
    WhatIfScenarioResult,
    AttentionItem,
)
from app.services.intelligence_service import IntelligenceService
from app.core.security import get_current_user

router = APIRouter()


@router.get("/risk/mission/{id}", response_model=MissionRiskAssessmentResponse)
def get_mission_risk_assessment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate multi-factor operational risk score for an expedition mission or traverse."""
    return IntelligenceService.get_mission_risk(db=db, mission_id=id)


@router.get("/delay/cargo/{id}", response_model=CargoDelayPredictionResponse)
@router.get("/cargo/{id}/delay-prediction", response_model=CargoDelayPredictionResponse)
def predict_cargo_delay(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict transit delay probability and estimated delay hours for a cargo package."""
    return IntelligenceService.predict_cargo_delay(db=db, cargo_id=id)


@router.post("/anomalies/scan", response_model=AnomalyScanResponse)
def scan_telemetry_anomalies(
    generate_alerts: bool = Query(True, description="Whether to automatically raise alerts for detected anomalies"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run real-time anomaly detection scan on active mission and transport telemetry streams."""
    return IntelligenceService.scan_anomalies(db=db, generate_alerts=generate_alerts)


@router.get("/forecast/inventory", response_model=List[InventoryShortageForecastItem])
def forecast_inventory_shortages(
    generate_alerts: bool = Query(False, description="Whether to generate critical shortage alerts"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Forecast consumption burn rate and days remaining for all polar base inventory stocks."""
    return IntelligenceService.forecast_inventory(db=db, generate_alerts=generate_alerts)


@router.post("/what-if", response_model=WhatIfScenarioResult)
def run_what_if_simulation(
    scenario: WhatIfScenarioInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run interactive operational simulation for multi-variable logistical disruptions."""
    return IntelligenceService.run_what_if_simulation(db=db, scenario_in=scenario)


@router.get("/attention", response_model=List[AttentionItem])
def get_attention_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve synthesized operational attention stream of critical alerts, anomalies, and shortages."""
    return IntelligenceService.get_attention_items(db=db)
