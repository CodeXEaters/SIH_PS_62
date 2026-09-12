import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.tracking_event import TrackingEvent, TrackingEntityType
from app.models.mission import Mission, MissionStatus
from app.models.transport import Transport, TransportStatus
from app.models.alert import AlertType, AlertSeverity, AlertEntityType
from app.schemas.alert import AlertCreate
from app.services.alert_service import AlertService
from app.services.emergency_service import haversine_distance_km

logger = logging.getLogger("dhruv.anomaly")


class AnomalyDetector:
    """
    Deterministic Polar Telemetry Anomaly Detection Engine.
    Identifies signal dropouts, severe battery depletion, physical velocity violations,
    and unexplained field stoppages. Automatically raises deduplicated system alerts.
    """

    @staticmethod
    def scan_for_anomalies(db: Session, generate_alerts: bool = True) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        anomalies: List[Dict[str, Any]] = []

        # 1. Scan Active Missions
        active_missions = (
            db.query(Mission)
            .filter(Mission.status.in_([MissionStatus.ACTIVE, MissionStatus.DELAYED]))
            .all()
        )
        for m in active_missions:
            latest = (
                db.query(TrackingEvent)
                .filter(
                    TrackingEvent.entity_type == TrackingEntityType.MISSION,
                    TrackingEvent.entity_id == m.id,
                )
                .order_by(TrackingEvent.timestamp.desc())
                .first()
            )
            if latest:
                t_time = latest.timestamp
                if t_time.tzinfo is None:
                    t_time = t_time.replace(tzinfo=timezone.utc)
                gap_sec = (now - t_time).total_seconds()

                # Rule 1: Signal Lost (> 15 minutes)
                if gap_sec > 900:
                    anom = {
                        "entity_type": "MISSION",
                        "entity_id": m.id,
                        "anomaly_type": "SIGNAL_LOST",
                        "severity": "CRITICAL" if gap_sec > 3600 else "HIGH",
                        "description": f"Telemetry blackout for Mission '{m.mission_name}': {round(gap_sec / 60.0, 1)} minutes elapsed since last position fix.",
                        "detected_at": now.isoformat(),
                    }
                    anomalies.append(anom)
                    if generate_alerts:
                        AlertService.create_alert(
                            db=db,
                            alert_in=AlertCreate(
                                alert_type=AlertType.SIGNAL_LOST,
                                severity=AlertSeverity.CRITICAL if gap_sec > 3600 else AlertSeverity.HIGH,
                                title=f"SIGNAL LOST: {m.mission_name}",
                                message=anom["description"],
                                entity_type=AlertEntityType.MISSION,
                                entity_id=m.id,
                                station_id=m.origin_station_id,
                            ),
                        )

                # Rule 2: Low Battery (< 20.0%)
                if latest.battery < 20.0:
                    anom = {
                        "entity_type": "MISSION",
                        "entity_id": m.id,
                        "anomaly_type": "LOW_BATTERY",
                        "severity": "CRITICAL" if latest.battery < 10.0 else "MEDIUM",
                        "description": f"Expedition comms battery at {latest.battery}% on Mission '{m.mission_name}'.",
                        "detected_at": now.isoformat(),
                    }
                    anomalies.append(anom)
                    if generate_alerts:
                        AlertService.create_alert(
                            db=db,
                            alert_in=AlertCreate(
                                alert_type=AlertType.LOW_BATTERY,
                                severity=AlertSeverity.CRITICAL if latest.battery < 10.0 else AlertSeverity.MEDIUM,
                                title=f"LOW BATTERY: {m.mission_name}",
                                message=anom["description"],
                                entity_type=AlertEntityType.MISSION,
                                entity_id=m.id,
                                station_id=m.origin_station_id,
                            ),
                        )

        # 2. Scan In-Transit Transports
        active_transports = (
            db.query(Transport)
            .filter(Transport.status == TransportStatus.IN_TRANSIT)
            .all()
        )
        for t in active_transports:
            recent_pings = (
                db.query(TrackingEvent)
                .filter(
                    TrackingEvent.entity_type == TrackingEntityType.TRANSPORT,
                    TrackingEvent.entity_id == t.id,
                )
                .order_by(TrackingEvent.timestamp.desc())
                .limit(2)
                .all()
            )
            if len(recent_pings) >= 1:
                latest = recent_pings[0]
                t_time = latest.timestamp
                if t_time.tzinfo is None:
                    t_time = t_time.replace(tzinfo=timezone.utc)
                gap_sec = (now - t_time).total_seconds()

                if gap_sec > 900:
                    anom = {
                        "entity_type": "TRANSPORT",
                        "entity_id": t.id,
                        "anomaly_type": "SIGNAL_LOST",
                        "severity": "HIGH",
                        "description": f"Transport '{t.transport_name}' lost telemetry contact {round(gap_sec / 60.0, 1)} minutes ago.",
                        "detected_at": now.isoformat(),
                    }
                    anomalies.append(anom)
                    if generate_alerts:
                        AlertService.create_alert(
                            db=db,
                            alert_in=AlertCreate(
                                alert_type=AlertType.SIGNAL_LOST,
                                severity=AlertSeverity.HIGH,
                                title=f"TRANSPORT SIGNAL LOST: {t.transport_name}",
                                message=anom["description"],
                                entity_type=AlertEntityType.TRANSPORT,
                                entity_id=t.id,
                                station_id=t.current_station_id,
                            ),
                        )

                # Rule 3: Velocity/Position Jump check between consecutive pings
                if len(recent_pings) >= 2:
                    p1 = recent_pings[0]
                    p2 = recent_pings[1]
                    dist_km = haversine_distance_km(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
                    dt_sec = abs((p1.timestamp - p2.timestamp).total_seconds())
                    if dt_sec > 0:
                        velocity_kmh = (dist_km / dt_sec) * 3600.0
                        if velocity_kmh > 400.0:  # Physical limit for Antarctic transport
                            anom = {
                                "entity_type": "TRANSPORT",
                                "entity_id": t.id,
                                "anomaly_type": "POSITION_JUMP",
                                "severity": "HIGH",
                                "description": f"Unrealistic GPS coordinate jump: {round(dist_km, 1)} km in {int(dt_sec)}s ({round(velocity_kmh, 1)} km/h) on '{t.transport_name}'.",
                                "detected_at": now.isoformat(),
                            }
                            anomalies.append(anom)

        logger.info("Anomaly scan complete. Detected %s operational anomalies.", len(anomalies))
        return anomalies
