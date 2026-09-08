"""Access to the shared contract fixtures of `docs/api/fixtures` (the API's source of truth)."""

import json
from decimal import Decimal
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parents[2] / "docs" / "api" / "fixtures"
EVM_REPORT_FIXTURE = FIXTURES_DIR / "evm-report.json"
EVM_REPORT_EMPTY_PROJECT_FIXTURE = FIXTURES_DIR / "evm-report-empty-project.json"
PROJECT_FIXTURE = FIXTURES_DIR / "project.json"
ACTIVITIES_FIXTURE = FIXTURES_DIR / "activities.json"


def load_json_fixture(path: Path) -> dict[str, object]:
    """Parse a fixture keeping every number as an exact `Decimal` instead of a float."""
    return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal, parse_int=Decimal)


def load_json_list_fixture(path: Path) -> list[dict[str, object]]:
    """Parse a fixture that holds a JSON array, keeping its numbers as exact `Decimal`s."""
    return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal, parse_int=Decimal)


def parse_json_decimals(raw: str) -> dict[str, object]:
    """Parse a JSON response body the same way, so numbers compare exactly against a fixture."""
    return json.loads(raw, parse_float=Decimal, parse_int=Decimal)
