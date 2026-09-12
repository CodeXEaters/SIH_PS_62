import math
import uuid
import logging
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.emergency import Emergency, EmergencyType, EmergencySeverity, EmergencyStatus, EmergencyDecision
from app.models.station import Station
from app.models.mission import Mission
from app.models.personnel import Personnel
from app.models.asset import Asset
from app.models.transport import Transport, TransportStatus
from app.models.alert import Alert, AlertType, AlertSeverity, AlertEntityType
from app.schemas.emergency import EmergencyCreate, EmergencyUpdate, EmergencyDecisionRequest
from app.services.alert_service import AlertService
from app.schemas.alert import AlertCreate

logger = logging.getLogger("dhruv.emergency")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2) + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class EmergencyService:
    @staticmethod
    def generate_incident_code(db: Session) -> str:
        for _ in range(10):
            code = f"EMG-2026-{uuid.uuid4().hex[:4].upper()}"
            if not db.query(Emergency).filter(Emergency.incident_code == code).first():
                return code
        return f"EMG-2026-{int(datetime.now().timestamp())}"

    @staticmethod
    def calculate_rescue_plan(
        db: Session,
        target_lat: Optional[float],
        target_lon: Optional[float],
        emergency_type: EmergencyType,
    ) -> str:
        """
        Consumes personnel, assets, and stations to compute optimal rescue recommendation:
        - Available doctor / medical lead
        - Available rescue vehicle / snowcat / helicopter
        - Haversine distance and estimated transit time
        """
        if target_lat is None or target_lon is None:
            return "Standard base rescue standby. Coordinates pending field report."

        # 1. Match Doctor
        doctor = (
            db.query(Personnel)
            .filter(
                (Personnel.team == "Medical") | (Personnel.designation.ilike("%Doctor%")) | (Personnel.designation.ilike("%Medic%")),
                Personnel.status.in_(["ACTIVE", "Active"]),
            )
            .first()
        )
        doctor_name = doctor.name if doctor else "Duty Expedition Physician"

        # 2. Match Vehicle (Assets or Transport)
        vehicle_name = "PistenBully Polar Traverse 01"
        asset_vehicle = (
            db.query(Asset)
            .filter(
                Asset.asset_type == "VEHICLE",
                Asset.health_score >= 60.0,
                Asset.status == "OPERATIONAL",
            )
            .first()
        )
        if asset_vehicle:
            vehicle_name = asset_vehicle.asset_name
        else:
            transport_vessel = (
                db.query(Transport)
                .filter(Transport.status == TransportStatus.AVAILABLE)
                .first()
            )
            if transport_vessel:
                vehicle_name = transport_vessel.transport_name

        # 3. Find Nearest Station
        stations = db.query(Station).all()
        nearest_station = None
        min_dist = float("inf")
        for s in stations:
            d = haversine_distance_km(target_lat, target_lon, s.latitude, s.longitude)
            if d < min_dist:
                min_dist = d
                nearest_station = s

        station_name = nearest_station.name if nearest_station else "Maitri Station"
        dist_km = min_dist if min_dist != float("inf") else 45.0
        est_hours = round(max(0.5, dist_km / 22.0), 1)  # Avg polar vehicle speed ~22 km/h
        fuel_needed = round(est_hours * 28.0, 1)  # Liters of polar diesel

        return (
            f"DISPATCH PLAN: Deploy {vehicle_name} from {station_name} under {doctor_name}. "
            f"Estimated transit: {est_hours} hrs ({dist_km} km). Required fuel: {fuel_needed} L. "
            f"Maintain VHF channel 16 and satellite link."
        )

    @staticmethod
    def create_emergency(db: Session, emergency_in: EmergencyCreate, reporter_id: Optional[int] = None) -> Emergency:
        # Validate foreign keys if provided
        target_lat = emergency_in.latitude
        target_lon = emergency_in.longitude

        if emergency_in.station_id is not None:
            station = db.query(Station).filter(Station.id == emergency_in.station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Station with ID {emergency_in.station_id} does not exist",
                )
            if target_lat is None:
                target_lat = station.latitude
                target_lon = station.longitude

        if emergency_in.mission_id is not None:
            mission = db.query(Mission).filter(Mission.id == emergency_in.mission_id).first()
            if not mission:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mission with ID {emergency_in.mission_id} does not exist",
                )

        if emergency_in.personnel_id is not None:
            person = db.query(Personnel).filter(Personnel.id == emergency_in.personnel_id).first()
            if not person:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Personnel with ID {emergency_in.personnel_id} does not exist",
                )

        if emergency_in.asset_id is not None:
            asset = db.query(Asset).filter(Asset.id == emergency_in.asset_id).first()
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Asset with ID {emergency_in.asset_id} does not exist",
                )

        code = EmergencyService.generate_incident_code(db)
        rescue_plan = EmergencyService.calculate_rescue_plan(
            db=db,
            target_lat=target_lat,
            target_lon=target_lon,
            emergency_type=emergency_in.emergency_type,
        )

        emergency = Emergency(
            incident_code=code,
            title=emergency_in.title,
            emergency_type=emergency_in.emergency_type,
            severity=emergency_in.severity,
            status=EmergencyStatus.OPEN,
            station_id=emergency_in.station_id,
            mission_id=emergency_in.mission_id,
            personnel_id=emergency_in.personnel_id,
            asset_id=emergency_in.asset_id,
            latitude=target_lat,
            longitude=target_lon,
            location_description=emergency_in.location_description,
            description=emergency_in.description,
            recommended_response=rescue_plan,
            human_decision=EmergencyDecision.PENDING,
            reported_by=reporter_id,
        )
        db.add(emergency)
        db.commit()
        db.refresh(emergency)
        logger.warning("SOS Emergency Created: %s [%s] %s", emergency.incident_code, emergency.severity.value, emergency.title)

        # Cross-module integration: Trigger critical alert
        try:
            alert_in = AlertCreate(
                alert_type=AlertType.EMERGENCY,
                severity=AlertSeverity.CRITICAL,
                title=f"EMERGENCY: {emergency.title}",
                message=f"[{emergency.incident_code}] {emergency.description}. {emergency.recommended_response}",
                entity_type=AlertEntityType.MISSION if emergency.mission_id else AlertEntityType.SYSTEM,
                entity_id=emergency.mission_id or emergency.id,
                station_id=emergency.station_id,
            )
            AlertService.create_alert(db=db, alert_in=alert_in)
        except Exception as alert_err:
            logger.error("Failed to raise automatic alert for emergency: %s", alert_err)

        return emergency

    @staticmethod
    def list_emergencies(
        db: Session,
        status_filter: Optional[EmergencyStatus] = None,
        emergency_type: Optional[EmergencyType] = None,
        severity: Optional[EmergencySeverity] = None,
        station_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Emergency]:
        query = db.query(Emergency)
        if status_filter:
            query = query.filter(Emergency.status == status_filter)
        if emergency_type:
            query = query.filter(Emergency.emergency_type == emergency_type)
        if severity:
            query = query.filter(Emergency.severity == severity)
        if station_id:
            query = query.filter(Emergency.station_id == station_id)

        return query.order_by(desc(Emergency.created_at)).offset(offset).limit(limit).all()

    @staticmethod
    def get_emergency_by_id(db: Session, emergency_id: int) -> Emergency:
        emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
        if not emergency:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency with ID {emergency_id} not found",
            )
        return emergency

    @staticmethod
    def get_active_emergency(db: Session) -> Optional[Emergency]:
        """Returns the current highest-priority open or dispatched emergency."""
        return (
            db.query(Emergency)
            .filter(Emergency.status.in_([EmergencyStatus.OPEN, EmergencyStatus.DISPATCHED, EmergencyStatus.CONTAINED]))
            .order_by(desc(Emergency.created_at))
            .first()
        )

    @staticmethod
    def update_decision(
        db: Session,
        emergency_id: int,
        decision_in: EmergencyDecisionRequest,
        user_id: Optional[int] = None,
    ) -> Emergency:
        emergency = EmergencyService.get_emergency_by_id(db, emergency_id)
        emergency.human_decision = decision_in.decision
        emergency.decision_notes = decision_in.notes
        emergency.decision_timestamp = datetime.now(timezone.utc)

        # Operational status progression based on human command
        if decision_in.decision == EmergencyDecision.APPROVED:
            if emergency.status == EmergencyStatus.OPEN:
                emergency.status = EmergencyStatus.DISPATCHED
        elif decision_in.decision == EmergencyDecision.REJECTED:
            if emergency.status == EmergencyStatus.OPEN:
                emergency.status = EmergencyStatus.CANCELLED

        db.commit()
        db.refresh(emergency)
        logger.info("Emergency decision updated: %s -> %s", emergency.incident_code, decision_in.decision.value)
        return emergency

    @staticmethod
    def update_emergency(
        db: Session,
        emergency_id: int,
        emergency_in: EmergencyUpdate,
    ) -> Emergency:
        emergency = EmergencyService.get_emergency_by_id(db, emergency_id)
        update_data = emergency_in.model_dump(exclude_unset=True)
        for field, val in update_data.items():
            setattr(emergency, field, val)

        if emergency_in.status == EmergencyStatus.RESOLVED and emergency.resolved_at is None:
            emergency.resolved_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(emergency)
        return emergency
