from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.OPERATIONS


class UserRegister(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    email: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
