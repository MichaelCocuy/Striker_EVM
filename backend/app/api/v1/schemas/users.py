"""`User` schema of the contract."""

from uuid import UUID

from app.api.v1.schemas.common import CamelCaseModel
from app.domain.auth.roles import UserRole


class UserResponse(CamelCaseModel):
    """Public view of a user (never exposes the password hash)."""

    id: UUID
    email: str
    full_name: str
    role: UserRole
