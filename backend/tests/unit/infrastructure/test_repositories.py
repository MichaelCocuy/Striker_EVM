"""Repository adapters against SQLite in-memory: CRUD, listing and cascade delete."""

from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.application.ports import ActivityData, ProjectData
from app.infrastructure.db.models import ActivityModel, ProjectModel, UserModel
from app.infrastructure.db.repositories import (
    SqlAlchemyActivityRepository,
    SqlAlchemyProjectRepository,
    SqlAlchemyUserRepository,
)
from tests.seed import REGISTRAR_ID, REVIEWER_ID, SECOND_REGISTRAR_ID

DESIGN = ActivityData(
    owner_id=REGISTRAR_ID,
    name="Diseño",
    budget_at_completion=Decimal("10000.00"),
    planned_progress_percent=Decimal("100.00"),
    actual_progress_percent=Decimal("100.00"),
    actual_cost=Decimal("9000.00"),
)
DEVELOPMENT = ActivityData(
    owner_id=SECOND_REGISTRAR_ID,
    name="Desarrollo",
    budget_at_completion=Decimal("40000.00"),
    planned_progress_percent=Decimal("50.00"),
    actual_progress_percent=Decimal("40.00"),
    actual_cost=Decimal("20000.00"),
)


@pytest.fixture
def users(session: Session, seeded_users: list[UserModel]) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(session)


@pytest.fixture
def projects(session: Session, seeded_users: list[UserModel]) -> SqlAlchemyProjectRepository:
    return SqlAlchemyProjectRepository(session)


@pytest.fixture
def activities(session: Session) -> SqlAlchemyActivityRepository:
    return SqlAlchemyActivityRepository(session)


@pytest.fixture
def portal(projects: SqlAlchemyProjectRepository) -> ProjectModel:
    return projects.add(ProjectData(name="Portal de clientes"), created_by=REVIEWER_ID)


class TestUserRepository:
    def test_get_by_id_and_email_return_same_user(self, users: SqlAlchemyUserRepository) -> None:
        by_id = users.get_by_id(REVIEWER_ID)
        by_email = users.get_by_email("revisor@striker.local")

        assert by_id is not None
        assert by_id is by_email
        assert by_id.role == "REVIEWER"

    def test_missing_users_return_none(self, users: SqlAlchemyUserRepository) -> None:
        assert users.get_by_id(uuid4()) is None
        assert users.get_by_email("nobody@striker.local") is None

    def test_list_all_is_ordered_by_full_name(self, users: SqlAlchemyUserRepository) -> None:
        names = [user.full_name for user in users.list_all()]

        assert names == ["Ana Registradora", "Carlos Registrador", "Laura Revisora"]

    def test_list_by_ids_returns_only_existing_requested_users(
        self, users: SqlAlchemyUserRepository
    ) -> None:
        found = users.list_by_ids({REGISTRAR_ID, SECOND_REGISTRAR_ID, uuid4()})

        assert {user.id for user in found} == {REGISTRAR_ID, SECOND_REGISTRAR_ID}
        assert users.list_by_ids([]) == []

    def test_role_check_constraint_rejects_unknown_roles(self, session: Session) -> None:
        session.add(
            UserModel(email="x@striker.local", full_name="X", role="ADMIN", password_hash="h")
        )

        with pytest.raises(IntegrityError):
            session.flush()


