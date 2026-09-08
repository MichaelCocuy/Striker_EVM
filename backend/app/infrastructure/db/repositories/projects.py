"""SQLAlchemy adapter of the `ProjectRepository` port."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.application.ports import ProjectData, ProjectWithActivityCount
from app.infrastructure.db.models import ActivityModel, ProjectModel


class SqlAlchemyProjectRepository:
    """Persistence of `project` rows; changes are flushed, the caller owns the transaction."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def list_with_activity_count(self) -> list[ProjectWithActivityCount]:
        """Return every project with its number of activities, oldest first."""
        activity_count = func.count(ActivityModel.id)
        statement = (
            select(ProjectModel, activity_count)
            .outerjoin(ActivityModel, ActivityModel.project_id == ProjectModel.id)
            .group_by(ProjectModel.id)
            .order_by(ProjectModel.created_at, ProjectModel.name)
        )
        return [
            ProjectWithActivityCount(project=project, activity_count=count)
            for project, count in self._session.execute(statement)
        ]

    def get(self, project_id: UUID) -> ProjectModel | None:
        """Return the project with the given id, or None."""
        return self._session.get(ProjectModel, project_id)

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
