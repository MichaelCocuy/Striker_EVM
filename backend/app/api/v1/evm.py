"""EVM report endpoint: `GET /projects/{projectId}/evm` (both roles)."""

from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import DbSession
from app.api.security import CurrentUser
from app.api.v1.docs.operations import EVM_REPORT, documented
from app.api.v1.params import PROJECT_ID_PARAM, ProjectId
from app.api.v1.schemas.evm import EvmReportSchema
from app.application.evm.get_project_report import GetProjectEvmReport
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyProjectRepository,
    SqlAlchemyUserRepository,
)

REPORT_PATH = f"/{{{PROJECT_ID_PARAM}}}/evm"

router = APIRouter(prefix="/projects", tags=["evm"])


def get_report_use_case(session: DbSession) -> GetProjectEvmReport:
    """Use case wired to the SQLAlchemy repositories of the request session."""
    return GetProjectEvmReport(
        SqlAlchemyProjectRepository(session),
        SqlAlchemyActivityRepository(session),
        SqlAlchemyUserRepository(session),
    )


ReportUseCase = Annotated[GetProjectEvmReport, Depends(get_report_use_case)]


@router.get(
    REPORT_PATH,
    response_model=EvmReportSchema,
    **documented(EVM_REPORT, HTTPStatus.UNAUTHORIZED, HTTPStatus.NOT_FOUND),
)
def get_project_evm_report(
    project_id: ProjectId, _: CurrentUser, use_case: ReportUseCase
) -> EvmReportSchema:
    """Indicators of every activity plus the consolidated project total, computed on read."""
    return EvmReportSchema.from_report(use_case.execute(project_id))
