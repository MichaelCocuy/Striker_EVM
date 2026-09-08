"""JWT issuing and validation: happy path, expiry, tampering and missing claims."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
import pytest

from app.application.ports import InvalidTokenError
from app.domain.auth.roles import UserRole
from app.infrastructure.security.jwt_tokens import (
    CLAIM_EXPIRES_AT,
    CLAIM_ISSUED_AT,
    CLAIM_ROLE,
    CLAIM_SUBJECT,
    JwtTokenService,
    utc_now,
)

SECRET = "unit-test-secret-with-at-least-32-bytes"
OTHER_SECRET = "another-secret-with-at-least-32-bytes!"
ALGORITHM = "HS256"
EXPIRES_MINUTES = 480
EXPECTED_EXPIRES_IN = 28_800
USER_ID = UUID("11111111-1111-4111-8111-000000000001")
ISSUED_AT = datetime(2026, 9, 8, 12, 0, tzinfo=UTC)


@pytest.fixture
def service() -> JwtTokenService:
    return JwtTokenService(SECRET, ALGORITHM, EXPIRES_MINUTES)


def _encode(payload: dict[str, object], secret: str = SECRET) -> str:
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def _valid_payload() -> dict[str, object]:
    now = utc_now()
    return {
        CLAIM_SUBJECT: str(USER_ID),
        CLAIM_ROLE: UserRole.REVIEWER,
        CLAIM_ISSUED_AT: now,
        CLAIM_EXPIRES_AT: now + timedelta(minutes=EXPIRES_MINUTES),
    }


def test_expires_in_is_the_lifetime_in_seconds(service: JwtTokenService) -> None:
    assert service.expires_in_seconds == EXPECTED_EXPIRES_IN


def test_token_round_trips_subject_and_role(service: JwtTokenService) -> None:
    claims = service.decode_token(service.create_token(USER_ID, UserRole.REGISTRAR))

    assert claims.user_id == USER_ID
    assert claims.role == UserRole.REGISTRAR


def test_token_carries_issued_at_and_expiry_from_the_clock() -> None:
    frozen = JwtTokenService(SECRET, ALGORITHM, EXPIRES_MINUTES, clock=lambda: ISSUED_AT)

    # The claims are what is under test, so expiry is not verified here: the frozen instant is a
    # fixed date and the token would look expired once the wall clock passes it.
    payload = jwt.decode(
        frozen.create_token(USER_ID, UserRole.REVIEWER),
        SECRET,
        algorithms=[ALGORITHM],
        options={"verify_exp": False},
    )

    assert payload[CLAIM_ISSUED_AT] == int(ISSUED_AT.timestamp())
    assert payload[CLAIM_EXPIRES_AT] - payload[CLAIM_ISSUED_AT] == EXPECTED_EXPIRES_IN


def test_expired_token_is_rejected(service: JwtTokenService) -> None:
    past = utc_now() - timedelta(days=1)
    expired = JwtTokenService(SECRET, ALGORITHM, EXPIRES_MINUTES, clock=lambda: past)

    with pytest.raises(InvalidTokenError, match="expired"):
        service.decode_token(expired.create_token(USER_ID, UserRole.REVIEWER))


def test_token_signed_with_another_secret_is_rejected(service: JwtTokenService) -> None:
    with pytest.raises(InvalidTokenError, match="Signature"):
        service.decode_token(_encode(_valid_payload(), secret=OTHER_SECRET))


def test_garbage_token_is_rejected(service: JwtTokenService) -> None:
    with pytest.raises(InvalidTokenError):
        service.decode_token("not.a.jwt")


@pytest.mark.parametrize("claim", [CLAIM_SUBJECT, CLAIM_ROLE, CLAIM_EXPIRES_AT, CLAIM_ISSUED_AT])
def test_token_missing_a_required_claim_is_rejected(service: JwtTokenService, claim: str) -> None:
    payload = _valid_payload()
    del payload[claim]

    with pytest.raises(InvalidTokenError, match=f"missing the {claim} claim"):
        service.decode_token(_encode(payload))


def test_token_whose_subject_is_not_a_uuid_is_rejected(service: JwtTokenService) -> None:
    payload = _valid_payload()
    payload[CLAIM_SUBJECT] = "not-a-uuid"

    with pytest.raises(InvalidTokenError, match="not a valid user id"):
        service.decode_token(_encode(payload))
