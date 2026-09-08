"""Contract tests of `GET /projects/{projectId}/evm` against the shared response fixtures.

The database is seeded with the example project of `docs/EVM_GUIA.md` section 6 using the ids of
`docs/api/fixtures/evm-report.json`, so the response can be compared field by field (only
`generatedAt` is volatile).
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from http import HTTPStatus
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.infrastructure.db.models import ActivityModel, ProjectModel
from tests.contract_fixtures import (
    EVM_REPORT_EMPTY_PROJECT_FIXTURE,
    EVM_REPORT_FIXTURE,
    load_json_fixture,
    parse_json_decimals,
)
from tests.seed import REGISTRAR_ID, REVIEWER_ID, SECOND_REGISTRAR_ID

PORTAL_ID = UUID("22222222-2222-4222-8222-000000000001")
EMPTY_PROJECT_ID = UUID("22222222-2222-4222-8222-000000000002")
GENERATED_AT_FIELD = "generatedAt"
CREATION_BASE = datetime(2026, 9, 1, 8, 0, tzinfo=UTC)

RawActivity = tuple[str, UUID, str, str, str, str, str]

# (id, owner, name, BAC, planned %, actual %, AC) as in EVM_GUIA.md section 6.1.
PORTAL_ACTIVITIES: tuple[RawActivity, ...] = (
    ("33333333-3333-4333-8333-000000000001", REGISTRAR_ID, "Diseño", "10000", "100", "100", "9000"),
    (
        "33333333-3333-4333-8333-000000000002",
        SECOND_REGISTRAR_ID,
        "Desarrollo",
        "40000",
        "50",
        "40",
        "20000",
    ),
    ("33333333-3333-4333-8333-000000000003", REGISTRAR_ID, "Pruebas", "10000", "20", "30", "2500"),
)


def report_path(project_id: UUID) -> str:
    """URL of the report endpoint for a project."""
    return f"/api/v1/projects/{project_id}/evm"


def build_activities() -> list[ActivityModel]:
    """The three guide activities, staggered in time so the listing order is 1, 2, 3."""
    return [
        ActivityModel(
            id=UUID(activity_id),
            project_id=PORTAL_ID,
            owner_id=owner_id,
            name=name,
            budget_at_completion=Decimal(budget),
            planned_progress_percent=Decimal(planned),
            actual_progress_percent=Decimal(actual),
            actual_cost=Decimal(cost),
            created_at=CREATION_BASE + timedelta(minutes=position),
            updated_at=CREATION_BASE + timedelta(minutes=position),
        )
        for position, (activity_id, owner_id, name, budget, planned, actual, cost) in enumerate(
            PORTAL_ACTIVITIES
        )
    ]


@pytest.fixture
def seeded_client(client: TestClient, engine: Engine) -> TestClient:
    """API client whose database also holds the guide project and an empty one."""
    with Session(engine) as seeding:
        seeding.add(ProjectModel(id=PORTAL_ID, name="Portal de clientes", created_by=REVIEWER_ID))
        seeding.add(
            ProjectModel(
                id=EMPTY_PROJECT_ID, name="Proyecto sin actividades", created_by=REVIEWER_ID
            )
        )
        seeding.add_all(build_activities())
        seeding.commit()
    return client


@pytest.mark.parametrize("headers_fixture", ["reviewer_headers", "registrar_headers"])
def test_report_of_the_guide_project_matches_the_fixture(
    seeded_client: TestClient, request: pytest.FixtureRequest, headers_fixture: str
) -> None:
    headers: dict[str, str] = request.getfixturevalue(headers_fixture)

    response = seeded_client.get(report_path(PORTAL_ID), headers=headers)

    assert response.status_code == HTTPStatus.OK
    body = parse_json_decimals(response.text)
    expected = load_json_fixture(EVM_REPORT_FIXTURE)
    generated_at = body.pop(GENERATED_AT_FIELD)
    expected.pop(GENERATED_AT_FIELD)
    assert body == expected
    assert datetime.fromisoformat(generated_at).tzinfo is not None


def test_project_indicators_are_the_consolidated_values_of_the_guide(
    seeded_client: TestClient, reviewer_headers: dict[str, str]
) -> None:
    response = seeded_client.get(report_path(PORTAL_ID), headers=reviewer_headers)

    indicators = parse_json_decimals(response.text)["project"]["indicators"]
    assert indicators["costPerformanceIndex"] == Decimal("0.9206")
    assert indicators["schedulePerformanceIndex"] == Decimal("0.9063")
    assert indicators["estimateAtCompletion"] == Decimal("65172.41")
    assert indicators["varianceAtCompletion"] == Decimal("-5172.41")
    assert indicators["costStatus"] == "OVER_BUDGET"
    assert indicators["scheduleStatus"] == "BEHIND_SCHEDULE"


def test_empty_project_reports_zeros_and_the_no_activities_note(
    seeded_client: TestClient, reviewer_headers: dict[str, str]
) -> None:
    response = seeded_client.get(report_path(EMPTY_PROJECT_ID), headers=reviewer_headers)

    assert response.status_code == HTTPStatus.OK
    body = parse_json_decimals(response.text)
    expected = load_json_fixture(EVM_REPORT_EMPTY_PROJECT_FIXTURE)
    body.pop(GENERATED_AT_FIELD)
    expected.pop(GENERATED_AT_FIELD)
    assert body == expected


def test_unknown_project_answers_not_found(
    seeded_client: TestClient, reviewer_headers: dict[str, str]
) -> None:
    response = seeded_client.get(report_path(uuid4()), headers=reviewer_headers)

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json()["code"] == "NOT_FOUND"


def test_anonymous_is_unauthorized(seeded_client: TestClient) -> None:
    response = seeded_client.get(report_path(PORTAL_ID))

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json()["code"] == "UNAUTHORIZED"


def test_malformed_project_id_is_a_validation_error(
    seeded_client: TestClient, reviewer_headers: dict[str, str]
) -> None:
    response = seeded_client.get("/api/v1/projects/not-a-uuid/evm", headers=reviewer_headers)

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.json()["code"] == "VALIDATION_ERROR"
