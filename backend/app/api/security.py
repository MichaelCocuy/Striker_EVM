"""Authentication and authorization dependencies (ARQUITECTURA.md section 11).

`CurrentUser` yields the authenticated user or 401 `UNAUTHORIZED`; `require_role(...)` builds a
dependency that additionally answers 403 `FORBIDDEN` for other roles. `ReviewerUser` is the
ready-made REVIEWER-only variant. Routers of later modules should import these annotated types.
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.dependencies import Tokens, UserRepo
from app.application.auth.current_user import CurrentUserResolver
from app.application.errors import ForbiddenError, UnauthorizedError
from app.application.ports import UserRecord
from app.domain.auth.roles import UserRole

SECURITY_SCHEME_NAME = "bearerAuth"
BEARER_FORMAT = "JWT"
SECURITY_SCHEME_DESCRIPTION = (
    "JWT obtained from `POST /auth/login`, sent as `Authorization: Bearer <token>`."
)
MESSAGE_MISSING_TOKEN = "Missing bearer token"
MESSAGE_ROLE_REQUIRED = "This action requires one of the roles: {roles}"
ROLES_SEPARATOR = ", "

bearer_scheme = HTTPBearer(
    scheme_name=SECURITY_SCHEME_NAME,
    bearerFormat=BEARER_FORMAT,
    description=SECURITY_SCHEME_DESCRIPTION,
    auto_error=False,
)

BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]


def get_current_user(credentials: BearerCredentials, users: UserRepo, tokens: Tokens) -> UserRecord:
    """Resolve the bearer token to a persisted user; 401 when absent or invalid."""
    if credentials is None:
        raise UnauthorizedError(MESSAGE_MISSING_TOKEN)
    return CurrentUserResolver(users, tokens).resolve(credentials.credentials)


CurrentUser = Annotated[UserRecord, Depends(get_current_user)]


def require_role(*roles: UserRole) -> Callable[[UserRecord], UserRecord]:
    """Build a dependency that lets through only users holding one of the given roles."""
    allowed = {role.value for role in roles}

    def check_role(user: CurrentUser) -> UserRecord:
        if user.role not in allowed:
            raise ForbiddenError(
                MESSAGE_ROLE_REQUIRED.format(roles=ROLES_SEPARATOR.join(sorted(allowed)))
            )
        return user

    return check_role


ReviewerUser = Annotated[UserRecord, Depends(require_role(UserRole.REVIEWER))]
