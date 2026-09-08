"""SQLAlchemy adapter of the `ActivityRepository` port."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application.ports import ActivityData
from app.infrastructure.db.models import ActivityModel


class SqlAlchemyActivityRepository:
    """Persistence of `activity` rows; changes are flushed, the caller owns the transaction."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def list_by_project(self, project_id: UUID) -> list[ActivityModel]:
        """Return the activities of a project, oldest first."""
        statement = (
            select(ActivityModel)
            .where(ActivityModel.project_id == project_id)
            .order_by(ActivityModel.created_at, ActivityModel.name)
        )
        return list(self._session.scalars(statement))

    def get(self, activity_id: UUID) -> ActivityModel | None:
        """Return the activity with the given id, or None."""
        return self._session.get(ActivityModel, activity_id)

    def get_in_project(self, project_id: UUID, activity_id: UUID) -> ActivityModel | None:
        """Return the activity only when it belongs to the given project, else None."""
        statement = select(ActivityModel).where(
            ActivityModel.id == activity_id, ActivityModel.project_id == project_id
        )
        return self._session.scalars(statement).one_or_none()

    def add(self, project_id: UUID, data: ActivityData) -> ActivityModel:
        """Persist a new activity inside the given project."""
        activity = ActivityModel(project_id=project_id, **_editable_fields(data))
        self._session.add(activity)
        self._session.flush()
        return activity

    def update(self, activity: ActivityModel, data: ActivityData) -> ActivityModel:
        """Apply the editable fields to an existing activity."""
        for field, value in _editable_fields(data).items():
            setattr(activity, field, value)
        self._session.flush()
        return activity

    def delete(self, activity: ActivityModel) -> None:
        """Delete the activity."""
        self._session.delete(activity)
        self._session.flush()


def _editable_fields(data: ActivityData) -> dict[str, object]:
    return {
        "owner_id": data.owner_id,
        "name": data.name,
        "budget_at_completion": data.budget_at_completion,
        "planned_progress_percent": data.planned_progress_percent,
        "actual_progress_percent": data.actual_progress_percent,
        "actual_cost": data.actual_cost,
    }
