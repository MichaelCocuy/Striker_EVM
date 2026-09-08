"""`EvmReport` schemas of the contract (`GET /projects/{projectId}/evm`).

Monetary values and indices are `Decimal` in Python (already rounded by the domain) and plain
JSON numbers on the wire, as the contract's `Money` and `PerformanceIndex` types require.
"""

from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import PlainSerializer

from app.api.v1.schemas.common import CamelCaseModel
from app.application.evm.get_project_report import ActivityEvmReport, ProjectEvmReport
from app.domain.evm import ActivityInput, CostStatus, EvmIndicators, ScheduleStatus

JSON_MODE = "json"

# Rounded decimals travel as JSON numbers (`65172.41`, `0.9206`), never as strings.
JsonNumber = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used=JSON_MODE)]


class OwnerSummary(CamelCaseModel):
    """`UserSummary`: the user responsible for an activity."""

    id: UUID
    full_name: str


class ActivityMeasures(CamelCaseModel):
    """`ActivityMeasures`: raw inputs of the calculation (percents on the 0-100 scale)."""

    budget_at_completion: JsonNumber
    planned_progress_percent: JsonNumber
    actual_progress_percent: JsonNumber
    actual_cost: JsonNumber

    @classmethod
    def from_input(cls, activity_input: ActivityInput) -> "ActivityMeasures":
        """Copy the measures of a domain input."""
        return cls.model_validate(activity_input)


class EvmIndicatorsSchema(CamelCaseModel):
    """`EvmIndicators`: money with 2 decimals, indices with 4, `null` when not computable."""

    budget_at_completion: JsonNumber
    planned_value: JsonNumber
    earned_value: JsonNumber
    actual_cost: JsonNumber
    cost_variance: JsonNumber
    schedule_variance: JsonNumber
    cost_performance_index: JsonNumber | None
    schedule_performance_index: JsonNumber | None
    estimate_at_completion: JsonNumber | None
    variance_at_completion: JsonNumber | None
    cost_status: CostStatus
    schedule_status: ScheduleStatus
    notes: list[str]

    @classmethod
    def from_indicators(cls, indicators: EvmIndicators) -> "EvmIndicatorsSchema":
        """Copy the domain indicators."""
        return cls.model_validate(indicators)


class EvmActivityReportSchema(CamelCaseModel):
    """`EvmActivityReport`: one activity with its owner, raw inputs and indicators."""

    id: UUID
    name: str
    owner: OwnerSummary
    input: ActivityMeasures
    indicators: EvmIndicatorsSchema

    @classmethod
    def from_report(cls, activity: ActivityEvmReport) -> "EvmActivityReportSchema":
        """Build the schema from the use case's activity report."""
        return cls(
            id=activity.id,
            name=activity.name,
            owner=OwnerSummary.model_validate(activity.owner),
            input=ActivityMeasures.from_input(activity.input),
            indicators=EvmIndicatorsSchema.from_indicators(activity.indicators),
        )


class EvmProjectSummary(CamelCaseModel):
    """`EvmProjectSummary`: project identification and consolidated indicators."""

    id: UUID
    name: str
    indicators: EvmIndicatorsSchema


class EvmReportSchema(CamelCaseModel):
    """`EvmReport`: the whole response of the report endpoint."""

    project: EvmProjectSummary
    activities: list[EvmActivityReportSchema]
    generated_at: datetime

    @classmethod
    def from_report(cls, report: ProjectEvmReport) -> "EvmReportSchema":
        """Build the response from the use case result."""
        return cls(
            project=EvmProjectSummary(
                id=report.project_id,
                name=report.project_name,
                indicators=EvmIndicatorsSchema.from_indicators(report.project_indicators),
            ),
            activities=[
                EvmActivityReportSchema.from_report(activity) for activity in report.activities
            ],
            generated_at=report.generated_at,
        )
