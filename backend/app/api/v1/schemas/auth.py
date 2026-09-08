"""`LoginRequest` and `LoginResponse` schemas of the contract."""

from typing import Literal

from pydantic import Field

from app.api.v1.schemas.common import CamelCaseModel
from app.api.v1.schemas.users import UserResponse

EMAIL_MAX_LENGTH = 254
PASSWORD_MIN_LENGTH = 1
PASSWORD_MAX_LENGTH = 128
TOKEN_TYPE_BEARER = "bearer"


class LoginRequest(CamelCaseModel):
    """Credentials sent to `POST /auth/login`."""

    email: str = Field(min_length=1, max_length=EMAIL_MAX_LENGTH)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class LoginResponse(CamelCaseModel):
    """Access token, its type and lifetime in seconds, plus the authenticated user."""

    access_token: str
    token_type: Literal["bearer"] = TOKEN_TYPE_BEARER
    expires_in: int
    user: UserResponse
