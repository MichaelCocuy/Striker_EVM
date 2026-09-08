"""Seed data and settings shared by the test suite (the three users of ARQUITECTURA.md §11)."""

from uuid import UUID

from app.core.config import Settings
from app.domain.auth.roles import UserRole
from app.infrastructure.db.models import UserModel

REVIEWER_ID = UUID("11111111-1111-4111-8111-000000000001")
REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000002")
SECOND_REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000003")

REVIEWER_EMAIL = "revisor@striker.local"
REGISTRAR_EMAIL = "registrador@striker.local"
SECOND_REGISTRAR_EMAIL = "registrador2@striker.local"

SEED_PASSWORD = "Striker2026!"
TEST_BCRYPT_ROUNDS = 4
TEST_JWT_SECRET = "integration-test-secret-with-32-bytes!!"

SEED_USERS: tuple[tuple[UUID, str, str, UserRole], ...] = (
    (REVIEWER_ID, REVIEWER_EMAIL, "Laura Revisora", UserRole.REVIEWER),
    (REGISTRAR_ID, REGISTRAR_EMAIL, "Carlos Registrador", UserRole.REGISTRAR),
    (SECOND_REGISTRAR_ID, SECOND_REGISTRAR_EMAIL, "Ana Registradora", UserRole.REGISTRAR),
)


def build_seed_users(password_hash: str) -> list[UserModel]:
    """Instantiate the seed users, all sharing the given password hash."""
    return [
        UserModel(
            id=user_id, email=email, full_name=full_name, role=role, password_hash=password_hash
        )
        for user_id, email, full_name, role in SEED_USERS
    ]


def build_test_settings() -> Settings:
    """Settings for API tests: no .env, fast bcrypt and a fixed signing key."""
    return Settings(_env_file=None, bcrypt_rounds=TEST_BCRYPT_ROUNDS, jwt_secret=TEST_JWT_SECRET)
