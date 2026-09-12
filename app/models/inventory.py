from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # e.g., FUEL, RATIONS, MEDICAL, SAFETY_GEAR, SPARE_PARTS
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=0.0)
    minimum_threshold = Column(Float, nullable=False, default=0.0)
    daily_consumption = Column(Float, nullable=False, default=0.0)
    unit = Column(String, nullable=False)  # e.g., L, KG, UNITS, PACKS, CYLINDERS
    expiry_date = Column(Date, nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    station = relationship("Station", back_populates="inventory")
