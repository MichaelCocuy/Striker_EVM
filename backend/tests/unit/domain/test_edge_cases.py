"""Edge cases that break a division, from the summary table of EVM_GUIA.md section 5."""

from decimal import Decimal

import pytest

from app.domain.evm import (
    NOTE_NO_ACTUAL_COST,
    NOTE_NO_PROGRESS_FORECAST,
    NOTE_NOT_SCHEDULED_YET,
    NOTE_NOT_STARTED,
    ActivityInput,
    CostStatus,
    EvmIndicators,
    ScheduleStatus,
    calculate_activity_indicators,
)
from tests.unit.domain.guide_example import make_activity

CASE_5_1_NO_COST_RECORDED = (
    make_activity("1000", "50", "20", "0"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("500.00"),
        earned_value=Decimal("200.00"),
        actual_cost=Decimal("0.00"),
        cost_variance=Decimal("200.00"),
        schedule_variance=Decimal("-300.00"),
        cost_performance_index=None,
        schedule_performance_index=Decimal("0.4000"),
        estimate_at_completion=None,
        variance_at_completion=None,
        cost_status=CostStatus.NOT_APPLICABLE,
        schedule_status=ScheduleStatus.BEHIND_SCHEDULE,
        notes=(NOTE_NO_ACTUAL_COST,),
    ),
)

CASE_5_2_NOT_STARTED = (
    make_activity("1000", "0", "0", "0"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("0.00"),
        earned_value=Decimal("0.00"),
        actual_cost=Decimal("0.00"),
        cost_variance=Decimal("0.00"),
        schedule_variance=Decimal("0.00"),
        cost_performance_index=None,
        schedule_performance_index=None,
        estimate_at_completion=None,
        variance_at_completion=None,
        cost_status=CostStatus.NOT_APPLICABLE,
        schedule_status=ScheduleStatus.NOT_APPLICABLE,
        notes=(NOTE_NOT_STARTED,),
    ),
)

CASE_5_2_VARIANT_PLANNED_BUT_NOT_STARTED = (
    make_activity("1000", "30", "0", "0"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("300.00"),
        earned_value=Decimal("0.00"),
        actual_cost=Decimal("0.00"),
        cost_variance=Decimal("0.00"),
        schedule_variance=Decimal("-300.00"),
        cost_performance_index=None,
        schedule_performance_index=Decimal("0.0000"),
        estimate_at_completion=None,
        variance_at_completion=None,
        cost_status=CostStatus.NOT_APPLICABLE,
        schedule_status=ScheduleStatus.BEHIND_SCHEDULE,
        notes=(NOTE_NOT_STARTED,),
    ),
)

CASE_5_3_SPENT_WITHOUT_PROGRESS = (
    make_activity("1000", "30", "0", "150"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("300.00"),
        earned_value=Decimal("0.00"),
        actual_cost=Decimal("150.00"),
        cost_variance=Decimal("-150.00"),
        schedule_variance=Decimal("-300.00"),
        cost_performance_index=Decimal("0.0000"),
        schedule_performance_index=Decimal("0.0000"),
        estimate_at_completion=None,
        variance_at_completion=None,
        cost_status=CostStatus.OVER_BUDGET,
        schedule_status=ScheduleStatus.BEHIND_SCHEDULE,
        notes=(NOTE_NO_PROGRESS_FORECAST,),
    ),
)

CASE_5_4_NOT_SCHEDULED_YET = (
    make_activity("1000", "0", "10", "80"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("0.00"),
        earned_value=Decimal("100.00"),
        actual_cost=Decimal("80.00"),
        cost_variance=Decimal("20.00"),
        schedule_variance=Decimal("100.00"),
        cost_performance_index=Decimal("1.2500"),
        schedule_performance_index=None,
        estimate_at_completion=Decimal("800.00"),
        variance_at_completion=Decimal("200.00"),
        cost_status=CostStatus.UNDER_BUDGET,
        schedule_status=ScheduleStatus.NOT_APPLICABLE,
        notes=(NOTE_NOT_SCHEDULED_YET,),
    ),
)

