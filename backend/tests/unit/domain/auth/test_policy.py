"""Permission matrix of ARQUITECTURA.md section 11, checked branch by branch."""

from uuid import UUID

import pytest

from app.domain.auth.errors import ActivityOwnerError, OwnerNotAllowedError, OwnerRequiredError
from app.domain.auth.policy import (
    can_list_users,
    can_manage_projects,
    can_modify_activity,
    resolve_activity_owner,
)
from app.domain.auth.roles import UserRole

REVIEWER_ID = UUID("11111111-1111-4111-8111-000000000001")
REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000002")
OTHER_REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000003")


@pytest.mark.parametrize(
    ("role", "expected"), [(UserRole.REVIEWER, True), (UserRole.REGISTRAR, False)]
)
def test_only_reviewers_manage_projects(role: UserRole, expected: bool) -> None:
    assert can_manage_projects(role) is expected


@pytest.mark.parametrize(
    ("role", "expected"), [(UserRole.REVIEWER, True), (UserRole.REGISTRAR, False)]
)
def test_only_reviewers_list_users(role: UserRole, expected: bool) -> None:
    assert can_list_users(role) is expected


def test_roles_are_accepted_as_plain_strings() -> None:
    assert can_manage_projects("REVIEWER") is True
    assert can_list_users("REGISTRAR") is False


def test_reviewer_modifies_any_activity() -> None:
    assert can_modify_activity(REVIEWER_ID, UserRole.REVIEWER, REGISTRAR_ID) is True


def test_registrar_modifies_own_activity() -> None:
    assert can_modify_activity(REGISTRAR_ID, UserRole.REGISTRAR, REGISTRAR_ID) is True


def test_registrar_cannot_modify_foreign_activity() -> None:
    assert can_modify_activity(REGISTRAR_ID, UserRole.REGISTRAR, OTHER_REGISTRAR_ID) is False


def test_reviewer_owner_is_the_requested_one() -> None:
    owner = resolve_activity_owner(REVIEWER_ID, UserRole.REVIEWER, REGISTRAR_ID)

    assert owner == REGISTRAR_ID


def test_reviewer_must_state_the_owner() -> None:
    with pytest.raises(OwnerRequiredError, match="ownerId is required"):
        resolve_activity_owner(REVIEWER_ID, UserRole.REVIEWER, None)


def test_registrar_is_the_owner_when_none_is_requested() -> None:
    assert resolve_activity_owner(REGISTRAR_ID, UserRole.REGISTRAR, None) == REGISTRAR_ID


def test_registrar_may_request_themselves_as_owner() -> None:
    assert resolve_activity_owner(REGISTRAR_ID, UserRole.REGISTRAR, REGISTRAR_ID) == REGISTRAR_ID


def test_registrar_cannot_request_a_different_owner() -> None:
    with pytest.raises(OwnerNotAllowedError, match="only own their own activities"):
        resolve_activity_owner(REGISTRAR_ID, UserRole.REGISTRAR, OTHER_REGISTRAR_ID)


def test_owner_errors_share_a_domain_base_class() -> None:
    assert issubclass(OwnerRequiredError, ActivityOwnerError)
    assert issubclass(OwnerNotAllowedError, ActivityOwnerError)
    assert issubclass(ActivityOwnerError, ValueError)
