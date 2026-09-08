"""Catalogue of documented error responses, shared by every operation of the API.

Each entry pairs the `ErrorResponse` model with a Spanish description of *when* the status
happens and an example body taken from `docs/api/fixtures/error-*.json`. `error_responses()`
builds the `responses` argument of a route and always adds the `500`, which any operation can
answer.
"""

from http import HTTPStatus
from typing import Any

from app.api.errors import ErrorResponse
from app.application.errors import ErrorCode

JSON_MEDIA_TYPE = "application/json"

DESCRIPTION_BAD_REQUEST = (
    "El cuerpo está mal formado o incumple una regla de entrada "
    "(`VALIDATION_ERROR`); `details` nombra cada campo inválido."
)
DESCRIPTION_UNAUTHORIZED = (
    "Falta la cabecera `Authorization`, o el token es inválido o está expirado (`UNAUTHORIZED`)."
)
DESCRIPTION_FORBIDDEN = (
    "El usuario está autenticado, pero su rol o su relación con el recurso no le permiten "
    "la acción (`FORBIDDEN`)."
)
DESCRIPTION_NOT_FOUND = (
    "El recurso indicado en la ruta no existe, o la actividad no pertenece a ese proyecto "
    "(`NOT_FOUND`)."
)
DESCRIPTION_INTERNAL_ERROR = (
    "Error inesperado del servidor (`INTERNAL_ERROR`); el cuerpo nunca expone detalles internos."
)

EXAMPLE_BAD_REQUEST = {
    "code": ErrorCode.VALIDATION_ERROR,
    "message": "La solicitud contiene campos inválidos",
    "details": [
        {
            "field": "plannedProgressPercent",
            "message": "plannedProgressPercent must be between 0 and 100",
        }
    ],
}
EXAMPLE_UNAUTHORIZED = {
    "code": ErrorCode.UNAUTHORIZED,
    "message": "Se requiere un token de acceso válido",
    "details": [],
}
EXAMPLE_FORBIDDEN = {
    "code": ErrorCode.FORBIDDEN,
    "message": "Solo un usuario con rol REVIEWER puede crear proyectos",
    "details": [],
}
EXAMPLE_NOT_FOUND = {
    "code": ErrorCode.NOT_FOUND,
    "message": "Proyecto 22222222-2222-4222-8222-000000000009 no encontrado",
    "details": [],
}
EXAMPLE_INTERNAL_ERROR = {
    "code": ErrorCode.INTERNAL_ERROR,
    "message": "Error interno del servidor",
    "details": [],
}

ERROR_CATALOGUE: dict[HTTPStatus, tuple[str, dict[str, Any]]] = {
    HTTPStatus.BAD_REQUEST: (DESCRIPTION_BAD_REQUEST, EXAMPLE_BAD_REQUEST),
    HTTPStatus.UNAUTHORIZED: (DESCRIPTION_UNAUTHORIZED, EXAMPLE_UNAUTHORIZED),
    HTTPStatus.FORBIDDEN: (DESCRIPTION_FORBIDDEN, EXAMPLE_FORBIDDEN),
    HTTPStatus.NOT_FOUND: (DESCRIPTION_NOT_FOUND, EXAMPLE_NOT_FOUND),
    HTTPStatus.INTERNAL_SERVER_ERROR: (DESCRIPTION_INTERNAL_ERROR, EXAMPLE_INTERNAL_ERROR),
}

ALWAYS_DOCUMENTED = (HTTPStatus.INTERNAL_SERVER_ERROR,)


def error_responses(*statuses: HTTPStatus) -> dict[int | str, dict[str, Any]]:
    """Return the `responses` entries of the given statuses, plus the always possible 500."""
    return {status.value: _error_response(status) for status in (*statuses, *ALWAYS_DOCUMENTED)}


def _error_response(status: HTTPStatus) -> dict[str, Any]:
    """One `responses` entry: the uniform error model, when it happens and an example body."""
    description, example = ERROR_CATALOGUE[status]
    return {
        "model": ErrorResponse,
        "description": description,
        "content": {JSON_MEDIA_TYPE: {"example": example}},
    }
