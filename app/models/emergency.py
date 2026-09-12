import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class EmergencySeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EmergencyType(str, enum.Enum):
    MEDICAL = "MEDICAL"
    TRAVERSE_BLIZZARD = "TRAVERSE_BLIZZARD"
    GENERATOR_FAILURE = "GENERATOR_FAILURE"
    COMMUNICATION_BLACKOUT = "COMMUNICATION_BLACKOUT"
    EQUIPMENT_LOSS = "EQUIPMENT_LOSS"
    EVACUATION = "EVACUATION"


class EmergencyStatus(str, enum.Enum):
    OPEN = "OPEN"
    DISPATCHED = "DISPATCHED"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class EmergencyDecision(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    MODIFIED = "MODIFIED"
    REJECTED = "REJECTED"


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    emergency_type = Column(Enum(EmergencyType), nullable=False, index=True)
    severity = Column(Enum(EmergencySeverity), nullable=False, default=EmergencySeverity.CRITICAL)
    status = Column(Enum(EmergencyStatus), nullable=False, default=EmergencyStatus.OPEN, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id", ondelete="SET NULL"), nullable=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id", ondelete="SET NULL"), nullable=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_description = Column(String, nullable=True)
    description = Column(String, nullable=False)
    recommended_response = Column(String, nullable=True)
    human_decision = Column(Enum(EmergencyDecision), nullable=False, default=EmergencyDecision.PENDING)
    decision_notes = Column(String, nullable=True)
    decision_timestamp = Column(DateTime(timezone=True), nullable=True)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Unidirectional relationships to Member 1 & 2 models
    station = relationship("Station", foreign_keys=[station_id])
    mission = relationship("Mission", foreign_keys=[mission_id])
    personnel = relationship("Personnel", foreign_keys=[personnel_id])
    asset = relationship("Asset", foreign_keys=[asset_id])
    reporter = relationship("User", foreign_keys=[reported_by])
