"""Pure EVM (Earned Value Management) domain: models, calculation and interpretation."""

from app.domain.evm.calculator import (
    calculate_activity_indicators,
    calculate_project_indicators,
)
from app.domain.evm.conventions import round_index, round_money
from app.domain.evm.errors import InvalidActivityError
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

__all__ = [
    "NOTE_NOT_SCHEDULED_YET",
    "NOTE_NOT_STARTED",
    "NOTE_NO_ACTIVITIES",
    "NOTE_NO_ACTUAL_COST",
    "NOTE_NO_PROGRESS_FORECAST",
    "ActivityInput",
    "CostStatus",
    "EvmIndicators",
    "InvalidActivityError",
    "ScheduleStatus",
    "calculate_activity_indicators",
    "calculate_project_indicators",
    "interpret_cost_index",
    "interpret_schedule_index",
    "round_index",
    "round_money",
]
