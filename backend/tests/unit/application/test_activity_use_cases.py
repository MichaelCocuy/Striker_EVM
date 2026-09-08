"""Activity use cases against in-memory fakes: owner resolution, measures and edit rights."""

from dataclasses import replace
from decimal import Decimal
from uuid import uuid4

import pytest

from app.application.activities.access import (
    MESSAGE_MODIFY_ACTIVITY_FORBIDDEN,
    load_activity_in_project,
)
from app.application.activities.commands import ActivityCommand
from app.application.activities.create_activity_use_case import CreateActivityUseCase
from app.application.activities.delete_activity_use_case import DeleteActivityUseCase
from app.application.activities.list_activities_use_case import ListActivitiesUseCase
from app.application.activities.update_activity_use_case import UpdateActivityUseCase
from app.application.activities.validation import MESSAGE_INVALID_MEASURES
from app.application.errors import ErrorCode, ForbiddenError, NotFoundError, ValidationError
from app.application.ports import ProjectData
from tests.unit.application.fakes import (
    DESIGN_ACTIVITY,
    REGISTRAR_ID,
    SECOND_REGISTRAR_ID,
    FakeActivity,
    FakeActivityRepository,
    FakeProject,
    FakeProjectRepository,
    FakeUserRepository,
    registrar,
    reviewer,
    second_registrar,
)

DEVELOPMENT = ActivityCommand(
    name="Desarrollo",
    owner_id=None,
    budget_at_completion=Decimal("40000.00"),
    planned_progress_percent=Decimal("50.00"),
    actual_progress_percent=Decimal("40.00"),
    actual_cost=Decimal("20000.00"),
)


@pytest.fixture
def activities() -> FakeActivityRepository:
    return FakeActivityRepository()


@pytest.fixture
def projects(activities: FakeActivityRepository) -> FakeProjectRepository:
    return FakeProjectRepository(activities=activities)


@pytest.fixture
def users() -> FakeUserRepository:
    return FakeUserRepository([reviewer(), registrar(), second_registrar()])


@pytest.fixture
def portal(projects: FakeProjectRepository) -> FakeProject:
    return projects.add(ProjectData(name="Portal de clientes"), created_by=reviewer().id)


@pytest.fixture
def design(activities: FakeActivityRepository, portal: FakeProject) -> FakeActivity:
    """An activity of the portal project owned by the first REGISTRAR."""
    return activities.add(portal.id, DESIGN_ACTIVITY)


@pytest.fixture
def create(
    projects: FakeProjectRepository,
    activities: FakeActivityRepository,
    users: FakeUserRepository,
) -> CreateActivityUseCase:
    return CreateActivityUseCase(projects, activities, users)


@pytest.fixture
def list_activities(
    projects: FakeProjectRepository,
    activities: FakeActivityRepository,
    users: FakeUserRepository,
) -> ListActivitiesUseCase:
    return ListActivitiesUseCase(projects, activities, users)


@pytest.fixture
def update(activities: FakeActivityRepository, users: FakeUserRepository) -> UpdateActivityUseCase:
    return UpdateActivityUseCase(activities, users)


@pytest.fixture
def delete(activities: FakeActivityRepository) -> DeleteActivityUseCase:
    return DeleteActivityUseCase(activities)


class TestCreateActivity:
    def test_registrar_becomes_the_owner_without_sending_owner_id(
        self, create: CreateActivityUseCase, portal: FakeProject
    ) -> None:
        view = create.execute(registrar(), portal.id, DEVELOPMENT)

        assert view.activity.owner_id == REGISTRAR_ID
        assert view.owner.full_name == "Carlos Registrador"
        assert view.activity.project_id == portal.id
        assert view.activity.budget_at_completion == Decimal("40000.00")

    def test_reviewer_must_name_an_owner(
        self, create: CreateActivityUseCase, portal: FakeProject
    ) -> None:
        with pytest.raises(ValidationError) as error:
            create.execute(reviewer(), portal.id, DEVELOPMENT)

        assert error.value.code == ErrorCode.VALIDATION_ERROR
        assert error.value.details[0] == {
            "field": "ownerId",
            "message": "ownerId is required for REVIEWER users",
        }

    def test_reviewer_assigns_another_user(
        self, create: CreateActivityUseCase, portal: FakeProject
    ) -> None:
        command = replace(DEVELOPMENT, owner_id=SECOND_REGISTRAR_ID)

        view = create.execute(reviewer(), portal.id, command)

        assert view.activity.owner_id == SECOND_REGISTRAR_ID
        assert view.owner.full_name == "Ana Registradora"

    def test_registrar_cannot_assign_another_user(
        self, create: CreateActivityUseCase, portal: FakeProject
    ) -> None:
        command = replace(DEVELOPMENT, owner_id=SECOND_REGISTRAR_ID)

        with pytest.raises(ForbiddenError) as error:
            create.execute(registrar(), portal.id, command)

        assert error.value.code == ErrorCode.FORBIDDEN

    def test_unknown_owner_is_a_validation_error(
        self, create: CreateActivityUseCase, portal: FakeProject
    ) -> None:
        command = replace(DEVELOPMENT, owner_id=uuid4())

        with pytest.raises(ValidationError) as error:
            create.execute(reviewer(), portal.id, command)

        assert error.value.details[0]["field"] == "ownerId"

    def test_unknown_project_is_not_found(self, create: CreateActivityUseCase) -> None:
        with pytest.raises(NotFoundError):
            create.execute(registrar(), uuid4(), DEVELOPMENT)

    @pytest.mark.parametrize(
        ("invalid", "field"),
        [
            ({"budget_at_completion": Decimal("0")}, "budgetAtCompletion"),
            ({"actual_cost": Decimal("-1")}, "actualCost"),
            ({"planned_progress_percent": Decimal("100.01")}, "plannedProgressPercent"),
            ({"actual_progress_percent": Decimal("-0.01")}, "actualProgressPercent"),
        ],
    )
    def test_measures_outside_the_domain_rules_name_the_field(
        self,
        create: CreateActivityUseCase,
        portal: FakeProject,
        invalid: dict[str, Decimal],
        field: str,
    ) -> None:
        command = replace(DEVELOPMENT, **invalid)

        with pytest.raises(ValidationError) as error:
            create.execute(registrar(), portal.id, command)

        assert error.value.message == MESSAGE_INVALID_MEASURES
        assert error.value.details[0]["field"] == field


