"""Users endpoint: `GET /users` (REVIEWER only)."""

from http import HTTPStatus

from fastapi import APIRouter

from app.api.dependencies import UserRepo
from app.api.errors import ErrorResponse
from app.api.security import ReviewerUser
from app.api.v1.schemas.users import UserResponse
from app.application.auth.list_users_use_case import ListUsersUseCase

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    summary="List users",
    response_model=list[UserResponse],
    responses={
        HTTPStatus.UNAUTHORIZED: {"model": ErrorResponse},
        HTTPStatus.FORBIDDEN: {"model": ErrorResponse},
    },
)
def list_users(actor: ReviewerUser, users: UserRepo) -> list[UserResponse]:
    """Every user ordered by name, so a REVIEWER can pick activity owners."""
    return [UserResponse.model_validate(user) for user in ListUsersUseCase(users).execute(actor)]
