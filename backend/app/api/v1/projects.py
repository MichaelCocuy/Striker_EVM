"""Projects endpoints: `GET/POST /projects` and `GET/PUT/DELETE /projects/{projectId}`.

Reading is open to both roles; creating, editing and deleting are REVIEWER capabilities, decided
by the use cases through the domain policy rather than here.
"""

from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.dependencies import DbSession
from app.api.security import CurrentUser
from app.api.v1.docs.operations import (
    CREATE_PROJECT,
    DELETE_PROJECT,
    GET_PROJECT,
    LIST_PROJECTS,
    UPDATE_PROJECT,
    documented,
)
from app.api.v1.params import PROJECT_ID_PARAM, ProjectId
from app.api.v1.schemas.projects import ProjectRequest, ProjectResponse
from app.application.projects.create_project_use_case import CreateProjectUseCase
from app.application.projects.delete_project_use_case import DeleteProjectUseCase
from app.application.projects.get_project_use_case import GetProjectUseCase
from app.application.projects.list_projects_use_case import ListProjectsUseCase
from app.application.projects.update_project_use_case import UpdateProjectUseCase
from app.infrastructure.db.repositories import (
    SqlAlchemyProjectRepository,
    SqlAlchemyUserRepository,
)

PROJECT_PATH = f"/{{{PROJECT_ID_PARAM}}}"
COLLECTION_PATH = ""

router = APIRouter(prefix="/projects", tags=["projects"])


def get_list_use_case(session: DbSession) -> ListProjectsUseCase:
    """Listing use case wired to the repositories of the request session."""
    return ListProjectsUseCase(
        SqlAlchemyProjectRepository(session), SqlAlchemyUserRepository(session)
    )


def get_read_use_case(session: DbSession) -> GetProjectUseCase:
    """Retrieval use case wired to the repositories of the request session."""
    return GetProjectUseCase(
        SqlAlchemyProjectRepository(session), SqlAlchemyUserRepository(session)
    )


def get_create_use_case(session: DbSession) -> CreateProjectUseCase:
    """Creation use case wired to the repositories of the request session."""
    return CreateProjectUseCase(SqlAlchemyProjectRepository(session))


def get_update_use_case(session: DbSession) -> UpdateProjectUseCase:
    """Update use case wired to the repositories of the request session."""
    return UpdateProjectUseCase(
        SqlAlchemyProjectRepository(session), SqlAlchemyUserRepository(session)
    )


def get_delete_use_case(session: DbSession) -> DeleteProjectUseCase:
    """Deletion use case wired to the repositories of the request session."""
    return DeleteProjectUseCase(SqlAlchemyProjectRepository(session))


ListUseCase = Annotated[ListProjectsUseCase, Depends(get_list_use_case)]
ReadUseCase = Annotated[GetProjectUseCase, Depends(get_read_use_case)]
CreateUseCase = Annotated[CreateProjectUseCase, Depends(get_create_use_case)]
UpdateUseCase = Annotated[UpdateProjectUseCase, Depends(get_update_use_case)]
DeleteUseCase = Annotated[DeleteProjectUseCase, Depends(get_delete_use_case)]


@router.get(
    COLLECTION_PATH,
    response_model=list[ProjectResponse],
    **documented(LIST_PROJECTS, HTTPStatus.UNAUTHORIZED),
)
def list_projects(_: CurrentUser, use_case: ListUseCase) -> list[ProjectResponse]:
    """Every project with its activity count, newest first; both roles may read it."""
    return [ProjectResponse.from_view(view) for view in use_case.execute()]


@router.post(
    COLLECTION_PATH,
    status_code=HTTPStatus.CREATED,
    response_model=ProjectResponse,
    **documented(
        CREATE_PROJECT, HTTPStatus.BAD_REQUEST, HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN
    ),
)
def create_project(
    body: ProjectRequest, actor: CurrentUser, use_case: CreateUseCase
) -> ProjectResponse:
    """Create an empty project; the caller is recorded as `createdBy` (REVIEWER only)."""
    return ProjectResponse.from_view(use_case.execute(actor, body.to_data()))


@router.get(
    PROJECT_PATH,
    response_model=ProjectResponse,
    **documented(GET_PROJECT, HTTPStatus.UNAUTHORIZED, HTTPStatus.NOT_FOUND),
)
def get_project(project_id: ProjectId, _: CurrentUser, use_case: ReadUseCase) -> ProjectResponse:
    """One project by id, with its activity count; both roles may read it."""
    return ProjectResponse.from_view(use_case.execute(project_id))


@router.put(
    PROJECT_PATH,
    response_model=ProjectResponse,
    **documented(
        UPDATE_PROJECT,
        HTTPStatus.BAD_REQUEST,
        HTTPStatus.UNAUTHORIZED,
        HTTPStatus.FORBIDDEN,
        HTTPStatus.NOT_FOUND,
    ),
)
def update_project(
    project_id: ProjectId, body: ProjectRequest, actor: CurrentUser, use_case: UpdateUseCase
) -> ProjectResponse:
    """Overwrite name and description of a project (REVIEWER only)."""
    return ProjectResponse.from_view(use_case.execute(actor, project_id, body.to_data()))


@router.delete(
    PROJECT_PATH,
    status_code=HTTPStatus.NO_CONTENT,
    **documented(
        DELETE_PROJECT, HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN, HTTPStatus.NOT_FOUND
    ),
)
def delete_project(project_id: ProjectId, actor: CurrentUser, use_case: DeleteUseCase) -> Response:
    """Delete a project and, in cascade, its activities (REVIEWER only)."""
    use_case.execute(actor, project_id)
    return Response(status_code=HTTPStatus.NO_CONTENT)
