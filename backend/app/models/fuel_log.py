from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    week_label = Column(String, nullable=False)  # e.g., "Wk 48", "Wk 49", "Wk 50", "Wk 51", "Wk 52"
    liters_consumed = Column(Float, nullable=False)
    recorded_date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)

    station = relationship("Station")
