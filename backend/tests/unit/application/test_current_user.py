"""Current user resolution: valid token of an existing user, or 401."""

from uuid import uuid4

import pytest

from app.application.auth.current_user import MESSAGE_INVALID_TOKEN, CurrentUserResolver
from app.application.errors import UnauthorizedError
from app.domain.auth.roles import UserRole
from tests.unit.application.fakes import FakeTokenService, FakeUserRepository, registrar

TOKENS = FakeTokenService()


@pytest.fixture
def resolver() -> CurrentUserResolver:
    return CurrentUserResolver(FakeUserRepository([registrar()]), TOKENS)


def test_valid_token_resolves_the_persisted_user(resolver: CurrentUserResolver) -> None:
    user = registrar()

    assert resolver.resolve(TOKENS.create_token(user.id, user.role)).id == user.id


def test_invalid_token_is_unauthorized(resolver: CurrentUserResolver) -> None:
    with pytest.raises(UnauthorizedError, match=MESSAGE_INVALID_TOKEN):
        resolver.resolve("garbage")


def test_token_of_a_deleted_user_is_unauthorized(resolver: CurrentUserResolver) -> None:
    with pytest.raises(UnauthorizedError, match=MESSAGE_INVALID_TOKEN):
        resolver.resolve(TOKENS.create_token(uuid4(), UserRole.REGISTRAR))
