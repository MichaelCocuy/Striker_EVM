"""Guards shared by the project use cases: who may manage projects and which ones exist."""

from uuid import UUID

from app.application.errors import ForbiddenError, NotFoundError
from app.application.ports import (
    ProjectRecord,
    ProjectRepository,
    ProjectWithActivityCount,
    UserRecord,
)
from app.domain.auth.policy import can_manage_projects

RESOURCE_PROJECT = "Project"
MESSAGE_MANAGE_PROJECTS_FORBIDDEN = "Only REVIEWER users can create, edit or delete projects"


def ensure_can_manage_projects(actor: UserRecord) -> None:
    """Raise `ForbiddenError` unless the actor's role administers projects."""
    if not can_manage_projects(actor.role):
        raise ForbiddenError(MESSAGE_MANAGE_PROJECTS_FORBIDDEN)


def load_project(projects: ProjectRepository, project_id: UUID) -> ProjectRecord:
    """Return the project, or raise `NotFoundError` when it does not exist."""
    project = projects.get(project_id)
    if project is None:
        raise NotFoundError(RESOURCE_PROJECT, project_id)
    return project


def load_counted_project(projects: ProjectRepository, project_id: UUID) -> ProjectWithActivityCount:
    """Return the project with its activity count, or raise `NotFoundError`."""
    counted = projects.get_with_activity_count(project_id)
    if counted is None:
        raise NotFoundError(RESOURCE_PROJECT, project_id)
    return counted
