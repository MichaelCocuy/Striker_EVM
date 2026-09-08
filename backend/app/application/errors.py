"""Application-level errors, independent of any web framework."""

from enum import StrEnum


class ErrorCode(StrEnum):
    """Machine-readable codes exposed in the `Error` contract shape."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    HTTP_ERROR = "HTTP_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class AppError(Exception):
    """Base class for errors raised by use cases; the API layer maps them to HTTP responses."""

    code: ErrorCode = ErrorCode.INTERNAL_ERROR

    def __init__(self, message: str, details: list[object] | None = None) -> None:
        self.message = message
        self.details: list[object] = details or []
        super().__init__(message)


class NotFoundError(AppError):
    """The requested resource does not exist."""

    code = ErrorCode.NOT_FOUND

    def __init__(self, resource: str, identifier: object) -> None:
        super().__init__(f"{resource} {identifier} not found")
        self.resource = resource
        self.identifier = identifier


class UnauthorizedError(AppError):
    """The request carries no valid credentials."""

    code = ErrorCode.UNAUTHORIZED


class ForbiddenError(AppError):
    """The authenticated user is not allowed to perform the action."""

    code = ErrorCode.FORBIDDEN
