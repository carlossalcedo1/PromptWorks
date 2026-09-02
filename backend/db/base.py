"""
Engine, session factory, and declarative Base for the Promptworks data layer.

Everything here is lazy on purpose. `main.py` imports this module at boot,
and the test suite imports `main` without a database in sight — so building
the engine at import time would make an unset DATABASE_URL a hard crash on
`import`, rather than an error on first query where it belongs.

Local dev (Postgres running on the host):
    DATABASE_URL=postgresql+psycopg://promptworks:promptworks@localhost:5432/promptworks

In the compose stack, `localhost` becomes the `postgres` service hostname.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Declarative base every model in models.py inherits from.

    Alembic's env.py points autogenerate at `Base.metadata`, so a model that
    doesn't inherit from this is a model migrations will silently ignore.
    """


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy deploy/.env.example to .env and "
            "point it at your Postgres instance, e.g. "
            "postgresql+psycopg://promptworks:promptworks@localhost:5432/promptworks"
        )
    return url


def get_engine() -> Engine:
    """The process-wide engine, built on first use and reused after that."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            get_database_url(),
            # Recycle before Postgres' own idle timeout can hand us a dead
            # socket — the API sits idle for long stretches between attempts.
            pool_pre_ping=True,
            pool_recycle=1800,
            future=True,
        )
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(), autoflush=False, expire_on_commit=False
        )
    return _session_factory


def reset_engine() -> None:
    """Drop the cached engine/session factory.

    Tests use this after pointing DATABASE_URL somewhere else; without it the
    first engine built in the process would be reused against the wrong DB.
    """
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a session that always gets closed.

    Routes own their own commits — this deliberately does not commit for you,
    so a handler that raises halfway through doesn't half-write a row.
    """
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
