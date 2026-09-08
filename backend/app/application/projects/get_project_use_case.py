"""Retrieval of a single project by id; available to both roles."""

from uuid import UUID

from app.application.ports import ProjectRepository, UserRepository
from app.application.projects.access import load_counted_project
from app.application.projects.views import ProjectView, build_project_view


class GetProjectUseCase:
    """Return one project with its activity count and its creator."""

    def __init__(self, projects: ProjectRepository, users: UserRepository) -> None:
        self._projects = projects
        self._users = users

    def execute(self, project_id: UUID) -> ProjectView:
        """Return the project, or raise `NotFoundError` when the id is unknown."""
        return build_project_view(load_counted_project(self._projects, project_id), self._users)
