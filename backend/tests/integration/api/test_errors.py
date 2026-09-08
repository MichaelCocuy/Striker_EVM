"""Every error response follows the contract `Error` shape `{code, message, details}`."""

from http import HTTPStatus

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.application.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.config import Settings
from app.main import create_app

ERROR_KEYS = {"code", "message", "details"}


def _register_probe_routes(app: FastAPI) -> None:
    @app.get("/probe/not-found")
    def raise_not_found() -> None:
        raise NotFoundError("Project", "abc")

    @app.get("/probe/forbidden")
    def raise_forbidden() -> None:
        raise ForbiddenError("Only reviewers can create projects")

    @app.get("/probe/unauthorized")
    def raise_unauthorized() -> None:
        raise UnauthorizedError("Missing bearer token")

    @app.get("/probe/crash")
    def raise_unexpected() -> None:
        raise RuntimeError("boom")

    @app.get("/probe/validated")
    def validated(limit: int) -> dict[str, int]:
        return {"limit": limit}


@pytest.fixture
def client() -> TestClient:
    app = create_app(Settings(_env_file=None))
    _register_probe_routes(app)
    return TestClient(app, raise_server_exceptions=False)


@pytest.mark.parametrize(
    ("path", "status", "code"),
    [
        ("/probe/not-found", HTTPStatus.NOT_FOUND, "NOT_FOUND"),
        ("/probe/forbidden", HTTPStatus.FORBIDDEN, "FORBIDDEN"),
        ("/probe/unauthorized", HTTPStatus.UNAUTHORIZED, "UNAUTHORIZED"),
    ],
)
def test_application_errors_map_to_contract_shape(
    client: TestClient, path: str, status: HTTPStatus, code: str
) -> None:
    response = client.get(path)

    assert response.status_code == status
    body = response.json()
    assert set(body) == ERROR_KEYS
    assert body["code"] == code
    assert body["details"] == []


def test_not_found_message_names_the_resource(client: TestClient) -> None:
    assert client.get("/probe/not-found").json()["message"] == "Project abc not found"


def test_request_validation_error_is_400_with_field_details(client: TestClient) -> None:
    response = client.get("/probe/validated", params={"limit": "many"})

    assert response.status_code == HTTPStatus.BAD_REQUEST
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"][0]["field"] == "query.limit"
    assert body["details"][0]["type"] == "int_parsing"


def test_unknown_route_uses_contract_shape(client: TestClient) -> None:
    response = client.get("/probe/does-not-exist")

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json() == {"code": "NOT_FOUND", "message": "Not Found", "details": []}


def test_wrong_method_uses_contract_shape_with_generic_code(client: TestClient) -> None:
    response = client.post("/probe/validated")

    assert response.status_code == HTTPStatus.METHOD_NOT_ALLOWED
    assert response.json()["code"] == "HTTP_ERROR"
    assert set(response.json()) == ERROR_KEYS


def test_unexpected_error_is_500_without_internals(client: TestClient) -> None:
    response = client.get("/probe/crash")

    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
    body = response.json()
    assert body["code"] == "INTERNAL_ERROR"
    assert "boom" not in body["message"]
