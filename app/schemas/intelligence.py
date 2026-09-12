from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MissionRiskAssessmentResponse(BaseModel):
    mission_id: int
    mission_name: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Composite polar risk score between 0 and 100")
    risk_level: str
    key_drivers: List[str]
    recommended_action: str
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CargoDelayPredictionResponse(BaseModel):
    cargo_id: int
    cargo_code: str
    delay_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of transit delay")
    estimated_delay_hours: float = Field(..., ge=0.0, description="Estimated delay duration in hours")
    key_drivers: List[str]
    recommendation: str
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalyItem(BaseModel):
    entity_type: str
    entity_id: int
    anomaly_type: str
    severity: str
    description: str
    detected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalyScanResponse(BaseModel):
    anomalies_detected: int
    alerts_generated: int
    anomalies: List[AnomalyItem]
    scanned_at: datetime


class InventoryShortageForecastItem(BaseModel):
    inventory_id: int
    item_name: str
    category: str
    station_id: int
    station_name: str
    quantity: float
    daily_consumption: float
    minimum_threshold: float
    days_remaining: float
    is_critical: bool
    projected_stockout_date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WhatIfScenarioInput(BaseModel):
    vessel_delay_days: int = Field(0, ge=0, description="Simulated cargo vessel arrival delay in days")
    aircraft_cancelled: bool = Field(False, description="Simulated cancellation of air transport bridge")
    fuel_consumption_spike_pct: float = Field(0.0, ge=0.0, le=300.0, description="Simulated percentage increase in generator/heater fuel burn")
    mission_traverse_extended_hours: float = Field(0.0, ge=0.0, description="Extended mission hours in blizzard/storm")
    station_transfer_delayed_days: int = Field(0, ge=0, description="Simulated inter-station transfer delay")


class WhatIfScenarioResult(BaseModel):
    bharati_fuel_days_remaining: float
    maitri_fuel_days_remaining: float
    cargo_delays_count: int
    critical_supply_stockouts: List[str]
    operational_risk_score: float = Field(..., ge=0.0, le=100.0)
    recommended_action: str


class AttentionItem(BaseModel):
    id: str
    title: str
    category: str
    severity: str
    reason: str
    location: str
    timestamp: datetime
    action_label: str
    action_url: str
    entity_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
