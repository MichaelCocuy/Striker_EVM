"""Building blocks shared by every v1 schema: base model, JSON numbers and `UserSummary`."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer
from pydantic.alias_generators import to_camel

from app.api.v1.docs.examples import USER_SUMMARY_EXAMPLE

JSON_MODE = "json"

# Rounded decimals travel as JSON numbers (`65172.41`, `0.9206`), never as strings. A JSON
# number carries no scale, so trailing zeros are not part of the payload (`10000.00` travels as
# `10000.0`); the value is the rounded one and clients format it for display.
JsonNumber = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used=JSON_MODE)]


class CamelCaseModel(BaseModel):
    """Serializes with camelCase aliases and accepts either spelling on input.

    A response always carries every field, defaults included, so fields with a default are
    documented as required in the response schemas (as the canonical contract declares them).
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        json_schema_serialization_defaults_required=True,
    )


class UserSummary(CamelCaseModel):
    """Referencia resumida a un usuario: responsable de una actividad o creador de un proyecto."""

    model_config = ConfigDict(json_schema_extra={"example": USER_SUMMARY_EXAMPLE})

    id: UUID = Field(description="Identificador (UUID) del usuario.")
    full_name: str = Field(description="Nombre completo del usuario, para mostrar en pantalla.")
