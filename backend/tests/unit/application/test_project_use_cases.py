"""Project use cases against in-memory fakes: management is a REVIEWER capability."""

from uuid import uuid4

import pytest

from app.application.errors import ForbiddenError, NotFoundError
from app.application.ports import ProjectData
from app.application.projects.access import MESSAGE_MANAGE_PROJECTS_FORBIDDEN
from app.application.projects.create_project_use_case import CreateProjectUseCase
from app.application.projects.delete_project_use_case import DeleteProjectUseCase
from app.application.projects.get_project_use_case import GetProjectUseCase
from app.application.projects.list_projects_use_case import ListProjectsUseCase
from app.application.projects.update_project_use_case import UpdateProjectUseCase
from tests.unit.application.fakes import (
    DESIGN_ACTIVITY,
    FakeActivityRepository,
    FakeProject,
    FakeProjectRepository,
    FakeUserRepository,
    registrar,
    reviewer,
)

PORTAL = ProjectData(name="Portal de clientes", description="Portal de autogestión")
RENAMED = ProjectData(name="Portal v2", description=None)


@pytest.fixture
def activities() -> FakeActivityRepository:
    return FakeActivityRepository()


@pytest.fixture
def projects(activities: FakeActivityRepository) -> FakeProjectRepository:
    return FakeProjectRepository(activities)


@pytest.fixture
def users() -> FakeUserRepository:
    return FakeUserRepository([reviewer(), registrar()])


@pytest.fixture
def portal(projects: FakeProjectRepository) -> FakeProject:
    return projects.add(PORTAL, created_by=reviewer().id)


class TestCreateProject:
    def test_reviewer_creates_a_project_they_own(self, projects: FakeProjectRepository) -> None:
        view = CreateProjectUseCase(projects).execute(reviewer(), PORTAL)

        assert view.project.name == PORTAL.name
        assert view.project.created_by == reviewer().id
        assert view.creator.full_name == "Laura Revisora"
        assert view.activity_count == 0

    def test_registrar_is_forbidden(self, projects: FakeProjectRepository) -> None:
        with pytest.raises(ForbiddenError, match=MESSAGE_MANAGE_PROJECTS_FORBIDDEN):
            CreateProjectUseCase(projects).execute(registrar(), PORTAL)


class TestListAndGetProject:
    def test_list_resolves_creator_and_counts_activities(
        self,
        projects: FakeProjectRepository,
        activities: FakeActivityRepository,
        users: FakeUserRepository,
        portal: FakeProject,
    ) -> None:
        activities.add(portal.id, DESIGN_ACTIVITY)

        views = ListProjectsUseCase(projects, users).execute()

        assert [(view.project.id, view.activity_count) for view in views] == [(portal.id, 1)]
        assert views[0].creator.id == reviewer().id

    def test_get_returns_the_project(
        self, projects: FakeProjectRepository, users: FakeUserRepository, portal: FakeProject
    ) -> None:
        view = GetProjectUseCase(projects, users).execute(portal.id)

        assert view.project.id == portal.id
        assert view.activity_count == 0

    def test_get_unknown_project_is_not_found(
        self, projects: FakeProjectRepository, users: FakeUserRepository
    ) -> None:
        with pytest.raises(NotFoundError):
            GetProjectUseCase(projects, users).execute(uuid4())


class TestUpdateProject:
    def test_reviewer_replaces_name_and_description(
        self,
        projects: FakeProjectRepository,
        activities: FakeActivityRepository,
        users: FakeUserRepository,
        portal: FakeProject,
    ) -> None:
        activities.add(portal.id, DESIGN_ACTIVITY)

        view = UpdateProjectUseCase(projects, users).execute(reviewer(), portal.id, RENAMED)

        assert view.project.name == RENAMED.name
        assert view.project.description is None
        assert view.activity_count == 1

    def test_registrar_is_forbidden(
        self, projects: FakeProjectRepository, users: FakeUserRepository, portal: FakeProject
    ) -> None:
        with pytest.raises(ForbiddenError):
            UpdateProjectUseCase(projects, users).execute(registrar(), portal.id, RENAMED)

    def test_unknown_project_is_not_found(
        self, projects: FakeProjectRepository, users: FakeUserRepository
    ) -> None:
        with pytest.raises(NotFoundError):
            UpdateProjectUseCase(projects, users).execute(reviewer(), uuid4(), RENAMED)


class TestDeleteProject:
    def test_reviewer_deletes_the_project_and_its_activities(
        self,
        projects: FakeProjectRepository,
        activities: FakeActivityRepository,
        portal: FakeProject,
    ) -> None:
        activities.add(portal.id, DESIGN_ACTIVITY)

        DeleteProjectUseCase(projects).execute(reviewer(), portal.id)

        assert projects.get(portal.id) is None
        assert activities.list_by_project(portal.id) == []

    def test_registrar_is_forbidden(
        self, projects: FakeProjectRepository, portal: FakeProject
    ) -> None:
        with pytest.raises(ForbiddenError):
            DeleteProjectUseCase(projects).execute(registrar(), portal.id)

    def test_unknown_project_is_not_found(self, projects: FakeProjectRepository) -> None:
        with pytest.raises(NotFoundError):
            DeleteProjectUseCase(projects).execute(reviewer(), uuid4())
