import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
from app.database.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OPERATIONS = "OPERATIONS"
    LOGISTICS = "LOGISTICS"
    STATION_MANAGER = "STATION_MANAGER"
    FIELD_TEAM = "FIELD_TEAM"
    MEDICAL = "MEDICAL"
    SCIENTIST = "SCIENTIST"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.OPERATIONS)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    personnel = relationship("Personnel", back_populates="user", uselist=False)
