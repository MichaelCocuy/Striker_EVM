"""Conversions between persisted records and domain value objects."""

from app.application.ports import ActivityRecord
from app.domain.evm.models import ActivityInput


def to_activity_input(activity: ActivityRecord) -> ActivityInput:
    """Build the EVM calculator input from a persisted activity."""
    return ActivityInput(
        name=activity.name,
        budget_at_completion=activity.budget_at_completion,
        planned_progress_percent=activity.planned_progress_percent,
        actual_progress_percent=activity.actual_progress_percent,
        actual_cost=activity.actual_cost,
    )
