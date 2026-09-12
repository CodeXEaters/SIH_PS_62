from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.cargo import Cargo
from app.models.inventory import Inventory
from app.models.mission import Mission, MissionStatus
from app.models.emergency import Emergency, EmergencyStatus
from app.models.asset import Asset
from app.schemas.reports import ReportSummaryResponse
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/summary", response_model=ReportSummaryResponse)
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real database-backed operational performance summary for project reports.
    """
    # 1. Total cargo weight tracked in metric tonnes
    total_kg = db.query(func.coalesce(func.sum(Cargo.weight), 0.0)).scalar() or 0.0
    tonnage = round(total_kg / 1000.0, 1)

    # 2. Critical supply minimum days remaining from inventory
    inv_items = db.query(Inventory).all()
    days_list = [
        item.quantity / item.daily_consumption
        for item in inv_items
        if item.daily_consumption and item.daily_consumption > 0
    ]
    min_supply_days = round(min(days_list), 1) if days_list else 0.0

    # 3. Total missions completed
    completed_missions = (
        db.query(func.count(Mission.id))
        .filter(Mission.status == MissionStatus.COMPLETED)
        .scalar()
        or 0
    )

    # 4. Active emergencies count
    active_emergencies = (
        db.query(func.count(Emergency.id))
        .filter(Emergency.status.in_([EmergencyStatus.OPEN, EmergencyStatus.DISPATCHED, EmergencyStatus.CONTAINED]))
        .scalar()
        or 0
    )

    # 5. Expedition readiness percentage based on asset health scores
    avg_asset_health = db.query(func.avg(Asset.health_score)).scalar()
    readiness = round(float(avg_asset_health), 1) if avg_asset_health is not None else 0.0

    # 6. Fuel reserve status derived from real inventory fuel stock
    fuel_items = db.query(Inventory).filter(Inventory.category == "FUEL").all()
    if fuel_items:
        total_fuel = sum(i.quantity for i in fuel_items)
        total_burn = sum(i.daily_consumption for i in fuel_items if i.daily_consumption)
        if total_burn > 0:
            fuel_rate = f"Derived: {round(total_fuel / total_burn, 1)} days reserve stock"
        else:
            fuel_rate = "Derived: Stable Cache"
    else:
        fuel_rate = "N/A (No fuel telemetry sensor)"

    return ReportSummaryResponse(
        expeditionReadinessPct=readiness,
        cargoTonnageTracked=tonnage,
        criticalSupplyDaysMin=min_supply_days,
        totalMissionsCompleted=completed_missions,
        activeIncidentsCount=active_emergencies,
        fuelEfficiencyRate=fuel_rate,
    )
