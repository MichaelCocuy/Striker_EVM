"""SQLAlchemy adapter of the `UserRepository` port."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import UserModel


class SqlAlchemyUserRepository:
    """Read-only access to `app_user` (users are managed by the init script)."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, user_id: UUID) -> UserModel | None:
        """Return the user with the given id, or None."""
        return self._session.get(UserModel, user_id)

    def get_by_email(self, email: str) -> UserModel | None:
        """Return the user with the given email, or None."""
        statement = select(UserModel).where(UserModel.email == email)
        return self._session.scalars(statement).one_or_none()

    def get_by_ids(self, user_ids: Iterable[UUID]) -> list[UserModel]:
        """Return the users whose ids are given, in one query; unknown ids are skipped."""
        statement = select(UserModel).where(UserModel.id.in_(list(user_ids)))
        return list(self._session.scalars(statement))

    def list_all(self) -> list[UserModel]:
        """Return every user ordered by full name."""
        statement = select(UserModel).order_by(UserModel.full_name)
        return list(self._session.scalars(statement))
