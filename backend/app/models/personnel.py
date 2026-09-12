from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


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

    user = relationship("User", back_populates="personnel")
    station = relationship("Station", back_populates="personnel")
