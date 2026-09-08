"""`EvmReport` schemas of the contract (`GET /projects/{projectId}/evm`).

Monetary values and indices are `Decimal` in Python (already rounded by the domain to 2 and 4
decimals) and plain JSON numbers on the wire through the shared `JsonNumber` type, as the
contract's `Money` and `PerformanceIndex` types require.
"""

from datetime import datetime
from uuid import UUID

from pydantic import ConfigDict, Field

from app.api.v1.docs import fields
from app.api.v1.docs.examples import (
    ACTIVITY_MEASURES_EXAMPLE,
    EVM_ACTIVITY_REPORT_EXAMPLE,
    EVM_INDICATORS_EXAMPLE,
    EVM_PROJECT_SUMMARY_EXAMPLE,
    EVM_REPORT_EXAMPLE,
)
from app.api.v1.schemas.common import CamelCaseModel, JsonNumber, UserSummary
from app.application.evm.get_project_report import ActivityEvmReport, ProjectEvmReport
from app.domain.evm import ActivityInput, CostStatus, EvmIndicators, ScheduleStatus


class ActivityMeasures(CamelCaseModel):
    """Datos crudos de una actividad: son la entrada con la que se calculan los indicadores."""

    model_config = ConfigDict(json_schema_extra={"example": ACTIVITY_MEASURES_EXAMPLE})

    budget_at_completion: JsonNumber = Field(description=fields.BUDGET_AT_COMPLETION)
    planned_progress_percent: JsonNumber = Field(description=fields.PLANNED_PROGRESS_PERCENT)
    actual_progress_percent: JsonNumber = Field(description=fields.ACTUAL_PROGRESS_PERCENT)
    actual_cost: JsonNumber = Field(description=fields.ACTUAL_COST)

    @classmethod
    def from_input(cls, activity_input: ActivityInput) -> "ActivityMeasures":
        """Copy the measures of a domain input."""
        return cls.model_validate(activity_input)


class EvmIndicatorsSchema(CamelCaseModel):
    """Indicadores de Valor Ganado.

    El mismo esquema se usa para una actividad y para el consolidado del proyecto. El dinero
    lleva 2 decimales y los índices 4, con redondeo *half up* aplicado solo al final. Un
    indicador que no se puede calcular (división por cero) llega como `null`, con el estado en
    `NOT_APPLICABLE` y el motivo en `notes`.
    """

    model_config = ConfigDict(json_schema_extra={"example": EVM_INDICATORS_EXAMPLE})

    budget_at_completion: JsonNumber = Field(description=fields.INDICATOR_BUDGET_AT_COMPLETION)
    planned_value: JsonNumber = Field(description=fields.PLANNED_VALUE)
    earned_value: JsonNumber = Field(description=fields.EARNED_VALUE)
    actual_cost: JsonNumber = Field(description=fields.INDICATOR_ACTUAL_COST)
    cost_variance: JsonNumber = Field(description=fields.COST_VARIANCE)
    schedule_variance: JsonNumber = Field(description=fields.SCHEDULE_VARIANCE)
    cost_performance_index: JsonNumber | None = Field(description=fields.COST_PERFORMANCE_INDEX)
    schedule_performance_index: JsonNumber | None = Field(
        description=fields.SCHEDULE_PERFORMANCE_INDEX
    )
    estimate_at_completion: JsonNumber | None = Field(description=fields.ESTIMATE_AT_COMPLETION)
    variance_at_completion: JsonNumber | None = Field(description=fields.VARIANCE_AT_COMPLETION)
    cost_status: CostStatus = Field(description=fields.COST_STATUS)
    schedule_status: ScheduleStatus = Field(description=fields.SCHEDULE_STATUS)
    notes: list[str] = Field(description=fields.NOTES)

    @classmethod
    def from_indicators(cls, indicators: EvmIndicators) -> "EvmIndicatorsSchema":
        """Copy the domain indicators."""
        return cls.model_validate(indicators)


class EvmActivityReportSchema(CamelCaseModel):
    """Una actividad dentro del reporte: su responsable, sus datos crudos y sus indicadores."""

    model_config = ConfigDict(json_schema_extra={"example": EVM_ACTIVITY_REPORT_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) de la actividad.")
    name: str = Field(description=fields.ACTIVITY_NAME)
    owner: UserSummary = Field(description=fields.ACTIVITY_OWNER)
    input: ActivityMeasures = Field(
        description="Datos crudos con los que se calcularon los indicadores de la actividad."
    )
    indicators: EvmIndicatorsSchema = Field(description="Indicadores EVM de la actividad.")

    @classmethod
    def from_report(cls, activity: ActivityEvmReport) -> "EvmActivityReportSchema":
        """Build the schema from the use case's activity report."""
        return cls(
            id=activity.id,
            name=activity.name,
            owner=UserSummary.model_validate(activity.owner),
            input=ActivityMeasures.from_input(activity.input),
            indicators=EvmIndicatorsSchema.from_indicators(activity.indicators),
        )


class EvmProjectSummary(CamelCaseModel):
    """Identificación del proyecto y sus indicadores consolidados."""

    model_config = ConfigDict(json_schema_extra={"example": EVM_PROJECT_SUMMARY_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) del proyecto.")
    name: str = Field(description="Nombre del proyecto.")
    indicators: EvmIndicatorsSchema = Field(
        description=(
            "Indicadores consolidados: se **suman los valores en dinero** de las actividades y "
            "se recalculan varianzas, índices y pronósticos sobre esas sumas. Nunca se promedian "
            "índices."
        )
    )


class EvmReportSchema(CamelCaseModel):
    """Reporte EVM completo de un proyecto: el consolidado y el detalle por actividad."""

    model_config = ConfigDict(json_schema_extra={"example": EVM_REPORT_EXAMPLE})

    project: EvmProjectSummary = Field(description="Proyecto y sus indicadores consolidados.")
    activities: list[EvmActivityReportSchema] = Field(
        description=(
            "Actividades del proyecto en orden de creación, cada una con sus indicadores. "
            "Vacío si el proyecto no tiene actividades."
        )
    )
    generated_at: datetime = Field(
        description="Instante (UTC) en que se calculó el reporte; los indicadores no se guardan."
    )

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
