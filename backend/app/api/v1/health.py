"""Liveness endpoint: reports whether the service and its database respond."""

from enum import StrEnum

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.api.dependencies import DbSession
from app.api.v1.docs.examples import HEALTH_EXAMPLE
from app.api.v1.docs.operations import HEALTH, documented
from app.core.config import APP_VERSION
from app.infrastructure.db.health import probe_database

router = APIRouter(tags=["health"])


class ComponentStatus(StrEnum):
    """Health of one component of the service."""

    OK = "ok"
    UNAVAILABLE = "unavailable"


class HealthResponse(BaseModel):
    """Body of `GET /health`."""

    model_config = ConfigDict(json_schema_extra={"example": HEALTH_EXAMPLE})

    status: ComponentStatus = Field(
        description="Estado del servicio HTTP; es `ok` siempre que el API alcance a responder."
    )
    database: ComponentStatus = Field(
        description=(
            "Estado de la base de datos: `ok` si acepta una consulta trivial, `unavailable` "
            "si no responde."
        )
    )
    version: str = Field(
        default=APP_VERSION, description="Versión del backend que atiende la solicitud."
    )


@router.get("/health", response_model=HealthResponse, **documented(HEALTH))
def get_health(session: DbSession) -> HealthResponse:
    """The API itself is up when this answers; `database` tells whether `SELECT 1` succeeded."""
    database = ComponentStatus.OK if probe_database(session) else ComponentStatus.UNAVAILABLE
    return HealthResponse(status=ComponentStatus.OK, database=database)
