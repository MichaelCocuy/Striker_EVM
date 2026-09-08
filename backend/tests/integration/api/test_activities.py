"""Contract tests of the nested activities CRUD: response shape and the ownership matrix."""

from decimal import Decimal
from http import HTTPStatus
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from tests.conftest import AuthHeaders
from tests.contract_fixtures import (
    ACTIVITIES_FIXTURE,
    load_json_list_fixture,
    parse_json_decimals,
)
from tests.seed import (
    REGISTRAR_ID,
    REVIEWER_ID,
    SECOND_REGISTRAR_EMAIL,
    SECOND_REGISTRAR_ID,
)

PROJECTS_PATH = "/api/v1/projects"
MONEY_FIELDS = (
    "budgetAtCompletion",
    "plannedProgressPercent",
    "actualProgressPercent",
    "actualCost",
)
DESIGN = {
    "name": "Diseño",
    "budgetAtCompletion": 10000.00,
    "plannedProgressPercent": 100.00,
    "actualProgressPercent": 100.00,
    "actualCost": 9000.00,
}
DEVELOPMENT = {
    "name": "Desarrollo",
    "budgetAtCompletion": 40000.00,
    "plannedProgressPercent": 50.00,
    "actualProgressPercent": 40.00,
    "actualCost": 20000.00,
}


def activities_path(project_id: str) -> str:
    """URL of the activity collection of a project."""
    return f"{PROJECTS_PATH}/{project_id}/activities"


def activity_path(project_id: str, activity_id: str) -> str:
    """URL of one activity inside a project."""
    return f"{activities_path(project_id)}/{activity_id}"


def create_second_project(client: TestClient, headers: dict[str, str]) -> str:
    """Create another project, to check that an activity is never reachable through it."""
    response = client.post(PROJECTS_PATH, json={"name": "Otro proyecto"}, headers=headers)
    assert response.status_code == HTTPStatus.CREATED, response.text
    return str(response.json()["id"])


@pytest.fixture
def portal_id(client: TestClient, reviewer_headers: dict[str, str]) -> str:
    """Id of a project created by the REVIEWER seed user."""
    response = client.post(
        PROJECTS_PATH, json={"name": "Portal de clientes"}, headers=reviewer_headers
    )
    assert response.status_code == HTTPStatus.CREATED, response.text
    return str(response.json()["id"])


@pytest.fixture
def second_registrar_headers(auth_headers: AuthHeaders) -> dict[str, str]:
    """Bearer header of the second REGISTRAR seed user (Ana, who owns nothing here)."""
    return auth_headers(SECOND_REGISTRAR_EMAIL)


@pytest.fixture
def design(
    client: TestClient, portal_id: str, registrar_headers: dict[str, str]
) -> dict[str, object]:
    """An activity of the project owned by the first REGISTRAR (Carlos)."""
    response = client.post(activities_path(portal_id), json=DESIGN, headers=registrar_headers)
    assert response.status_code == HTTPStatus.CREATED, response.text
    return response.json()


