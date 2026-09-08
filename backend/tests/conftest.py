"""Shared fixtures: an in-memory SQLite database with the full schema and seed users."""

from collections.abc import Iterator
from uuid import UUID

import pytest
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine.interfaces import DBAPIConnection
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.domain.auth.roles import UserRole
from app.infrastructure.db.models import Base, UserModel

SQLITE_IN_MEMORY_URL = "sqlite+pysqlite:///:memory:"
ENABLE_FOREIGN_KEYS = "PRAGMA foreign_keys=ON"

REVIEWER_ID = UUID("11111111-1111-4111-8111-000000000001")
REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000002")
SECOND_REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000003")
FAKE_PASSWORD_HASH = "$2b$12$not-a-real-hash"


def _enable_sqlite_foreign_keys(dbapi_connection: DBAPIConnection, _: object) -> None:
    dbapi_connection.execute(ENABLE_FOREIGN_KEYS)


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
def seeded_users(session: Session) -> list[UserModel]:
    """The three seed users of ARQUITECTURA.md section 11."""
    users = [
        UserModel(
            id=REVIEWER_ID,
            email="revisor@striker.local",
            full_name="Laura Revisora",
            role=UserRole.REVIEWER,
            password_hash=FAKE_PASSWORD_HASH,
        ),
        UserModel(
            id=REGISTRAR_ID,
            email="registrador@striker.local",
            full_name="Carlos Registrador",
            role=UserRole.REGISTRAR,
            password_hash=FAKE_PASSWORD_HASH,
        ),
        UserModel(
            id=SECOND_REGISTRAR_ID,
            email="registrador2@striker.local",
            full_name="Ana Registradora",
            role=UserRole.REGISTRAR,
            password_hash=FAKE_PASSWORD_HASH,
        ),
    ]
    session.add_all(users)
    session.flush()
    return users
