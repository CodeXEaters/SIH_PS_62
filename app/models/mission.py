import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base


class MissionType(str, enum.Enum):
    SCIENTIFIC_SURVEY = "SCIENTIFIC_SURVEY"
    LOGISTICS_RESUPPLY = "LOGISTICS_RESUPPLY"
    RECONNAISSANCE = "RECONNAISSANCE"
    EMERGENCY_RESCUE = "EMERGENCY_RESCUE"


class MissionStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"
    EMERGENCY = "EMERGENCY"


class MissionRiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    mission_name = Column(String, unique=True, index=True, nullable=False)
    mission_type = Column(Enum(MissionType), nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    team_lead_id = Column(Integer, ForeignKey("personnel.id", ondelete="RESTRICT"), nullable=False, index=True)
    origin_station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    destination_station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    expected_return = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(MissionStatus), nullable=False, default=MissionStatus.PLANNED, index=True)
    risk_level = Column(Enum(MissionRiskLevel), nullable=False, default=MissionRiskLevel.LOW)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Unidirectional relationships to Personnel and Station
    team_lead = relationship("Personnel", foreign_keys=[team_lead_id])
    origin_station = relationship("Station", foreign_keys=[origin_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
