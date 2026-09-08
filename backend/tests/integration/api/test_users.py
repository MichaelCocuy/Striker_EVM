"""Contract tests of `GET /users`: REVIEWER only."""

from http import HTTPStatus

from fastapi.testclient import TestClient

from tests.seed import REGISTRAR_ID, REVIEWER_ID, SECOND_REGISTRAR_ID

USERS_PATH = "/api/v1/users"


def test_reviewer_lists_users_ordered_by_name(
    client: TestClient, reviewer_headers: dict[str, str]
) -> None:
    response = client.get(USERS_PATH, headers=reviewer_headers)

    assert response.status_code == HTTPStatus.OK
    users = response.json()
    assert [user["id"] for user in users] == [
        str(SECOND_REGISTRAR_ID),
        str(REGISTRAR_ID),
        str(REVIEWER_ID),
    ]
    assert set(users[0]) == {"id", "email", "fullName", "role"}


def test_registrar_is_forbidden(client: TestClient, registrar_headers: dict[str, str]) -> None:
    response = client.get(USERS_PATH, headers=registrar_headers)

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json() == {
        "code": "FORBIDDEN",
        "message": "This action requires one of the roles: REVIEWER",
        "details": [],
    }


def test_anonymous_is_unauthorized(client: TestClient) -> None:
    response = client.get(USERS_PATH)

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json()["code"] == "UNAUTHORIZED"
