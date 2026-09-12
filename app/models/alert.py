import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Index, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertType(str, enum.Enum):
    LOW_BATTERY = "LOW_BATTERY"
    SIGNAL_LOST = "SIGNAL_LOST"
    INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
    MAINTENANCE_ALERT = "MAINTENANCE_ALERT"
    MISSION_OVERDUE = "MISSION_OVERDUE"
    WEATHER_BLIZZARD = "WEATHER_BLIZZARD"
    CARGO_DELAY = "CARGO_DELAY"
    ANOMALY = "ANOMALY"
    EMERGENCY = "EMERGENCY"
    GENERAL = "GENERAL"


class AlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class AlertEntityType(str, enum.Enum):
    INVENTORY = "INVENTORY"
    ASSET = "ASSET"
    MISSION = "MISSION"
    CARGO = "CARGO"
    TRANSPORT = "TRANSPORT"
    PERSONNEL = "PERSONNEL"
    STATION = "STATION"
    SYSTEM = "SYSTEM"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.MEDIUM, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    entity_type = Column(Enum(AlertEntityType), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Unidirectional relationships to Station and User
    station = relationship("Station", foreign_keys=[station_id])
    acknowledged_user = relationship("User", foreign_keys=[acknowledged_by])
    resolved_user = relationship("User", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("ix_alerts_entity", "entity_type", "entity_id"),
    )
