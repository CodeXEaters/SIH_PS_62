from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.mission import Mission, MissionType, MissionStatus, MissionRiskLevel
from app.models.personnel import Personnel
from app.models.station import Station
from app.schemas.mission import MissionCreate, MissionUpdate, MissionStatusUpdate

# Defined lifecycle transition rules
VALID_MISSION_TRANSITIONS = {
    MissionStatus.PLANNED: [MissionStatus.ACTIVE, MissionStatus.CANCELLED],
    MissionStatus.ACTIVE: [MissionStatus.COMPLETED, MissionStatus.DELAYED, MissionStatus.EMERGENCY],
    MissionStatus.DELAYED: [MissionStatus.ACTIVE, MissionStatus.COMPLETED, MissionStatus.EMERGENCY],
    MissionStatus.EMERGENCY: [MissionStatus.ACTIVE, MissionStatus.COMPLETED, MissionStatus.CANCELLED],
    MissionStatus.COMPLETED: [],  # Terminal state
    MissionStatus.CANCELLED: [],  # Terminal state
}


class MissionService:
    @staticmethod
    def create_mission(db: Session, mission_in: MissionCreate) -> Mission:
        """Creates and schedules an expedition or traverse mission."""
        # 1. Validate team lead exists
        lead = db.query(Personnel).filter(Personnel.id == mission_in.team_lead_id).first()
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel team lead with id {mission_in.team_lead_id} does not exist",
            )

        # 2. Validate stations if referenced
        if mission_in.origin_station_id is not None:
            st = db.query(Station).filter(Station.id == mission_in.origin_station_id).first()
            if not st:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Origin station with id {mission_in.origin_station_id} does not exist",
                )

        if mission_in.destination_station_id is not None:
            st = db.query(Station).filter(Station.id == mission_in.destination_station_id).first()
            if not st:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination station with id {mission_in.destination_station_id} does not exist",
                )

        # 3. Check name uniqueness
        existing = db.query(Mission).filter(Mission.mission_name == mission_in.mission_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mission with name '{mission_in.mission_name}' already exists",
            )

        # 4. Check timestamps
        if mission_in.expected_return < mission_in.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expected return time must be at or after start time",
            )

        mission = Mission(
            mission_name=mission_in.mission_name,
            mission_type=mission_in.mission_type,
            origin=mission_in.origin,
            destination=mission_in.destination,
            team_lead_id=mission_in.team_lead_id,
            origin_station_id=mission_in.origin_station_id,
            destination_station_id=mission_in.destination_station_id,
            start_time=mission_in.start_time,
            expected_return=mission_in.expected_return,
            status=mission_in.status,
            risk_level=mission_in.risk_level,
        )
        db.add(mission)
        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def list_missions(
        db: Session,
        status_filter: Optional[MissionStatus] = None,
        mission_type: Optional[MissionType] = None,
        risk_level: Optional[MissionRiskLevel] = None,
    ) -> List[Mission]:
        """Lists missions with optional status, type, and risk filters."""
        query = db.query(Mission)
        if status_filter:
            query = query.filter(Mission.status == status_filter)
        if mission_type:
            query = query.filter(Mission.mission_type == mission_type)
        if risk_level:
            query = query.filter(Mission.risk_level == risk_level)
        return query.order_by(Mission.id.asc()).all()

    @staticmethod
    def get_mission_by_id(db: Session, mission_id: int) -> Mission:
        """Retrieves a single mission by ID."""
        mission = db.query(Mission).filter(Mission.id == mission_id).first()
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission with id {mission_id} not found",
            )
        return mission

    @staticmethod
    def update_mission(db: Session, mission_id: int, mission_in: MissionUpdate) -> Mission:
        """Updates mission details."""
        mission = db.query(Mission).filter(Mission.id == mission_id).first()
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission with id {mission_id} not found",
            )

        update_data = mission_in.model_dump(exclude_unset=True)

        if "team_lead_id" in update_data:
            lead = db.query(Personnel).filter(Personnel.id == update_data["team_lead_id"]).first()
            if not lead:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Personnel team lead with id {update_data['team_lead_id']} does not exist",
                )

        if "origin_station_id" in update_data and update_data["origin_station_id"] is not None:
            if not db.query(Station).filter(Station.id == update_data["origin_station_id"]).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Origin station with id {update_data['origin_station_id']} does not exist",
                )

        if "destination_station_id" in update_data and update_data["destination_station_id"] is not None:
            if not db.query(Station).filter(Station.id == update_data["destination_station_id"]).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination station with id {update_data['destination_station_id']} does not exist",
                )

        for field, val in update_data.items():
            setattr(mission, field, val)

        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def patch_mission_status(db: Session, mission_id: int, status_in: MissionStatusUpdate) -> Mission:
        """Validates and updates mission lifecycle status and risk level."""
        mission = db.query(Mission).filter(Mission.id == mission_id).first()
        if not mission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Mission with id {mission_id} not found",
            )

        new_status = status_in.status
        if new_status != mission.status:
            allowed = VALID_MISSION_TRANSITIONS.get(mission.status, [])
            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid mission status transition from {mission.status.value} to {new_status.value}. Allowed: {[s.value for s in allowed]}",
                )
            mission.status = new_status

        if status_in.risk_level is not None:
            mission.risk_level = status_in.risk_level

        db.commit()
        db.refresh(mission)
        return mission
