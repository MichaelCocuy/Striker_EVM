"""`GetProjectEvmReport` against in-memory fakes, checked with the shared contract fixtures."""

import json
from dataclasses import asdict
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from pydantic.alias_generators import to_camel

from app.application.errors import NotFoundError
from app.application.evm.get_project_report import GetProjectEvmReport, ProjectEvmReport
from app.domain.evm import EvmIndicators
from tests.unit.application.fakes import (
    REGISTRAR_ID,
    REVIEWER_ID,
    FakeActivity,
    FakeActivityRepository,
    FakeProject,
    FakeProjectRepository,
    FakeUser,
    FakeUserDirectory,
    registrar,
    reviewer,
)

FIXTURES_DIR = Path(__file__).resolve().parents[5] / "docs" / "api" / "fixtures"
SEED_REPORT_FIXTURE = FIXTURES_DIR / "evm-report.json"
EMPTY_REPORT_FIXTURE = FIXTURES_DIR / "evm-report-empty-project.json"

PORTAL_ID = UUID("22222222-2222-4222-8222-000000000001")
EMPTY_PROJECT_ID = UUID("22222222-2222-4222-8222-000000000002")
SECOND_REGISTRAR_ID = UUID("11111111-1111-4111-8111-000000000003")
FROZEN_NOW = datetime(2026, 9, 8, 12, 0, tzinfo=UTC)
ACTIVITY_NAME_FIELD = "name"

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


def load_fixture(path: Path) -> dict[str, object]:
    """Parse a fixture keeping every number as an exact `Decimal`."""
    return json.loads(path.read_text(encoding="utf-8"), parse_float=Decimal, parse_int=Decimal)


def indicators_as_fixture(indicators: EvmIndicators) -> dict[str, object]:
    """Camel-case view of the domain indicators, comparable with a fixture `indicators` block."""
    values = asdict(indicators)
    values["notes"] = list(values["notes"])
    return {to_camel(name): value for name, value in values.items()}


def second_registrar() -> FakeUser:
    return FakeUser(
        id=SECOND_REGISTRAR_ID,
        email="registrador2@striker.local",
        full_name="Ana Registradora",
        role="REGISTRAR",
        password_hash="unused",
    )


def build_activity(raw: RawActivity) -> FakeActivity:
    activity_id, owner_id, name, budget, planned, actual, cost = raw
    return FakeActivity(
        id=UUID(activity_id),
        project_id=PORTAL_ID,
        owner_id=owner_id,
        name=name,
        budget_at_completion=Decimal(budget),
        planned_progress_percent=Decimal(planned),
        actual_progress_percent=Decimal(actual),
        actual_cost=Decimal(cost),
    )


@pytest.fixture
def users() -> FakeUserDirectory:
    return FakeUserDirectory([reviewer(), registrar(), second_registrar()])


@pytest.fixture
def use_case(users: FakeUserDirectory) -> GetProjectEvmReport:
    projects = FakeProjectRepository(
        [
            FakeProject(id=PORTAL_ID, name="Portal de clientes", created_by=REVIEWER_ID),
            FakeProject(
                id=EMPTY_PROJECT_ID, name="Proyecto sin actividades", created_by=REVIEWER_ID
            ),
        ]
    )
    activities = FakeActivityRepository([build_activity(raw) for raw in PORTAL_ACTIVITIES])
    return GetProjectEvmReport(projects, activities, users, clock=lambda: FROZEN_NOW)


class TestSeedProject:
    @pytest.fixture
    def report(self, use_case: GetProjectEvmReport) -> ProjectEvmReport:
        return use_case.execute(PORTAL_ID)

    @pytest.fixture
    def expected(self) -> dict[str, object]:
        return load_fixture(SEED_REPORT_FIXTURE)

    def test_project_summary_matches_the_guide(
        self, report: ProjectEvmReport, expected: dict[str, object]
    ) -> None:
        assert str(report.project_id) == expected["project"]["id"]
        assert report.project_name == expected["project"]["name"]
        expected_indicators = expected["project"]["indicators"]
        assert indicators_as_fixture(report.project_indicators) == expected_indicators
        assert report.generated_at == FROZEN_NOW

    def test_activities_keep_repository_order_and_match_the_guide(
        self, report: ProjectEvmReport, expected: dict[str, object]
    ) -> None:
        assert len(report.activities) == len(expected["activities"])
        for actual, wanted in zip(report.activities, expected["activities"], strict=True):
            assert str(actual.id) == wanted["id"]
            assert actual.name == wanted["name"]
            assert str(actual.owner.id) == wanted["owner"]["id"]
            assert actual.owner.full_name == wanted["owner"]["fullName"]
            measures = {
                to_camel(field): value
                for field, value in asdict(actual.input).items()
                if field != ACTIVITY_NAME_FIELD
            }
            assert measures == wanted["input"]
            assert indicators_as_fixture(actual.indicators) == wanted["indicators"]

    def test_owners_are_resolved_with_a_single_lookup(
        self, report: ProjectEvmReport, users: FakeUserDirectory
    ) -> None:
        assert users.lookups == 1


class TestEmptyProject:
    def test_report_has_zero_indicators_and_the_no_activities_note(
        self, use_case: GetProjectEvmReport, users: FakeUserDirectory
    ) -> None:
        expected = load_fixture(EMPTY_REPORT_FIXTURE)

        report = use_case.execute(EMPTY_PROJECT_ID)

        assert str(report.project_id) == expected["project"]["id"]
        assert report.project_name == expected["project"]["name"]
        expected_indicators = expected["project"]["indicators"]
        assert indicators_as_fixture(report.project_indicators) == expected_indicators
        assert report.activities == ()
        assert users.lookups == 0


def test_unknown_project_raises_not_found(use_case: GetProjectEvmReport) -> None:
    missing_id = uuid4()

    with pytest.raises(NotFoundError) as error:
        use_case.execute(missing_id)

    assert error.value.resource == "Project"
    assert error.value.identifier == missing_id


def test_default_clock_is_utc() -> None:
    use_case = GetProjectEvmReport(
        FakeProjectRepository([FakeProject(id=PORTAL_ID, name="P", created_by=REVIEWER_ID)]),
        FakeActivityRepository([]),
        FakeUserDirectory([]),
    )

    report = use_case.execute(PORTAL_ID)

    assert report.generated_at.tzinfo is UTC
