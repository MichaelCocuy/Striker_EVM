"""Path parameters shared by the v1 routers, named and documented in a single place."""

from typing import Annotated
from uuid import UUID

from fastapi import Path

from app.api.v1.docs.examples import ACTIVITY_ID, PROJECT_ID

PROJECT_ID_PARAM = "projectId"
ACTIVITY_ID_PARAM = "activityId"

ProjectId = Annotated[
    UUID,
    Path(
        alias=PROJECT_ID_PARAM,
        description="Identificador (UUID) del proyecto.",
        examples=[PROJECT_ID],
    ),
]
ActivityId = Annotated[
    UUID,
    Path(
        alias=ACTIVITY_ID_PARAM,
        description=(
            "Identificador (UUID) de la actividad. Debe pertenecer al proyecto de la ruta; "
            "si no, la respuesta es `404`."
        ),
        examples=[ACTIVITY_ID],
    ),
]
