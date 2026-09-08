"""Building blocks shared by every v1 schema: base model, JSON numbers and `UserSummary`."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel

JSON_MODE = "json"

# Rounded decimals travel as JSON numbers (`65172.41`, `0.9206`), never as strings. A JSON
# number carries no scale, so trailing zeros are not part of the payload (`10000.00` travels as
# `10000.0`); the value is the rounded one and clients format it for display.
JsonNumber = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used=JSON_MODE)]


class CamelCaseModel(BaseModel):
    """Serializes with camelCase aliases and accepts either spelling on input."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UserSummary(CamelCaseModel):
    """`UserSummary`: a user referenced from another resource (activity owner, project creator)."""

    id: UUID
    full_name: str
