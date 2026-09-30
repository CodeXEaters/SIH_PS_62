from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.database import Base


class ReadinessStatus(str, Enum):
    READY = "READY"
    LIMITED = "LIMITED"
    NOT_READY = "NOT_READY"
    CLEARANCE_EXPIRED = "CLEARANCE_EXPIRED"


class HealthClearanceStatus(str, Enum):
    APPROVED = "APPROVED"
    PENDING = "PENDING"
    RESTRICTED = "RESTRICTED"
    REVOKED = "REVOKED"


class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    designation = Column(String, nullable=False)
    team = Column(String, nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    current_location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="ACTIVE", index=True)  # e.g., ACTIVE, ON_MISSION, REST, EVACUATING
    medical_clearance = Column(Boolean, default=True, nullable=False)
    emergency_contact = Column(String, nullable=False)
    last_check_in = Column(DateTime(timezone=True), nullable=True)

    # Health & Readiness fields (PPT Parity: Personnel Profiles, Health & Readiness)
    health_clearance_status = Column(String, nullable=False, default=HealthClearanceStatus.APPROVED.value, index=True)
    clearance_expiry = Column(DateTime(timezone=True), nullable=True, index=True)
    readiness_status = Column(String, nullable=False, default=ReadinessStatus.READY.value, index=True)
    medical_review_date = Column(DateTime(timezone=True), nullable=True)
    deployment_eligibility = Column(String, nullable=False, default="FIT_FOR_DEPLOYMENT")
    restrictions_notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="personnel")
    station = relationship("Station", back_populates="personnel")
