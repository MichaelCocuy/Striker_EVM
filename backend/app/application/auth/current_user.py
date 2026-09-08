"""Resolution of the authenticated user from a bearer token."""

from app.application.errors import UnauthorizedError
from app.application.ports import InvalidTokenError, TokenService, UserRecord, UserRepository

MESSAGE_INVALID_TOKEN = "Invalid or expired token"


class CurrentUserResolver:
    """Turn an access token into the persisted user it identifies."""

    def __init__(self, users: UserRepository, tokens: TokenService) -> None:
        self._users = users
        self._tokens = tokens

    def resolve(self, token: str) -> UserRecord:
        """Return the token's user; raise `UnauthorizedError` if the token or user is invalid.

        The token is rejected when it is malformed, tampered with or expired, and also when the
        user it names no longer exists; both cases share one message.
        """
        try:
            claims = self._tokens.decode_token(token)
        except InvalidTokenError as error:
            raise UnauthorizedError(MESSAGE_INVALID_TOKEN) from error
        user = self._users.get_by_id(claims.user_id)
        if user is None:
            raise UnauthorizedError(MESSAGE_INVALID_TOKEN)
        return user
