import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class CargoCategory(str, enum.Enum):
    SCIENTIFIC = "SCIENTIFIC"
    MEDICAL = "MEDICAL"
    FUEL = "FUEL"
    FOOD = "FOOD"
    EQUIPMENT = "EQUIPMENT"


class CargoPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CargoStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    PACKED = "PACKED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    ARRIVED = "ARRIVED"
    DELIVERED = "DELIVERED"


class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)
    cargo_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(Enum(CargoCategory), nullable=False)
    weight = Column(Float, nullable=False)  # in kilograms
    priority = Column(Enum(CargoPriority), nullable=False, default=CargoPriority.MEDIUM)
    origin_station_id = Column(Integer, ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False, index=True)
    destination_station_id = Column(Integer, ForeignKey("stations.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(Enum(CargoStatus), nullable=False, default=CargoStatus.PLANNED, index=True)
    current_location = Column(String, nullable=False)
    qr_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Unidirectional relationships to Station (does not modify Station model)
    origin_station = relationship("Station", foreign_keys=[origin_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
