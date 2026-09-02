"""
Alembic environment for Promptworks.

Two things this does differently from the stock `alembic init` template:

  * The database URL comes from DATABASE_URL (via .env), not from
    alembic.ini — the connection string is a credential and alembic.ini is
    committed.
  * `target_metadata` is `backend.db.base.Base.metadata`, which is what makes
    `alembic revision --autogenerate` see the models at all.
"""

from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# Make `backend.*` importable when alembic is run from the repo root.
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

load_dotenv()

from backend.db.base import Base  # noqa: E402
import backend.db.models  # noqa: E402,F401  (import registers every model on Base)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Alembic needs it to know which database "
            "to migrate. Copy deploy/.env.example to .env and fill it in."
        )
    return url


def run_migrations_offline() -> None:
    """Emit SQL to stdout instead of running it (`alembic upgrade head --sql`).

    Useful for reviewing exactly what a migration will do to production
    before letting it near production.
    """
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Without this, autogenerate ignores column type changes, which
            # is exactly the kind of drift that bites months later.
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
