"""Ports (interfaces) the application layer depends on; infrastructure provides the adapters.

Records are structural `Protocol`s so ORM models satisfy them without the application layer
importing SQLAlchemy.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Protocol
from uuid import UUID


class UserRecord(Protocol):
    """A persisted user."""

    id: UUID
    email: str
    full_name: str
    role: str
    password_hash: str
    created_at: datetime


class ProjectRecord(Protocol):
    """A persisted project."""

    id: UUID
    name: str
    description: str | None
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ActivityRecord(Protocol):
    """A persisted activity with its raw EVM inputs (percents on the 0-100 scale)."""

    id: UUID
    project_id: UUID
    owner_id: UUID
    name: str
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class ProjectData:
    """Editable fields of a project."""

    name: str
    description: str | None = None


@dataclass(frozen=True)
class ActivityData:
    """Editable fields of an activity."""

    owner_id: UUID
    name: str
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal


@dataclass(frozen=True)
class ProjectWithActivityCount:
    """A project together with how many activities it contains."""

    project: ProjectRecord
    activity_count: int


class UserRepository(Protocol):
    """Read access to users."""

    def get_by_id(self, user_id: UUID) -> UserRecord | None: ...

    def get_by_email(self, email: str) -> UserRecord | None: ...

    def list_all(self) -> list[UserRecord]: ...


class ProjectRepository(Protocol):
    """Persistence of projects."""

    def list_with_activity_count(self) -> list[ProjectWithActivityCount]: ...

    def get(self, project_id: UUID) -> ProjectRecord | None: ...

    def add(self, data: ProjectData, created_by: UUID) -> ProjectRecord: ...

    def update(self, project: ProjectRecord, data: ProjectData) -> ProjectRecord: ...

    def delete(self, project: ProjectRecord) -> None: ...


class ActivityRepository(Protocol):
    """Persistence of activities."""

    def list_by_project(self, project_id: UUID) -> list[ActivityRecord]: ...

    def get(self, activity_id: UUID) -> ActivityRecord | None: ...

    def add(self, project_id: UUID, data: ActivityData) -> ActivityRecord: ...

    def update(self, activity: ActivityRecord, data: ActivityData) -> ActivityRecord: ...

    def delete(self, activity: ActivityRecord) -> None: ...


class InvalidTokenError(Exception):
    """The access token is malformed, expired, tampered with or lacks a required claim."""


@dataclass(frozen=True)
class TokenClaims:
    """Identity carried by a valid access token."""

    user_id: UUID
    role: str


class PasswordHasher(Protocol):
    """Hashing and verification of user passwords."""

    def hash(self, password: str) -> str: ...

    def verify(self, password: str, password_hash: str) -> bool: ...


class TokenService(Protocol):
    """Issuing and validation of access tokens."""

    @property
    def expires_in_seconds(self) -> int: ...

    def create_token(self, user_id: UUID, role: str) -> str: ...

    def decode_token(self, token: str) -> TokenClaims: ...
