"""The generated OpenAPI document must agree with `docs/api/openapi.yaml`, the canonical contract.

The contract is the synchronization point between backend and frontend (module M1 of
`docs/ARQUITECTURA.md`), so it is the source of truth: when this module fails, the code is what
has to change, unless the contract itself is wrong and is fixed in the same pull request.

What is compared: the set of `(method, path)` operations, the status codes each one declares,
the property names and the required fields of every shared schema, the values of every
enumeration, and which operations are public. Where the two documents legitimately differ, the
difference is named in an allow-list below with the reason, and the intersection is asserted
instead of being skipped.
"""

from http import HTTPStatus
from typing import Any

import pytest

from app.core.config import Settings
from app.main import create_app
from tests.contract_fixtures import load_canonical_contract

# The contract writes its paths without the prefix and declares `/api/v1` in its single relative
# server; FastAPI mounts the routers under the prefix and repeats it in every path. Same
# operations, different place for the prefix.
API_PREFIX = "/api/v1"

HTTP_METHODS = frozenset({"get", "put", "post", "delete", "patch"})

# Accepted difference: the contract names a schema after the resource (`Project`), while the code
# names it after the direction of the message, because the request and the response of one
# resource are two different Python classes with different fields. The mapping is checked to be
# exhaustive on both sides, so a new schema cannot slip through undocumented.
SCHEMA_NAMES = {
    "ActivityMeasures": "ActivityMeasures",
    "ActivityRequest": "ActivityInput",
    "ActivityResponse": "Activity",
    "ComponentStatus": "ComponentStatus",
    "CostStatus": "CostStatus",
    "ErrorCode": "ErrorCode",
    "ErrorDetail": "ErrorDetail",
    "ErrorResponse": "Error",
    "EvmActivityReportSchema": "EvmActivityReport",
    "EvmIndicatorsSchema": "EvmIndicators",
    "EvmProjectSummary": "EvmProjectSummary",
    "EvmReportSchema": "EvmReport",
    "HealthResponse": "HealthResponse",
    "LoginRequest": "LoginRequest",
    "LoginResponse": "LoginResponse",
    "ProjectRequest": "ProjectInput",
    "ProjectResponse": "Project",
    "ScheduleStatus": "ScheduleStatus",
    "UserResponse": "User",
    "UserRole": "Role",
    "UserSummary": "UserSummary",
}

# Accepted difference: the contract factors the scalar types out into named schemas to describe
# their scale once. They are Pydantic annotated types in the code (`JsonNumber`, `ProgressPercent`)
# and a type alias is not a component, so FastAPI inlines them into each property. Their scale is
# documented in the description of the properties that use them.
CONTRACT_ONLY_SCALAR_SCHEMAS = frozenset({"Money", "NullableMoney", "PerformanceIndex", "Percent"})

# Accepted difference: `info.version` of the contract is the version of the document (1.0.0) and
# the one of the generated document is the released version of the service (`APP_VERSION`).
# Accepted difference: the contract groups the operations under Spanish labels (`Proyectos`) and
# the generated document under the names of the routers (`projects`), which is what the reader of
# `/api-docs` navigates; the tags are therefore not compared.

PUBLIC_OPERATIONS = {("GET", "/health"), ("POST", "/auth/login")}
SECURITY_SCHEME = "bearerAuth"

GENERATED = create_app(Settings(_env_file=None)).openapi()
CONTRACT = load_canonical_contract()


def _operations(document: dict[str, Any], prefix: str = "") -> dict[tuple[str, str], Any]:
    """Index the operations of a document by `(METHOD, path)`, without the routing prefix."""
    return {
        (method.upper(), path.removeprefix(prefix)): operation
        for path, path_item in document["paths"].items()
        for method, operation in path_item.items()
        if method in HTTP_METHODS
    }


GENERATED_OPERATIONS = _operations(GENERATED, API_PREFIX)
CONTRACT_OPERATIONS = _operations(CONTRACT)
SHARED_OPERATIONS = sorted(set(GENERATED_OPERATIONS) & set(CONTRACT_OPERATIONS))


def _schemas(document: dict[str, Any]) -> dict[str, Any]:
    return document["components"]["schemas"]


