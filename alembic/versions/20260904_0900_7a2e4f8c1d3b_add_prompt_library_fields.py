"""add public prompt library fields (category, upvotes)

Adds category and upvote_count to workflows, and a new workflow_votes table
for idempotent upvoting. Nothing about the existing workflows table's
meaning changes -- a "public" visibility workflow is now what the
/library routes read, so no new parallel table was needed for the pivot
toward a consumer prompt library, just two columns and a votes table.

Revision ID: 7a2e4f8c1d3b
Revises: 3f1a7c9d2b6e
Create Date: 2026-09-04
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "7a2e4f8c1d3b"
down_revision: Union[str, None] = "3f1a7c9d2b6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workflows",
        sa.Column("category", sa.String(length=64), nullable=False, server_default=""),
    )
    op.add_column(
        "workflows",
        sa.Column("upvote_count", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "workflow_votes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("workflow_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workflow_id", "user_id", name="uq_workflow_votes_pair"),
    )


def downgrade() -> None:
    op.drop_table("workflow_votes")
    op.drop_column("workflows", "upvote_count")
    op.drop_column("workflows", "category")
