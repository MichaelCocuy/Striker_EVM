"""Numeric conventions of the EVM domain (EVM_GUIA.md, section 7)."""

from decimal import ROUND_HALF_UP, Decimal

MONEY_PLACES = 2
INDEX_PLACES = 4
ROUNDING = ROUND_HALF_UP

ZERO = Decimal("0")
UNIT_INDEX = Decimal("1")
PERCENT_SCALE = Decimal("100")
MIN_PERCENT = ZERO
MAX_PERCENT = PERCENT_SCALE

_MONEY_QUANTUM = Decimal(1).scaleb(-MONEY_PLACES)
_INDEX_QUANTUM = Decimal(1).scaleb(-INDEX_PLACES)


def round_money(value: Decimal) -> Decimal:
    """Round a monetary amount to MONEY_PLACES decimals using half-up rounding."""
    return value.quantize(_MONEY_QUANTUM, rounding=ROUNDING)


def round_index(value: Decimal) -> Decimal:
    """Round a performance index to INDEX_PLACES decimals using half-up rounding."""
    return value.quantize(_INDEX_QUANTUM, rounding=ROUNDING)


def percent_to_fraction(percent: Decimal) -> Decimal:
    """Convert a 0-100 percentage into a 0-1 fraction."""
    return percent / PERCENT_SCALE
