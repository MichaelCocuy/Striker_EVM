"""PyJWT adapter of the `TokenService` port (HS256 access tokens, ARQUITECTURA.md section 11)."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from app.application.ports import InvalidTokenError, TokenClaims

CLAIM_SUBJECT = "sub"
CLAIM_ROLE = "role"
CLAIM_EXPIRES_AT = "exp"
CLAIM_ISSUED_AT = "iat"
REQUIRED_CLAIMS = (CLAIM_SUBJECT, CLAIM_ROLE, CLAIM_EXPIRES_AT, CLAIM_ISSUED_AT)

MESSAGE_MISSING_CLAIM = "Token is missing the {claim} claim"
MESSAGE_INVALID_SUBJECT = "Token subject is not a valid user id"

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    """Default clock: timezone-aware current time."""
    return datetime.now(tz=UTC)


class JwtTokenService:
    """Signs and verifies JWTs carrying the user id (`sub`) and role (`role`)."""

    def __init__(
        self, secret: str, algorithm: str, expires_minutes: int, clock: Clock = utc_now
    ) -> None:
        self._secret = secret
        self._algorithm = algorithm
        self._lifetime = timedelta(minutes=expires_minutes)
        self._clock = clock

    @property
    def expires_in_seconds(self) -> int:
        """Token lifetime as advertised in `LoginResponse.expiresIn`."""
        return int(self._lifetime.total_seconds())

    def create_token(self, user_id: UUID, role: str) -> str:
        """Issue a signed token valid from now for the configured lifetime."""
        issued_at = self._clock()
        payload = {
            CLAIM_SUBJECT: str(user_id),
            CLAIM_ROLE: role,
            CLAIM_ISSUED_AT: issued_at,
            CLAIM_EXPIRES_AT: issued_at + self._lifetime,
        }
        return jwt.encode(payload, self._secret, algorithm=self._algorithm)

    def decode_token(self, token: str) -> TokenClaims:
        """Verify signature, expiry and required claims; raise `InvalidTokenError` otherwise."""
        try:
            payload = jwt.decode(
                token,
                self._secret,
                algorithms=[self._algorithm],
                options={"require": list(REQUIRED_CLAIMS)},
            )
        except jwt.MissingRequiredClaimError as error:
            raise InvalidTokenError(MESSAGE_MISSING_CLAIM.format(claim=error.claim)) from error
        except jwt.InvalidTokenError as error:
            raise InvalidTokenError(str(error)) from error
        try:
            user_id = UUID(str(payload[CLAIM_SUBJECT]))
        except ValueError as error:
            raise InvalidTokenError(MESSAGE_INVALID_SUBJECT) from error
        return TokenClaims(user_id=user_id, role=str(payload[CLAIM_ROLE]))
