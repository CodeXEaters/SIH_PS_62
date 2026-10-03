import logging
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.station import Station
from app.models.alert import AlertType, AlertSeverity, AlertEntityType
from app.schemas.alert import AlertCreate
from app.services.alert_service import AlertService

logger = logging.getLogger("dhruv.inventory_forecast")


class InventoryForecaster:
    """
    Inventory Shortage Forecasting Engine.
    Consumes inventory quantity, daily consumption, and thresholds.
    Calculates days_remaining = quantity / daily_consumption.
    Generates alerts when days_remaining <= 14 as mandated by DATABASE_CONTRACT.md.
    """

    @staticmethod
    def forecast_shortages(db: Session, generate_alerts: bool = True) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        items = db.query(Inventory).all()
        results: List[Dict[str, Any]] = []

        for item in items:
            daily = item.daily_consumption if item.daily_consumption > 0 else 1.0
            days_left = round(item.quantity / daily, 1)
            is_critical = days_left <= 14.0 or item.quantity <= item.minimum_threshold

            stockout_date = None
            if days_left < 365:
                stockout_date = (now + timedelta(days=days_left)).strftime("%Y-%m-%d")

            station = db.query(Station).filter(Station.id == item.station_id).first()
            station_name = station.name if station else f"Station #{item.station_id}"

            if days_left <= 3.0:
                urgency = "IMMEDIATE"
                replenishment_recommendation = (
                    f"CRITICAL RESERVE: Expedite urgent airlift/transfer of at least "
                    f"{round(max(item.minimum_threshold * 2.0 - item.quantity, 10.0), 1)} {item.unit} to prevent station shutdown."
                )
            elif days_left <= 7.0:
                urgency = "HIGH"
                replenishment_recommendation = (
                    f"HIGH DEFICIT: Schedule resupply convoy for "
                    f"{round(max(item.minimum_threshold * 1.5 - item.quantity, 5.0), 1)} {item.unit} within 5 days."
                )
            elif days_left <= 14.0:
                urgency = "MODERATE"
                replenishment_recommendation = (
                    f"APPROACHING BUFFER: Allocate {round(max(item.minimum_threshold - item.quantity, 1.0), 1)} {item.unit} "
                    f"in next cargo manifest."
                )
            else:
                urgency = "NOMINAL"
                replenishment_recommendation = "Stock levels nominal. Daily burn-rate within seasonal profile."

            forecast_entry = {
                "inventory_id": item.id,
                "item_name": item.item_name,
                "category": item.category,
                "station_id": item.station_id,
                "station_name": station_name,
                "quantity": item.quantity,
                "daily_consumption": item.daily_consumption,
                "minimum_threshold": item.minimum_threshold,
                "days_remaining": days_left,
                "is_critical": is_critical,
                "projected_stockout_date": stockout_date,
                "urgency": urgency,
                "replenishment_recommendation": replenishment_recommendation,
            }
            results.append(forecast_entry)

            # Contractual Alert Generation Rule: days_remaining <= 14
            if generate_alerts and days_left <= 14.0:
                if days_left <= 3.0:
                    severity = AlertSeverity.CRITICAL
                elif days_left <= 7.0:
                    severity = AlertSeverity.HIGH
                else:
                    severity = AlertSeverity.MEDIUM
                AlertService.create_alert(
                    db=db,
                    alert_in=AlertCreate(
                        alert_type=AlertType.INVENTORY_SHORTAGE,
                        severity=severity,
                        title=f"CRITICAL SHORTAGE: {item.item_name}",
                        message=f"{item.item_name} at {station_name} has only {days_left} days remaining ({item.quantity} {item.unit} remaining). Projected exhaustion: {stockout_date}.",
                        entity_type=AlertEntityType.INVENTORY,
                        entity_id=item.id,
                        station_id=item.station_id,
                    ),
                )

        logger.info("Inventory forecast completed for %s items.", len(results))
        return results
