"""`Project` and `ProjectInput` schemas of the contract."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import StringConstraints

from app.api.v1.schemas.common import CamelCaseModel, UserSummary
from app.application.ports import ProjectData
from app.application.projects.views import ProjectView

NAME_MAX_LENGTH = 120
NAME_MIN_LENGTH = 1
DESCRIPTION_MAX_LENGTH = 2000

ProjectName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=NAME_MIN_LENGTH, max_length=NAME_MAX_LENGTH
    ),
]
ProjectDescription = Annotated[
    str, StringConstraints(strip_whitespace=True, max_length=DESCRIPTION_MAX_LENGTH)
]


class ProjectRequest(CamelCaseModel):
    """`ProjectInput`: the editable fields of a project, sent to POST and PUT."""

    name: ProjectName
    description: ProjectDescription | None = None

    def to_data(self) -> ProjectData:
        """Payload the project use cases persist."""
        return ProjectData(name=self.name, description=self.description)


class ProjectResponse(CamelCaseModel):
    """`Project`: the stored project with its activity count and its creator."""

    id: UUID
    name: str
    description: str | None
    activity_count: int
    created_by: UserSummary
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_view(cls, view: ProjectView) -> "ProjectResponse":
        """Build the response from the use case result."""
        return cls(
            id=view.project.id,
            name=view.project.name,
            description=view.project.description,
            activity_count=view.activity_count,
            created_by=UserSummary.model_validate(view.creator),
            created_at=view.project.created_at,
            updated_at=view.project.updated_at,
        )
