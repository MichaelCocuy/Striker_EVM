"""Liveness endpoint: reports whether the service and its database respond."""

from enum import StrEnum

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.dependencies import DbSession
from app.infrastructure.db.health import probe_database

router = APIRouter(tags=["health"])


class ComponentStatus(StrEnum):
    """Health of one component of the service."""

    OK = "ok"
    UNAVAILABLE = "unavailable"


class HealthResponse(BaseModel):
    """Body of `GET /health`."""

    status: ComponentStatus
    database: ComponentStatus


@router.get(
    "/health",
    summary="Check that the service and the database respond",
    response_model=HealthResponse,
)
def get_health(session: DbSession) -> HealthResponse:
    """The API itself is up when this answers; `database` tells whether `SELECT 1` succeeded."""
    database = ComponentStatus.OK if probe_database(session) else ComponentStatus.UNAVAILABLE
    return HealthResponse(status=ComponentStatus.OK, database=database)
