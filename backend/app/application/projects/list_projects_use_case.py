"""Listing of the project portfolio; available to both roles."""

from app.application.ports import ProjectRepository, UserRepository
from app.application.projects.views import ProjectView, build_project_views


class ListProjectsUseCase:
    """Return every project, newest first, with its activity count and its creator."""

    def __init__(self, projects: ProjectRepository, users: UserRepository) -> None:
        self._projects = projects
        self._users = users

    def execute(self) -> list[ProjectView]:
        """List the projects; any authenticated user may read them."""
        return build_project_views(self._projects.list_with_activity_count(), self._users)
