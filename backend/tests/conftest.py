"""Shared fixtures: an in-memory SQLite database with the full schema, seed users and an
authenticated API client.

Later modules should reuse `client`, `auth_headers`, `reviewer_headers` and `registrar_headers`.
"""

from collections.abc import Callable, Iterator
from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.infrastructure.db.models import Base, UserModel
from app.infrastructure.db.session import get_db_session
from app.infrastructure.security import BcryptPasswordHasher
from app.main import create_app
from tests.seed import (
    REGISTRAR_EMAIL,
    REVIEWER_EMAIL,
    SEED_PASSWORD,
    TEST_BCRYPT_ROUNDS,
    build_seed_users,
    build_test_settings,
)

SQLITE_IN_MEMORY_URL = "sqlite+pysqlite:///:memory:"
ENABLE_FOREIGN_KEYS = "PRAGMA foreign_keys=ON"
LOGIN_PATH = "/api/v1/auth/login"
AUTHORIZATION_HEADER = "Authorization"
BEARER_PREFIX = "Bearer "

AuthHeaders = Callable[[str], dict[str, str]]


def _enable_sqlite_foreign_keys(dbapi_connection: DBAPIConnection, _: object) -> None:
    dbapi_connection.execute(ENABLE_FOREIGN_KEYS)


@pytest.fixture(scope="session")
def seed_password_hash() -> str:
    """bcrypt hash of the seed password, computed once with a low cost to keep tests fast."""
    return BcryptPasswordHasher(rounds=TEST_BCRYPT_ROUNDS).hash(SEED_PASSWORD)


@pytest.fixture
def engine() -> Iterator[Engine]:
    """In-memory SQLite engine with foreign keys enforced and the schema created."""
    engine = create_engine(
        SQLITE_IN_MEMORY_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    event.listen(engine, "connect", _enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session(engine: Engine) -> Iterator[Session]:
    """Session on the in-memory database, rolled back at the end of the test."""
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as session:
        yield session
        session.rollback()


@pytest.fixture
def seeded_users(session: Session, seed_password_hash: str) -> list[UserModel]:
    """The three seed users of ARQUITECTURA.md section 11, flushed in the test session."""
    users = build_seed_users(seed_password_hash)
    session.add_all(users)
    session.flush()
    return users


@pytest.fixture
def client(engine: Engine, seed_password_hash: str) -> TestClient:
    """API client over the in-memory database, with the seed users committed."""
    with Session(engine) as seeding:
        seeding.add_all(build_seed_users(seed_password_hash))
        seeding.commit()
    app = create_app(build_test_settings())

    def override_session() -> Iterator[Session]:
        with Session(engine) as request_session:
            yield request_session
            request_session.commit()

    app.dependency_overrides[get_db_session] = override_session
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> AuthHeaders:
    """Factory: log in as the given seed email and return the `Authorization` header."""

    def headers_for(email: str) -> dict[str, str]:
        response = client.post(LOGIN_PATH, json={"email": email, "password": SEED_PASSWORD})
        assert response.status_code == HTTPStatus.OK, response.text
        return {AUTHORIZATION_HEADER: f"{BEARER_PREFIX}{response.json()['accessToken']}"}

    return headers_for


@pytest.fixture
def reviewer_headers(auth_headers: AuthHeaders) -> dict[str, str]:
    """Bearer header of the REVIEWER seed user."""
    return auth_headers(REVIEWER_EMAIL)


@pytest.fixture
def registrar_headers(auth_headers: AuthHeaders) -> dict[str, str]:
    """Bearer header of the first REGISTRAR seed user."""
    return auth_headers(REGISTRAR_EMAIL)
