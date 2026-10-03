from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.tracking_event import TrackingEvent, TrackingEntityType
from app.models.mission import Mission
from app.models.transport import Transport
from app.schemas.tracking import TrackingEventCreate, LiveTrackingItem


class TrackingService:
    @staticmethod
    def record_telemetry(db: Session, event_in: TrackingEventCreate) -> TrackingEvent:
        """Records a new GPS and operational telemetry point for a mission or transport."""
        entity_name: Optional[str] = None

        if event_in.entity_type == TrackingEntityType.MISSION:
            mission = db.query(Mission).filter(Mission.id == event_in.entity_id).first()
            if not mission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mission with id {event_in.entity_id} not found",
                )
            entity_name = mission.mission_name

        elif event_in.entity_type == TrackingEntityType.TRANSPORT:
            transport = db.query(Transport).filter(Transport.id == event_in.entity_id).first()
            if not transport:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Transport with id {event_in.entity_id} not found",
                )
            entity_name = transport.transport_name
            # Keep transport current_location up to date with coordinates
            transport.current_location = f"{event_in.latitude:.4f}, {event_in.longitude:.4f}"

        ts = event_in.timestamp or datetime.now(timezone.utc)
        event = TrackingEvent(
            entity_type=event_in.entity_type,
            entity_id=event_in.entity_id,
            latitude=event_in.latitude,
            longitude=event_in.longitude,
            speed=event_in.speed,
            battery=event_in.battery,
            timestamp=ts,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Cross-module integration: Trigger low-battery alert if battery is critically depleted
        if event.battery is not None and event.battery < 20.0:
            try:
                from app.services.alert_service import AlertService
                from app.schemas.alert import AlertCreate
                from app.models.alert import AlertType, AlertSeverity, AlertEntityType
                AlertService.create_alert(
                    db=db,
                    alert_in=AlertCreate(
                        alert_type=AlertType.LOW_BATTERY,
                        severity=AlertSeverity.HIGH if event.battery > 10.0 else AlertSeverity.CRITICAL,
                        title=f"Low Battery: {entity_name or 'Tracked Unit'}",
                        message=f"{event.entity_type.value} #{event.entity_id} ({entity_name}) reported critical battery level at {event.battery}%.",
                        entity_type=AlertEntityType.MISSION if event.entity_type == TrackingEntityType.MISSION else AlertEntityType.TRANSPORT,
                        entity_id=event.entity_id,
                    ),
                )
            except Exception:
                pass

        # Broadcast live tracking update via WebSocket
        try:
            from app.websocket.manager import ws_manager
            import asyncio
            payload = {
                "event": "TRACKING_UPDATE",
                "telemetry": {
                    "id": event.id,
                    "entity_type": event.entity_type.value,
                    "entity_id": event.entity_id,
                    "entity_name": entity_name,
                    "latitude": event.latitude,
                    "longitude": event.longitude,
                    "speed": event.speed,
                    "battery": event.battery,
                    "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                    "is_simulated": True,
                },
            }
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(ws_manager.broadcast("tracking", payload))
            except RuntimeError:
                pass
        except Exception:
            pass

        return event

    @staticmethod
    def get_live_tracking(db: Session) -> List[LiveTrackingItem]:
        """Aggregates and returns the latest live telemetry state for all tracked entities."""
        # Find latest timestamp per (entity_type, entity_id)
        subq = (
            db.query(
                TrackingEvent.entity_type,
                TrackingEvent.entity_id,
                func.max(TrackingEvent.id).label("max_id"),
            )
            .group_by(TrackingEvent.entity_type, TrackingEvent.entity_id)
            .subquery()
        )

        events = (
            db.query(TrackingEvent)
            .join(
                subq,
                (TrackingEvent.entity_type == subq.c.entity_type)
                & (TrackingEvent.entity_id == subq.c.entity_id)
                & (TrackingEvent.id == subq.c.max_id),
            )
            .order_by(TrackingEvent.timestamp.desc())
            .all()
        )

        items = []
        for ev in events:
            name: Optional[str] = None
            st: Optional[str] = None

            if ev.entity_type == TrackingEntityType.MISSION:
                m = db.query(Mission).filter(Mission.id == ev.entity_id).first()
                if m:
                    name = m.mission_name
                    st = m.status.value
            elif ev.entity_type == TrackingEntityType.TRANSPORT:
                t = db.query(Transport).filter(Transport.id == ev.entity_id).first()
                if t:
                    name = t.transport_name
                    st = t.status.value

            items.append(
                LiveTrackingItem(
                    entity_type=ev.entity_type,
                    entity_id=ev.entity_id,
                    entity_name=name,
                    status=st,
                    latest_latitude=ev.latitude,
                    latest_longitude=ev.longitude,
                    latest_speed=ev.speed,
                    latest_battery=ev.battery,
                    latest_timestamp=ev.timestamp,
                    event_id=ev.id,
                )
            )

        return items

    @staticmethod
    def get_entity_tracking(
        db: Session,
        entity_type: TrackingEntityType,
        entity_id: int,
    ) -> List[TrackingEvent]:
        """Retrieves full historical telemetry track for a specific mission or transport."""
        if entity_type == TrackingEntityType.MISSION:
            if not db.query(Mission).filter(Mission.id == entity_id).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Mission with id {entity_id} not found",
                )
        elif entity_type == TrackingEntityType.TRANSPORT:
            if not db.query(Transport).filter(Transport.id == entity_id).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Transport with id {entity_id} not found",
                )

        return (
            db.query(TrackingEvent)
            .filter(
                TrackingEvent.entity_type == entity_type,
                TrackingEvent.entity_id == entity_id,
            )
            .order_by(TrackingEvent.timestamp.asc())
            .all()
        )
