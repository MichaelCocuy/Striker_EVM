"""Listing of the activities of a project with their raw measures; available to both roles."""

from uuid import UUID

from app.application.activities.views import ActivityView, build_activity_views
from app.application.ports import ActivityRepository, ProjectRepository, UserRepository
from app.application.projects.access import load_project


class ListActivitiesUseCase:
    """Return the activities of one project, oldest first, with their owners."""

    def __init__(
        self,
        projects: ProjectRepository,
        activities: ActivityRepository,
        users: UserRepository,
    ) -> None:
        self._projects = projects
        self._activities = activities
        self._users = users

    def execute(self, project_id: UUID) -> list[ActivityView]:
        """List the activities; an unknown project raises `NotFoundError`, an empty one is []."""
        load_project(self._projects, project_id)
        return build_activity_views(self._activities.list_by_project(project_id), self._users)
