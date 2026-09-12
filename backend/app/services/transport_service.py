from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.transport import Transport, TransportType, TransportStatus
from app.models.station import Station
from app.schemas.transport import TransportCreate, TransportUpdate, TransportStatusResponse


class TransportService:
    @staticmethod
    def create_transport(db: Session, transport_in: TransportCreate) -> Transport:
        """Registers a new polar transport vessel/vehicle."""
        if transport_in.capacity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transport capacity must be strictly positive",
            )

        existing = db.query(Transport).filter(Transport.transport_name == transport_in.transport_name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transport with name '{transport_in.transport_name}' already exists",
            )

        if transport_in.current_station_id is not None:
            station = db.query(Station).filter(Station.id == transport_in.current_station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Current station with id {transport_in.current_station_id} does not exist",
                )

        if transport_in.destination_station_id is not None:
            station = db.query(Station).filter(Station.id == transport_in.destination_station_id).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination station with id {transport_in.destination_station_id} does not exist",
                )

        transport = Transport(
            transport_name=transport_in.transport_name,
            type=transport_in.type,
            capacity=transport_in.capacity,
            status=transport_in.status,
            current_location=transport_in.current_location,
            destination=transport_in.destination,
            eta=transport_in.eta,
            current_station_id=transport_in.current_station_id,
            destination_station_id=transport_in.destination_station_id,
        )
        db.add(transport)
        db.commit()
        db.refresh(transport)
        return transport

    @staticmethod
    def list_transports(
        db: Session,
        status_filter: Optional[TransportStatus] = None,
        type_filter: Optional[TransportType] = None,
    ) -> List[Transport]:
        """Lists transports with optional status and type filters."""
        query = db.query(Transport)
        if status_filter:
            query = query.filter(Transport.status == status_filter)
        if type_filter:
            query = query.filter(Transport.type == type_filter)
        return query.order_by(Transport.id.asc()).all()

    @staticmethod
    def get_transport_by_id(db: Session, transport_id: int) -> Transport:
        """Retrieves a transport record by ID."""
        transport = db.query(Transport).filter(Transport.id == transport_id).first()
        if not transport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transport with id {transport_id} not found",
            )
        return transport

    @staticmethod
    def update_transport(db: Session, transport_id: int, transport_in: TransportUpdate) -> Transport:
        """Updates transport details."""
        transport = db.query(Transport).filter(Transport.id == transport_id).first()
        if not transport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transport with id {transport_id} not found",
            )

        update_data = transport_in.model_dump(exclude_unset=True)

        if "transport_name" in update_data and update_data["transport_name"] != transport.transport_name:
            existing = db.query(Transport).filter(Transport.transport_name == update_data["transport_name"]).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Transport with name '{update_data['transport_name']}' already exists",
                )

        if "current_station_id" in update_data and update_data["current_station_id"] is not None:
            station = db.query(Station).filter(Station.id == update_data["current_station_id"]).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Current station with id {update_data['current_station_id']} does not exist",
                )

        if "destination_station_id" in update_data and update_data["destination_station_id"] is not None:
            station = db.query(Station).filter(Station.id == update_data["destination_station_id"]).first()
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Destination station with id {update_data['destination_station_id']} does not exist",
                )

        for field, val in update_data.items():
            setattr(transport, field, val)

        db.commit()
        db.refresh(transport)
        return transport

    @staticmethod
    def get_transport_status(db: Session, transport_id: int) -> TransportStatusResponse:
        """Retrieves quick operational status of a transport."""
        transport = db.query(Transport).filter(Transport.id == transport_id).first()
        if not transport:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transport with id {transport_id} not found",
            )
        return TransportStatusResponse(
            id=transport.id,
            transport_name=transport.transport_name,
            type=transport.type,
            status=transport.status,
            current_location=transport.current_location,
            destination=transport.destination,
            eta=transport.eta,
        )
