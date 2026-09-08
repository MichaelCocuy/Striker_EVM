"""`Activity` and `ActivityInput` schemas of the contract.

The numeric constraints mirror the EVM domain rules (`budgetAtCompletion > 0`, `actualCost >= 0`,
percents in 0-100) so a badly shaped body is rejected by FastAPI before reaching the use case,
which keeps the same rules for every other caller.
"""

from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import Field, StringConstraints

from app.api.v1.schemas.common import CamelCaseModel, JsonNumber, UserSummary
from app.application.activities.commands import ActivityCommand
from app.application.activities.views import ActivityView

NAME_MAX_LENGTH = 120
NAME_MIN_LENGTH = 1
MONEY_MAX_DIGITS = 14
MONEY_DECIMAL_PLACES = 2
MONEY_MAX = Decimal("999999999999.99")
MONEY_MIN = Decimal("0")
PERCENT_MAX_DIGITS = 5
PERCENT_MIN = Decimal("0")
PERCENT_MAX = Decimal("100")

ActivityName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=NAME_MIN_LENGTH, max_length=NAME_MAX_LENGTH
    ),
]
BudgetAtCompletion = Annotated[
    Decimal,
    Field(
        gt=MONEY_MIN,
        le=MONEY_MAX,
        max_digits=MONEY_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
    ),
]
ActualCost = Annotated[
    Decimal,
    Field(
        ge=MONEY_MIN,
        le=MONEY_MAX,
        max_digits=MONEY_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
    ),
]
ProgressPercent = Annotated[
    Decimal,
    Field(
        ge=PERCENT_MIN,
        le=PERCENT_MAX,
        max_digits=PERCENT_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
    ),
]


class ActivityRequest(CamelCaseModel):
    """`ActivityInput`: create and edit body; `ownerId` follows the rules of each role."""

    name: ActivityName
    owner_id: UUID | None = None
    budget_at_completion: BudgetAtCompletion
    planned_progress_percent: ProgressPercent
    actual_progress_percent: ProgressPercent
    actual_cost: ActualCost

    def to_command(self) -> ActivityCommand:
        """Payload the activity use cases resolve the owner for and persist."""
        return ActivityCommand(
            name=self.name,
            owner_id=self.owner_id,
            budget_at_completion=self.budget_at_completion,
            planned_progress_percent=self.planned_progress_percent,
            actual_progress_percent=self.actual_progress_percent,
            actual_cost=self.actual_cost,
        )


class ActivityResponse(CamelCaseModel):
    """`Activity`: the stored activity with its raw measures and its owner (no indicators)."""

    id: UUID
    project_id: UUID
    name: str
    owner: UserSummary
    budget_at_completion: JsonNumber
    planned_progress_percent: JsonNumber
    actual_progress_percent: JsonNumber
    actual_cost: JsonNumber
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_view(cls, view: ActivityView) -> "ActivityResponse":
        """Build the response from the use case result."""
        activity = view.activity
        return cls(
            id=activity.id,
            project_id=activity.project_id,
            name=activity.name,
            owner=UserSummary.model_validate(view.owner),
            budget_at_completion=activity.budget_at_completion,
            planned_progress_percent=activity.planned_progress_percent,
            actual_progress_percent=activity.actual_progress_percent,
            actual_cost=activity.actual_cost,
            created_at=activity.created_at,
            updated_at=activity.updated_at,
        )
