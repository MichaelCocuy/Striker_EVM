"""The request-scoped session dependency commits on success and rolls back on failure."""

from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import text

from app.core.config import get_settings
from app.infrastructure.db.session import get_db_session, get_engine, get_session_factory

SQLITE_FILE_URL = "sqlite+pysqlite:///{path}"


@pytest.fixture
def sqlite_settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("DATABASE_URL", SQLITE_FILE_URL.format(path=tmp_path / "striker.db"))
    _clear_caches()
    yield
    get_engine().dispose()
    _clear_caches()


def _clear_caches() -> None:
    get_settings.cache_clear()
    get_engine.cache_clear()
    get_session_factory.cache_clear()


def _run_dependency(statement: str) -> None:
    generator = get_db_session()
    session = next(generator)
    session.execute(text(statement))
    next(generator, None)


def test_engine_uses_configured_database_url(sqlite_settings: None) -> None:
    assert str(get_engine().url).startswith("sqlite+pysqlite")
    assert get_session_factory().kw["bind"] is get_engine()


def test_session_commits_when_request_succeeds(sqlite_settings: None) -> None:
    _run_dependency("CREATE TABLE marker (id INTEGER PRIMARY KEY)")
    _run_dependency("INSERT INTO marker (id) VALUES (1)")

    with get_session_factory()() as verification:
        assert verification.execute(text("SELECT COUNT(*) FROM marker")).scalar() == 1


def test_session_rolls_back_when_request_fails(sqlite_settings: None) -> None:
    _run_dependency("CREATE TABLE marker (id INTEGER PRIMARY KEY)")
    generator = get_db_session()
    session = next(generator)
    session.execute(text("INSERT INTO marker (id) VALUES (1)"))

    with pytest.raises(RuntimeError):
        generator.throw(RuntimeError("request failed"))

    with get_session_factory()() as verification:
        assert verification.execute(text("SELECT COUNT(*) FROM marker")).scalar() == 0
