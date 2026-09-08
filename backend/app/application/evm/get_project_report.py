"""EVM report of a project: indicators of every activity plus the consolidated project total."""

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from app.application.errors import NotFoundError
from app.application.mappers import to_activity_input
from app.application.ports import (
    ActivityRecord,
    ActivityRepository,
    ProjectRepository,
    UserRepository,
)
from app.domain.evm import (
    ActivityInput,
    EvmIndicators,
    calculate_activity_indicators,
    calculate_project_indicators,
)

PROJECT_RESOURCE = "Project"

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    """Default clock: the current instant in UTC."""
    return datetime.now(tz=UTC)


@dataclass(frozen=True)
class OwnerSummary:
    """Identification of the user responsible for an activity."""

    id: UUID
    full_name: str


@dataclass(frozen=True)
class ActivityEvmReport:
    """One activity of the report: raw inputs and the indicators derived from them."""

    id: UUID
    name: str
    owner: OwnerSummary
    input: ActivityInput
    indicators: EvmIndicators


@dataclass(frozen=True)
class ProjectEvmReport:
    """Complete report: project identification, consolidated indicators and its activities."""

    project_id: UUID
    project_name: str
    project_indicators: EvmIndicators
    activities: tuple[ActivityEvmReport, ...]
    generated_at: datetime


class GetProjectEvmReport:
    """Build the EVM report of a project from its persisted activities."""

    def __init__(
        self,
        projects: ProjectRepository,
        activities: ActivityRepository,
        users: UserRepository,
        clock: Clock = utc_now,
    ) -> None:
        self._projects = projects
        self._activities = activities
        self._users = users
        self._clock = clock

    def execute(self, project_id: UUID) -> ProjectEvmReport:
        """Return the report; raise `NotFoundError` when the project does not exist.

        Activities keep the repository order (creation order). The consolidated indicators are
        computed by the domain from the same inputs, so money is summed and indices are never
        averaged.
        """
        project = self._projects.get(project_id)
        if project is None:
            raise NotFoundError(PROJECT_RESOURCE, project_id)
        activities = self._activities.list_by_project(project_id)
        owners = self._owners_of(activities)
        inputs = [to_activity_input(activity) for activity in activities]
        return ProjectEvmReport(
            project_id=project.id,
            project_name=project.name,
            project_indicators=calculate_project_indicators(inputs),
            activities=tuple(
                ActivityEvmReport(
                    id=activity.id,
                    name=activity.name,
                    owner=owners[activity.owner_id],
                    input=activity_input,
                    indicators=calculate_activity_indicators(activity_input),
                )
                for activity, activity_input in zip(activities, inputs, strict=True)
            ),
            generated_at=self._clock(),
        )

    def _owners_of(self, activities: Sequence[ActivityRecord]) -> dict[UUID, OwnerSummary]:
        """Resolve every distinct owner with a single query (no per-activity lookups)."""
        owner_ids = {activity.owner_id for activity in activities}
        if not owner_ids:
            return {}
        return {
            user.id: OwnerSummary(id=user.id, full_name=user.full_name)
            for user in self._users.list_by_ids(owner_ids)
        }
