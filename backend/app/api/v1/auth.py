"""Authentication endpoints: `POST /auth/login` (public) and `GET /auth/me`."""

from http import HTTPStatus

from fastapi import APIRouter

from app.api.dependencies import Hasher, Tokens, UserRepo
from app.api.security import CurrentUser
from app.api.v1.docs.operations import CURRENT_USER, LOGIN, documented
from app.api.v1.schemas.auth import LoginRequest, LoginResponse
from app.api.v1.schemas.users import UserResponse
from app.application.auth.login_use_case import LoginUseCase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    response_model=LoginResponse,
    **documented(LOGIN, HTTPStatus.BAD_REQUEST, HTTPStatus.UNAUTHORIZED),
)
def login(body: LoginRequest, users: UserRepo, hasher: Hasher, tokens: Tokens) -> LoginResponse:
    """Validate email and password; wrong credentials answer 401 `UNAUTHORIZED`."""
    session = LoginUseCase(users, hasher, tokens).authenticate(body.email, body.password)
    return LoginResponse(
        access_token=session.access_token,
        expires_in=session.expires_in_seconds,
        user=UserResponse.model_validate(session.user),
    )


@router.get("/me", response_model=UserResponse, **documented(CURRENT_USER, HTTPStatus.UNAUTHORIZED))
def get_current_user_profile(user: CurrentUser) -> UserResponse:
    """The owner of the bearer token and their role."""
    return UserResponse.model_validate(user)
