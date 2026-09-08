"""Contract tests of the projects CRUD: response shape, role matrix and cascade delete."""

from decimal import Decimal
from http import HTTPStatus
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from app.infrastructure.db.models import ActivityModel
from tests.contract_fixtures import PROJECT_FIXTURE, load_json_fixture
from tests.seed import REVIEWER_ID

PROJECTS_PATH = "/api/v1/projects"
ERROR_KEYS = {"code", "message", "details"}
NEW_PROJECT = {"name": "Portal de clientes", "description": "Portal de autogestión"}
RENAMED_PROJECT = {"name": "Portal v2", "description": None}
ACTIVITY_BODY = {
    "name": "Diseño",
    "budgetAtCompletion": 10000.00,
    "plannedProgressPercent": 100.00,
    "actualProgressPercent": 100.00,
    "actualCost": 9000.00,
}


def project_path(project_id: str) -> str:
    """URL of one project."""
    return f"{PROJECTS_PATH}/{project_id}"


def create_project(client: TestClient, headers: dict[str, str]) -> dict[str, object]:
    """Create the sample project as the given user and return the response body."""
    response = client.post(PROJECTS_PATH, json=NEW_PROJECT, headers=headers)
    assert response.status_code == HTTPStatus.CREATED, response.text
    return response.json()


@pytest.fixture
def portal(client: TestClient, reviewer_headers: dict[str, str]) -> dict[str, object]:
    """A project created by the REVIEWER seed user."""
    return create_project(client, reviewer_headers)


class TestCreateProject:
    def test_response_follows_the_contract_shape(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        body = create_project(client, reviewer_headers)

        assert set(body) == set(load_json_fixture(PROJECT_FIXTURE))
        assert set(body["createdBy"]) == {"id", "fullName"}
        assert body["createdBy"] == {"id": str(REVIEWER_ID), "fullName": "Laura Revisora"}
        assert body["name"] == NEW_PROJECT["name"]
        assert body["description"] == NEW_PROJECT["description"]
        assert body["activityCount"] == 0

    def test_registrar_is_forbidden(
        self, client: TestClient, registrar_headers: dict[str, str]
    ) -> None:
        response = client.post(PROJECTS_PATH, json=NEW_PROJECT, headers=registrar_headers)

        assert response.status_code == HTTPStatus.FORBIDDEN
        body = response.json()
        assert set(body) == ERROR_KEYS
        assert body["code"] == "FORBIDDEN"

    def test_anonymous_is_unauthorized(self, client: TestClient) -> None:
        response = client.post(PROJECTS_PATH, json=NEW_PROJECT)

        assert response.status_code == HTTPStatus.UNAUTHORIZED
        assert response.json()["code"] == "UNAUTHORIZED"

    @pytest.mark.parametrize("name", ["", "   ", "x" * 121])
    def test_invalid_name_is_a_validation_error(
        self, client: TestClient, reviewer_headers: dict[str, str], name: str
    ) -> None:
        response = client.post(PROJECTS_PATH, json={"name": name}, headers=reviewer_headers)

        assert response.status_code == HTTPStatus.BAD_REQUEST
        body = response.json()
        assert body["code"] == "VALIDATION_ERROR"
        assert body["details"][0]["field"] == "body.name"

    def test_name_is_trimmed(self, client: TestClient, reviewer_headers: dict[str, str]) -> None:
        response = client.post(PROJECTS_PATH, json={"name": "  Portal  "}, headers=reviewer_headers)

        assert response.json()["name"] == "Portal"


class TestListAndGetProjects:
    @pytest.mark.parametrize("role_headers", ["reviewer_headers", "registrar_headers"])
    def test_both_roles_list_projects(
        self,
        client: TestClient,
        portal: dict[str, object],
        role_headers: str,
        request: pytest.FixtureRequest,
    ) -> None:
        headers: dict[str, str] = request.getfixturevalue(role_headers)

        response = client.get(PROJECTS_PATH, headers=headers)

        assert response.status_code == HTTPStatus.OK
        assert [project["id"] for project in response.json()] == [portal["id"]]

    def test_activity_count_reflects_the_activities(
        self,
        client: TestClient,
        portal: dict[str, object],
        reviewer_headers: dict[str, str],
        registrar_headers: dict[str, str],
    ) -> None:
        activities_path = f"{project_path(str(portal['id']))}/activities"
        for name in ("Diseño", "Pruebas"):
            created = client.post(
                activities_path, json={**ACTIVITY_BODY, "name": name}, headers=registrar_headers
            )
            assert created.status_code == HTTPStatus.CREATED, created.text

        listed = client.get(PROJECTS_PATH, headers=reviewer_headers).json()

        assert [project["activityCount"] for project in listed] == [2]

    def test_get_returns_the_project(
        self, client: TestClient, portal: dict[str, object], registrar_headers: dict[str, str]
    ) -> None:
        response = client.get(project_path(str(portal["id"])), headers=registrar_headers)

        assert response.status_code == HTTPStatus.OK
        assert response.json() == portal

    def test_unknown_project_is_not_found(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.get(project_path(str(uuid4())), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.NOT_FOUND
        assert response.json()["code"] == "NOT_FOUND"

    def test_malformed_id_is_a_validation_error(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.get(project_path("not-a-uuid"), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert response.json()["code"] == "VALIDATION_ERROR"


class TestUpdateProject:
    def test_reviewer_replaces_name_and_description(
        self, client: TestClient, portal: dict[str, object], reviewer_headers: dict[str, str]
    ) -> None:
        response = client.put(
            project_path(str(portal["id"])), json=RENAMED_PROJECT, headers=reviewer_headers
        )

        assert response.status_code == HTTPStatus.OK
        body = response.json()
        assert body["name"] == RENAMED_PROJECT["name"]
        assert body["description"] is None
        assert body["id"] == portal["id"]

    def test_registrar_is_forbidden(
        self, client: TestClient, portal: dict[str, object], registrar_headers: dict[str, str]
    ) -> None:
        response = client.put(
            project_path(str(portal["id"])), json=RENAMED_PROJECT, headers=registrar_headers
        )

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_unknown_project_is_not_found(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.put(
            project_path(str(uuid4())), json=RENAMED_PROJECT, headers=reviewer_headers
        )

        assert response.status_code == HTTPStatus.NOT_FOUND


class TestDeleteProject:
    def test_reviewer_deletes_the_project_and_cascades_its_activities(
        self,
        client: TestClient,
        engine: Engine,
        portal: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        project_id = str(portal["id"])
        created = client.post(
            f"{project_path(project_id)}/activities",
            json={**ACTIVITY_BODY, "ownerId": str(REVIEWER_ID)},
            headers=reviewer_headers,
        )
        assert created.status_code == HTTPStatus.CREATED, created.text

        response = client.delete(project_path(project_id), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.NO_CONTENT
        assert response.content == b""
        assert (
            client.get(project_path(project_id), headers=reviewer_headers).status_code
            == HTTPStatus.NOT_FOUND
        )
        with Session(engine) as session:
            assert session.scalars(select(ActivityModel)).all() == []

    def test_registrar_is_forbidden(
        self, client: TestClient, portal: dict[str, object], registrar_headers: dict[str, str]
    ) -> None:
        response = client.delete(project_path(str(portal["id"])), headers=registrar_headers)

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_unknown_project_is_not_found(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.delete(project_path(str(uuid4())), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.NOT_FOUND


def test_money_is_not_part_of_the_project_payload(portal: dict[str, object]) -> None:
    """The project resource carries no amounts; they belong to its activities."""
    assert not any(isinstance(value, Decimal | float) for value in portal.values())
