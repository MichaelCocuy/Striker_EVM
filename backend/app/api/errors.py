"""Uniform error responses: every 4xx/5xx follows the contract `Error` shape."""

import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.exceptions import HTTPException

from app.application.errors import AppError, ErrorCode

logger = logging.getLogger(__name__)

STATUS_BY_CODE: dict[ErrorCode, HTTPStatus] = {
    ErrorCode.VALIDATION_ERROR: HTTPStatus.BAD_REQUEST,
    ErrorCode.UNAUTHORIZED: HTTPStatus.UNAUTHORIZED,
    ErrorCode.FORBIDDEN: HTTPStatus.FORBIDDEN,
    ErrorCode.NOT_FOUND: HTTPStatus.NOT_FOUND,
    ErrorCode.INTERNAL_ERROR: HTTPStatus.INTERNAL_SERVER_ERROR,
}

CODE_BY_STATUS: dict[int, ErrorCode] = {status: code for code, status in STATUS_BY_CODE.items()}
FALLBACK_HTTP_CODE = ErrorCode.HTTP_ERROR

MESSAGE_VALIDATION_FAILED = "Request validation failed"
MESSAGE_INTERNAL_ERROR = "An unexpected error occurred"
LOCATION_SEPARATOR = "."


class ErrorDetail(BaseModel):
    """Detalle de un problema puntual, normalmente asociado a un campo del cuerpo."""

    field: str | None = Field(
        default=None,
        description=(
            "Nombre del campo al que aplica el detalle, como lo escribe el contrato "
            "(`camelCase`); ausente cuando el problema no es de un campo concreto."
        ),
    )
    message: str = Field(description="Descripción del problema, legible para una persona.")
    type: str | None = Field(
        default=None,
        description=(
            "Identificador técnico del error de validación (por ejemplo `int_parsing`); solo "
            "aparece cuando la falla es de forma del cuerpo, no de una regla de negocio."
        ),
    )


class ErrorResponse(BaseModel):
    """Cuerpo uniforme de todas las respuestas de error (4xx y 5xx) del API."""

    # An error body always carries `details`, so the schema declares it required.
    model_config = ConfigDict(json_schema_serialization_defaults_required=True)

    code: ErrorCode = Field(
        description=(
            "Código de error legible por máquina: `VALIDATION_ERROR` (400), `UNAUTHORIZED` "
            "(401), `FORBIDDEN` (403), `NOT_FOUND` (404), `HTTP_ERROR` (otros estados del "
            "framework, como 405) o `INTERNAL_ERROR` (500)."
        )
    )
    message: str = Field(description="Mensaje del error, legible para el usuario final.")
    details: list[ErrorDetail] = Field(
        default_factory=list,
        description=(
            "Un detalle por campo inválido en `VALIDATION_ERROR`; lista vacía en los demás casos."
        ),
    )


def error_response(
    code: ErrorCode,
    message: str,
    details: list[object] | None = None,
    status: int | None = None,
) -> JSONResponse:
    """Serialize an error; the HTTP status defaults to the one that corresponds to its code."""
    body = ErrorResponse(code=code, message=message, details=details or [])
    # `exclude_none` keeps out the keys that do not apply to a given detail (`type` for a domain
    # rule, `field` for a general problem) instead of publishing them as `null`.
    return JSONResponse(
        status_code=status or STATUS_BY_CODE[code],
        content=body.model_dump(mode="json", exclude_none=True),
    )


def _validation_details(exc: RequestValidationError) -> list[object]:
    return [
        ErrorDetail(
            field=LOCATION_SEPARATOR.join(str(part) for part in error["loc"]),
            message=error["msg"],
            type=error["type"],
        )
        for error in exc.errors()
    ]


async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Map FastAPI request validation failures to 400 VALIDATION_ERROR."""
    return error_response(
        ErrorCode.VALIDATION_ERROR, MESSAGE_VALIDATION_FAILED, _validation_details(exc)
    )


async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    """Map application errors (404, 403, 401...) to their contract response."""
    return error_response(exc.code, exc.message, exc.details)


async def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
    """Give framework-raised HTTP errors (unknown route, wrong method...) the contract shape."""
    code = CODE_BY_STATUS.get(exc.status_code, FALLBACK_HTTP_CODE)
    return error_response(code, str(exc.detail), status=exc.status_code)


async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    """Hide internals behind a generic 500 INTERNAL_ERROR, logging the cause."""
    logger.exception("Unhandled error while processing request", exc_info=exc)
    return error_response(ErrorCode.INTERNAL_ERROR, MESSAGE_INTERNAL_ERROR)


def register_error_handlers(app: FastAPI) -> None:
    """Attach the uniform handlers to the application."""
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(AppError, handle_app_error)
    app.add_exception_handler(HTTPException, handle_http_exception)
    app.add_exception_handler(Exception, handle_unexpected_error)
