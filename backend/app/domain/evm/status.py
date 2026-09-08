"""Interpretation of the EVM performance indices (EVM_GUIA.md, sections 3 and 5.8)."""

from decimal import Decimal
from enum import StrEnum

from app.domain.evm.conventions import UNIT_INDEX, round_index


class CostStatus(StrEnum):
    """Interpretation of the Cost Performance Index (CPI)."""

    UNDER_BUDGET = "UNDER_BUDGET"
    ON_BUDGET = "ON_BUDGET"
    OVER_BUDGET = "OVER_BUDGET"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class ScheduleStatus(StrEnum):
    """Interpretation of the Schedule Performance Index (SPI)."""

    AHEAD_OF_SCHEDULE = "AHEAD_OF_SCHEDULE"
    ON_SCHEDULE = "ON_SCHEDULE"
    BEHIND_SCHEDULE = "BEHIND_SCHEDULE"
    NOT_APPLICABLE = "NOT_APPLICABLE"


def interpret_cost_index(cost_performance_index: Decimal | None) -> CostStatus:
    """Classify a CPI; None means the index was not computable."""
    if cost_performance_index is None:
        return CostStatus.NOT_APPLICABLE
    return _classify_against_unit(
        cost_performance_index,
        above=CostStatus.UNDER_BUDGET,
        equal=CostStatus.ON_BUDGET,
        below=CostStatus.OVER_BUDGET,
    )


def interpret_schedule_index(schedule_performance_index: Decimal | None) -> ScheduleStatus:
    """Classify an SPI; None means the index was not computable."""
    if schedule_performance_index is None:
        return ScheduleStatus.NOT_APPLICABLE
    return _classify_against_unit(
        schedule_performance_index,
        above=ScheduleStatus.AHEAD_OF_SCHEDULE,
        equal=ScheduleStatus.ON_SCHEDULE,
        below=ScheduleStatus.BEHIND_SCHEDULE,
    )


def _classify_against_unit[StatusT](
    index: Decimal, *, above: StatusT, equal: StatusT, below: StatusT
) -> StatusT:
    """Compare the index, rounded to the presentation precision, with 1."""
    rounded_index = round_index(index)
    if rounded_index > UNIT_INDEX:
        return above
    if rounded_index < UNIT_INDEX:
        return below
    return equal
