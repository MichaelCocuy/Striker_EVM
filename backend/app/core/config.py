"""Application settings loaded from environment variables (and an optional .env file)."""

from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# The user-facing OpenAPI metadata (summary, description, tags, servers, contact) lives in
# `app/api/openapi.py`; only the identity of the service belongs here.
APP_TITLE = "Striker EVM API"
APP_VERSION = "1.0.0"

DEFAULT_DATABASE_URL = "postgresql+psycopg://striker:striker@localhost:5432/striker"
DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173"
ORIGINS_SEPARATOR = ","
DEFAULT_BCRYPT_ROUNDS = 12
# HS256 keys shorter than 32 bytes are rejected as insecure by RFC 7518; override outside local.
DEFAULT_JWT_SECRET = "change-me-in-production-at-least-32-bytes"


class Settings(BaseSettings):
    """Runtime configuration; every field can be overridden with an upper-case env var."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = DEFAULT_DATABASE_URL
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [DEFAULT_FRONTEND_ORIGIN]
    )

    api_v1_prefix: str = "/api/v1"
    docs_url: str = "/api-docs"
    openapi_url: str = "/api-docs/openapi.json"

    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 480
    bcrypt_rounds: int = DEFAULT_BCRYPT_ROUNDS

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_comma_separated_origins(cls, value: object) -> object:
        """Accept `CORS_ORIGINS=http://a,http://b` in addition to a real list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(ORIGINS_SEPARATOR) if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings instance (cached after the first read)."""
    return Settings()
