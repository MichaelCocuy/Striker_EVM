"""bcrypt hashing and verification."""

import pytest

from app.infrastructure.security.password_hasher import BcryptPasswordHasher

FAST_ROUNDS = 4
PASSWORD = "Striker2026!"


@pytest.fixture
def hasher() -> BcryptPasswordHasher:
    return BcryptPasswordHasher(rounds=FAST_ROUNDS)


def test_hash_is_salted_bcrypt_with_the_configured_cost(hasher: BcryptPasswordHasher) -> None:
    first, second = hasher.hash(PASSWORD), hasher.hash(PASSWORD)

    assert first.startswith(f"$2b${FAST_ROUNDS:02d}$")
    assert first != second


def test_verify_accepts_the_right_password(hasher: BcryptPasswordHasher) -> None:
    assert hasher.verify(PASSWORD, hasher.hash(PASSWORD)) is True


def test_verify_rejects_a_wrong_password(hasher: BcryptPasswordHasher) -> None:
    assert hasher.verify("wrong-password", hasher.hash(PASSWORD)) is False


def test_verify_rejects_a_malformed_hash(hasher: BcryptPasswordHasher) -> None:
    assert hasher.verify(PASSWORD, "$2b$12$not-a-real-hash") is False


def test_default_cost_matches_the_settings_default() -> None:
    assert BcryptPasswordHasher().hash(PASSWORD).startswith("$2b$12$")
