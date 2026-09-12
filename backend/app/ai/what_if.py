import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.cargo import Cargo, CargoStatus
from app.schemas.intelligence import WhatIfScenarioInput, WhatIfScenarioResult


class WhatIfSimulator:
    """
    Simulates operational consequences of multi-variable polar expedition disruptions:
    - Cargo vessel delay
    - Aircraft flight cancellation
    - Extreme weather generator fuel burn spikes
    - Traverse mission duration extension
    """

    @staticmethod
    def simulate_scenario(db: Session, scenario: WhatIfScenarioInput) -> WhatIfScenarioResult:
        # 1. Base Fuel Calculation from actual inventory
        bharati_fuel = (
            db.query(Inventory)
            .filter(Inventory.category == "FUEL", Inventory.item_name.ilike("%Bharati%"))
            .first()
        )
        maitri_fuel = (
            db.query(Inventory)
            .filter(Inventory.category == "FUEL", Inventory.item_name.ilike("%Maitri%"))
            .first()
        )

        base_bharati_qty = bharati_fuel.quantity if bharati_fuel else 1240.0
        base_bharati_burn = (bharati_fuel.daily_consumption if bharati_fuel else 180.0) * (
            1.0 + (scenario.fuel_consumption_spike_pct / 100.0)
        )
        updated_bharati_days = max(0.0, round(base_bharati_qty / base_bharati_burn, 1))

        base_maitri_qty = maitri_fuel.quantity if maitri_fuel else 8200.0
        base_maitri_burn = (maitri_fuel.daily_consumption if maitri_fuel else 350.0) * (
            1.0 + (scenario.fuel_consumption_spike_pct / 100.0)
        )
        updated_maitri_days = max(0.0, round(base_maitri_qty / base_maitri_burn, 1))

        # 2. Cargo Delays Calculation
        base_delays = db.query(Cargo).filter(Cargo.status.in_([CargoStatus.DELAYED, CargoStatus.IN_TRANSIT])).count()
        delay_count = base_delays
        if scenario.vessel_delay_days > 0:
            delay_count += int(math.ceil(scenario.vessel_delay_days * 1.5))
        if scenario.aircraft_cancelled:
            delay_count += 3

        # 3. Stockout Risk Identification
        stockouts: List[str] = []
        if updated_bharati_days < 7.0:
            stockouts.append("Bharati Station Emergency Polar Diesel")
        if updated_maitri_days < 10.0:
            stockouts.append("Maitri Generator Fuel Depot")
        if scenario.aircraft_cancelled:
            stockouts.append("Critical Medical Plasma Buffer")
        if scenario.vessel_delay_days >= 4:
            stockouts.append("Fresh Cryo-Reagents for Atmospheric Lab")

        # 4. Operational Risk Score (0 - 100)
        risk = 45.0
        risk += scenario.vessel_delay_days * 5.0
        if scenario.aircraft_cancelled:
            risk += 18.0
        risk += min(25.0, scenario.fuel_consumption_spike_pct * 0.35)
        risk += min(20.0, scenario.mission_traverse_extended_hours * 0.75)
        risk += scenario.station_transfer_delayed_days * 3.0

        final_risk = round(max(10.0, min(99.0, risk)), 1)

        # 5. Strategic Recommendation
        if final_risk >= 75.0:
            rec = "CRITICAL ADVISORY: Immediately shed non-essential heating loads at Bharati Station. Re-task available Snowcats to haul auxiliary fuel bladders from coastal staging cache."
        elif final_risk >= 50.0:
            rec = "WARNING: Prioritize maritime fuel hose discharge over standard dry cargo container unloads on next calm weather window."
        else:
            rec = "Nominal expedition resilience. Maintain planned logistical cadence."

        return WhatIfScenarioResult(
            bharati_fuel_days_remaining=updated_bharati_days,
            maitri_fuel_days_remaining=updated_maitri_days,
            cargo_delays_count=delay_count,
            critical_supply_stockouts=stockouts,
            operational_risk_score=final_risk,
            recommended_action=rec,
        )
