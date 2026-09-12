from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.alert import AlertType, AlertSeverity, AlertStatus, AlertEntityType


class AlertBase(BaseModel):
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    title: str = Field(..., min_length=1, description="Short summary title of the alert")
    message: str = Field(..., min_length=1, description="Detailed explanatory message of the condition")
    entity_type: Optional[AlertEntityType] = Field(None, description="Type of related entity if applicable")
    entity_id: Optional[int] = Field(None, description="ID of the related entity if applicable")
    station_id: Optional[int] = Field(None, description="Associated station ID if applicable")


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    severity: Optional[AlertSeverity] = None
    title: Optional[str] = None
    message: Optional[str] = None
    status: Optional[AlertStatus] = None


class AlertAcknowledgeRequest(BaseModel):
    pass


class AlertResolveRequest(BaseModel):
    pass


class AlertResponse(AlertBase):
    id: int
    status: AlertStatus
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
