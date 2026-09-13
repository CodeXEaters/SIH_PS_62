from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database.base import Base


class InventoryTransfer(Base):
    __tablename__ = "inventory_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_code = Column(String, unique=True, index=True, nullable=False)
    item_name = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String, nullable=False)
    from_location = Column(String, nullable=False)
    to_location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="COMPLETED")  # COMPLETED, PENDING, IN_TRANSIT
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    authorizing_officer = Column(String, nullable=False)
    notes = Column(String, nullable=True)
