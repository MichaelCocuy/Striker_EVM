"""In-memory stand-ins for the auth ports, so use cases are tested without infrastructure."""

from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
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


@dataclass
class FakeProject:
    """Structural `ProjectRecord`."""

    id: UUID
    name: str
    created_by: UUID
    description: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))


@dataclass
class FakeActivity:
    """Structural `ActivityRecord`."""

    id: UUID
    project_id: UUID
    owner_id: UUID
    name: str
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))


class FakeProjectRepository:
    """Read side of `ProjectRepository` over a list."""

    def __init__(self, projects: list[FakeProject]) -> None:
        self._projects = projects

    def get(self, project_id: UUID) -> FakeProject | None:
        return next((project for project in self._projects if project.id == project_id), None)


class FakeActivityRepository:
    """Read side of `ActivityRepository` over a list, preserving insertion order."""

    def __init__(self, activities: list[FakeActivity]) -> None:
        self._activities = activities

    def list_by_project(self, project_id: UUID) -> list[FakeActivity]:
        return [activity for activity in self._activities if activity.project_id == project_id]

    def get(self, activity_id: UUID) -> FakeActivity | None:
        return next((a for a in self._activities if a.id == activity_id), None)


class FakeUserDirectory(FakeUserRepository):
    """`FakeUserRepository` plus the bulk lookup the EVM report uses to resolve owners."""

    def __init__(self, users: list[FakeUser]) -> None:
        super().__init__(users)
        self.lookups = 0

    def list_by_ids(self, user_ids: Iterable[UUID]) -> list[FakeUser]:
        self.lookups += 1
        wanted = set(user_ids)
        return [user for user in self._users if user.id in wanted]
