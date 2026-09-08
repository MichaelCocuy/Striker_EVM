"""Replacement of the editable fields of a project (REVIEWER only)."""

from uuid import UUID

from app.application.ports import (
    ProjectData,
    ProjectRepository,
    ProjectWithActivityCount,
    UserRecord,
    UserRepository,
)
from app.application.projects.access import ensure_can_manage_projects, load_counted_project
from app.application.projects.views import ProjectView, build_project_view


class UpdateProjectUseCase:
    """Overwrite name and description of an existing project."""

    def __init__(self, projects: ProjectRepository, users: UserRepository) -> None:
        self._projects = projects
        self._users = users

    def execute(self, actor: UserRecord, project_id: UUID, data: ProjectData) -> ProjectView:
        """Update the project; 403 for other roles, 404 when the id is unknown.

        Editing never changes how many activities the project holds, so the count read before
        the update is still the right one.
        """
        ensure_can_manage_projects(actor)
        counted = load_counted_project(self._projects, project_id)
        project = self._projects.update(counted.project, data)
        updated = ProjectWithActivityCount(project=project, activity_count=counted.activity_count)
        return build_project_view(updated, self._users)
