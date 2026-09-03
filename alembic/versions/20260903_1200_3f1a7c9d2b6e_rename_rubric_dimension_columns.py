"""rename rubric dimension columns to match frontend keys

The initial migration named the attempts table's score/feedback columns
after a set of dimension keys (task_clarity, context_supplied,
output_format, role_and_audience) that turned out not to match
frontend/src/data/rubric.js, which actually uses: clarity, context,
constraints, format, audience, examples. constraints and examples were
already correct and are untouched here.

This is a rename, not a drop/recreate — any rows already written by a live
deployment keep their data; only the column names and check-constraint
names change to stay in lockstep with backend/llm_grader.py's DIMENSIONS
and backend/db/models.py's Attempt columns after that fix.

Revision ID: 3f1a7c9d2b6e
Revises: 8f2a1c4d5e6b
Create Date: 2026-09-03
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "3f1a7c9d2b6e"
down_revision: Union[str, None] = "8f2a1c4d5e6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (old_column, new_column) for every renamed score/feedback pair.
# constraints_score/examples_score/constraints_feedback/examples_feedback
# were already correct and are intentionally not in this list.
RENAMES = [
    ("task_clarity_score", "clarity_score"),
    ("context_supplied_score", "context_score"),
    ("output_format_score", "format_score"),
    ("role_and_audience_score", "audience_score"),
    ("task_clarity_feedback", "clarity_feedback"),
    ("context_supplied_feedback", "context_feedback"),
    ("output_format_feedback", "format_feedback"),
    ("role_and_audience_feedback", "audience_feedback"),
]

# (old_constraint_name, new_constraint_name, new_column_name) — only the
# four constraints on renamed columns; constraints_score/examples_score/
# total keep their original constraint names unchanged.
CONSTRAINT_RENAMES = [
    (
        "ck_attempts_task_clarity_score_range",
        "ck_attempts_clarity_score_range",
        "clarity_score",
    ),
    (
        "ck_attempts_context_supplied_score_range",
        "ck_attempts_context_score_range",
        "context_score",
    ),
    (
        "ck_attempts_output_format_score_range",
        "ck_attempts_format_score_range",
        "format_score",
    ),
    (
        "ck_attempts_role_and_audience_score_range",
        "ck_attempts_audience_score_range",
        "audience_score",
    ),
]


def upgrade() -> None:
    # Drop the old-named check constraints first — Postgres won't let you
    # rename a column that a constraint still references by its old name
    # inside the constraint's own CHECK expression body in some setups, and
    # doing this explicitly is clearer than relying on cascade behavior.
    for old_name, _, _ in CONSTRAINT_RENAMES:
        op.drop_constraint(old_name, "attempts", type_="check")

    for old_col, new_col in RENAMES:
        op.alter_column("attempts", old_col, new_column_name=new_col)

    for _, new_name, new_column in CONSTRAINT_RENAMES:
        op.create_check_constraint(
            new_name, "attempts", f"{new_column} BETWEEN 0 AND 5"
        )


def downgrade() -> None:
    for _, new_name, new_column in CONSTRAINT_RENAMES:
        op.drop_constraint(new_name, "attempts", type_="check")

    for old_col, new_col in RENAMES:
        op.alter_column("attempts", new_col, new_column_name=old_col)

    for old_name, _, old_column in CONSTRAINT_RENAMES:
        op.create_check_constraint(
            old_name, "attempts", f"{old_column} BETWEEN 0 AND 5"
        )
