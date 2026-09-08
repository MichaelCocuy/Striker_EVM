"""Input of the activity write use cases, as the client sent it."""

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from app.application.ports import ActivityData


@dataclass(frozen=True)
class ActivityCommand:
    """Fields of a create or update request; `owner_id` is still the *requested* owner."""

    name: str
    owner_id: UUID | None
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal

    def to_data(self, owner_id: UUID) -> ActivityData:
        """Fields to persist, once the policy has decided who really owns the activity."""
        return ActivityData(
            owner_id=owner_id,
            name=self.name,
            budget_at_completion=self.budget_at_completion,
            planned_progress_percent=self.planned_progress_percent,
            actual_progress_percent=self.actual_progress_percent,
            actual_cost=self.actual_cost,
        )