def _flatten(schema: dict[str, Any], document: dict[str, Any]) -> tuple[set[str], set[str]]:
    """Return the property names and the required fields of a schema, resolving `allOf` and refs.

    The contract composes `Activity` out of `ActivityMeasures` plus its own fields; the generated
    schema lists every field flat. Merging the composition makes both comparable.
    """
    properties: set[str] = set()
    required: set[str] = set()
    pending = [schema]
    while pending:
        part = pending.pop()
        if "$ref" in part:
            pending.append(_schemas(document)[part["$ref"].rsplit("/", maxsplit=1)[-1]])
            continue
        properties.update(part.get("properties", {}))
        required.update(part.get("required", []))
        pending.extend(part.get("allOf", []))
    return properties, required


def _is_enum(name: str) -> bool:
    return "enum" in _schemas(GENERATED).get(name, {})


ENUM_PAIRS = [pair for pair in sorted(SCHEMA_NAMES.items()) if _is_enum(pair[0])]
OBJECT_PAIRS = [pair for pair in sorted(SCHEMA_NAMES.items()) if not _is_enum(pair[0])]


def _requires_authentication(document: dict[str, Any], operation: dict[str, Any]) -> bool:
    """Whether the operation needs a token; an operation-level `security: []` opts out."""
    return bool(operation.get("security", document.get("security")))


def test_the_two_documents_declare_the_same_operations() -> None:
    assert set(GENERATED_OPERATIONS) == set(CONTRACT_OPERATIONS)


@pytest.mark.parametrize(("method", "path"), SHARED_OPERATIONS)
def test_every_operation_declares_the_same_status_codes(method: str, path: str) -> None:
    generated = GENERATED_OPERATIONS[method, path]["responses"]
    contract = CONTRACT_OPERATIONS[method, path]["responses"]

    assert set(generated) == set(contract)


@pytest.mark.parametrize(("method", "path"), SHARED_OPERATIONS)
def test_every_operation_documents_when_each_error_happens(method: str, path: str) -> None:
    """Every declared 4xx/5xx carries a description, so the reader learns what triggers it."""
    responses = GENERATED_OPERATIONS[method, path]["responses"]
    errors = [status for status in responses if int(status) >= HTTPStatus.BAD_REQUEST]

    assert errors
    assert all(responses[status].get("description") for status in errors)


def test_the_schema_mapping_covers_every_generated_schema() -> None:
    assert set(_schemas(GENERATED)) == set(SCHEMA_NAMES)


def test_the_schema_mapping_covers_every_schema_of_the_contract() -> None:
    mapped = set(SCHEMA_NAMES.values()) | CONTRACT_ONLY_SCALAR_SCHEMAS

    assert set(_schemas(CONTRACT)) == mapped


@pytest.mark.parametrize(("generated_name", "contract_name"), OBJECT_PAIRS)
def test_shared_schemas_declare_the_same_properties(
    generated_name: str, contract_name: str
) -> None:
    generated, _ = _flatten(_schemas(GENERATED)[generated_name], GENERATED)
    contract, _ = _flatten(_schemas(CONTRACT)[contract_name], CONTRACT)

    assert generated == contract


@pytest.mark.parametrize(("generated_name", "contract_name"), OBJECT_PAIRS)
def test_shared_schemas_declare_the_same_required_fields(
    generated_name: str, contract_name: str
) -> None:
    _, generated = _flatten(_schemas(GENERATED)[generated_name], GENERATED)
    _, contract = _flatten(_schemas(CONTRACT)[contract_name], CONTRACT)

    assert generated == contract


@pytest.mark.parametrize(("generated_name", "contract_name"), ENUM_PAIRS)
def test_enumerations_declare_the_same_values(generated_name: str, contract_name: str) -> None:
    generated = _schemas(GENERATED)[generated_name]["enum"]
    contract = _schemas(CONTRACT)[contract_name]["enum"]

    assert set(generated) == set(contract)


def test_the_same_operations_are_public() -> None:
    generated = {
        operation_key
        for operation_key, operation in GENERATED_OPERATIONS.items()
        if not _requires_authentication(GENERATED, operation)
    }
    contract = {
        operation_key
        for operation_key, operation in CONTRACT_OPERATIONS.items()
        if not _requires_authentication(CONTRACT, operation)
    }

    assert generated == contract == PUBLIC_OPERATIONS


def test_the_bearer_security_scheme_matches_the_contract() -> None:
    generated = GENERATED["components"]["securitySchemes"][SECURITY_SCHEME]
    contract = CONTRACT["components"]["securitySchemes"][SECURITY_SCHEME]

    assert (generated["type"], generated["scheme"]) == (contract["type"], contract["scheme"])
    assert generated["bearerFormat"] == contract["bearerFormat"]
