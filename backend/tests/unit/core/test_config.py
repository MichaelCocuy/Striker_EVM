"""Settings parsing rules."""

from app.core.config import Settings


def test_defaults_match_the_architecture_contract() -> None:
    settings = Settings(_env_file=None)

    assert settings.api_v1_prefix == "/api/v1"
    assert settings.docs_url == "/api-docs"
    assert settings.openapi_url == "/api-docs/openapi.json"
    assert settings.jwt_algorithm == "HS256"
    assert settings.jwt_expires_minutes == 480
    assert settings.cors_origins == ["http://localhost:5173"]


def test_cors_origins_accepts_comma_separated_string() -> None:
    settings = Settings(_env_file=None, cors_origins="http://a.local, http://b.local,")

    assert settings.cors_origins == ["http://a.local", "http://b.local"]


def test_cors_origins_accepts_a_list() -> None:
    settings = Settings(_env_file=None, cors_origins=["http://a.local"])

    assert settings.cors_origins == ["http://a.local"]
