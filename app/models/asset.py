from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_name = Column(String, nullable=False, index=True)
    asset_type = Column(String, nullable=False, index=True)  # e.g., VEHICLE, GENERATOR, COMMS, MEDICAL, SCIENTIFIC_INSTRUMENT
    qr_code = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, nullable=False, default="OPERATIONAL")  # e.g., OPERATIONAL, MAINTENANCE_REQUIRED, IN_REPAIR, DECOMMISSIONED
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    location = Column(String, nullable=False)
    last_maintenance = Column(Date, nullable=True)
    next_maintenance = Column(Date, nullable=True)
    health_score = Column(Float, nullable=False, default=100.0)  # 0 to 100

    station = relationship("Station", back_populates="assets")
