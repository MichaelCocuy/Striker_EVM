"""Reusable FastAPI dependencies shared by the routers."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.infrastructure.db.session import get_db_session

DbSession = Annotated[Session, Depends(get_db_session)]
