"""
Shared fixtures.

The database fixtures here follow the standard SQLAlchemy testing pattern:
one connection with an outer transaction per test, a session bound inside it,
and a rollback on teardown. Nothing a test writes survives it — including
anything the code under test commits, because the session joins the outer
transaction via a savepoint rather than starting its own.

Tests that need a database skip (rather than fail) when there isn't one, so
`pytest` stays green on a machine with no Postgres. Point them at one with:

    TEST_DATABASE_URL=postgresql+psycopg://promptworks:...@localhost:5432/promptworks

TEST_DATABASE_URL is preferred over DATABASE_URL so that running the suite
can't touch a database you actually care about by accident.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]

_SKIP_REASON = (
    "no test database available — set TEST_DATABASE_URL (or DATABASE_URL) to a "
    "reachable Postgres to run the database-backed tests"
)


def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


@pytest.fixture(scope="session")
def database_url() -> str:
    url = _database_url()
    if not url:
        pytest.skip(_SKIP_REASON)

    import sqlalchemy as sa

    try:
        engine = sa.create_engine(url, connect_args={"connect_timeout": 3})
        with engine.connect():
            pass
        engine.dispose()
    except Exception as exc:  # noqa: BLE001 — any connection failure means skip
        pytest.skip(f"{_SKIP_REASON} (connection failed: {exc})")

    return url


@pytest.fixture(scope="session")
def migrated_database(database_url: str) -> str:
    """Bring the target database up to head before any test touches it.

    Running the real migration rather than `Base.metadata.create_all` is
    deliberate: it means the suite exercises the migration that production
    will actually run, not a parallel definition that could quietly drift.
    """
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=REPO_ROOT,
        env={**os.environ, "DATABASE_URL": database_url},
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        pytest.fail(
            "alembic upgrade head failed:\n"
            f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return database_url


@pytest.fixture
def db_session(migrated_database: str):
    """A session whose every write is rolled back on teardown."""
    import sqlalchemy as sa
    from sqlalchemy.orm import Session

    engine = sa.create_engine(migrated_database)
    connection = engine.connect()
    transaction = connection.begin()

    # join_transaction_mode="create_savepoint" makes session.commit() inside
    # the code under test commit to a savepoint, not to the database — so
    # committing code stays testable and still leaves nothing behind.
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
        engine.dispose()
