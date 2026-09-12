import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class TransportType(str, enum.Enum):
    RESEARCH_VESSEL = "RESEARCH_VESSEL"
    CARGO_AIRCRAFT = "CARGO_AIRCRAFT"
    SNOW_VEHICLE = "SNOW_VEHICLE"
    HELICOPTER = "HELICOPTER"


class TransportStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    STANDBY = "STANDBY"


class Transport(Base):
    __tablename__ = "transport"

    id = Column(Integer, primary_key=True, index=True)
    transport_name = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(TransportType), nullable=False)
    capacity = Column(Float, nullable=False)  # Payload capacity in kg
    status = Column(Enum(TransportStatus), nullable=False, default=TransportStatus.AVAILABLE, index=True)
    current_location = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    eta = Column(DateTime(timezone=True), nullable=True)
    current_station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    destination_station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Unidirectional relationships to Station
    current_station = relationship("Station", foreign_keys=[current_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
