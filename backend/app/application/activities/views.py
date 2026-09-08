"""Read model the activity use cases return: an activity row with its owner resolved."""

from collections.abc import Sequence
from dataclasses import dataclass

from app.application.ports import ActivityRecord, UserRecord, UserRepository


@dataclass(frozen=True)
class ActivityView:
    """An activity ready to serialize, together with the user responsible for it."""

    activity: ActivityRecord
    owner: UserRecord


def build_activity_views(
    activities: Sequence[ActivityRecord], users: UserRepository
) -> list[ActivityView]:
    """Resolve the owners of several activities with a single user query."""
    owners = {user.id: user for user in users.get_by_ids({item.owner_id for item in activities})}
    return [
        ActivityView(activity=activity, owner=owners[activity.owner_id]) for activity in activities
    ]
