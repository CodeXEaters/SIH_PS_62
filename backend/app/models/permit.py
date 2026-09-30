from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class PermitStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    EXPIRING = "EXPIRING"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"


class PermitType(str, Enum):
    SCIENTIFIC_RESEARCH = "SCIENTIFIC_RESEARCH"
    WASTE_MANAGEMENT = "WASTE_MANAGEMENT"
    FLIGHT_OPERATIONS = "FLIGHT_OPERATIONS"
    WILDLIFE_ACCESS = "WILDLIFE_ACCESS"
    CONSTRUCTION = "CONSTRUCTION"
    MINERAL_RESOURCE_SURVEY = "MINERAL_RESOURCE_SURVEY"
    RADIO_SPECTRUM = "RADIO_SPECTRUM"


class Permit(Base):
    __tablename__ = "permits"

    id = Column(Integer, primary_key=True, index=True)
    permit_number = Column(String, unique=True, index=True, nullable=False)
    permit_type = Column(String, nullable=False, index=True)
    issuing_authority = Column(String, nullable=False)  # e.g., NCPOR / Ministry of Earth Sciences / ATS
    expedition_id = Column(String, nullable=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True, index=True)
    issue_date = Column(DateTime(timezone=True), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String, nullable=False, default=PermitStatus.APPROVED.value, index=True)
    conditions = Column(Text, nullable=True)
    responsible_officer = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    station = relationship("Station", backref="permits")
