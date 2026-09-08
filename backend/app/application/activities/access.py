"""Guards of the activity use cases: existence inside the project and right to modify."""

from uuid import UUID

from app.application.errors import ForbiddenError, NotFoundError
from app.application.ports import ActivityRecord, ActivityRepository, UserRecord
from app.domain.auth.policy import can_modify_activity

RESOURCE_ACTIVITY = "Activity"
MESSAGE_MODIFY_ACTIVITY_FORBIDDEN = "REGISTRAR users can only modify the activities they own"


def load_activity_in_project(
    activities: ActivityRepository, project_id: UUID, activity_id: UUID
) -> ActivityRecord:
    """Return the activity of that project.

    An activity that belongs to another project is reported as missing, so the nested route
    never exposes activities through the wrong parent.
    """
    activity = activities.get_in_project(project_id, activity_id)
    if activity is None:
        raise NotFoundError(RESOURCE_ACTIVITY, activity_id)
    return activity


def ensure_can_modify_activity(actor: UserRecord, activity: ActivityRecord) -> None:
    """Raise `ForbiddenError` unless the actor may edit or delete that activity."""
    if not can_modify_activity(actor.id, actor.role, activity.owner_id):
        raise ForbiddenError(MESSAGE_MODIFY_ACTIVITY_FORBIDDEN)
