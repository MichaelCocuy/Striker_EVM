"""EVM indicator calculation for a single activity and for a whole project."""

from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal

from app.domain.evm.conventions import ZERO, percent_to_fraction, round_index, round_money
from app.domain.evm.models import ActivityInput, EvmIndicators
from app.domain.evm.notes import (
    NOTE_NO_ACTIVITIES,
    NOTE_NO_ACTUAL_COST,
    NOTE_NO_PROGRESS_FORECAST,
    NOTE_NOT_SCHEDULED_YET,
    NOTE_NOT_STARTED,
)
from app.domain.evm.status import (
    CostStatus,
    ScheduleStatus,
    interpret_cost_index,
    interpret_schedule_index,
)


@dataclass(frozen=True)
class _BaseValues:
    """Unrounded monetary values every derived indicator is built from."""

    budget_at_completion: Decimal
    planned_value: Decimal
    earned_value: Decimal
    actual_cost: Decimal


def calculate_activity_indicators(activity: ActivityInput) -> EvmIndicators:
    """Compute the EVM indicators of one activity."""
    return _build_indicators(_base_values_of(activity))


def calculate_project_indicators(activities: Sequence[ActivityInput]) -> EvmIndicators:
    """Compute the consolidated EVM indicators of a project by summing money, never indices."""
    if not activities:
        return _empty_project_indicators()
    return _build_indicators(_sum_base_values([_base_values_of(a) for a in activities]))


def _base_values_of(activity: ActivityInput) -> _BaseValues:
    budget = activity.budget_at_completion
    return _BaseValues(
        budget_at_completion=budget,
        planned_value=percent_to_fraction(activity.planned_progress_percent) * budget,
        earned_value=percent_to_fraction(activity.actual_progress_percent) * budget,
        actual_cost=activity.actual_cost,
    )


def _sum_base_values(values: Sequence[_BaseValues]) -> _BaseValues:
    return _BaseValues(
        budget_at_completion=sum((v.budget_at_completion for v in values), ZERO),
        planned_value=sum((v.planned_value for v in values), ZERO),
        earned_value=sum((v.earned_value for v in values), ZERO),
        actual_cost=sum((v.actual_cost for v in values), ZERO),
    )


def _build_indicators(base: _BaseValues) -> EvmIndicators:
    """Derive variances, indices and forecasts from unrounded values, rounding only at the end."""
    cost_performance_index = _safe_divide(base.earned_value, base.actual_cost)
    schedule_performance_index = _safe_divide(base.earned_value, base.planned_value)
    estimate_at_completion = _estimate_at_completion(
        base.budget_at_completion, cost_performance_index
    )
    variance_at_completion = _variance_at_completion(
        base.budget_at_completion, estimate_at_completion
    )
    return EvmIndicators(
        budget_at_completion=round_money(base.budget_at_completion),
        planned_value=round_money(base.planned_value),
        earned_value=round_money(base.earned_value),
        actual_cost=round_money(base.actual_cost),
        cost_variance=round_money(base.earned_value - base.actual_cost),
        schedule_variance=round_money(base.earned_value - base.planned_value),
        cost_performance_index=_round_optional_index(cost_performance_index),
        schedule_performance_index=_round_optional_index(schedule_performance_index),
        estimate_at_completion=_round_optional_money(estimate_at_completion),
        variance_at_completion=_round_optional_money(variance_at_completion),
        cost_status=interpret_cost_index(cost_performance_index),
        schedule_status=interpret_schedule_index(schedule_performance_index),
        notes=_collect_notes(base, cost_performance_index, schedule_performance_index),
    )


def _empty_project_indicators() -> EvmIndicators:
    zero_money = round_money(ZERO)
    return EvmIndicators(
        budget_at_completion=zero_money,
        planned_value=zero_money,
        earned_value=zero_money,
        actual_cost=zero_money,
        cost_variance=zero_money,
        schedule_variance=zero_money,
        cost_performance_index=None,
        schedule_performance_index=None,
        estimate_at_completion=None,
        variance_at_completion=None,
        cost_status=CostStatus.NOT_APPLICABLE,
        schedule_status=ScheduleStatus.NOT_APPLICABLE,
        notes=(NOTE_NO_ACTIVITIES,),
    )


def _safe_divide(numerator: Decimal, denominator: Decimal) -> Decimal | None:
    """Divide, or return None when the denominator is zero (non-computable indicator)."""
    if denominator == ZERO:
        return None
    return numerator / denominator


def _estimate_at_completion(
    budget_at_completion: Decimal, cost_performance_index: Decimal | None
) -> Decimal | None:
    """EAC = BAC / CPI, using the unrounded CPI; None when CPI is missing or zero."""
    if cost_performance_index is None or cost_performance_index == ZERO:
        return None
    return budget_at_completion / cost_performance_index


def _variance_at_completion(
    budget_at_completion: Decimal, estimate_at_completion: Decimal | None
) -> Decimal | None:
    """VAC = BAC - EAC; None when EAC is not computable."""
    if estimate_at_completion is None:
        return None
    return budget_at_completion - estimate_at_completion


def _round_optional_money(value: Decimal | None) -> Decimal | None:
    return None if value is None else round_money(value)


def _round_optional_index(value: Decimal | None) -> Decimal | None:
    return None if value is None else round_index(value)


def _collect_notes(
    base: _BaseValues,
    cost_performance_index: Decimal | None,
    schedule_performance_index: Decimal | None,
) -> tuple[str, ...]:
    """Explain every non-computable indicator, without repeating the same reason."""
    candidate_notes = (
        _cost_note(base, cost_performance_index),
        _schedule_note(base, schedule_performance_index),
    )
    return tuple(dict.fromkeys(note for note in candidate_notes if note is not None))


def _cost_note(base: _BaseValues, cost_performance_index: Decimal | None) -> str | None:
    if cost_performance_index is None:
        return NOTE_NOT_STARTED if base.earned_value == ZERO else NOTE_NO_ACTUAL_COST
    if cost_performance_index == ZERO:
        return NOTE_NO_PROGRESS_FORECAST
    return None


def _schedule_note(base: _BaseValues, schedule_performance_index: Decimal | None) -> str | None:
    if schedule_performance_index is not None:
        return None
    is_not_started = base.earned_value == ZERO and base.actual_cost == ZERO
    return NOTE_NOT_STARTED if is_not_started else NOTE_NOT_SCHEDULED_YET
