import logging
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.alert import Alert, AlertStatus, AlertSeverity, AlertType, AlertEntityType
from app.models.station import Station
from app.schemas.alert import AlertCreate, AlertUpdate

logger = logging.getLogger("dhruv.alerts")


class AlertService:
    @staticmethod
    def create_alert(db: Session, alert_in: AlertCreate) -> Alert:
        """
        Creates a new alert or updates existing active alert for deduplication.
        """
        # Validate station reference if supplied
        if alert_in.station_id is not None:
            station = db.query(Station).filter(Station.id == alert_in.station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Station with ID {alert_in.station_id} does not exist",
                )

        # Deduplication check: If an identical active alert exists for this entity, update message rather than flooding
        if alert_in.entity_type is not None and alert_in.entity_id is not None:
            existing = (
                db.query(Alert)
                .filter(
                    Alert.alert_type == alert_in.alert_type,
                    Alert.entity_type == alert_in.entity_type,
                    Alert.entity_id == alert_in.entity_id,
                    Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
                )
                .first()
            )
            if existing:
                existing.severity = alert_in.severity
                existing.title = alert_in.title
                existing.message = alert_in.message
                db.commit()
                db.refresh(existing)
                return existing

        alert = Alert(
            alert_type=alert_in.alert_type,
            severity=alert_in.severity,
            title=alert_in.title,
            message=alert_in.message,
            entity_type=alert_in.entity_type,
            entity_id=alert_in.entity_id,
            station_id=alert_in.station_id,
            status=AlertStatus.ACTIVE,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        logger.info("Created alert [%s] %s (ID: %s)", alert.severity.value, alert.title, alert.id)

        # Try notifying websocket manager if available
        try:
            from app.websocket.manager import ws_manager
            import asyncio
            payload = {
                "event": "ALERT_CREATED",
                "alert": {
                    "id": alert.id,
                    "alert_type": alert.alert_type.value,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "message": alert.message,
                    "status": alert.status.value,
                    "created_at": alert.created_at.isoformat() if alert.created_at else None,
                },
            }
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(ws_manager.broadcast("alerts", payload))
            except RuntimeError:
                pass
        except Exception as ws_err:
            logger.debug("WebSocket broadcast skipped: %s", ws_err)

        return alert

    @staticmethod
    def list_alerts(
        db: Session,
        status_filter: Optional[AlertStatus] = None,
        severity: Optional[AlertSeverity] = None,
        alert_type: Optional[AlertType] = None,
        station_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Alert]:
        query = db.query(Alert)
        if status_filter:
            query = query.filter(Alert.status == status_filter)
        if severity:
            query = query.filter(Alert.severity == severity)
        if alert_type:
            query = query.filter(Alert.alert_type == alert_type)
        if station_id:
            query = query.filter(Alert.station_id == station_id)

        return query.order_by(desc(Alert.created_at)).offset(offset).limit(limit).all()

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: int) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert with ID {alert_id} not found",
            )
        return alert

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: int, user_id: Optional[int] = None) -> Alert:
        alert = AlertService.get_alert_by_id(db, alert_id)
        if alert.status == AlertStatus.RESOLVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot acknowledge an already resolved alert",
            )
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = datetime.now(timezone.utc)
        alert.acknowledged_by = user_id
        db.commit()
        db.refresh(alert)
        logger.info("Acknowledged alert ID: %s by user: %s", alert.id, user_id)
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: int, user_id: Optional[int] = None) -> Alert:
        alert = AlertService.get_alert_by_id(db, alert_id)
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = user_id
        db.commit()
        db.refresh(alert)
        logger.info("Resolved alert ID: %s by user: %s", alert.id, user_id)
        return alert

    @staticmethod
    def dismiss_alert(db: Session, alert_id: int, user_id: Optional[int] = None) -> Alert:
        alert = AlertService.get_alert_by_id(db, alert_id)
        alert.status = AlertStatus.DISMISSED
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = user_id
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def get_active_alerts(db: Session, limit: int = 50) -> List[Alert]:
        return (
            db.query(Alert)
            .filter(Alert.status.in_([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]))
            .order_by(desc(Alert.created_at))
            .limit(limit)
            .all()
        )
