"""Users endpoint: `GET /users` (REVIEWER only)."""

from http import HTTPStatus

from fastapi import APIRouter

from app.api.dependencies import UserRepo
from app.api.security import ReviewerUser
from app.api.v1.docs.operations import LIST_USERS, documented
from app.api.v1.schemas.users import UserResponse
from app.application.auth.list_users_use_case import ListUsersUseCase

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=list[UserResponse],
    **documented(LIST_USERS, HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN),
)
def list_users(actor: ReviewerUser, users: UserRepo) -> list[UserResponse]:
    """Every user ordered by name, so a REVIEWER can pick activity owners."""
    return [UserResponse.model_validate(user) for user in ListUsersUseCase(users).execute(actor)]
