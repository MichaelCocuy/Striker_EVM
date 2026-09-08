"""Database connectivity probe used by the health endpoint."""

import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

PROBE_STATEMENT = text("SELECT 1")


def probe_database(session: Session) -> bool:
    """Return True when the database answers a trivial query, False otherwise."""
    try:
        session.execute(PROBE_STATEMENT)
    except SQLAlchemyError:
        logger.warning("Database health probe failed", exc_info=True)
        return False
    return True
