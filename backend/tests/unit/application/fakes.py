"""In-memory stand-ins for the auth ports, so use cases are tested without infrastructure."""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID

from app.application.ports import InvalidTokenError, TokenClaims
from app.domain.auth.roles import UserRole

REVIEWER_ID = UUID("11111111-1111-4111-8111-000000000001")
REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000002")
HASH_PREFIX = "hashed:"
TOKEN_SEPARATOR = "|"
FAKE_EXPIRES_IN = 28_800


@dataclass
class FakeUser:
    """Structural `UserRecord`."""

    id: UUID
    email: str
    full_name: str
    role: str
    password_hash: str
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))


def reviewer(password: str = "secret") -> FakeUser:
    return FakeUser(
        id=REVIEWER_ID,
        email="revisor@striker.local",
        full_name="Laura Revisora",
        role=UserRole.REVIEWER,
        password_hash=FakePasswordHasher().hash(password),
    )


def registrar(password: str = "secret") -> FakeUser:
    return FakeUser(
        id=REGISTRAR_ID,
        email="registrador@striker.local",
        full_name="Carlos Registrador",
        role=UserRole.REGISTRAR,
        password_hash=FakePasswordHasher().hash(password),
    )


class FakeUserRepository:
    """`UserRepository` over a list."""

    def __init__(self, users: list[FakeUser]) -> None:
        self._users = users

    def get_by_id(self, user_id: UUID) -> FakeUser | None:
        return next((user for user in self._users if user.id == user_id), None)

    def get_by_email(self, email: str) -> FakeUser | None:
        return next((user for user in self._users if user.email == email), None)

    def list_all(self) -> list[FakeUser]:
        return sorted(self._users, key=lambda user: user.full_name)


class FakePasswordHasher:
    """Reversible "hash" that keeps the tests readable."""

    def hash(self, password: str) -> str:
        return f"{HASH_PREFIX}{password}"

    def verify(self, password: str, password_hash: str) -> bool:
        return password_hash == self.hash(password)


class FakeTokenService:
    """Tokens are `<user id>|<role>`; anything else is invalid."""

    expires_in_seconds = FAKE_EXPIRES_IN

    def create_token(self, user_id: UUID, role: str) -> str:
        return f"{user_id}{TOKEN_SEPARATOR}{role}"

    def decode_token(self, token: str) -> TokenClaims:
        try:
            raw_id, role = token.split(TOKEN_SEPARATOR)
            return TokenClaims(user_id=UUID(raw_id), role=role)
        except ValueError as error:
            raise InvalidTokenError("malformed fake token") from error