class TestProjectRepository:
    def test_add_assigns_id_and_timestamps(self, portal: ProjectModel) -> None:
        assert portal.id is not None
        assert portal.description is None
        assert portal.created_by == REVIEWER_ID
        assert portal.created_at is not None
        assert portal.updated_at is not None

    def test_get_returns_added_project_or_none(
        self, projects: SqlAlchemyProjectRepository, portal: ProjectModel
    ) -> None:
        assert projects.get(portal.id) is portal
        assert projects.get(uuid4()) is None

    def test_update_changes_editable_fields(
        self, projects: SqlAlchemyProjectRepository, portal: ProjectModel
    ) -> None:
        updated = projects.update(portal, ProjectData(name="Portal v2", description="Nuevo"))

        assert updated.name == "Portal v2"
        assert updated.description == "Nuevo"

    def test_list_with_activity_count(
        self,
        projects: SqlAlchemyProjectRepository,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
    ) -> None:
        empty = projects.add(ProjectData(name="Vacío"), created_by=REVIEWER_ID)
        activities.add(portal.id, DESIGN)
        activities.add(portal.id, DEVELOPMENT)

        listed = projects.list_with_activity_count()

        counts = {item.project.id: item.activity_count for item in listed}
        assert counts == {portal.id: 2, empty.id: 0}

    def test_list_orders_newest_first(
        self, session: Session, projects: SqlAlchemyProjectRepository, portal: ProjectModel
    ) -> None:
        newer = projects.add(ProjectData(name="Más nuevo"), created_by=REVIEWER_ID)
        newer.created_at = portal.created_at + timedelta(days=1)
        session.flush()

        listed = projects.list_with_activity_count()

        assert [item.project.id for item in listed] == [newer.id, portal.id]

    def test_get_with_activity_count(
        self,
        projects: SqlAlchemyProjectRepository,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
    ) -> None:
        activities.add(portal.id, DESIGN)

        counted = projects.get_with_activity_count(portal.id)

        assert counted is not None
        assert counted.project is portal
        assert counted.activity_count == 1
        assert projects.get_with_activity_count(uuid4()) is None

    def test_delete_cascades_to_activities(
        self,
        session: Session,
        projects: SqlAlchemyProjectRepository,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
    ) -> None:
        activities.add(portal.id, DESIGN)
        activities.add(portal.id, DEVELOPMENT)
        session.expire_all()

        projects.delete(projects.get(portal.id))

        assert projects.get(portal.id) is None
        assert session.scalars(select(ActivityModel)).all() == []


class TestActivityRepository:
    def test_add_and_get(
        self, activities: SqlAlchemyActivityRepository, portal: ProjectModel
    ) -> None:
        design = activities.add(portal.id, DESIGN)

        fetched = activities.get(design.id)
        assert fetched is design
        assert fetched.project_id == portal.id
        assert fetched.budget_at_completion == Decimal("10000.00")
        assert activities.get(uuid4()) is None

    def test_get_in_project_requires_matching_project(
        self,
        projects: SqlAlchemyProjectRepository,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
    ) -> None:
        other = projects.add(ProjectData(name="Otro"), created_by=REVIEWER_ID)
        design = activities.add(portal.id, DESIGN)

        assert activities.get_in_project(portal.id, design.id) is design
        assert activities.get_in_project(other.id, design.id) is None
        assert activities.get_in_project(portal.id, uuid4()) is None

    def test_list_by_project_only_returns_its_activities(
        self,
        projects: SqlAlchemyProjectRepository,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
    ) -> None:
        other = projects.add(ProjectData(name="Otro"), created_by=REVIEWER_ID)
        activities.add(portal.id, DESIGN)
        activities.add(other.id, DEVELOPMENT)

        names = [activity.name for activity in activities.list_by_project(portal.id)]

        assert names == ["Diseño"]

    def test_update_replaces_every_editable_field(
        self, activities: SqlAlchemyActivityRepository, portal: ProjectModel
    ) -> None:
        design = activities.add(portal.id, DESIGN)

        updated = activities.update(design, DEVELOPMENT)

        assert updated.name == "Desarrollo"
        assert updated.owner_id == SECOND_REGISTRAR_ID
        assert updated.actual_cost == Decimal("20000.00")

    def test_delete_removes_only_that_activity(
        self, activities: SqlAlchemyActivityRepository, portal: ProjectModel
    ) -> None:
        design = activities.add(portal.id, DESIGN)
        development = activities.add(portal.id, DEVELOPMENT)

        activities.delete(design)

        assert [a.id for a in activities.list_by_project(portal.id)] == [development.id]

    @pytest.mark.parametrize(
        "invalid",
        [
            {"budget_at_completion": Decimal("0")},
            {"actual_cost": Decimal("-1")},
            {"planned_progress_percent": Decimal("100.01")},
            {"actual_progress_percent": Decimal("-0.01")},
        ],
    )
    def test_check_constraints_reject_out_of_range_values(
        self,
        activities: SqlAlchemyActivityRepository,
        portal: ProjectModel,
        invalid: dict[str, Decimal],
    ) -> None:
        data = ActivityData(**{**DESIGN.__dict__, **invalid})

        with pytest.raises(IntegrityError):
            activities.add(portal.id, data)

    def test_activity_requires_existing_project(
        self, activities: SqlAlchemyActivityRepository, seeded_users: list[UserModel]
    ) -> None:
        with pytest.raises(IntegrityError):
            activities.add(uuid4(), DESIGN)
