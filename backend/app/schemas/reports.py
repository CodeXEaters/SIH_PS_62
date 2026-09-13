from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class ReportSummaryResponse(BaseModel):
    expedition_readiness_pct: float = Field(..., validation_alias="expeditionReadinessPct", serialization_alias="expeditionReadinessPct")
    cargo_tonnage_tracked: float = Field(..., validation_alias="cargoTonnageTracked", serialization_alias="cargoTonnageTracked")
    critical_supply_days_min: float = Field(..., validation_alias="criticalSupplyDaysMin", serialization_alias="criticalSupplyDaysMin")
    total_missions_completed: int = Field(..., validation_alias="totalMissionsCompleted", serialization_alias="totalMissionsCompleted")
    active_incidents_count: int = Field(..., validation_alias="activeIncidentsCount", serialization_alias="activeIncidentsCount")
    fuel_efficiency_rate: str = Field(..., validation_alias="fuelEfficiencyRate", serialization_alias="fuelEfficiencyRate")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class MonthlyCargoChartItem(BaseModel):
    month: str
    dispatched: float
    received: float


class FuelConsumptionChartItem(BaseModel):
    week: str
    maitri: float
    bharati: float


class AssetHealthChartItem(BaseModel):
    name: str
    score: float
    total: int
    operational: int


class ReportChartsResponse(BaseModel):
    monthly_cargo_data: List[MonthlyCargoChartItem] = Field(..., validation_alias="monthlyCargoData", serialization_alias="monthlyCargoData")
    fuel_consumption_data: List[FuelConsumptionChartItem] = Field(..., validation_alias="fuelConsumptionData", serialization_alias="fuelConsumptionData")
    asset_health_data: List[AssetHealthChartItem] = Field(..., validation_alias="assetHealthData", serialization_alias="assetHealthData")
    total_delivered_tonnes: float = Field(..., validation_alias="totalDeliveredTonnes", serialization_alias="totalDeliveredTonnes")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )
