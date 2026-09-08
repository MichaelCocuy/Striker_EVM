"""Listing of users so a REVIEWER can assign activity owners."""

from app.application.errors import ForbiddenError
from app.application.ports import UserRecord, UserRepository
from app.domain.auth.policy import can_list_users

MESSAGE_LIST_USERS_FORBIDDEN = "Only REVIEWER users can list users"


class ListUsersUseCase:
    """Return every user, ordered by name, to callers allowed by the domain policy."""

    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def execute(self, actor: UserRecord) -> list[UserRecord]:
        """List users for the actor; raise `ForbiddenError` when their role is not allowed."""
        if not can_list_users(actor.role):
            raise ForbiddenError(MESSAGE_LIST_USERS_FORBIDDEN)
        return self._users.list_all()
