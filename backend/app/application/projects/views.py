"""Read model the project use cases return: a project row with its count and its creator."""

from collections.abc import Sequence
from dataclasses import dataclass

from app.application.ports import (
    ProjectRecord,
    ProjectWithActivityCount,
    UserRecord,
    UserRepository,
)


@dataclass(frozen=True)
class ProjectView:
    """A project ready to serialize: the row, how many activities it has and who created it."""

    project: ProjectRecord
    activity_count: int
    creator: UserRecord


def build_project_views(
    counted: Sequence[ProjectWithActivityCount], users: UserRepository
) -> list[ProjectView]:
    """Resolve the creators of several projects with a single user query."""
    creator_ids = {item.project.created_by for item in counted}
    creators = {user.id: user for user in users.list_by_ids(creator_ids)}
    return [
        ProjectView(
            project=item.project,
            activity_count=item.activity_count,
            creator=creators[item.project.created_by],
        )
        for item in counted
    ]


def build_project_view(counted: ProjectWithActivityCount, users: UserRepository) -> ProjectView:
    """Resolve the creator of a single project."""
    return build_project_views([counted], users)[0]
