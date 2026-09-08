"""Resolution of the user responsible for an activity: domain policy plus existence check."""

from uuid import UUID

from app.application.errors import ForbiddenError, ValidationError, field_detail
from app.application.ports import UserRecord, UserRepository
from app.domain.auth.errors import OwnerNotAllowedError, OwnerRequiredError
from app.domain.auth.policy import resolve_activity_owner

OWNER_FIELD = "ownerId"
MESSAGE_INVALID_OWNER = "The activity owner is not valid"
MESSAGE_OWNER_UNKNOWN = "ownerId does not match any user"


def resolve_owner(
    actor: UserRecord, requested_owner_id: UUID | None, users: UserRepository
) -> UserRecord:
    """Return the user who must own the activity, per ARQUITECTURA.md section 11.

    A REVIEWER has to name an existing user; a REGISTRAR always owns their own activities and
    cannot hand one to somebody else. A missing owner is a validation error, a foreign one is
    forbidden and an id that matches no user is a validation error again.
    """
    owner_id = _resolve_owner_id(actor, requested_owner_id)
    owner = users.get_by_id(owner_id)
    if owner is None:
        raise ValidationError(
            MESSAGE_INVALID_OWNER, [field_detail(OWNER_FIELD, MESSAGE_OWNER_UNKNOWN)]
        )
    return owner


def _resolve_owner_id(actor: UserRecord, requested_owner_id: UUID | None) -> UUID:
    try:
        return resolve_activity_owner(actor.id, actor.role, requested_owner_id)
    except OwnerRequiredError as error:
        raise ValidationError(
            MESSAGE_INVALID_OWNER, [field_detail(OWNER_FIELD, str(error))]
        ) from error
    except OwnerNotAllowedError as error:
        raise ForbiddenError(str(error)) from error
