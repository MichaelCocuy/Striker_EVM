"""Deletion of an activity, restricted by the ownership policy."""

from uuid import UUID

from app.application.activities.access import ensure_can_modify_activity, load_activity_in_project
from app.application.ports import ActivityRepository, UserRecord


class DeleteActivityUseCase:
    """Remove an activity a REVIEWER may always delete and a REGISTRAR only when they own it."""

    def __init__(self, activities: ActivityRepository) -> None:
        self._activities = activities

    def execute(self, actor: UserRecord, project_id: UUID, activity_id: UUID) -> None:
        """Delete the activity; 404 when it is not in that project, 403 when it is not theirs."""
        activity = load_activity_in_project(self._activities, project_id, activity_id)
        ensure_can_modify_activity(actor, activity)
        self._activities.delete(activity)
