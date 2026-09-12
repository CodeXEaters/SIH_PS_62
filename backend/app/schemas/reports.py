from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


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
