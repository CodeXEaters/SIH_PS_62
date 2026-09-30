from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class WasteCategory(str, Enum):
    GENERAL = "GENERAL"
    BIOLOGICAL = "BIOLOGICAL"
    HAZARDOUS = "HAZARDOUS"
    RECYCLABLE = "RECYCLABLE"
    SCIENTIFIC = "SCIENTIFIC"


class WasteStatus(str, Enum):
    GENERATED = "GENERATED"
    STORED = "STORED"
    TRANSFERRED = "TRANSFERRED"
    PROCESSED = "PROCESSED"
    DISPOSED = "DISPOSED"


class DisposalMethod(str, Enum):
    INCINERATION = "INCINERATION"
    RETROGRADE_SHIPMENT = "RETROGRADE_SHIPMENT"
    COMPACTED_STORAGE = "COMPACTED_STORAGE"
    NEUTRALIZATION = "NEUTRALIZATION"
    DEEP_CONTAINMENT = "DEEP_CONTAINMENT"


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    waste_category = Column(String, nullable=False, index=True)  # WasteCategory enum value
    quantity = Column(Float, nullable=False)                     # e.g., 120.5
    unit = Column(String, nullable=False, default="KG")          # KG, L, DRUMS
    disposal_method = Column(String, nullable=False)             # DisposalMethod enum value
    storage_location = Column(String, nullable=False)            # e.g., "Maitri Hazardous Waste Vault #1"
    hazardous = Column(Boolean, default=False, nullable=False, index=True)
    status = Column(String, nullable=False, default=WasteStatus.STORED.value, index=True)
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    responsible_personnel_id = Column(Integer, ForeignKey("personnel.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    station = relationship("Station", backref="waste_records")
    responsible_personnel = relationship("Personnel")
