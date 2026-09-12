from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.mission import Mission, MissionStatus, MissionRiskLevel
from app.models.tracking_event import TrackingEvent, TrackingEntityType


class RiskEngine:
    """
    Deterministic, explainable Polar Expedition Risk Evaluation Engine.
    Computes a normalized risk score (0 to 100) and risk level classification.
    """

    @staticmethod
    def evaluate_mission_risk(db: Session, mission_id: int) -> Dict[str, Any]:
        mission = db.query(Mission).filter(Mission.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} does not exist")

        now = datetime.now(timezone.utc)
        score = 15  # Base Antarctic operational risk baseline
        drivers: List[str] = []

        # 1. Mission Status Risk
        if mission.status == MissionStatus.ACTIVE:
            score += 10
            # Check overdue return
            expected = mission.expected_return
            if expected.tzinfo is None:
                expected = expected.replace(tzinfo=timezone.utc)
            if now > expected:
                overdue_hours = (now - expected).total_seconds() / 3600.0
                score += min(35, int(overdue_hours * 5) + 15)
                drivers.append(f"Mission is overdue by {round(overdue_hours, 1)} hours")
        elif mission.status == MissionStatus.DELAYED:
            score += 25
            drivers.append("Mission operational status is currently DELAYED")
        elif mission.status == MissionStatus.EMERGENCY:
            score += 55
            drivers.append("CRITICAL: Active emergency incident declared on traverse")

        # 2. Telemetry Telepresence & Health Check
        latest_telemetry = (
            db.query(TrackingEvent)
            .filter(
                TrackingEvent.entity_type == TrackingEntityType.MISSION,
                TrackingEvent.entity_id == mission.id,
            )
            .order_by(TrackingEvent.timestamp.desc())
            .first()
        )

        if latest_telemetry:
            t_time = latest_telemetry.timestamp
            if t_time.tzinfo is None:
                t_time = t_time.replace(tzinfo=timezone.utc)
            gap_minutes = (now - t_time).total_seconds() / 60.0

            # Signal gap
            if gap_minutes > 15:
                score += min(30, int(gap_minutes / 5) * 5)
                drivers.append(f"Telemetry signal blackout: {round(gap_minutes, 1)} mins elapsed without ping")
            elif gap_minutes < 5:
                score -= 5  # Recent healthy ping reduces uncertainty

            # Battery level
            if latest_telemetry.battery < 15.0:
                score += 25
                drivers.append(f"Critical battery depletion: {latest_telemetry.battery}% remaining")
            elif latest_telemetry.battery < 30.0:
                score += 12
                drivers.append(f"Low battery warning: {latest_telemetry.battery}% remaining")

            # Stationary in field
            if mission.status == MissionStatus.ACTIVE and latest_telemetry.speed == 0.0 and gap_minutes > 10:
                score += 10
                drivers.append("Traverse party stationary in crevasse/ice zone")
        elif mission.status == MissionStatus.ACTIVE:
            # Active mission with zero telemetry
            score += 20
            drivers.append("Active mission with no recorded GPS telemetry pings")

        # 3. Mission Type Inherent Hazard
        if mission.mission_type.value == "EMERGENCY_RESCUE":
            score += 20
            drivers.append("High-hazard emergency rescue sortie")
        elif mission.mission_type.value == "RECONNAISSANCE":
            score += 10

        # Bound score to [0, 100]
        final_score = max(5, min(100, score))

        # Risk Classification
        if final_score >= 80:
            level = MissionRiskLevel.CRITICAL
            action = "HALT TRAVERSE IMMEDIATELY. Dispatch support snowcat or emergency air beacon."
        elif final_score >= 60:
            level = MissionRiskLevel.HIGH
            action = "Require hourly satellite check-in and stage nearest rescue vehicle on standby."
        elif final_score >= 35:
            level = MissionRiskLevel.MEDIUM
            action = "Maintain regular radio schedule and monitor katabatic wind fronts."
        else:
            level = MissionRiskLevel.LOW
            action = "Normal operational parameters. Traverse nominal."

        return {
            "mission_id": mission.id,
            "mission_name": mission.mission_name,
            "risk_score": final_score,
            "risk_level": level.value,
            "key_drivers": drivers if drivers else ["Nominal Antarctic conditions"],
            "recommended_action": action,
            "evaluated_at": now.isoformat(),
        }