CASE_5_7_FINISHED_OVER_BUDGET = (
    make_activity("1000", "100", "100", "1200"),
    EvmIndicators(
        budget_at_completion=Decimal("1000.00"),
        planned_value=Decimal("1000.00"),
        earned_value=Decimal("1000.00"),
        actual_cost=Decimal("1200.00"),
        cost_variance=Decimal("-200.00"),
        schedule_variance=Decimal("0.00"),
        cost_performance_index=Decimal("0.8333"),
        schedule_performance_index=Decimal("1.0000"),
        estimate_at_completion=Decimal("1200.00"),
        variance_at_completion=Decimal("-200.00"),
        cost_status=CostStatus.OVER_BUDGET,
        schedule_status=ScheduleStatus.ON_SCHEDULE,
        notes=(),
    ),
)


@pytest.mark.parametrize(
    ("activity", "expected"),
    [
        pytest.param(*CASE_5_1_NO_COST_RECORDED, id="5.1-work-done-without-cost"),
        pytest.param(*CASE_5_2_NOT_STARTED, id="5.2-not-started"),
        pytest.param(*CASE_5_2_VARIANT_PLANNED_BUT_NOT_STARTED, id="5.2-planned-not-started"),
        pytest.param(*CASE_5_3_SPENT_WITHOUT_PROGRESS, id="5.3-spent-without-progress"),
        pytest.param(*CASE_5_4_NOT_SCHEDULED_YET, id="5.4-not-scheduled-yet"),
        pytest.param(*CASE_5_7_FINISHED_OVER_BUDGET, id="5.7-finished-over-budget"),
    ],
)
def test_edge_case_matches_guide_summary_table(
    activity: ActivityInput, expected: EvmIndicators
) -> None:
    assert calculate_activity_indicators(activity) == expected


def test_no_cost_and_no_schedule_with_progress_explains_both_reasons() -> None:
    """Combining 5.1 and 5.4: EV > 0 while AC = 0 and PV = 0 yields two distinct notes."""
    indicators = calculate_activity_indicators(make_activity("1000", "0", "10", "0"))

    assert indicators.cost_status == CostStatus.NOT_APPLICABLE
    assert indicators.schedule_status == ScheduleStatus.NOT_APPLICABLE
    assert indicators.notes == (NOTE_NO_ACTUAL_COST, NOTE_NOT_SCHEDULED_YET)


def test_spent_without_progress_and_without_schedule_keeps_cost_status() -> None:
    indicators = calculate_activity_indicators(make_activity("1000", "0", "0", "100"))

    assert indicators.cost_performance_index == Decimal("0.0000")
    assert indicators.cost_status == CostStatus.OVER_BUDGET
    assert indicators.schedule_status == ScheduleStatus.NOT_APPLICABLE
    assert indicators.notes == (NOTE_NO_PROGRESS_FORECAST, NOTE_NOT_SCHEDULED_YET)


def test_index_exactly_one_is_on_budget_and_on_schedule() -> None:
    """Section 5.8: CPI = SPI = 1 must not be read as over or under."""
    indicators = calculate_activity_indicators(make_activity("1000", "50", "50", "500"))

    assert indicators.cost_performance_index == Decimal("1.0000")
    assert indicators.schedule_performance_index == Decimal("1.0000")
    assert indicators.cost_status == CostStatus.ON_BUDGET
    assert indicators.schedule_status == ScheduleStatus.ON_SCHEDULE


def test_cost_index_within_rounding_noise_of_one_is_on_budget() -> None:
    """Section 5.8: 1000 / 999.99999 rounds to 1.0000, so the status is ON_BUDGET."""
    indicators = calculate_activity_indicators(make_activity("1000", "100", "100", "999.99999"))

    assert indicators.cost_performance_index == Decimal("1.0000")
    assert indicators.cost_status == CostStatus.ON_BUDGET


def test_schedule_index_within_rounding_noise_of_one_is_on_schedule() -> None:
    indicators = calculate_activity_indicators(make_activity("1000", "99.99999", "100", "1000"))

    assert indicators.schedule_performance_index == Decimal("1.0000")
    assert indicators.schedule_status == ScheduleStatus.ON_SCHEDULE


def test_index_just_beyond_rounding_noise_is_classified() -> None:
    indicators = calculate_activity_indicators(make_activity("1000", "100", "100", "999.9"))

    assert indicators.cost_performance_index == Decimal("1.0001")
    assert indicators.cost_status == CostStatus.UNDER_BUDGET
