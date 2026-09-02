"""initial schema

Creates every table in the Stage 2 data-layer plan: orgs, users, tracks,
scenarios, attempts, workflows, assignments, assignment_completions and
login_codes.

Revision ID: 8f2a1c4d5e6b
Revises:
Create Date: 2026-09-02
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "8f2a1c4d5e6b"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "login_codes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_login_codes_email_created",
        "login_codes",
        ["email", "created_at"],
        unique=False,
    )

    op.create_table(
        "orgs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("plan", sa.String(length=32), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=True),
        sa.Column("sso_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "settings",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "tracks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("org_id", sa.Uuid(), nullable=False),
        sa.Column("track_id", sa.Uuid(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("org_id", sa.Uuid(), nullable=True),
        sa.Column("primary_track_id", sa.Uuid(), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("streak_count", sa.Integer(), nullable=False),
        sa.Column("last_active_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["primary_track_id"], ["tracks.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "assignment_completions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("assignment_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["assignment_id"], ["assignments.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "assignment_id", "user_id", name="uq_assignment_completions_pair"
        ),
    )

    op.create_table(
        "scenarios",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("track_id", sa.Uuid(), nullable=True),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("brief", sa.Text(), nullable=False),
        sa.Column("context", sa.Text(), nullable=False),
        sa.Column(
            "constraints",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("output_format", sa.Text(), nullable=False),
        sa.Column("role_and_audience", sa.Text(), nullable=False),
        sa.Column(
            "examples",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("reference_prompt", sa.Text(), nullable=False),
        sa.Column(
            "rubric_weights", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column(
            "calibration_examples",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["track_id"], ["tracks.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("scenario_id", sa.Uuid(), nullable=False),
        sa.Column("org_id", sa.Uuid(), nullable=True),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=120), nullable=False),
        sa.Column("model_output", sa.Text(), nullable=True),
        sa.Column("task_clarity_score", sa.SmallInteger(), nullable=False),
        sa.Column("context_supplied_score", sa.SmallInteger(), nullable=False),
        sa.Column("constraints_score", sa.SmallInteger(), nullable=False),
        sa.Column("output_format_score", sa.SmallInteger(), nullable=False),
        sa.Column("role_and_audience_score", sa.SmallInteger(), nullable=False),
        sa.Column("examples_score", sa.SmallInteger(), nullable=False),
        sa.Column("task_clarity_feedback", sa.Text(), nullable=False),
        sa.Column("context_supplied_feedback", sa.Text(), nullable=False),
        sa.Column("constraints_feedback", sa.Text(), nullable=False),
        sa.Column("output_format_feedback", sa.Text(), nullable=False),
        sa.Column("role_and_audience_feedback", sa.Text(), nullable=False),
        sa.Column("examples_feedback", sa.Text(), nullable=False),
        sa.Column("total", sa.SmallInteger(), nullable=False),
        sa.Column(
            "rubric_weights_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("tokens_input", sa.Integer(), nullable=False),
        sa.Column("tokens_output", sa.Integer(), nullable=False),
        sa.Column("cost_usd", sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "constraints_score BETWEEN 0 AND 5",
            name="ck_attempts_constraints_score_range",
        ),
        sa.CheckConstraint(
            "context_supplied_score BETWEEN 0 AND 5",
            name="ck_attempts_context_supplied_score_range",
        ),
        sa.CheckConstraint(
            "examples_score BETWEEN 0 AND 5", name="ck_attempts_examples_score_range"
        ),
        sa.CheckConstraint(
            "output_format_score BETWEEN 0 AND 5",
            name="ck_attempts_output_format_score_range",
        ),
        sa.CheckConstraint(
            "role_and_audience_score BETWEEN 0 AND 5",
            name="ck_attempts_role_and_audience_score_range",
        ),
        sa.CheckConstraint(
            "task_clarity_score BETWEEN 0 AND 5",
            name="ck_attempts_task_clarity_score_range",
        ),
        sa.CheckConstraint("total BETWEEN 0 AND 30", name="ck_attempts_total_range"),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["scenario_id"], ["scenarios.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attempts_created_at", "attempts", ["created_at"], unique=False)
    op.create_index(
        "ix_attempts_org_created", "attempts", ["org_id", "created_at"], unique=False
    )
    op.create_index(
        "ix_attempts_scenario_created",
        "attempts",
        ["scenario_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_attempts_user_created", "attempts", ["user_id", "created_at"], unique=False
    )

    op.create_table(
        "workflows",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("org_id", sa.Uuid(), nullable=True),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("prompt_template", sa.Text(), nullable=False),
        sa.Column(
            "variables",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("source_attempt_id", sa.Uuid(), nullable=True),
        sa.Column("usage_count", sa.Integer(), nullable=False),
        sa.Column("visibility", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["orgs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["source_attempt_id"], ["attempts.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("workflows")
    op.drop_index("ix_attempts_user_created", table_name="attempts")
    op.drop_index("ix_attempts_scenario_created", table_name="attempts")
    op.drop_index("ix_attempts_org_created", table_name="attempts")
    op.drop_index("ix_attempts_created_at", table_name="attempts")
    op.drop_table("attempts")
    op.drop_table("scenarios")
    op.drop_table("assignment_completions")
    op.drop_table("users")
    op.drop_table("assignments")
    op.drop_table("tracks")
    op.drop_index("ix_login_codes_email_created", table_name="login_codes")
    op.drop_table("login_codes")
    op.drop_table("orgs")
