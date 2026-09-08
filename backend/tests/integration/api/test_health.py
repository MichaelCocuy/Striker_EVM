"""Contract test of `GET /api/v1/health`.

The database check runs against SQLite: an in-memory database for the healthy case and an
engine pointing to an unreachable file for the unavailable case (no PostgreSQL required).
"""

from collections.abc import Iterator
from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import APP_VERSION, Settings
from app.infrastructure.db.session import get_db_session
from app.main import create_app

HEALTH_PATH = "/api/v1/health"
UNREACHABLE_SQLITE_URL = "sqlite+pysqlite:////nonexistent-directory/striker.db"


def _client_with_engine(engine: Engine) -> TestClient:
    app = create_app(Settings(_env_file=None))

    def override_session() -> Iterator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db_session] = override_session
    return TestClient(app)


@pytest.fixture
def healthy_client(engine: Engine) -> TestClient:
    return _client_with_engine(engine)


@pytest.fixture
def unhealthy_client() -> TestClient:
    return _client_with_engine(create_engine(UNREACHABLE_SQLITE_URL))


def test_health_reports_ok_when_database_answers(healthy_client: TestClient) -> None:
    response = healthy_client.get(HEALTH_PATH)

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok", "database": "ok", "version": APP_VERSION}


def test_health_reports_database_unavailable_when_query_fails(
    unhealthy_client: TestClient,
) -> None:
    response = unhealthy_client.get(HEALTH_PATH)

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok", "database": "unavailable", "version": APP_VERSION}


def test_openapi_document_is_served_at_api_docs(healthy_client: TestClient) -> None:
    response = healthy_client.get("/api-docs/openapi.json")

    assert response.status_code == HTTPStatus.OK
    assert HEALTH_PATH in response.json()["paths"]
    assert healthy_client.get("/api-docs").status_code == HTTPStatus.OK
