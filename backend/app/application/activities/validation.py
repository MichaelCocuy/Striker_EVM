"""Validation of the raw EVM numbers through the domain, so API and domain never disagree."""

from app.application.activities.commands import ActivityCommand
from app.application.errors import ValidationError, field_detail
from app.domain.evm.errors import InvalidActivityError
from app.domain.evm.models import ActivityInput

MESSAGE_INVALID_MEASURES = "The activity measures are not valid"
# The domain names its fields in snake_case; the contract spells them in camelCase.
CONTRACT_FIELD_NAMES = {
    "budget_at_completion": "budgetAtCompletion",
    "planned_progress_percent": "plannedProgressPercent",
    "actual_progress_percent": "actualProgressPercent",
    "actual_cost": "actualCost",
}


def validate_measures(command: ActivityCommand) -> None:
    """Reject numbers the EVM domain refuses, naming the offending field.

    The domain value object is built for its rules only: the stored activity keeps the raw
    numbers and the EVM report builds its own input when it needs to calculate.
    """
    try:
        ActivityInput(
            name=command.name,
            budget_at_completion=command.budget_at_completion,
            planned_progress_percent=command.planned_progress_percent,
            actual_progress_percent=command.actual_progress_percent,
            actual_cost=command.actual_cost,
        )
    except InvalidActivityError as error:
        detail = field_detail(CONTRACT_FIELD_NAMES[error.field], error.message)
        raise ValidationError(MESSAGE_INVALID_MEASURES, [detail]) from error
