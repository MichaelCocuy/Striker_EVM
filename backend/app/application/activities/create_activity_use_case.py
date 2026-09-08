"""Creation of an activity inside a project; both roles may do it, with different owner rules."""

from uuid import UUID

from app.application.activities.commands import ActivityCommand
from app.application.activities.owners import resolve_owner
from app.application.activities.validation import validate_measures
from app.application.activities.views import ActivityView
from app.application.ports import ActivityRepository, ProjectRepository, UserRecord, UserRepository
from app.application.projects.access import load_project


class CreateActivityUseCase:
    """Persist an activity whose owner the domain policy decides from the actor's role."""

    def __init__(
        self,
        projects: ProjectRepository,
        activities: ActivityRepository,
        users: UserRepository,
    ) -> None:
        self._projects = projects
        self._activities = activities
        self._users = users

    def execute(
        self, actor: UserRecord, project_id: UUID, command: ActivityCommand
    ) -> ActivityView:
        """Create the activity: 404 for an unknown project, then owner and measure checks."""
        load_project(self._projects, project_id)
        owner = resolve_owner(actor, command.owner_id, self._users)
        validate_measures(command)
        activity = self._activities.add(project_id, command.to_data(owner.id))
        return ActivityView(activity=activity, owner=owner)
