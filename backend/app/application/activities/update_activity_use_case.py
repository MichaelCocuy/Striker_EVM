"""Replacement of the data of an activity, restricted by the ownership policy."""

from uuid import UUID

from app.application.activities.access import ensure_can_modify_activity, load_activity_in_project
from app.application.activities.commands import ActivityCommand
from app.application.activities.owners import resolve_owner
from app.application.activities.validation import validate_measures
from app.application.activities.views import ActivityView
from app.application.ports import ActivityRepository, UserRecord, UserRepository


class UpdateActivityUseCase:
    """Overwrite an activity a REVIEWER may always edit and a REGISTRAR only when they own it."""

    def __init__(self, activities: ActivityRepository, users: UserRepository) -> None:
        self._activities = activities
        self._users = users

    def execute(
        self, actor: UserRecord, project_id: UUID, activity_id: UUID, command: ActivityCommand
    ) -> ActivityView:
        """Update the activity.

        The activity must belong to the given project (404 otherwise) and the actor must be
        allowed to modify it (403). Resolving the owner again lets a REVIEWER reassign the
        activity while a REGISTRAR keeps it.
        """
        activity = load_activity_in_project(self._activities, project_id, activity_id)
        ensure_can_modify_activity(actor, activity)
        owner = resolve_owner(actor, command.owner_id, self._users)
        validate_measures(command)
        updated = self._activities.update(activity, command.to_data(owner.id))
        return ActivityView(activity=updated, owner=owner)
