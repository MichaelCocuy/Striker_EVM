"""bcrypt adapter of the `PasswordHasher` port."""

import bcrypt

from app.core.config import DEFAULT_BCRYPT_ROUNDS

PASSWORD_ENCODING = "utf-8"


class BcryptPasswordHasher:
    """Hashes passwords with bcrypt; the cost factor is configurable (lower it only in tests)."""

    def __init__(self, rounds: int = DEFAULT_BCRYPT_ROUNDS) -> None:
        self._rounds = rounds

    def hash(self, password: str) -> str:
        """Return a salted bcrypt hash of the password."""
        salt = bcrypt.gensalt(rounds=self._rounds)
        return bcrypt.hashpw(password.encode(PASSWORD_ENCODING), salt).decode(PASSWORD_ENCODING)

    def verify(self, password: str, password_hash: str) -> bool:
        """Tell whether the password matches the hash; a malformed hash never matches."""
        try:
            return bcrypt.checkpw(
                password.encode(PASSWORD_ENCODING), password_hash.encode(PASSWORD_ENCODING)
            )
        except ValueError:
            return False
