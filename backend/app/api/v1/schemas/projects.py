"""`Project` and `ProjectInput` schemas of the contract."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import ConfigDict, Field, StringConstraints

from app.api.v1.docs.examples import PROJECT_EXAMPLE, PROJECT_INPUT_EXAMPLE
from app.api.v1.schemas.common import CamelCaseModel, UserSummary
from app.application.ports import ProjectData
from app.application.projects.views import ProjectView

NAME_MAX_LENGTH = 120
NAME_MIN_LENGTH = 1
DESCRIPTION_MAX_LENGTH = 2000

NAME_DESCRIPTION = (
    f"Nombre del proyecto, hasta {NAME_MAX_LENGTH} caracteres; se recortan los espacios "
    "sobrantes y no puede quedar vacío."
)
DESCRIPTION_DESCRIPTION = (
    f"Descripción libre del proyecto, hasta {DESCRIPTION_MAX_LENGTH} caracteres. "
    "Opcional: `null` cuando no se registró ninguna."
)

ProjectName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=NAME_MIN_LENGTH, max_length=NAME_MAX_LENGTH
    ),
]
ProjectDescription = Annotated[
    str, StringConstraints(strip_whitespace=True, max_length=DESCRIPTION_MAX_LENGTH)
]


class ProjectRequest(CamelCaseModel):
    """Datos editables de un proyecto; es el cuerpo de la creación (POST) y la edición (PUT)."""

    model_config = ConfigDict(json_schema_extra={"example": PROJECT_INPUT_EXAMPLE})

    name: ProjectName = Field(description=NAME_DESCRIPTION)
    description: ProjectDescription | None = Field(
        default=None, description=DESCRIPTION_DESCRIPTION
    )

    def to_data(self) -> ProjectData:
        """Payload the project use cases persist."""
        return ProjectData(name=self.name, description=self.description)


class ProjectResponse(CamelCaseModel):
    """Proyecto almacenado, con su conteo de actividades y el usuario que lo creó."""

    model_config = ConfigDict(json_schema_extra={"example": PROJECT_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) del proyecto.")
    name: str = Field(description=NAME_DESCRIPTION)
    description: str | None = Field(description=DESCRIPTION_DESCRIPTION)
    activity_count: int = Field(
        description="Número de actividades registradas en el proyecto (0 si no tiene ninguna)."
    )
    created_by: UserSummary = Field(
        description="Usuario `REVIEWER` que creó el proyecto; no cambia."
    )
    created_at: datetime = Field(description="Fecha y hora (UTC) de creación del proyecto.")
    updated_at: datetime = Field(
        description="Fecha y hora (UTC) de la última edición; igual a `createdAt` si no se editó."
    )

    @classmethod
    def from_view(cls, view: ProjectView) -> "ProjectResponse":
        """Build the response from the use case result."""
        return cls(
            id=view.project.id,
            name=view.project.name,
            description=view.project.description,
            activity_count=view.activity_count,
            created_by=UserSummary.model_validate(view.creator),
            created_at=view.project.created_at,
            updated_at=view.project.updated_at,
        )
