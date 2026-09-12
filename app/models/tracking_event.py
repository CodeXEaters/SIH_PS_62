import enum
from sqlalchemy import Column, Integer, Float, DateTime, Enum, Index, func
from app.database.base import Base


class TrackingEntityType(str, enum.Enum):
    MISSION = "MISSION"
    TRANSPORT = "TRANSPORT"


class TrackingEvent(Base):
    __tablename__ = "tracking_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(Enum(TrackingEntityType), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=False)  # km/h
    battery = Column(Float, nullable=False)  # percentage 0.0 - 100.0
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    __table_args__ = (
        Index("ix_tracking_events_entity", "entity_type", "entity_id"),
    )
