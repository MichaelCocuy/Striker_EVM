"""Input and output value objects of the EVM domain."""

from dataclasses import dataclass
from decimal import Decimal

from app.domain.evm.conventions import MAX_PERCENT, MIN_PERCENT, ZERO
from app.domain.evm.errors import InvalidActivityError
from app.domain.evm.status import CostStatus, ScheduleStatus

MESSAGE_BUDGET_MUST_BE_POSITIVE = "budget at completion must be greater than zero"
MESSAGE_ACTUAL_COST_MUST_BE_NON_NEGATIVE = "actual cost must be zero or greater"
MESSAGE_PERCENT_OUT_OF_RANGE = f"progress percent must be between {MIN_PERCENT} and {MAX_PERCENT}"


@dataclass(frozen=True)
class ActivityInput:
    """Raw data registered for an activity; percents use the 0-100 scale."""

    name: str
    budget_at_completion: Decimal
    planned_progress_percent: Decimal
    actual_progress_percent: Decimal
    actual_cost: Decimal

    def __post_init__(self) -> None:
        _validate_budget(self.budget_at_completion)
        _validate_actual_cost(self.actual_cost)
        _validate_percent("planned_progress_percent", self.planned_progress_percent)
        _validate_percent("actual_progress_percent", self.actual_progress_percent)


@dataclass(frozen=True)
class EvmIndicators:
    """EVM indicators, rounded for presentation; None marks a non-computable value."""

    budget_at_completion: Decimal
    planned_value: Decimal
    earned_value: Decimal
    actual_cost: Decimal
    cost_variance: Decimal
    schedule_variance: Decimal
    cost_performance_index: Decimal | None
    schedule_performance_index: Decimal | None
    estimate_at_completion: Decimal | None
    variance_at_completion: Decimal | None
    cost_status: CostStatus
    schedule_status: ScheduleStatus
    notes: tuple[str, ...] = ()


def _validate_budget(budget_at_completion: Decimal) -> None:
    if budget_at_completion <= ZERO:
        raise InvalidActivityError("budget_at_completion", MESSAGE_BUDGET_MUST_BE_POSITIVE)


def _validate_actual_cost(actual_cost: Decimal) -> None:
    if actual_cost < ZERO:
        raise InvalidActivityError("actual_cost", MESSAGE_ACTUAL_COST_MUST_BE_NON_NEGATIVE)


def _validate_percent(field: str, percent: Decimal) -> None:
    if not MIN_PERCENT <= percent <= MAX_PERCENT:
        raise InvalidActivityError(field, MESSAGE_PERCENT_OUT_OF_RANGE)
