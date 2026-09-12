from typing import List
from fastapi import APIRouter, Depends, status, Path
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.tracking_event import TrackingEntityType
from app.models.user import User, UserRole
from app.schemas.tracking import (
    TrackingEventCreate,
    TrackingEventResponse,
    LiveTrackingItem,
)
from app.services.tracking_service import TrackingService
from app.core.security import get_current_user, require_roles

router = APIRouter()


@router.post("/update", response_model=TrackingEventResponse, status_code=status.HTTP_201_CREATED)
def record_tracking_update(
    event_in: TrackingEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.LOGISTICS, UserRole.FIELD_TEAM)),
):
    """Ingests a telemetry GPS and operational data update."""
    return TrackingService.record_telemetry(db=db, event_in=event_in)


@router.get("/live", response_model=List[LiveTrackingItem])
def get_live_tracking(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve the latest live tracking state for all active missions and transports."""
    return TrackingService.get_live_tracking(db=db)


@router.get("/entities")
def get_tracking_entities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns tactical tracking entities across stations, transports, missions, and cargo
    for the interactive operations GIS map.
    """
    from app.models.station import Station
    from app.models.transport import Transport
    from app.models.mission import Mission
    from app.models.cargo import Cargo, CargoStatus
    from app.models.tracking_event import TrackingEvent

    entities = []

    # 1. Stations
    stations = db.query(Station).all()
    for s in stations:
        entities.append({
            "id": f"STAT-{s.id}",
            "name": s.name,
            "type": "STATION",
            "lat": s.latitude,
            "lng": s.longitude,
            "status": s.status,
            "lastPing": "No Telemetry Recorded",
            "stationBase": s.name,
            "description": f"Indian Antarctic Base ({s.location}). Type: {s.type}.",
        })

    # 2. Transports
    transports = db.query(Transport).all()
    for t in transports:
        latest_track = (
            db.query(TrackingEvent)
            .filter(TrackingEvent.entity_type == TrackingEntityType.TRANSPORT, TrackingEvent.entity_id == t.id)
            .order_by(TrackingEvent.timestamp.desc())
            .first()
        )
        if latest_track:
            lat = latest_track.latitude
            lng = latest_track.longitude
            speed = latest_track.speed
            battery = round(latest_track.battery, 1)
            last_ping = latest_track.timestamp.strftime("%Y-%m-%d %H:%M UTC")
        else:
            lat = t.current_station.latitude if t.current_station else 0.0
            lng = t.current_station.longitude if t.current_station else 0.0
            speed = 0.0
            battery = None
            last_ping = "No Telemetry Recorded"

        t_type = "VESSEL" if "VESSEL" in t.type.value else "AIRCRAFT" if ("AIRCRAFT" in t.type.value or "HELICOPTER" in t.type.value) else "VEHICLE"

        entities.append({
            "id": f"TRN-{t.id}",
            "name": t.transport_name,
            "type": t_type,
            "lat": lat,
            "lng": lng,
            "status": t.status.value,
            "speedKts": round(speed * 0.539957, 1),
            "batteryPct": battery,
            "lastPing": last_ping,
            "stationBase": t.current_location,
            "description": f"Fleet asset: {t.transport_name}. Capacity: {t.capacity} kg.",
        })

    # 3. Active Field Missions
    missions = db.query(Mission).all()
    for m in missions:
        latest_track = (
            db.query(TrackingEvent)
            .filter(TrackingEvent.entity_type == TrackingEntityType.MISSION, TrackingEvent.entity_id == m.id)
            .order_by(TrackingEvent.timestamp.desc())
            .first()
        )
        if latest_track:
            lat = latest_track.latitude
            lng = latest_track.longitude
            speed = latest_track.speed
            battery = round(latest_track.battery, 1)
            last_ping = latest_track.timestamp.strftime("%Y-%m-%d %H:%M UTC")
        else:
            lat = m.origin_station.latitude if m.origin_station else 0.0
            lng = m.origin_station.longitude if m.origin_station else 0.0
            speed = 0.0
            battery = None
            last_ping = "No Telemetry Recorded"

        entities.append({
            "id": f"MIS-{m.id}",
            "name": m.mission_name,
            "type": "TEAM",
            "lat": lat,
            "lng": lng,
            "status": m.status.value,
            "speedKts": round(speed * 0.539957, 1),
            "batteryPct": battery,
            "lastPing": last_ping,
            "stationBase": m.origin,
            "description": f"Traverse expedition: {m.mission_name}. Risk Level: {m.risk_level.value}.",
        })

    return entities



@router.get("/{entity_type}/{entity_id}", response_model=List[TrackingEventResponse])
def get_entity_tracking_history(
    entity_type: TrackingEntityType = Path(..., description="Type of entity: MISSION or TRANSPORT"),
    entity_id: int = Path(..., description="ID of the entity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve chronological telemetry history for a specific mission or transport."""
    return TrackingService.get_entity_tracking(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
    )
