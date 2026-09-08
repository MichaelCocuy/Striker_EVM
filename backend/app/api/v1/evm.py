"""EVM report endpoint: `GET /projects/{projectId}/evm` (both roles)."""

from http import HTTPStatus
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path

from app.api.dependencies import DbSession
from app.api.errors import ErrorResponse
from app.api.security import CurrentUser
from app.api.v1.schemas.evm import EvmReportSchema
from app.application.evm.get_project_report import GetProjectEvmReport
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyProjectRepository,
    SqlAlchemyUserRepository,
)

PROJECT_ID_PARAM = "projectId"

router = APIRouter(prefix="/projects", tags=["evm"])

ProjectId = Annotated[UUID, Path(alias=PROJECT_ID_PARAM, description="Project identifier")]


def get_report_use_case(session: DbSession) -> GetProjectEvmReport:
    """Use case wired to the SQLAlchemy repositories of the request session."""
    return GetProjectEvmReport(
        SqlAlchemyProjectRepository(session),
        SqlAlchemyActivityRepository(session),
        SqlAlchemyUserRepository(session),
    )


ReportUseCase = Annotated[GetProjectEvmReport, Depends(get_report_use_case)]


@router.get(
    f"/{{{PROJECT_ID_PARAM}}}/evm",
    summary="Get the EVM report of a project",
    response_model=EvmReportSchema,
    responses={
        HTTPStatus.UNAUTHORIZED: {"model": ErrorResponse},
        HTTPStatus.NOT_FOUND: {"model": ErrorResponse},
    },
)
def get_project_evm_report(
    project_id: ProjectId, _: CurrentUser, use_case: ReportUseCase
) -> EvmReportSchema:
    """Indicators of every activity plus the consolidated project total, computed on read.

    A project without activities answers 200 with an empty list; an unknown project answers 404.
    """
    return EvmReportSchema.from_report(use_case.execute(project_id))
