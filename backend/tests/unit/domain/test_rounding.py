"""Numeric conventions of EVM_GUIA.md section 7: half-up rounding, scales, rounding at the end."""

from decimal import ROUND_HALF_EVEN, Decimal

import pytest

from app.domain.evm import calculate_project_indicators, round_index, round_money
from app.domain.evm.conventions import INDEX_PLACES, MONEY_PLACES
from tests.unit.domain.guide_example import PORTAL_DE_CLIENTES_ACTIVITIES

PROJECT_ESTIMATE_FROM_UNROUNDED_CPI = Decimal("65172.41")
PROJECT_ESTIMATE_FROM_ROUNDED_CPI = Decimal("65174.89")


@pytest.mark.parametrize(
    ("raw_index", "expected"),
    [
        pytest.param(Decimal("0.90625"), Decimal("0.9063"), id="guide-spi-half-up"),
        pytest.param(Decimal("0.920634920634"), Decimal("0.9206"), id="guide-cpi-truncates"),
        pytest.param(Decimal("1.11111111"), Decimal("1.1111"), id="design-cpi"),
        pytest.param(Decimal("0.83333333"), Decimal("0.8333"), id="finished-over-budget-cpi"),
        pytest.param(Decimal("1"), Decimal("1.0000"), id="integer-gets-four-places"),
    ],
)
def test_round_index_uses_four_places_half_up(raw_index: Decimal, expected: Decimal) -> None:
    assert round_index(raw_index) == expected


@pytest.mark.parametrize(
    ("raw_amount", "expected"),
    [
        pytest.param(Decimal("8333.333333"), Decimal("8333.33"), id="testing-eac"),
        pytest.param(Decimal("1666.666666"), Decimal("1666.67"), id="testing-vac"),
        pytest.param(Decimal("2.345"), Decimal("2.35"), id="half-goes-up-not-to-even"),
        pytest.param(Decimal("-5172.4138"), Decimal("-5172.41"), id="negative-amount"),
        pytest.param(Decimal("10000"), Decimal("10000.00"), id="integer-gets-two-places"),
    ],
)
def test_round_money_uses_two_places_half_up(raw_amount: Decimal, expected: Decimal) -> None:
    assert round_money(raw_amount) == expected


def test_half_up_differs_from_bankers_rounding_on_the_guide_example() -> None:
    raw_spi = Decimal("0.90625")
    bankers_result = raw_spi.quantize(Decimal("0.0001"), rounding=ROUND_HALF_EVEN)

    assert bankers_result == Decimal("0.9062")
    assert round_index(raw_spi) == Decimal("0.9063")


def test_estimate_at_completion_is_derived_from_unrounded_cpi() -> None:
    project = calculate_project_indicators(PORTAL_DE_CLIENTES_ACTIVITIES)
    estimate_from_rounded_cpi = round_money(
        project.budget_at_completion / project.cost_performance_index
    )

    assert estimate_from_rounded_cpi == PROJECT_ESTIMATE_FROM_ROUNDED_CPI
    assert project.estimate_at_completion == PROJECT_ESTIMATE_FROM_UNROUNDED_CPI


def test_indicators_are_presented_with_the_documented_scales() -> None:
    project = calculate_project_indicators(PORTAL_DE_CLIENTES_ACTIVITIES)
    money_fields = (
        project.budget_at_completion,
        project.planned_value,
        project.earned_value,
        project.actual_cost,
        project.cost_variance,
        project.schedule_variance,
        project.estimate_at_completion,
        project.variance_at_completion,
    )
    index_fields = (project.cost_performance_index, project.schedule_performance_index)

    assert all(_decimal_places(value) == MONEY_PLACES for value in money_fields)
    assert all(_decimal_places(value) == INDEX_PLACES for value in index_fields)


def _decimal_places(value: Decimal) -> int:
    return -value.as_tuple().exponent
