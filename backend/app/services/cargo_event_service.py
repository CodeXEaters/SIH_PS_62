import logging
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.cargo import Cargo, CargoStatus
from app.models.cargo_event import CargoEvent, CargoEventType
from app.models.station import Station
from app.models.user import User
from app.schemas.cargo_event import CargoScanRequest, CargoScanResponse, CargoTimelineResponse
from app.services.cargo_service import VALID_CARGO_TRANSITIONS

logger = logging.getLogger("dhruv.cargo_events")


class CargoEventService:
    @classmethod
    def scan_cargo(
        cls,
        db: Session,
        cargo_id: int,
        scan_in: CargoScanRequest,
        current_user: Optional[User] = None,
    ) -> CargoScanResponse:
        """
        Validates scanned QR against the cargo package, records chain-of-custody event,
        updates location, and advances lifecycle status when valid.
        """
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo with id {cargo_id} not found",
            )

        # 1. Validate QR payload
        scanned_qr = scan_in.qr_code.strip()
        expected_qr = cargo.qr_code
        expected_code = cargo.cargo_code

        if scanned_qr != expected_qr and scanned_qr != expected_code and scanned_qr != f"DHRUV:CARGO:{expected_code}":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Scanned QR '{scanned_qr}' does not match requested cargo {expected_code}",
            )

        # 2. Validate station if provided
        if scan_in.station_id is not None:
            station = db.query(Station).filter(Station.id == scan_in.station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Referenced station with id {scan_in.station_id} does not exist",
                )

        event_type = scan_in.event_type or CargoEventType.SCANNED

        # 3. Handle lifecycle progression rules based on event type
        # Terminal state guard: cannot alter DELIVERED cargo
        if cargo.status == CargoStatus.DELIVERED and event_type != CargoEventType.SCANNED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cargo is already in terminal state DELIVERED. No status-changing events permitted.",
            )

        target_status: Optional[CargoStatus] = None
        if event_type == CargoEventType.PACKED:
            target_status = CargoStatus.PACKED
        elif event_type == CargoEventType.LOADED:
            target_status = CargoStatus.DISPATCHED
        elif event_type == CargoEventType.ARRIVED_AT_HUB:
            target_status = CargoStatus.ARRIVED
        elif event_type == CargoEventType.DELAY_REPORTED:
            target_status = CargoStatus.DELAYED
        elif event_type == CargoEventType.DELIVERED:
            target_status = CargoStatus.DELIVERED

        if target_status and target_status != cargo.status:
            allowed = VALID_CARGO_TRANSITIONS.get(cargo.status, [])
            if target_status in allowed:
                cargo.status = target_status
            else:
                logger.warning(
                    f"Scan event {event_type} does not represent a valid lifecycle transition from {cargo.status}. Preserving status."
                )

        # 4. Update cargo location
        if scan_in.location:
            cargo.current_location = scan_in.location.strip()

        # 5. Create immutable audit event
        event = CargoEvent(
            cargo_id=cargo.id,
            event_type=event_type,
            location=scan_in.location.strip(),
            station_id=scan_in.station_id,
            latitude=scan_in.latitude,
            longitude=scan_in.longitude,
            remarks=scan_in.remarks.strip() if scan_in.remarks else None,
            updated_by=current_user.id if current_user else None,
        )

        db.add(event)
        db.commit()
        db.refresh(cargo)
        db.refresh(event)

        return CargoScanResponse(
            message=f"Cargo {cargo.cargo_code} successfully scanned and logged",
            cargo_id=cargo.id,
            cargo_code=cargo.cargo_code,
            status=cargo.status,
            current_location=cargo.current_location,
            event=event,
        )

    @classmethod
    def get_cargo_timeline(cls, db: Session, cargo_id: int) -> CargoTimelineResponse:
        """Retrieves chronological chain-of-custody timeline for a cargo package."""
        cargo = db.query(Cargo).filter(Cargo.id == cargo_id).first()
        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo with id {cargo_id} not found",
            )

        events = (
            db.query(CargoEvent)
            .filter(CargoEvent.cargo_id == cargo_id)
            .order_by(CargoEvent.timestamp.asc())
            .all()
        )

        return CargoTimelineResponse(
            cargo_id=cargo.id,
            cargo_code=cargo.cargo_code,
            cargo_name=cargo.name,
            current_status=cargo.status,
            current_location=cargo.current_location,
            events=events,
        )
