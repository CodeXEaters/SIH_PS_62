import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class CargoEventType(str, enum.Enum):
    CREATED = "CREATED"
    PACKED = "PACKED"
    SCANNED = "SCANNED"
    LOADED = "LOADED"
    UNLOADED = "UNLOADED"
    ARRIVED_AT_HUB = "ARRIVED_AT_HUB"
    DELAY_REPORTED = "DELAY_REPORTED"
    DELIVERED = "DELIVERED"


class CargoEvent(Base):
    __tablename__ = "cargo_events"

    id = Column(Integer, primary_key=True, index=True)
    cargo_id = Column(Integer, ForeignKey("cargo.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(Enum(CargoEventType), nullable=False, index=True)
    location = Column(String, nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    remarks = Column(String, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    cargo = relationship("Cargo", back_populates="events")
    station = relationship("Station", foreign_keys=[station_id])
    user = relationship("User", foreign_keys=[updated_by], lazy="joined")

    @property
    def updated_by_user(self):
        if self.user:
            return self.user.email or self.user.full_name
        return None

    @property
    def updated_by_name(self):
        if self.user:
            return self.user.full_name or self.user.email
        return None

