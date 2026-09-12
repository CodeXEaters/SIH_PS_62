from pydantic import BaseModel, ConfigDict


class StationBase(BaseModel):
    name: str
    location: str
    latitude: float
    longitude: float
    type: str  # e.g., HQ, TRANSIT_HUB, PERMANENT_STATION, FIELD_CAMP
    status: str = "OPERATIONAL"  # e.g., OPERATIONAL, MAINTENANCE, STANDBY


class StationCreate(StationBase):
    pass


class StationResponse(StationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
