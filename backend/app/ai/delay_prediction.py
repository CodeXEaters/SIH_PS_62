import math
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.cargo import Cargo, CargoStatus, CargoPriority
from app.models.cargo_event import CargoEvent, CargoEventType
from app.models.station import Station
from app.services.emergency_service import haversine_distance_km


class DelayPredictor:
    """
    Deterministic, explainable Cargo & Supply Chain Delay Prediction Engine.
    Estimates transit delay probability, delay duration, and actionable logistics recommendations.
    """

    @staticmethod
    def predict_cargo_delay(db: Session, cargo_id: int) -> Dict[str, Any]:
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise ValueError(f"Cargo {cargo_id} does not exist")

        now = datetime.now(timezone.utc)
        prob = 0.15  # Baseline polar logistics transit friction
        delay_hours = 0.0
        drivers: List[str] = []

        # 1. Status Factor
        if cargo.status == CargoStatus.DELAYED:
            prob += 0.65
            delay_hours += 24.0
            drivers.append("Cargo consignment currently marked as DELAYED in chain of custody")
        elif cargo.status == CargoStatus.IN_TRANSIT:
            prob += 0.15
            delay_hours += 4.0
            drivers.append("Consignment active on traverse/vessel leg")
        elif cargo.status == CargoStatus.DELIVERED:
            return {
                "cargo_id": cargo.id,
                "cargo_code": cargo.cargo_code,
                "delay_probability": 0.0,
                "estimated_delay_hours": 0.0,
                "key_drivers": ["Cargo has already been delivered successfully."],
                "recommendation": "Package safely archived at destination base.",
                "evaluated_at": now.isoformat(),
            }

        # 2. Inspect Chain-of-Custody Timeline Events
        delay_events = (
            db.query(CargoEvent)
            .filter(
                CargoEvent.cargo_id == cargo.id,
                CargoEvent.event_type == CargoEventType.DELAY_REPORTED,
            )
            .count()
        )
        if delay_events > 0:
            prob += 0.20 * delay_events
            delay_hours += 12.0 * delay_events
            drivers.append(f"{delay_events} formal delay reports logged in event timeline")

        # 3. Distance and Station Traverse Analysis
        origin = db.query(Station).filter(Station.id == cargo.origin_station_id).first()
        dest = db.query(Station).filter(Station.id == cargo.destination_station_id).first()

        if origin and dest:
            distance_km = haversine_distance_km(origin.latitude, origin.longitude, dest.latitude, dest.longitude)
            if distance_km > 2000:
                prob += 0.15
                delay_hours += 18.0
                drivers.append(f"Long-distance inter-continental transit corridor ({distance_km} km)")
            elif distance_km > 500:
                prob += 0.10
                delay_hours += 6.0
                drivers.append(f"Regional polar traverse route ({distance_km} km)")

        # 4. Cargo Weight and Priority Sensitivity
        if cargo.weight > 1000:
            prob += 0.10
            delay_hours += 4.0
            drivers.append(f"Heavy bulk cargo ({cargo.weight} kg) requires crane/groomer staging")

        # Bound probability to [0.05, 0.98]
        final_prob = round(max(0.05, min(0.98, prob)), 2)
        est_delay = round(max(0.0, delay_hours), 1)

        # Recommendation Generation
        if final_prob >= 0.70:
            recommendation = f"CRITICAL: Re-route container via Twin Otter air transport or pre-position buffer stock at {dest.name if dest else 'destination base'}."
        elif final_prob >= 0.40:
            recommendation = "ADVISORY: Prioritize cargo container loading on next daylight convoy departure window."
        else:
            recommendation = "Transit tracking within normal polar operational tolerance."

        return {
            "cargo_id": cargo.id,
            "cargo_code": cargo.cargo_code,
            "delay_probability": final_prob,
            "estimated_delay_hours": est_delay,
            "key_drivers": drivers if drivers else ["Normal transit cadence"],
            "recommendation": recommendation,
            "evaluated_at": now.isoformat(),
        }
