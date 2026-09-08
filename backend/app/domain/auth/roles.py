"""User roles of Striker EVM (ARQUITECTURA.md, section 11)."""

from enum import StrEnum


class UserRole(StrEnum):
    """Who registers progress versus who reviews it."""

    REGISTRAR = "REGISTRAR"
    REVIEWER = "REVIEWER"
