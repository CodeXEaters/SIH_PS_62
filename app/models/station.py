from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database.database import Base


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    type = Column(String, nullable=False)    # e.g., HQ, TRANSIT_HUB, PERMANENT_STATION, FIELD_CAMP
    status = Column(String, nullable=False)  # e.g., OPERATIONAL, MAINTENANCE, STANDBY

    personnel = relationship("Personnel", back_populates="station", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="station", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="station", cascade="all, delete-orphan")
