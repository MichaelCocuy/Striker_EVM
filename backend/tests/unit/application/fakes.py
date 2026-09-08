"""In-memory stand-ins for the application ports, so use cases run without infrastructure."""

from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from app.application.ports import (
    ActivityData,
    InvalidTokenError,
    ProjectData,
    ProjectWithActivityCount,
    TokenClaims,
)
from app.domain.auth.roles import UserRole

REVIEWER_ID = UUID("11111111-1111-4111-8111-000000000001")
REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000002")
SECOND_REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000003")
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


def second_registrar(password: str = "secret") -> FakeUser:
    return FakeUser(
        id=SECOND_REGISTRAR_ID,
        email="registrador2@striker.local",
        full_name="Ana Registradora",
        role=UserRole.REGISTRAR,
        password_hash=FakePasswordHasher().hash(password),
    )


@dataclass
class FakeProject:
    """Structural `ProjectRecord`."""

    name: str
    created_by: UUID
    description: str | None = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))


@dataclass
class FakeActivity:
    """Structural `ActivityRecord`."""

    project_id: UUID
    owner_id: UUID
    name: str
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(tz=UTC))


class FakeUserRepository:
    """`UserRepository` over a list."""

    def __init__(self, users: list[FakeUser]) -> None:
        self._users = users

    def get_by_id(self, user_id: UUID) -> FakeUser | None:
        return next((user for user in self._users if user.id == user_id), None)

    def get_by_email(self, email: str) -> FakeUser | None:
        return next((user for user in self._users if user.email == email), None)

    def get_by_ids(self, user_ids: Iterable[UUID]) -> list[FakeUser]:
        wanted = set(user_ids)
        return [user for user in self._users if user.id in wanted]

    def list_all(self) -> list[FakeUser]:
        return sorted(self._users, key=lambda user: user.full_name)


class FakeActivityRepository:
    """`ActivityRepository` over a list."""

    def __init__(self) -> None:
        self._activities: list[FakeActivity] = []

    def list_by_project(self, project_id: UUID) -> list[FakeActivity]:
        return [activity for activity in self._activities if activity.project_id == project_id]

    def get(self, activity_id: UUID) -> FakeActivity | None:
        return next((a for a in self._activities if a.id == activity_id), None)

    def get_in_project(self, project_id: UUID, activity_id: UUID) -> FakeActivity | None:
        activity = self.get(activity_id)
        return activity if activity is not None and activity.project_id == project_id else None

    def add(self, project_id: UUID, data: ActivityData) -> FakeActivity:
        activity = FakeActivity(project_id=project_id, **data.__dict__)
        self._activities.append(activity)
        return activity

    def update(self, activity: FakeActivity, data: ActivityData) -> FakeActivity:
        for name, value in data.__dict__.items():
            setattr(activity, name, value)
        return activity

    def delete(self, activity: FakeActivity) -> None:
        self._activities.remove(activity)

    def delete_by_project(self, project_id: UUID) -> None:
        """Mimic the database `ON DELETE CASCADE`."""
        self._activities = [a for a in self._activities if a.project_id != project_id]


class FakeProjectRepository:
    """`ProjectRepository` over a list; activity counts come from the activity fake."""

    def __init__(self, activities: FakeActivityRepository) -> None:
        self._projects: list[FakeProject] = []
        self._activities = activities

    def list_with_activity_count(self) -> list[ProjectWithActivityCount]:
        return [self._count(project) for project in self._projects]

    def get(self, project_id: UUID) -> FakeProject | None:
        return next((project for project in self._projects if project.id == project_id), None)

    def get_with_activity_count(self, project_id: UUID) -> ProjectWithActivityCount | None:
        project = self.get(project_id)
        return None if project is None else self._count(project)

    def add(self, data: ProjectData, created_by: UUID) -> FakeProject:
        project = FakeProject(name=data.name, description=data.description, created_by=created_by)
        self._projects.append(project)
        return project

    def update(self, project: FakeProject, data: ProjectData) -> FakeProject:
        project.name = data.name
        project.description = data.description
        return project

    def delete(self, project: FakeProject) -> None:
        self._projects.remove(project)
        self._activities.delete_by_project(project.id)

    def _count(self, project: FakeProject) -> ProjectWithActivityCount:
        count = len(self._activities.list_by_project(project.id))
        return ProjectWithActivityCount(project=project, activity_count=count)


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
