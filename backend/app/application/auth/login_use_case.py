"""Email and password authentication that issues an access token."""

from dataclasses import dataclass

from app.application.errors import UnauthorizedError
from app.application.ports import PasswordHasher, TokenService, UserRecord, UserRepository

# One message for unknown email and wrong password, so the response does not reveal which
# emails exist.
MESSAGE_INVALID_CREDENTIALS = "Invalid email or password"


@dataclass(frozen=True)
class AuthenticatedSession:
    """Outcome of a successful login."""

    user: UserRecord
    access_token: str
    expires_in_seconds: int


class LoginUseCase:
    """Verify credentials and issue a token for the authenticated user."""

    def __init__(self, users: UserRepository, hasher: PasswordHasher, tokens: TokenService) -> None:
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    def authenticate(self, email: str, password: str) -> AuthenticatedSession:
        """Return a session for the user, or raise `UnauthorizedError` on bad credentials."""
        user = self._users.get_by_email(email)
        if user is None or not self._hasher.verify(password, user.password_hash):
            raise UnauthorizedError(MESSAGE_INVALID_CREDENTIALS)
        return AuthenticatedSession(
            user=user,
            access_token=self._tokens.create_token(user.id, user.role),
            expires_in_seconds=self._tokens.expires_in_seconds,
        )
