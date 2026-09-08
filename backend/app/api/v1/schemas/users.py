"""`User` schema of the contract."""

from uuid import UUID

from pydantic import ConfigDict, Field

from app.api.v1.docs.examples import USER_EXAMPLE
from app.api.v1.schemas.common import CamelCaseModel
from app.domain.auth.roles import UserRole

ROLE_DESCRIPTION = (
    "Rol del usuario: `REGISTRAR` registra el avance y el costo real de sus actividades; "
    "`REVIEWER` administra proyectos, asigna responsables y revisa el consolidado."
)


class UserResponse(CamelCaseModel):
    """Usuario del sistema, tal como lo ve el API (nunca expone la contraseña)."""

    model_config = ConfigDict(json_schema_extra={"example": USER_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) del usuario.")
    email: str = Field(description="Correo con el que el usuario inicia sesión; es único.")
    full_name: str = Field(description="Nombre completo del usuario, para mostrar en pantalla.")
    role: UserRole = Field(description=ROLE_DESCRIPTION)
