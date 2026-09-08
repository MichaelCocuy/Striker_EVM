"""The persistence-to-domain mapper feeds the EVM calculator with the stored raw inputs."""

from decimal import Decimal

from app.application.mappers import to_activity_input
from app.domain.evm import calculate_activity_indicators
from app.infrastructure.db.models import ActivityModel
from tests.conftest import REGISTRAR_ID


def test_to_activity_input_copies_raw_fields() -> None:
    stored = ActivityModel(
        owner_id=REGISTRAR_ID,
        name="Desarrollo",
        budget_at_completion=Decimal("40000.00"),
        planned_progress_percent=Decimal("50.00"),
        actual_progress_percent=Decimal("40.00"),
        actual_cost=Decimal("20000.00"),
    )

    activity_input = to_activity_input(stored)

    assert activity_input.name == "Desarrollo"
    assert activity_input.budget_at_completion == Decimal("40000.00")
    assert activity_input.planned_progress_percent == Decimal("50.00")
    assert activity_input.actual_progress_percent == Decimal("40.00")
    assert activity_input.actual_cost == Decimal("20000.00")
    assert calculate_activity_indicators(activity_input).cost_performance_index == Decimal("0.8000")
