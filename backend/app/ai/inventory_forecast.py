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
            }
            results.append(forecast_entry)

            # Contractual Alert Generation Rule: days_remaining <= 14
            if generate_alerts and days_left <= 14.0:
                severity = AlertSeverity.CRITICAL if days_left <= 5.0 else AlertSeverity.HIGH
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
