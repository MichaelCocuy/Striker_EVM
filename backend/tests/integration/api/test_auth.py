"""Contract tests of `POST /auth/login` and `GET /auth/me`."""

from http import HTTPStatus

from fastapi.testclient import TestClient

from tests.conftest import AUTHORIZATION_HEADER, LOGIN_PATH, AuthHeaders
from tests.seed import REGISTRAR_EMAIL, REVIEWER_EMAIL, REVIEWER_ID, SEED_PASSWORD

ME_PATH = "/api/v1/auth/me"
EXPECTED_EXPIRES_IN = 28_800
REVIEWER_USER = {
    "id": str(REVIEWER_ID),
    "email": REVIEWER_EMAIL,
    "fullName": "Laura Revisora",
    "role": "REVIEWER",
}
ERROR_KEYS = {"code", "message", "details"}


def test_login_returns_token_lifetime_and_user(client: TestClient) -> None:
    response = client.post(LOGIN_PATH, json={"email": REVIEWER_EMAIL, "password": SEED_PASSWORD})

    assert response.status_code == HTTPStatus.OK
    body = response.json()
    assert set(body) == {"accessToken", "tokenType", "expiresIn", "user"}
    assert body["tokenType"] == "bearer"
    assert body["expiresIn"] == EXPECTED_EXPIRES_IN
    assert body["user"] == REVIEWER_USER
    assert body["accessToken"].count(".") == 2


def test_login_with_wrong_password_is_401(client: TestClient) -> None:
    response = client.post(LOGIN_PATH, json={"email": REVIEWER_EMAIL, "password": "wrong"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json() == {
        "code": "UNAUTHORIZED",
        "message": "Invalid email or password",
        "details": [],
    }


def test_login_with_unknown_email_gives_the_same_401(client: TestClient) -> None:
    response = client.post(LOGIN_PATH, json={"email": "nobody@striker.local", "password": "x"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json()["message"] == "Invalid email or password"


def test_login_with_malformed_body_is_400(client: TestClient) -> None:
    response = client.post(LOGIN_PATH, json={"email": REVIEWER_EMAIL})

    assert response.status_code == HTTPStatus.BAD_REQUEST
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"][0]["field"] == "body.password"


def test_me_returns_the_token_owner(client: TestClient, auth_headers: AuthHeaders) -> None:
    response = client.get(ME_PATH, headers=auth_headers(REGISTRAR_EMAIL))

    assert response.status_code == HTTPStatus.OK
    assert response.json()["email"] == REGISTRAR_EMAIL
    assert response.json()["role"] == "REGISTRAR"
    assert "passwordHash" not in response.json()


def test_me_without_token_is_401(client: TestClient) -> None:
    response = client.get(ME_PATH)

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json() == {
        "code": "UNAUTHORIZED",
        "message": "Missing bearer token",
        "details": [],
    }


def test_me_with_garbage_token_is_401(client: TestClient) -> None:
    response = client.get(ME_PATH, headers={AUTHORIZATION_HEADER: "Bearer not-a-jwt"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json()["code"] == "UNAUTHORIZED"
    assert response.json()["message"] == "Invalid or expired token"


def test_me_with_a_non_bearer_scheme_is_401(client: TestClient) -> None:
    response = client.get(ME_PATH, headers={AUTHORIZATION_HEADER: "Basic dXNlcjpwYXNz"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert set(response.json()) == ERROR_KEYS


def test_openapi_declares_bearer_auth_and_public_routes(client: TestClient) -> None:
    spec = client.get("/api-docs/openapi.json").json()

    assert spec["components"]["securitySchemes"]["bearerAuth"]["scheme"] == "bearer"
    assert "security" not in spec["paths"]["/api/v1/health"]["get"]
    assert "security" not in spec["paths"][LOGIN_PATH]["post"]
    assert spec["paths"][ME_PATH]["get"]["security"] == [{"bearerAuth": []}]
