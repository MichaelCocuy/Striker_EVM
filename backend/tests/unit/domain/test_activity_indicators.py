"""Per-activity indicators against the worked example of EVM_GUIA.md, section 6.5."""

from decimal import Decimal

import pytest

from app.domain.evm import (
    ActivityInput,
    CostStatus,
    EvmIndicators,
    ScheduleStatus,
    calculate_activity_indicators,
)
from tests.unit.domain.guide_example import DESIGN, DEVELOPMENT, TESTING

EXPECTED_DESIGN = EvmIndicators(
    budget_at_completion=Decimal("10000.00"),
    planned_value=Decimal("10000.00"),
    earned_value=Decimal("10000.00"),
    actual_cost=Decimal("9000.00"),
    cost_variance=Decimal("1000.00"),
    schedule_variance=Decimal("0.00"),
    cost_performance_index=Decimal("1.1111"),
    schedule_performance_index=Decimal("1.0000"),
    estimate_at_completion=Decimal("9000.00"),
    variance_at_completion=Decimal("1000.00"),
    cost_status=CostStatus.UNDER_BUDGET,
    schedule_status=ScheduleStatus.ON_SCHEDULE,
    notes=(),
)

EXPECTED_DEVELOPMENT = EvmIndicators(
    budget_at_completion=Decimal("40000.00"),
    planned_value=Decimal("20000.00"),
    earned_value=Decimal("16000.00"),
    actual_cost=Decimal("20000.00"),
    cost_variance=Decimal("-4000.00"),
    schedule_variance=Decimal("-4000.00"),
    cost_performance_index=Decimal("0.8000"),
    schedule_performance_index=Decimal("0.8000"),
    estimate_at_completion=Decimal("50000.00"),
    variance_at_completion=Decimal("-10000.00"),
    cost_status=CostStatus.OVER_BUDGET,
    schedule_status=ScheduleStatus.BEHIND_SCHEDULE,
    notes=(),
)

EXPECTED_TESTING = EvmIndicators(
    budget_at_completion=Decimal("10000.00"),
    planned_value=Decimal("2000.00"),
    earned_value=Decimal("3000.00"),
    actual_cost=Decimal("2500.00"),
    cost_variance=Decimal("500.00"),
    schedule_variance=Decimal("1000.00"),
    cost_performance_index=Decimal("1.2000"),
    schedule_performance_index=Decimal("1.5000"),
    estimate_at_completion=Decimal("8333.33"),
    variance_at_completion=Decimal("1666.67"),
    cost_status=CostStatus.UNDER_BUDGET,
    schedule_status=ScheduleStatus.AHEAD_OF_SCHEDULE,
    notes=(),
)


@pytest.mark.parametrize(
    ("activity", "expected"),
    [
        pytest.param(DESIGN, EXPECTED_DESIGN, id="diseno-finished-under-budget"),
        pytest.param(DEVELOPMENT, EXPECTED_DEVELOPMENT, id="desarrollo-late-and-over-budget"),
        pytest.param(TESTING, EXPECTED_TESTING, id="pruebas-ahead-and-under-budget"),
    ],
)
def test_activity_indicators_match_guide_table(
    activity: ActivityInput, expected: EvmIndicators
) -> None:
    assert calculate_activity_indicators(activity) == expected


def test_finished_activity_estimate_at_completion_equals_actual_cost() -> None:
    indicators = calculate_activity_indicators(DESIGN)

    assert indicators.estimate_at_completion == indicators.actual_cost


def test_earned_value_uses_budget_not_actual_cost() -> None:
    indicators = calculate_activity_indicators(DEVELOPMENT)

    assert indicators.earned_value == Decimal("16000.00")
    assert indicators.earned_value != indicators.actual_cost


def test_estimate_at_completion_matches_alternative_pmi_formula() -> None:
    """BAC / CPI equals AC + (BAC - EV) / CPI, the cross-check suggested by the guide."""
    indicators = calculate_activity_indicators(DEVELOPMENT)
    unrounded_cpi = indicators.earned_value / indicators.actual_cost
    remaining_work = indicators.budget_at_completion - indicators.earned_value

    alternative_estimate = indicators.actual_cost + remaining_work / unrounded_cpi

    assert indicators.estimate_at_completion == alternative_estimate
