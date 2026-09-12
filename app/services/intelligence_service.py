from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.ai.risk_engine import RiskEngine
from app.ai.delay_prediction import DelayPredictor
from app.ai.anomaly_detection import AnomalyDetector
from app.ai.inventory_forecast import InventoryForecaster
from app.ai.what_if import WhatIfSimulator
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.models.station import Station
from app.schemas.intelligence import (
    MissionRiskAssessmentResponse,
    CargoDelayPredictionResponse,
    AnomalyScanResponse,
    AnomalyItem,
    InventoryShortageForecastItem,
    WhatIfScenarioInput,
    WhatIfScenarioResult,
    AttentionItem,
)
from fastapi import HTTPException, status


class IntelligenceService:
    @staticmethod
    def get_mission_risk(db: Session, mission_id: int) -> MissionRiskAssessmentResponse:
        try:
            data = RiskEngine.evaluate_mission_risk(db=db, mission_id=mission_id)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        return MissionRiskAssessmentResponse(
            mission_id=data["mission_id"],
            mission_name=data["mission_name"],
            risk_score=data["risk_score"],
            risk_level=data["risk_level"],
            key_drivers=data["key_drivers"],
            recommended_action=data["recommended_action"],
            evaluated_at=datetime.fromisoformat(data["evaluated_at"]),
        )

    @staticmethod
    def predict_cargo_delay(db: Session, cargo_id: int) -> CargoDelayPredictionResponse:
        try:
            data = DelayPredictor.predict_cargo_delay(db=db, cargo_id=cargo_id)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        return CargoDelayPredictionResponse(
            cargo_id=data["cargo_id"],
            cargo_code=data["cargo_code"],
            delay_probability=data["delay_probability"],
            estimated_delay_hours=data["estimated_delay_hours"],
            key_drivers=data["key_drivers"],
            recommendation=data["recommendation"],
            evaluated_at=datetime.fromisoformat(data["evaluated_at"]),
        )

    @staticmethod
    def scan_anomalies(db: Session, generate_alerts: bool = True) -> AnomalyScanResponse:
        raw_anomalies = AnomalyDetector.scan_for_anomalies(db=db, generate_alerts=generate_alerts)
        now = datetime.now(timezone.utc)
        items = [
            AnomalyItem(
                entity_type=a["entity_type"],
                entity_id=a["entity_id"],
                anomaly_type=a["anomaly_type"],
                severity=a["severity"],
                description=a["description"],
                detected_at=datetime.fromisoformat(a["detected_at"]),
            )
            for a in raw_anomalies
        ]
        return AnomalyScanResponse(
            anomalies_detected=len(items),
            alerts_generated=len(items) if generate_alerts else 0,
            anomalies=items,
            scanned_at=now,
        )

    @staticmethod
    def forecast_inventory(db: Session, generate_alerts: bool = True) -> List[InventoryShortageForecastItem]:
        raw_forecasts = InventoryForecaster.forecast_shortages(db=db, generate_alerts=generate_alerts)
        return [
            InventoryShortageForecastItem(
                inventory_id=f["inventory_id"],
                item_name=f["item_name"],
                category=f["category"],
                station_id=f["station_id"],
                station_name=f["station_name"],
                quantity=f["quantity"],
                daily_consumption=f["daily_consumption"],
                minimum_threshold=f["minimum_threshold"],
                days_remaining=f["days_remaining"],
                is_critical=f["is_critical"],
                projected_stockout_date=f["projected_stockout_date"],
            )
            for f in raw_forecasts
        ]

    @staticmethod
    def run_what_if_simulation(db: Session, scenario_in: WhatIfScenarioInput) -> WhatIfScenarioResult:
        return WhatIfSimulator.simulate_scenario(db=db, scenario=scenario_in)

    @staticmethod
    def get_attention_items(db: Session) -> List[AttentionItem]:
        """
        Unified operational attention stream synthesizing active alerts,
        telemetry dropouts, and critical shortages into prioritized actionable items.
        """
        active_alerts = (
            db.query(Alert)
            .filter(Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]))
            .order_by(desc(Alert.created_at))
            .limit(20)
            .all()
        )

        attention_items: List[AttentionItem] = []
        for a in active_alerts:
            station_name = "Antarctica Sector"
            if a.station_id:
                s = db.query(Station).filter(Station.id == a.station_id).first()
                if s:
                    station_name = s.name

            category = "SYSTEM"
            if "BATTERY" in a.alert_type.value or "SIGNAL" in a.alert_type.value:
                category = "TELEMETRY"
            elif "INVENTORY" in a.alert_type.value:
                category = "INVENTORY"
            elif "WEATHER" in a.alert_type.value:
                category = "WEATHER"
            elif "CARGO" in a.alert_type.value:
                category = "CARGO"
            elif "MAINTENANCE" in a.alert_type.value:
                category = "ASSET"
            elif "EMERGENCY" in a.alert_type.value:
                category = "EMERGENCY"

            attention_items.append(
                AttentionItem(
                    id=f"attn-{a.id}",
                    title=a.title,
                    category=category,
                    severity=a.severity.value,
                    reason=a.message,
                    location=station_name,
                    timestamp=a.created_at,
                    action_label="Review Alert",
                    action_url=f"/alerts/{a.id}",
                    entity_id=str(a.entity_id) if a.entity_id else None,
                )
            )

        return attention_items
