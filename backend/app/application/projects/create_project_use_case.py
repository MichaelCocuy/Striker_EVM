"""Creation of a project by the REVIEWER who requests it."""

from app.application.ports import ProjectData, ProjectRepository, UserRecord
from app.application.projects.access import ensure_can_manage_projects
from app.application.projects.views import ProjectView

NEW_PROJECT_ACTIVITY_COUNT = 0


class CreateProjectUseCase:
    """Persist an empty project whose creator is the authenticated user."""

    def __init__(self, projects: ProjectRepository) -> None:
        self._projects = projects

    def execute(self, actor: UserRecord, data: ProjectData) -> ProjectView:
        """Create the project; raise `ForbiddenError` when the actor does not manage projects."""
        ensure_can_manage_projects(actor)
        project = self._projects.add(data, created_by=actor.id)
        return ProjectView(
            project=project, activity_count=NEW_PROJECT_ACTIVITY_COUNT, creator=actor
        )
