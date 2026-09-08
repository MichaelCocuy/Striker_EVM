"""Input validation of the EVM domain (EVM_GUIA.md sections 5.6 and 7)."""

from decimal import Decimal

import pytest

from app.domain.evm import ActivityInput, InvalidActivityError
from tests.unit.domain.guide_example import make_activity


@pytest.mark.parametrize(
    ("budget", "planned_percent", "actual_percent", "actual_cost", "invalid_field"),
    [
        pytest.param("0", "50", "50", "100", "budget_at_completion", id="zero-budget"),
        pytest.param("-1000", "50", "50", "100", "budget_at_completion", id="negative-budget"),
        pytest.param("1000", "50", "50", "-0.01", "actual_cost", id="negative-actual-cost"),
        pytest.param("1000", "-1", "50", "100", "planned_progress_percent", id="planned-below"),
        pytest.param("1000", "100.01", "50", "100", "planned_progress_percent", id="planned-above"),
        pytest.param("1000", "50", "-1", "100", "actual_progress_percent", id="actual-below"),
        pytest.param("1000", "50", "101", "100", "actual_progress_percent", id="actual-above"),
    ],
)
def test_invalid_activity_input_is_rejected(
    budget: str,
    planned_percent: str,
    actual_percent: str,
    actual_cost: str,
    invalid_field: str,
) -> None:
    with pytest.raises(InvalidActivityError) as raised:
        make_activity(budget, planned_percent, actual_percent, actual_cost)

    assert raised.value.field == invalid_field
    assert invalid_field in str(raised.value)


def test_invalid_activity_error_is_a_value_error() -> None:
    assert issubclass(InvalidActivityError, ValueError)


@pytest.mark.parametrize(
    ("budget", "planned_percent", "actual_percent", "actual_cost"),
    [
        pytest.param("0.01", "0", "0", "0", id="smallest-budget-and-legit-zeros"),
        pytest.param("1000", "100", "100", "0", id="upper-percent-bounds"),
        pytest.param("1000", "0", "100", "1000000", id="large-actual-cost"),
    ],
)
def test_boundary_values_are_accepted(
    budget: str, planned_percent: str, actual_percent: str, actual_cost: str
) -> None:
    activity = make_activity(budget, planned_percent, actual_percent, actual_cost)

    assert isinstance(activity, ActivityInput)
    assert activity.budget_at_completion == Decimal(budget)


def test_activity_input_is_immutable() -> None:
    activity = make_activity("1000", "50", "50", "100")

    with pytest.raises(AttributeError):
        activity.actual_cost = Decimal("0")  # type: ignore[misc]
