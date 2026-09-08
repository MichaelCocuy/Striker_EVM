"""Shared fixtures taken from docs/EVM_GUIA.md: the worked example (section 6) and helpers."""

from decimal import Decimal

from app.domain.evm import ActivityInput

EDGE_CASE_ACTIVITY_NAME = "Actividad de caso borde"


def make_activity(
    budget: str, planned_percent: str, actual_percent: str, actual_cost: str
) -> ActivityInput:
    """Build an activity from decimal literals written as strings, as the guide tables do."""
    return ActivityInput(
        name=EDGE_CASE_ACTIVITY_NAME,
        budget_at_completion=Decimal(budget),
        planned_progress_percent=Decimal(planned_percent),
        actual_progress_percent=Decimal(actual_percent),
        actual_cost=Decimal(actual_cost),
    )


DESIGN = ActivityInput(
    name="Diseño",
    budget_at_completion=Decimal("10000"),
    planned_progress_percent=Decimal("100"),
    actual_progress_percent=Decimal("100"),
    actual_cost=Decimal("9000"),
)

DEVELOPMENT = ActivityInput(
    name="Desarrollo",
    budget_at_completion=Decimal("40000"),
    planned_progress_percent=Decimal("50"),
    actual_progress_percent=Decimal("40"),
    actual_cost=Decimal("20000"),
)

TESTING = ActivityInput(
    name="Pruebas",
    budget_at_completion=Decimal("10000"),
    planned_progress_percent=Decimal("20"),
    actual_progress_percent=Decimal("30"),
    actual_cost=Decimal("2500"),
)

PORTAL_DE_CLIENTES_ACTIVITIES = (DESIGN, DEVELOPMENT, TESTING)
