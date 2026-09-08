"""Login: right credentials issue a token, anything else is a uniform 401."""

import pytest

from app.application.auth.login_use_case import MESSAGE_INVALID_CREDENTIALS, LoginUseCase
from app.application.errors import ErrorCode, UnauthorizedError
from tests.unit.application.fakes import (
    FAKE_EXPIRES_IN,
    FakePasswordHasher,
    FakeTokenService,
    FakeUserRepository,
    reviewer,
)

PASSWORD = "Striker2026!"


@pytest.fixture
def use_case() -> LoginUseCase:
    users = FakeUserRepository([reviewer(PASSWORD)])
    return LoginUseCase(users, FakePasswordHasher(), FakeTokenService())


def test_right_credentials_return_user_token_and_lifetime(use_case: LoginUseCase) -> None:
    session = use_case.authenticate("revisor@striker.local", PASSWORD)

    assert session.user.email == "revisor@striker.local"
    assert session.access_token == FakeTokenService().create_token(
        session.user.id, session.user.role
    )
    assert session.expires_in_seconds == FAKE_EXPIRES_IN


def test_wrong_password_is_unauthorized(use_case: LoginUseCase) -> None:
    with pytest.raises(UnauthorizedError) as error:
        use_case.authenticate("revisor@striker.local", "wrong")

    assert error.value.code == ErrorCode.UNAUTHORIZED
    assert error.value.message == MESSAGE_INVALID_CREDENTIALS


def test_unknown_email_is_unauthorized_with_the_same_message(use_case: LoginUseCase) -> None:
    with pytest.raises(UnauthorizedError) as error:
        use_case.authenticate("nobody@striker.local", PASSWORD)

    assert error.value.message == MESSAGE_INVALID_CREDENTIALS
