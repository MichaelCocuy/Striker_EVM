"""`LoginRequest` and `LoginResponse` schemas of the contract."""

from typing import Literal

from pydantic import ConfigDict, Field

from app.api.v1.docs.examples import LOGIN_REQUEST_EXAMPLE, LOGIN_RESPONSE_EXAMPLE
from app.api.v1.schemas.common import CamelCaseModel
from app.api.v1.schemas.users import UserResponse

EMAIL_MIN_LENGTH = 1
EMAIL_MAX_LENGTH = 254
PASSWORD_MIN_LENGTH = 1
PASSWORD_MAX_LENGTH = 128
TOKEN_TYPE_BEARER = "bearer"


class LoginRequest(CamelCaseModel):
    """Credenciales de acceso que se envían a `POST /auth/login`."""

    model_config = ConfigDict(json_schema_extra={"example": LOGIN_REQUEST_EXAMPLE})

    email: str = Field(
        min_length=EMAIL_MIN_LENGTH,
        max_length=EMAIL_MAX_LENGTH,
        description="Correo del usuario registrado.",
    )
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description="Contraseña en texto plano; solo viaja por HTTPS y nunca se almacena así.",
    )


class LoginResponse(CamelCaseModel):
    """Token de acceso, su vigencia y el usuario autenticado."""

    model_config = ConfigDict(json_schema_extra={"example": LOGIN_RESPONSE_EXAMPLE})

    access_token: str = Field(
        description=(
            "JWT firmado (HS256) que se envía en cada llamada como `Authorization: Bearer <token>`."
        )
    )
    token_type: Literal["bearer"] = Field(
        default=TOKEN_TYPE_BEARER,
        description="Tipo de token; siempre `bearer`, el esquema que espera el API.",
    )
    expires_in: int = Field(
        description="Segundos de validez del token desde su emisión (8 horas, 28800 segundos)."
    )
    user: UserResponse = Field(description="Usuario dueño del token, con su rol.")
