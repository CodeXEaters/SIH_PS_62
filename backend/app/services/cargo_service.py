from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.cargo import Cargo, CargoCategory, CargoPriority, CargoStatus
from app.models.cargo_event import CargoEvent, CargoEventType
from app.models.station import Station
from app.models.user import User
from app.schemas.cargo import CargoCreate, CargoUpdate, CargoStatusUpdate


# Strict lifecycle state machine
VALID_CARGO_TRANSITIONS = {
    CargoStatus.PLANNED: [CargoStatus.PACKED, CargoStatus.DELAYED],
    CargoStatus.PACKED: [CargoStatus.DISPATCHED, CargoStatus.DELAYED, CargoStatus.PLANNED],
    CargoStatus.DISPATCHED: [CargoStatus.IN_TRANSIT, CargoStatus.DELAYED],
    CargoStatus.IN_TRANSIT: [CargoStatus.ARRIVED, CargoStatus.DELAYED],
    CargoStatus.DELAYED: [CargoStatus.PACKED, CargoStatus.DISPATCHED, CargoStatus.IN_TRANSIT, CargoStatus.ARRIVED],
    CargoStatus.ARRIVED: [CargoStatus.DELIVERED],
    CargoStatus.DELIVERED: [],  # Terminal state
}


class CargoService:
    @staticmethod
    def _generate_cargo_code(db: Session) -> str:
        """Generates a sequential, unique cargo code in the format CRG-2026-XXX."""
        count = db.query(func.count(Cargo.id)).scalar() or 0
        seq = count + 1
        while True:
            candidate = f"CRG-2026-{seq:03d}"
            existing = db.query(Cargo).filter(Cargo.cargo_code == candidate).first()
            if not existing:
                return candidate
            seq += 1

    @classmethod
    def create_cargo(
        cls,
        db: Session,
        cargo_in: CargoCreate,
        current_user: Optional[User] = None,
    ) -> Cargo:
        """Creates and registers a new cargo package with auto-generated QR identity and initial CREATED event."""
        # 1. Validate stations
        origin = db.query(Station).filter(Station.id == cargo_in.origin_station_id).first()
        if not origin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Origin station with id {cargo_in.origin_station_id} does not exist"
            )

        destination = db.query(Station).filter(Station.id == cargo_in.destination_station_id).first()
        if not destination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination station with id {cargo_in.destination_station_id} does not exist"
            )

        if cargo_in.origin_station_id == cargo_in.destination_station_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Origin and destination stations cannot be the same"
            )

        # 2. Validate weight
        if cargo_in.weight <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cargo weight must be strictly positive"
            )

        # 3. Generate unique cargo code and QR payload
        cargo_code = cls._generate_cargo_code(db)
        qr_code = f"DHRUV:CARGO:{cargo_code}"

        # 4. Default location to origin station if omitted
        current_loc = cargo_in.current_location.strip() if cargo_in.current_location else origin.name

        cargo = Cargo(
            cargo_code=cargo_code,
            name=cargo_in.name,
            category=cargo_in.category,
            weight=cargo_in.weight,
            priority=cargo_in.priority,
            origin_station_id=cargo_in.origin_station_id,
            destination_station_id=cargo_in.destination_station_id,
            status=CargoStatus.PLANNED,
            current_location=current_loc,
            qr_code=qr_code,
        )

        db.add(cargo)
        db.flush()  # Generates cargo.id within current transaction

        # 5. Create atomic initial CREATED event
        creator_info = current_user.email if current_user and current_user.email else "Central Logistics Directorate"
        creation_event = CargoEvent(
            cargo_id=cargo.id,
            event_type=CargoEventType.CREATED,
            location=current_loc,
            station_id=cargo_in.origin_station_id,
            latitude=origin.latitude if origin else None,
            longitude=origin.longitude if origin else None,
            remarks=f"Consignment manifested and registered by {creator_info}",
            updated_by=current_user.id if current_user else None,
        )
        db.add(creation_event)

        db.commit()
        db.refresh(cargo)
        return cargo

    @staticmethod
    def list_cargo(
        db: Session,
        status_filter: Optional[CargoStatus] = None,
        priority: Optional[CargoPriority] = None,
        category: Optional[CargoCategory] = None,
        origin_station_id: Optional[int] = None,
        destination_station_id: Optional[int] = None,
    ) -> List[Cargo]:
        """Retrieves cargo records matching optional filters."""
        query = db.query(Cargo)
        if status_filter:
            query = query.filter(Cargo.status == status_filter)
        if priority:
            query = query.filter(Cargo.priority == priority)
        if category:
            query = query.filter(Cargo.category == category)
        if origin_station_id is not None:
            query = query.filter(Cargo.origin_station_id == origin_station_id)
        if destination_station_id is not None:
            query = query.filter(Cargo.destination_station_id == destination_station_id)
        return query.order_by(Cargo.id.asc()).all()

    @staticmethod
    def get_cargo_by_id(db: Session, cargo_id: int) -> Cargo:
        """Retrieves a single cargo by ID."""
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo with id {cargo_id} not found"
            )
        return cargo

    @staticmethod
    def update_cargo(db: Session, cargo_id: int, cargo_in: CargoUpdate) -> Cargo:
        """Updates cargo attributes."""
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo with id {cargo_id} not found"
            )

        update_data = cargo_in.model_dump(exclude_unset=True)

        # Validate stations if being updated
        new_origin = update_data.get("origin_station_id", cargo.origin_station_id)
        new_dest = update_data.get("destination_station_id", cargo.destination_station_id)

        if "origin_station_id" in update_data:
            if not db.query(Station).filter(Station.id == new_origin).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Origin station with id {new_origin} does not exist"
                )

        if "destination_station_id" in update_data:
            if not db.query(Station).filter(Station.id == new_dest).first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination station with id {new_dest} does not exist"
                )

        if new_origin == new_dest:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Origin and destination stations cannot be the same"
            )

        # Validate status transition if status is being updated directly
        if "status" in update_data:
            new_status = update_data["status"]
            if new_status != cargo.status:
                allowed = VALID_CARGO_TRANSITIONS.get(cargo.status, [])
                if new_status not in allowed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status transition from {cargo.status.value} to {new_status.value}. Allowed: {[s.value for s in allowed]}"
                    )

        for field, value in update_data.items():
            setattr(cargo, field, value)

        db.commit()
        db.refresh(cargo)
        return cargo

    @staticmethod
    def update_cargo_status(db: Session, cargo_id: int, status_in: CargoStatusUpdate) -> Cargo:
        """Validates and transitions cargo status along the defined logistics lifecycle."""
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo with id {cargo_id} not found"
            )

        new_status = status_in.status
        if new_status != cargo.status:
            allowed = VALID_CARGO_TRANSITIONS.get(cargo.status, [])
            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status transition from {cargo.status.value} to {new_status.value}. Allowed: {[s.value for s in allowed]}"
                )
            cargo.status = new_status

        if status_in.current_location:
            cargo.current_location = status_in.current_location.strip()

        db.commit()
        db.refresh(cargo)
        return cargo