class TestCreateActivity:
    def test_response_follows_the_contract_shape(self, design: dict[str, object]) -> None:
        assert set(design) == set(load_json_list_fixture(ACTIVITIES_FIXTURE)[0])
        assert set(design["owner"]) == {"id", "fullName"}
        assert design["owner"] == {"id": str(REGISTRAR_ID), "fullName": "Carlos Registrador"}
        assert design["name"] == DESIGN["name"]

    def test_money_travels_as_json_numbers_with_two_decimals(
        self, client: TestClient, portal_id: str, registrar_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(portal_id), json=DEVELOPMENT, headers=registrar_headers
        )

        body = parse_json_decimals(response.text)
        assert body["budgetAtCompletion"] == Decimal("40000.00")
        assert body["plannedProgressPercent"] == Decimal("50.00")
        assert body["actualCost"] == Decimal("20000.00")
        assert all(isinstance(body[field], Decimal) for field in MONEY_FIELDS)

    def test_registrar_owns_the_activity_without_sending_owner_id(
        self, design: dict[str, object], portal_id: str
    ) -> None:
        assert design["owner"]["id"] == str(REGISTRAR_ID)
        assert design["projectId"] == portal_id

    def test_reviewer_must_send_owner_id(
        self, client: TestClient, portal_id: str, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(portal_id), json=DEVELOPMENT, headers=reviewer_headers
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        body = response.json()
        assert body["code"] == "VALIDATION_ERROR"
        assert body["details"][0] == {
            "field": "ownerId",
            "message": "ownerId is required for REVIEWER users",
        }

    def test_reviewer_assigns_another_user(
        self, client: TestClient, portal_id: str, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(portal_id),
            json={**DEVELOPMENT, "ownerId": str(SECOND_REGISTRAR_ID)},
            headers=reviewer_headers,
        )

        assert response.status_code == HTTPStatus.CREATED
        assert response.json()["owner"] == {
            "id": str(SECOND_REGISTRAR_ID),
            "fullName": "Ana Registradora",
        }

    def test_registrar_cannot_assign_a_foreign_owner(
        self, client: TestClient, portal_id: str, registrar_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(portal_id),
            json={**DEVELOPMENT, "ownerId": str(SECOND_REGISTRAR_ID)},
            headers=registrar_headers,
        )

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert response.json()["code"] == "FORBIDDEN"

    def test_unknown_owner_is_a_validation_error(
        self, client: TestClient, portal_id: str, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(portal_id),
            json={**DEVELOPMENT, "ownerId": str(uuid4())},
            headers=reviewer_headers,
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert response.json()["details"][0]["field"] == "ownerId"

    def test_unknown_project_is_not_found(
        self, client: TestClient, registrar_headers: dict[str, str]
    ) -> None:
        response = client.post(
            activities_path(str(uuid4())), json=DESIGN, headers=registrar_headers
        )

        assert response.status_code == HTTPStatus.NOT_FOUND
        assert response.json()["code"] == "NOT_FOUND"

    def test_anonymous_is_unauthorized(self, client: TestClient, portal_id: str) -> None:
        response = client.post(activities_path(portal_id), json=DESIGN)

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    @pytest.mark.parametrize(
        ("invalid", "field"),
        [
            ({"budgetAtCompletion": 0}, "budgetAtCompletion"),
            ({"budgetAtCompletion": -5}, "budgetAtCompletion"),
            ({"actualCost": -1}, "actualCost"),
            ({"plannedProgressPercent": 100.01}, "plannedProgressPercent"),
            ({"actualProgressPercent": -0.01}, "actualProgressPercent"),
            ({"name": ""}, "name"),
        ],
    )
    def test_invalid_measures_are_400_naming_the_field(
        self,
        client: TestClient,
        portal_id: str,
        registrar_headers: dict[str, str],
        invalid: dict[str, object],
        field: str,
    ) -> None:
        response = client.post(
            activities_path(portal_id), json={**DESIGN, **invalid}, headers=registrar_headers
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        body = response.json()
        assert body["code"] == "VALIDATION_ERROR"
        assert [detail["field"] for detail in body["details"]] == [f"body.{field}"]


class TestListActivities:
    @pytest.mark.parametrize("role_headers", ["reviewer_headers", "registrar_headers"])
    def test_both_roles_list_the_activities_of_the_project(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        role_headers: str,
        request: pytest.FixtureRequest,
    ) -> None:
        headers: dict[str, str] = request.getfixturevalue(role_headers)

        response = client.get(activities_path(portal_id), headers=headers)

        assert response.status_code == HTTPStatus.OK
        assert [activity["id"] for activity in response.json()] == [design["id"]]

    def test_project_without_activities_answers_an_empty_list(
        self, client: TestClient, portal_id: str, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.get(activities_path(portal_id), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.OK
        assert response.json() == []

    def test_unknown_project_is_not_found(
        self, client: TestClient, reviewer_headers: dict[str, str]
    ) -> None:
        response = client.get(activities_path(str(uuid4())), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.NOT_FOUND

    def test_activities_of_another_project_are_not_listed(
        self,
        client: TestClient,
        design: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        other_id = create_second_project(client, reviewer_headers)

        response = client.get(activities_path(other_id), headers=reviewer_headers)

        assert response.status_code == HTTPStatus.OK
        assert response.json() == []


class TestUpdateActivity:
    def test_owner_replaces_every_measure(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        registrar_headers: dict[str, str],
    ) -> None:
        response = client.put(
            activity_path(portal_id, str(design["id"])),
            json=DEVELOPMENT,
            headers=registrar_headers,
        )

        assert response.status_code == HTTPStatus.OK
        body = parse_json_decimals(response.text)
        assert body["name"] == DEVELOPMENT["name"]
        assert body["actualCost"] == Decimal("20000.00")
        assert body["owner"]["id"] == str(REGISTRAR_ID)
        assert body["id"] == design["id"]

    def test_registrar_cannot_edit_an_activity_of_somebody_else(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        second_registrar_headers: dict[str, str],
    ) -> None:
        response = client.put(
            activity_path(portal_id, str(design["id"])),
            json=DEVELOPMENT,
            headers=second_registrar_headers,
        )

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert response.json()["code"] == "FORBIDDEN"

    def test_registrar_cannot_reassign_the_owner(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        registrar_headers: dict[str, str],
    ) -> None:
        response = client.put(
            activity_path(portal_id, str(design["id"])),
            json={**DEVELOPMENT, "ownerId": str(SECOND_REGISTRAR_ID)},
            headers=registrar_headers,
        )

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_reviewer_edits_any_activity_and_reassigns_it(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        response = client.put(
            activity_path(portal_id, str(design["id"])),
            json={**DEVELOPMENT, "ownerId": str(REVIEWER_ID)},
            headers=reviewer_headers,
        )

        assert response.status_code == HTTPStatus.OK
        assert response.json()["owner"]["id"] == str(REVIEWER_ID)

    def test_activity_of_another_project_is_not_found(
        self,
        client: TestClient,
        design: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        other_id = create_second_project(client, reviewer_headers)

        response = client.put(
            activity_path(other_id, str(design["id"])),
            json={**DEVELOPMENT, "ownerId": str(REGISTRAR_ID)},
            headers=reviewer_headers,
        )

        assert response.status_code == HTTPStatus.NOT_FOUND
        assert response.json()["code"] == "NOT_FOUND"

    def test_unknown_activity_is_not_found(
        self, client: TestClient, portal_id: str, registrar_headers: dict[str, str]
    ) -> None:
        response = client.put(
            activity_path(portal_id, str(uuid4())), json=DESIGN, headers=registrar_headers
        )

        assert response.status_code == HTTPStatus.NOT_FOUND


class TestDeleteActivity:
    def test_owner_deletes_their_activity(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        registrar_headers: dict[str, str],
    ) -> None:
        response = client.delete(
            activity_path(portal_id, str(design["id"])), headers=registrar_headers
        )

        assert response.status_code == HTTPStatus.NO_CONTENT
        assert response.content == b""
        assert client.get(activities_path(portal_id), headers=registrar_headers).json() == []

    def test_reviewer_deletes_any_activity(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        response = client.delete(
            activity_path(portal_id, str(design["id"])), headers=reviewer_headers
        )

        assert response.status_code == HTTPStatus.NO_CONTENT

    def test_registrar_cannot_delete_an_activity_of_somebody_else(
        self,
        client: TestClient,
        portal_id: str,
        design: dict[str, object],
        second_registrar_headers: dict[str, str],
    ) -> None:
        response = client.delete(
            activity_path(portal_id, str(design["id"])), headers=second_registrar_headers
        )

        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_activity_of_another_project_is_not_found(
        self,
        client: TestClient,
        design: dict[str, object],
        reviewer_headers: dict[str, str],
    ) -> None:
        other_id = create_second_project(client, reviewer_headers)

        response = client.delete(
            activity_path(other_id, str(design["id"])), headers=reviewer_headers
        )

        assert response.status_code == HTTPStatus.NOT_FOUND
