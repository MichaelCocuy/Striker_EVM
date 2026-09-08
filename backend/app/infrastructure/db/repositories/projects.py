"""SQLAlchemy adapter of the `ProjectRepository` port."""

from uuid import UUID

from sqlalchemy import Row, Select, func, select
from sqlalchemy.orm import Session

from app.application.ports import ProjectData, ProjectWithActivityCount
from app.infrastructure.db.models import ActivityModel, ProjectModel


class SqlAlchemyProjectRepository:
    """Persistence of `project` rows; changes are flushed, the caller owns the transaction."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def list_with_activity_count(self) -> list[ProjectWithActivityCount]:
        """Return every project with its number of activities, newest first (API contract)."""
        statement = _with_activity_count().order_by(
            ProjectModel.created_at.desc(), ProjectModel.name
        )
        return [_to_counted(row) for row in self._session.execute(statement)]

    def get(self, project_id: UUID) -> ProjectModel | None:
        """Return the project with the given id, or None."""
        return self._session.get(ProjectModel, project_id)

    def get_with_activity_count(self, project_id: UUID) -> ProjectWithActivityCount | None:
        """Return the project with its number of activities, or None when it does not exist."""
        statement = _with_activity_count().where(ProjectModel.id == project_id)
        row = self._session.execute(statement).one_or_none()
        return None if row is None else _to_counted(row)

    def add(self, data: ProjectData, created_by: UUID) -> ProjectModel:
        """Persist a new project created by the given user."""
        project = ProjectModel(name=data.name, description=data.description, created_by=created_by)
        self._session.add(project)
        self._session.flush()
        return project

    def update(self, project: ProjectModel, data: ProjectData) -> ProjectModel:
        """Apply the editable fields to an existing project."""
        project.name = data.name
        project.description = data.description
        self._session.flush()
        return project

    def delete(self, project: ProjectModel) -> None:
        """Delete the project; its activities go with it (ON DELETE CASCADE)."""
        self._session.delete(project)
        self._session.flush()


def _with_activity_count() -> Select[tuple[ProjectModel, int]]:
    return (
        select(ProjectModel, func.count(ActivityModel.id))
        .outerjoin(ActivityModel, ActivityModel.project_id == ProjectModel.id)
        .group_by(ProjectModel.id)
    )


def _to_counted(row: Row[tuple[ProjectModel, int]]) -> ProjectWithActivityCount:
    project, count = row
    return ProjectWithActivityCount(project=project, activity_count=count)
