"""Listing users is a REVIEWER capability."""

import pytest

from app.application.auth.list_users_use_case import (
    MESSAGE_LIST_USERS_FORBIDDEN,
    ListUsersUseCase,
)
from app.application.errors import ForbiddenError
from tests.unit.application.fakes import FakeUserRepository, registrar, reviewer


@pytest.fixture
def use_case() -> ListUsersUseCase:
    return ListUsersUseCase(FakeUserRepository([reviewer(), registrar()]))


def test_reviewer_lists_every_user_ordered_by_name(use_case: ListUsersUseCase) -> None:
    names = [user.full_name for user in use_case.execute(reviewer())]

    assert names == ["Carlos Registrador", "Laura Revisora"]


def test_registrar_is_forbidden(use_case: ListUsersUseCase) -> None:
    with pytest.raises(ForbiddenError, match=MESSAGE_LIST_USERS_FORBIDDEN):
        use_case.execute(registrar())
