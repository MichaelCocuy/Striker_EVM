"""Activities endpoints, nested under their project.

`GET/POST /projects/{projectId}/activities` and
`PUT/DELETE /projects/{projectId}/activities/{activityId}`. Both roles take part; who may own,
edit or delete an activity is decided by the use cases through the domain policy.
"""

from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.dependencies import DbSession
from app.api.security import CurrentUser
from app.api.v1.docs.operations import (
    CREATE_ACTIVITY,
    DELETE_ACTIVITY,
    LIST_ACTIVITIES,
    UPDATE_ACTIVITY,
    documented,
)
from app.api.v1.params import ACTIVITY_ID_PARAM, PROJECT_ID_PARAM, ActivityId, ProjectId
from app.api.v1.schemas.activities import ActivityRequest, ActivityResponse
from app.application.activities.create_activity_use_case import CreateActivityUseCase
from app.application.activities.delete_activity_use_case import DeleteActivityUseCase
from app.application.activities.list_activities_use_case import ListActivitiesUseCase
from app.application.activities.update_activity_use_case import UpdateActivityUseCase
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyProjectRepository,
    SqlAlchemyUserRepository,
)

ACTIVITY_PATH = f"/{{{ACTIVITY_ID_PARAM}}}"
COLLECTION_PATH = ""

router = APIRouter(prefix=f"/projects/{{{PROJECT_ID_PARAM}}}/activities", tags=["activities"])


def get_list_use_case(session: DbSession) -> ListActivitiesUseCase:
    """Listing use case wired to the repositories of the request session."""
    return ListActivitiesUseCase(
        SqlAlchemyProjectRepository(session),
        SqlAlchemyActivityRepository(session),
        SqlAlchemyUserRepository(session),
    )


def get_create_use_case(session: DbSession) -> CreateActivityUseCase:
    """Creation use case wired to the repositories of the request session."""
    return CreateActivityUseCase(
        SqlAlchemyProjectRepository(session),
        SqlAlchemyActivityRepository(session),
        SqlAlchemyUserRepository(session),
    )


def get_update_use_case(session: DbSession) -> UpdateActivityUseCase:
    """Update use case wired to the repositories of the request session."""
    return UpdateActivityUseCase(
        SqlAlchemyActivityRepository(session), SqlAlchemyUserRepository(session)
    )


def get_delete_use_case(session: DbSession) -> DeleteActivityUseCase:
    """Deletion use case wired to the repositories of the request session."""
    return DeleteActivityUseCase(SqlAlchemyActivityRepository(session))


ListUseCase = Annotated[ListActivitiesUseCase, Depends(get_list_use_case)]
CreateUseCase = Annotated[CreateActivityUseCase, Depends(get_create_use_case)]
UpdateUseCase = Annotated[UpdateActivityUseCase, Depends(get_update_use_case)]
DeleteUseCase = Annotated[DeleteActivityUseCase, Depends(get_delete_use_case)]


@router.get(
    COLLECTION_PATH,
    response_model=list[ActivityResponse],
    **documented(LIST_ACTIVITIES, HTTPStatus.UNAUTHORIZED, HTTPStatus.NOT_FOUND),
)
def list_activities(
    project_id: ProjectId, _: CurrentUser, use_case: ListUseCase
) -> list[ActivityResponse]:
    """Raw measures of every activity of the project, oldest first; indicators live in `/evm`."""
    return [ActivityResponse.from_view(view) for view in use_case.execute(project_id)]


@router.post(
    COLLECTION_PATH,
    status_code=HTTPStatus.CREATED,
    response_model=ActivityResponse,
    **documented(
        CREATE_ACTIVITY,
        HTTPStatus.BAD_REQUEST,
        HTTPStatus.UNAUTHORIZED,
        HTTPStatus.FORBIDDEN,
        HTTPStatus.NOT_FOUND,
    ),
)
def create_activity(
    project_id: ProjectId, body: ActivityRequest, actor: CurrentUser, use_case: CreateUseCase
) -> ActivityResponse:
    """Add an activity: a REGISTRAR owns it, a REVIEWER must name an existing `ownerId`."""
    return ActivityResponse.from_view(use_case.execute(actor, project_id, body.to_command()))


@router.put(
    ACTIVITY_PATH,
    response_model=ActivityResponse,
    **documented(
        UPDATE_ACTIVITY,
        HTTPStatus.BAD_REQUEST,
        HTTPStatus.UNAUTHORIZED,
        HTTPStatus.FORBIDDEN,
        HTTPStatus.NOT_FOUND,
    ),
)
def update_activity(
    project_id: ProjectId,
    activity_id: ActivityId,
    body: ActivityRequest,
    actor: CurrentUser,
    use_case: UpdateUseCase,
) -> ActivityResponse:
    """Overwrite an activity of the project; a REVIEWER may also reassign its owner."""
    return ActivityResponse.from_view(
        use_case.execute(actor, project_id, activity_id, body.to_command())
    )


@router.delete(
    ACTIVITY_PATH,
    status_code=HTTPStatus.NO_CONTENT,
    **documented(
        DELETE_ACTIVITY, HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN, HTTPStatus.NOT_FOUND
    ),
)
def delete_activity(
    project_id: ProjectId, activity_id: ActivityId, actor: CurrentUser, use_case: DeleteUseCase
) -> Response:
    """Delete an activity of the project; a REGISTRAR only its own."""
    use_case.execute(actor, project_id, activity_id)
    return Response(status_code=HTTPStatus.NO_CONTENT)
