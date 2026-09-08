"""Authorization rules of ARQUITECTURA.md section 11 (permission matrix), free of any framework.

Roles are accepted as `UserRole` or as their plain string value so persisted records can be
checked without conversion.
"""

from uuid import UUID

from app.domain.auth.errors import OwnerNotAllowedError, OwnerRequiredError
from app.domain.auth.roles import UserRole


def can_manage_projects(role: str) -> bool:
    """Only REVIEWER users create, edit or delete projects."""
    return role == UserRole.REVIEWER


def can_list_users(role: str) -> bool:
    """Only REVIEWER users list users (to assign activity owners)."""
    return role == UserRole.REVIEWER


def can_modify_activity(actor_id: UUID, actor_role: str, activity_owner_id: UUID) -> bool:
    """A REVIEWER modifies any activity; a REGISTRAR only the activities they own."""
    if actor_role == UserRole.REVIEWER:
        return True
    return actor_id == activity_owner_id


def resolve_activity_owner(
    actor_id: UUID, actor_role: str, requested_owner_id: UUID | None
) -> UUID:
    """Decide who owns an activity being created or edited.

    A REVIEWER must state the owner explicitly (`OwnerRequiredError` otherwise). A REGISTRAR is
    always the owner: omitting `ownerId` or repeating their own id is accepted, while requesting
    a different owner is rejected with `OwnerNotAllowedError` rather than silently overridden,
    so the client learns that the field was not honoured.
    """
    if actor_role == UserRole.REVIEWER:
        if requested_owner_id is None:
            raise OwnerRequiredError()
        return requested_owner_id
    if requested_owner_id is not None and requested_owner_id != actor_id:
        raise OwnerNotAllowedError()
    return actor_id
