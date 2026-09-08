"""Access to the shared contract of `docs/api` (the API's source of truth).

`docs/api/openapi.yaml` is the hand-written contract and `docs/api/fixtures/*.json` the example
payloads both sides agree on.
"""

import json
from decimal import Decimal
from pathlib import Path
from typing import Any

import yaml

API_DOCS_DIR = Path(__file__).resolve().parents[2] / "docs" / "api"
CANONICAL_CONTRACT = API_DOCS_DIR / "openapi.yaml"
FIXTURES_DIR = API_DOCS_DIR / "fixtures"
EVM_REPORT_FIXTURE = FIXTURES_DIR / "evm-report.json"
EVM_REPORT_EMPTY_PROJECT_FIXTURE = FIXTURES_DIR / "evm-report-empty-project.json"
PROJECT_FIXTURE = FIXTURES_DIR / "project.json"
ACTIVITIES_FIXTURE = FIXTURES_DIR / "activities.json"


def load_canonical_contract() -> dict[str, Any]:
    """Parse the hand-written OpenAPI contract the generated document must agree with."""
    return yaml.safe_load(CANONICAL_CONTRACT.read_text(encoding="utf-8"))


def load_json_fixture(path: Path) -> dict[str, object]:
    """Parse a fixture keeping every number as an exact `Decimal` instead of a float."""
    return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal, parse_int=Decimal)


def load_json_list_fixture(path: Path) -> list[dict[str, object]]:
    """Parse a fixture that holds a JSON array, keeping its numbers as exact `Decimal`s."""
    return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal, parse_int=Decimal)


def parse_json_decimals(raw: str) -> dict[str, object]:
    """Parse a JSON response body the same way, so numbers compare exactly against a fixture."""
    return json.loads(raw, parse_float=Decimal, parse_int=Decimal)
