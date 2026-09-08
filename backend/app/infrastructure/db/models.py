"""SQLAlchemy 2.0 declarative models mirroring ARQUITECTURA.md section 4.

Types are portable (`Uuid`, `DateTime(timezone=True)`, `Numeric`) so the same metadata runs on
PostgreSQL in production and on SQLite in the repository tests.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    MetaData,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.domain.auth.roles import UserRole

MONEY_PRECISION = 14
MONEY_SCALE = 2
PERCENT_PRECISION = 5
PERCENT_SCALE = 2
MIN_PERCENT = 0
MAX_PERCENT = 100

EMAIL_MAX_LENGTH = 255
NAME_MAX_LENGTH = 200
ROLE_MAX_LENGTH = 20
PASSWORD_HASH_MAX_LENGTH = 255

ALLOWED_ROLES_SQL = ", ".join(f"'{role.value}'" for role in UserRole)

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Declarative base with deterministic constraint names (needed by Alembic)."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class UserModel(Base):
    """Row of `app_user`."""

    __tablename__ = "app_user"
    __table_args__ = (CheckConstraint(f"role IN ({ALLOWED_ROLES_SQL})", name="role_allowed"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(EMAIL_MAX_LENGTH), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(NAME_MAX_LENGTH), nullable=False)
    role: Mapped[str] = mapped_column(String(ROLE_MAX_LENGTH), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(PASSWORD_HASH_MAX_LENGTH), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ProjectModel(Base):
    """Row of `project`."""

    __tablename__ = "project"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(NAME_MAX_LENGTH), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[UUID] = mapped_column(Uuid, ForeignKey("app_user.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    activities: Mapped[list["ActivityModel"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )


class ActivityModel(Base):
    """Row of `activity`; stores only raw inputs, indicators are derived on read."""

    __tablename__ = "activity"
    __table_args__ = (
        CheckConstraint("budget_at_completion > 0", name="budget_positive"),
        CheckConstraint("actual_cost >= 0", name="actual_cost_non_negative"),
        CheckConstraint(
            f"planned_progress_percent BETWEEN {MIN_PERCENT} AND {MAX_PERCENT}",
            name="planned_percent_range",
        ),
        CheckConstraint(
            f"actual_progress_percent BETWEEN {MIN_PERCENT} AND {MAX_PERCENT}",
            name="actual_percent_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    project_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("project.id", ondelete="CASCADE"), nullable=False, index=True
    )
    owner_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("app_user.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(NAME_MAX_LENGTH), nullable=False)
    budget_at_completion: Mapped[Decimal] = mapped_column(
        Numeric(MONEY_PRECISION, MONEY_SCALE), nullable=False
    )
    planned_progress_percent: Mapped[Decimal] = mapped_column(
        Numeric(PERCENT_PRECISION, PERCENT_SCALE), nullable=False
    )
    actual_progress_percent: Mapped[Decimal] = mapped_column(
        Numeric(PERCENT_PRECISION, PERCENT_SCALE), nullable=False
    )
    actual_cost: Mapped[Decimal] = mapped_column(
        Numeric(MONEY_PRECISION, MONEY_SCALE), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    project: Mapped[ProjectModel] = relationship(back_populates="activities")
