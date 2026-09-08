"""Deletion of a project and, in cascade, of its activities (REVIEWER only)."""

from uuid import UUID

from app.application.ports import ProjectRepository, UserRecord
from app.application.projects.access import ensure_can_manage_projects, load_project


class DeleteProjectUseCase:
    """Remove a project; the database cascades the deletion to its activities."""

    def __init__(self, projects: ProjectRepository) -> None:
        self._projects = projects

    def execute(self, actor: UserRecord, project_id: UUID) -> None:
        """Delete the project; 403 for other roles, 404 when the id is unknown."""
        ensure_can_manage_projects(actor)
        self._projects.delete(load_project(self._projects, project_id))