class TestListActivities:
    def test_lists_the_activities_of_the_project_with_their_owners(
        self, list_activities: ListActivitiesUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        views = list_activities.execute(portal.id)

        assert [view.activity.id for view in views] == [design.id]
        assert views[0].owner.id == REGISTRAR_ID

    def test_project_without_activities_returns_an_empty_list(
        self, list_activities: ListActivitiesUseCase, portal: FakeProject
    ) -> None:
        assert list_activities.execute(portal.id) == []

    def test_unknown_project_is_not_found(self, list_activities: ListActivitiesUseCase) -> None:
        with pytest.raises(NotFoundError):
            list_activities.execute(uuid4())


class TestUpdateActivity:
    def test_owner_updates_their_activity(
        self, update: UpdateActivityUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        view = update.execute(registrar(), portal.id, design.id, DEVELOPMENT)

        assert view.activity.name == "Desarrollo"
        assert view.activity.owner_id == REGISTRAR_ID
        assert view.activity.actual_cost == Decimal("20000.00")

    def test_registrar_cannot_update_an_activity_of_somebody_else(
        self, update: UpdateActivityUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        with pytest.raises(ForbiddenError, match=MESSAGE_MODIFY_ACTIVITY_FORBIDDEN):
            update.execute(second_registrar(), portal.id, design.id, DEVELOPMENT)

    def test_registrar_cannot_reassign_the_owner(
        self, update: UpdateActivityUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        command = replace(DEVELOPMENT, owner_id=SECOND_REGISTRAR_ID)

        with pytest.raises(ForbiddenError):
            update.execute(registrar(), portal.id, design.id, command)

    def test_reviewer_reassigns_the_owner(
        self, update: UpdateActivityUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        command = replace(DEVELOPMENT, owner_id=SECOND_REGISTRAR_ID)

        view = update.execute(reviewer(), portal.id, design.id, command)

        assert view.activity.owner_id == SECOND_REGISTRAR_ID
        assert view.owner.full_name == "Ana Registradora"

    def test_activity_of_another_project_is_not_found(
        self,
        update: UpdateActivityUseCase,
        projects: FakeProjectRepository,
        design: FakeActivity,
    ) -> None:
        other = projects.add(ProjectData(name="Otro"), created_by=reviewer().id)

        with pytest.raises(NotFoundError):
            update.execute(reviewer(), other.id, design.id, DEVELOPMENT)


class TestDeleteActivity:
    def test_owner_deletes_their_activity(
        self,
        delete: DeleteActivityUseCase,
        activities: FakeActivityRepository,
        design: FakeActivity,
        portal: FakeProject,
    ) -> None:
        delete.execute(registrar(), portal.id, design.id)

        assert activities.list_by_project(portal.id) == []

    def test_reviewer_deletes_any_activity(
        self,
        delete: DeleteActivityUseCase,
        activities: FakeActivityRepository,
        design: FakeActivity,
        portal: FakeProject,
    ) -> None:
        delete.execute(reviewer(), portal.id, design.id)

        assert activities.get(design.id) is None

    def test_registrar_cannot_delete_an_activity_of_somebody_else(
        self, delete: DeleteActivityUseCase, design: FakeActivity, portal: FakeProject
    ) -> None:
        with pytest.raises(ForbiddenError):
            delete.execute(second_registrar(), portal.id, design.id)

    def test_unknown_activity_is_not_found(
        self, delete: DeleteActivityUseCase, portal: FakeProject
    ) -> None:
        with pytest.raises(NotFoundError):
            delete.execute(reviewer(), portal.id, uuid4())


def test_loader_reports_the_activity_resource(
    activities: FakeActivityRepository, portal: FakeProject
) -> None:
    missing_id = uuid4()

    with pytest.raises(NotFoundError) as error:
        load_activity_in_project(activities, portal.id, missing_id)

    assert error.value.message == f"Activity {missing_id} not found"
