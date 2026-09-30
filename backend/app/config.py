from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://dhruv_user:dhruv_password@localhost:5432/dhruv_db"
    SECRET_KEY: str = "dhruv_polar_expedition_secret_key_super_secure_jwt_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """
        Render and several cloud PostgreSQL providers format the connection string
        as 'postgres://...'. SQLAlchemy 1.4+ / 2.0+ requires 'postgresql://'.
        """
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        # Security: When CORS allow_credentials=True, '*' is rejected by browsers and insecure.
        # Filter out '*' if specific origins are present; if only '*' was specified, retain it.
        non_wildcard = [o for o in origins if o != "*"]
        return non_wildcard if non_wildcard else origins


settings = Settings()

