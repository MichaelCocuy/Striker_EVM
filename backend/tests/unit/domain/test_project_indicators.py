"""Project consolidation against EVM_GUIA.md, sections 4, 5.5, 6.6 and 6.7."""

from decimal import Decimal

from app.domain.evm import (
    NOTE_NO_ACTIVITIES,
    CostStatus,
    EvmIndicators,
    ScheduleStatus,
    calculate_activity_indicators,
    calculate_project_indicators,
    interpret_cost_index,
    round_index,
)
from tests.unit.domain.guide_example import DEVELOPMENT, PORTAL_DE_CLIENTES_ACTIVITIES

EXPECTED_PORTAL_DE_CLIENTES = EvmIndicators(
    budget_at_completion=Decimal("60000.00"),
    planned_value=Decimal("32000.00"),
    earned_value=Decimal("29000.00"),
    actual_cost=Decimal("31500.00"),
    cost_variance=Decimal("-2500.00"),
    schedule_variance=Decimal("-3000.00"),
    cost_performance_index=Decimal("0.9206"),
    schedule_performance_index=Decimal("0.9063"),
    estimate_at_completion=Decimal("65172.41"),
    variance_at_completion=Decimal("-5172.41"),
    cost_status=CostStatus.OVER_BUDGET,
    schedule_status=ScheduleStatus.BEHIND_SCHEDULE,
    notes=(),
)

EXPECTED_EMPTY_PROJECT = EvmIndicators(
    budget_at_completion=Decimal("0.00"),
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
    notes=(NOTE_NO_ACTIVITIES,),
)

AVERAGED_CPI_FROM_GUIDE = Decimal("1.0370")


def test_project_indicators_match_guide_consolidated_table() -> None:
    assert (
        calculate_project_indicators(PORTAL_DE_CLIENTES_ACTIVITIES) == EXPECTED_PORTAL_DE_CLIENTES
    )


def test_project_sums_money_of_every_activity() -> None:
    per_activity = [calculate_activity_indicators(a) for a in PORTAL_DE_CLIENTES_ACTIVITIES]

    project = calculate_project_indicators(PORTAL_DE_CLIENTES_ACTIVITIES)

    assert project.budget_at_completion == sum(i.budget_at_completion for i in per_activity)
    assert project.planned_value == sum(i.planned_value for i in per_activity)
    assert project.earned_value == sum(i.earned_value for i in per_activity)
    assert project.actual_cost == sum(i.actual_cost for i in per_activity)


def test_project_cpi_is_not_the_average_of_activity_cpis() -> None:
    """Section 6.7: averaging would say UNDER_BUDGET while the project is OVER_BUDGET."""
    activity_cpis = [
        calculate_activity_indicators(a).cost_performance_index
        for a in PORTAL_DE_CLIENTES_ACTIVITIES
    ]
    averaged_cpi = round_index(sum(activity_cpis, Decimal("0")) / len(activity_cpis))

    project = calculate_project_indicators(PORTAL_DE_CLIENTES_ACTIVITIES)

    assert averaged_cpi == AVERAGED_CPI_FROM_GUIDE
    assert interpret_cost_index(averaged_cpi) == CostStatus.UNDER_BUDGET
    assert project.cost_performance_index != averaged_cpi
    assert project.cost_status == CostStatus.OVER_BUDGET


def test_project_indicators_do_not_depend_on_activity_order() -> None:
    reversed_activities = tuple(reversed(PORTAL_DE_CLIENTES_ACTIVITIES))

    assert calculate_project_indicators(reversed_activities) == EXPECTED_PORTAL_DE_CLIENTES


def test_single_activity_project_equals_that_activity() -> None:
    assert calculate_project_indicators([DEVELOPMENT]) == calculate_activity_indicators(DEVELOPMENT)


def test_project_without_activities_reports_no_data() -> None:
    assert calculate_project_indicators([]) == EXPECTED_EMPTY_PROJECT
