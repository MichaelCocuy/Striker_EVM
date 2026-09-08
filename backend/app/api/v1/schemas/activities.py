"""`Activity` and `ActivityInput` schemas of the contract.

The numeric constraints mirror the EVM domain rules (`budgetAtCompletion > 0`, `actualCost >= 0`,
percents in 0-100) so a badly shaped body is rejected by FastAPI before reaching the use case,
which keeps the same rules for every other caller.
"""

from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import ConfigDict, Field, StringConstraints

from app.api.v1.docs import fields
from app.api.v1.docs.examples import ACTIVITY_EXAMPLE, ACTIVITY_INPUT_EXAMPLE
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

OWNER_ID_DESCRIPTION = (
    "Id del usuario responsable. Un `REGISTRAR` puede omitirlo (queda a su nombre) y solo puede "
    "enviar su propio id; un `REVIEWER` está obligado a enviar el id de un usuario existente."
)

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
        description=fields.BUDGET_AT_COMPLETION,
    ),
]
ActualCost = Annotated[
    Decimal,
    Field(
        ge=MONEY_MIN,
        le=MONEY_MAX,
        max_digits=MONEY_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
        description=fields.ACTUAL_COST,
    ),
]
PlannedProgressPercent = Annotated[
    Decimal,
    Field(
        ge=PERCENT_MIN,
        le=PERCENT_MAX,
        max_digits=PERCENT_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
        description=fields.PLANNED_PROGRESS_PERCENT,
    ),
]
ActualProgressPercent = Annotated[
    Decimal,
    Field(
        ge=PERCENT_MIN,
        le=PERCENT_MAX,
        max_digits=PERCENT_MAX_DIGITS,
        decimal_places=MONEY_DECIMAL_PLACES,
        description=fields.ACTUAL_PROGRESS_PERCENT,
    ),
]


class ActivityRequest(CamelCaseModel):
    """Cuerpo de creación y edición de una actividad; con él se registra el avance y el costo."""

    model_config = ConfigDict(json_schema_extra={"example": ACTIVITY_INPUT_EXAMPLE})

    name: ActivityName = Field(description=fields.ACTIVITY_NAME)
    owner_id: UUID | None = Field(default=None, description=OWNER_ID_DESCRIPTION)
    budget_at_completion: BudgetAtCompletion
    planned_progress_percent: PlannedProgressPercent
    actual_progress_percent: ActualProgressPercent
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
    """Actividad almacenada con sus datos crudos y su responsable; sin indicadores EVM."""

    model_config = ConfigDict(json_schema_extra={"example": ACTIVITY_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) de la actividad.")
    project_id: UUID = Field(description="Identificador (UUID) del proyecto que la contiene.")
    name: str = Field(description=fields.ACTIVITY_NAME)
    owner: UserSummary = Field(description=fields.ACTIVITY_OWNER)
    budget_at_completion: JsonNumber = Field(description=fields.BUDGET_AT_COMPLETION)
    planned_progress_percent: JsonNumber = Field(description=fields.PLANNED_PROGRESS_PERCENT)
    actual_progress_percent: JsonNumber = Field(description=fields.ACTUAL_PROGRESS_PERCENT)
    actual_cost: JsonNumber = Field(description=fields.ACTUAL_COST)
    created_at: datetime = Field(description="Fecha y hora (UTC) de creación de la actividad.")
    updated_at: datetime = Field(
        description="Fecha y hora (UTC) del último registro de avance o costo."
    )

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
