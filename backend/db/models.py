"""
Every Promptworks table, as SQLAlchemy 2.0 declarative models.

Conventions used throughout, decided in the Stage 2 data-layer plan:

  * UUID primary keys generated in Python (`uuid.uuid4`), not by a Postgres
    extension — one less thing to install on the NUC.
  * Flexible/nested fields (constraints, examples, rubric weights) are JSONB
    columns on otherwise ordinary relational tables. No second database.
  * Every table has `created_at`; tables that get edited after creation also
    have `updated_at`.
  * No `password_hash` anywhere. Auth is email + a 6-digit code.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base

# The six rubric dimensions, in fixed order. This is the third place the list
# lives (after frontend/src/data/rubric.js and llm_grader.DIMENSIONS) — the
# score and feedback columns below are named from it, so at least this file
# can't drift out of step with itself.
DIMENSIONS: tuple[str, ...] = (
    "clarity",
    "context",
    "constraints",
    "format",
    "audience",
    "examples",
)


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)


def _created_at() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


def _updated_at() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ---------------------------------------------------------------------------
# Orgs and users
# ---------------------------------------------------------------------------


class Org(Base):
    __tablename__ = "orgs"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), nullable=False, default="free")
    seats: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Reserved for Stage 3 SSO. Deliberately unused for now — it exists so
    # turning SSO on later isn't a migration on a table with real rows in it.
    sso_config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    settings: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    users: Mapped[list["User"]] = relationship(back_populates="org")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    # The login identifier. Stored lowercased by the auth layer so
    # "Carlos@x.com" and "carlos@x.com" can't become two accounts.
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    first_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Nullable: free-tier individuals sign up without belonging to an org.
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orgs.id", ondelete="SET NULL"), nullable=True
    )
    primary_track_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tracks.id", ondelete="SET NULL"), nullable=True
    )
    # Derived/cached, recomputed from `attempts` — never hand-edited. The
    # exact leveling formula is still an open product decision; the column
    # holds whatever that formula eventually produces.
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Needed alongside streak_count: without it there's no way to tell whether
    # a new attempt should increment the streak or reset it.
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    org: Mapped[Org | None] = relationship(back_populates="users")
    primary_track: Mapped["Track | None"] = relationship()


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[uuid.UUID] = _uuid_pk()
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    level: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    scenarios: Mapped[list["Scenario"]] = relationship(back_populates="track")


class Scenario(Base):
    """Mirrors `llm_grader.Scenario` field for field.

    The dataclass and this row are meant to stay in lockstep: main.py builds
    the dataclass straight from a row of this table, so a field added here
    without a matching dataclass field is a field the grader will never see.
    """

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = _uuid_pk()
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    track_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tracks.id", ondelete="SET NULL"), nullable=True
    )
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str] = mapped_column(Text, nullable=False, default="")
    constraints: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    output_format: Mapped[str] = mapped_column(Text, nullable=False, default="")
    role_and_audience: Mapped[str] = mapped_column(Text, nullable=False, default="")
    examples: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    reference_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # dimension key -> float. Equal weight unless a scenario says otherwise.
    rubric_weights: Mapped[dict[str, float]] = mapped_column(
        JSONB, nullable=False, default=lambda: {dim: 1.0 for dim in DIMENSIONS}
    )
    # list of {"prompt": str, "scores": {dimension: int}}
    calibration_examples: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    # Null for curated content shipped by the seed script; set when an
    # Enterprise org authors its own scenario.
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()

    track: Mapped[Track | None] = relationship(back_populates="scenarios")


# ---------------------------------------------------------------------------
# Attempts — the central fact table
# ---------------------------------------------------------------------------


class Attempt(Base):
    """One graded submission.

    The score screen, the learner dashboard, the team heat map, and cost
    tracking all read from this table, and nothing else keeps its own copy.
    """

    __tablename__ = "attempts"
    __table_args__ = (
        # Per-dimension scores are 0-5 and the weighted total is 0-30.
        # Enforced in the database as well as in llm_grader, because the
        # dashboards do arithmetic on these columns and one out-of-range row
        # silently skews every aggregate built on them.
        CheckConstraint(
            "clarity_score BETWEEN 0 AND 5",
            name="ck_attempts_clarity_score_range",
        ),
        CheckConstraint(
            "context_score BETWEEN 0 AND 5",
            name="ck_attempts_context_score_range",
        ),
        CheckConstraint(
            "constraints_score BETWEEN 0 AND 5",
            name="ck_attempts_constraints_score_range",
        ),
        CheckConstraint(
            "format_score BETWEEN 0 AND 5",
            name="ck_attempts_format_score_range",
        ),
        CheckConstraint(
            "audience_score BETWEEN 0 AND 5",
            name="ck_attempts_audience_score_range",
        ),
        CheckConstraint(
            "examples_score BETWEEN 0 AND 5",
            name="ck_attempts_examples_score_range",
        ),
        CheckConstraint("total BETWEEN 0 AND 30", name="ck_attempts_total_range"),
        Index("ix_attempts_user_created", "user_id", "created_at"),
        Index("ix_attempts_org_created", "org_id", "created_at"),
        Index("ix_attempts_scenario_created", "scenario_id", "created_at"),
        # Spend rollups scan by time alone ("today", "this month").
        Index("ix_attempts_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    # Nullable so the homepage's "Try one now" widget can insert a row with
    # no signup, per the design brief. Grading is identical either way.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scenarios.id", ondelete="RESTRICT"), nullable=False
    )
    # Denormalized from user.org_id at write time so org-scoped dashboard
    # queries don't need the join. Null for anonymous and free-tier attempts.
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orgs.id", ondelete="SET NULL"), nullable=True
    )

    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(120), nullable=False)
    # Not populated yet: llm_grader grades the submitted prompt without ever
    # executing it. Nullable so deciding to run the prompt later (and fill
    # the score screen's "Your output" tab) needs no migration.
    model_output: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Real columns rather than one JSON blob: the heat map and the daily org
    # rollups need PERCENTILE_CONT and GROUP BY per dimension, which is cheap
    # against columns and awkward against JSON.
    clarity_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    context_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    constraints_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    format_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    audience_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    examples_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    clarity_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    context_feedback: Mapped[str] = mapped_column(
        Text, nullable=False, default=""
    )
    constraints_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    format_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    audience_feedback: Mapped[str] = mapped_column(
        Text, nullable=False, default=""
    )
    examples_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Always recomputed server-side from the six scores at write time; never
    # trusted from the model or the client.
    total: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    # A copy of the scenario's rubric_weights as they were at grading time, so
    # editing a scenario's weighting later doesn't retroactively reinterpret
    # scores already sitting on someone's dashboard.
    rubric_weights_snapshot: Mapped[dict[str, float]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )

    tokens_input: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(10, 6), nullable=False, default=Decimal("0")
    )

    created_at: Mapped[datetime] = _created_at()

    user: Mapped[User | None] = relationship()
    scenario: Mapped[Scenario] = relationship()
    org: Mapped[Org | None] = relationship()

    @property
    def scores(self) -> dict[str, int]:
        """The six scores back in the dict shape the API and frontend use."""
        return {dim: getattr(self, f"{dim}_score") for dim in DIMENSIONS}

    @property
    def feedback(self) -> dict[str, str]:
        return {dim: getattr(self, f"{dim}_feedback") for dim in DIMENSIONS}


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = _uuid_pk()
    # Nullable: individuals save personal workflows without an org.
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orgs.id", ondelete="CASCADE"), nullable=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    source_attempt_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("attempts.id", ondelete="SET NULL"), nullable=True
    )
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # "private" | "org" | "public". The default for a brand-new save is still
    # an open product decision; "private" is the safe one to land on.
    # "public" is what the consumer prompt library (see /library routes)
    # reads — a workflow saved from Team Practice and one posted to the
    # public library are the same underlying row shape, just different
    # visibility, which is why this table didn't need a rename or a
    # parallel table for the library pivot.
    visibility: Mapped[str] = mapped_column(
        String(32), nullable=False, default="private"
    )
    # Library-specific fields — meaningless for a private/org workflow, but
    # not worth a separate table for two columns. One of a small fixed set
    # (see backend/main.py's LIBRARY_CATEGORIES) rather than free-tag text,
    # so category filtering stays a simple equality check.
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    upvote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = _created_at()
    updated_at: Mapped[datetime] = _updated_at()


class WorkflowVote(Base):
    """
    One row per (workflow, user) upvote — the unique constraint is what
    makes upvoting idempotent instead of spammable. Deleting the row is how
    an un-vote would work if that's ever added; for now the API only adds.
    """

    __tablename__ = "workflow_votes"

    id: Mapped[uuid.UUID] = _uuid_pk()
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = _created_at()

    __table_args__ = (
        UniqueConstraint("workflow_id", "user_id", name="uq_workflow_votes_pair"),
    )


# ---------------------------------------------------------------------------
# Assignments — schema now, wiring in Stage 3
# ---------------------------------------------------------------------------


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = _uuid_pk()
    org_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False
    )
    track_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    created_at: Mapped[datetime] = _created_at()


class AssignmentCompletion(Base):
    """A join table rather than an array of assignee ids on `assignments`.

    Per-person completion state is the thing a manager actually looks at, and
    an array column can't carry a status per element without turning into a
    JSON blob you then can't index or group by.
    """

    __tablename__ = "assignment_completions"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id", "user_id", name="uq_assignment_completions_pair"
        ),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="not_started"
    )
    created_at: Mapped[datetime] = _created_at()


# ---------------------------------------------------------------------------
# Passwordless auth
# ---------------------------------------------------------------------------


class LoginCode(Base):
    """One issued 6-digit login code.

    There is no `sessions` table to go with this: the JWT handed out on
    successful verification is stateless with an expiry, so there is nothing
    to store server-side once it has been issued.
    """

    __tablename__ = "login_codes"
    __table_args__ = (
        # verify-code looks up the newest live code for an email on every
        # attempt; this is the index that lookup rides on.
        Index("ix_login_codes_email_created", "email", "created_at"),
    )

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    # SHA-256 of the 6-digit code. The plaintext code exists only in the
    # email that was sent; it is never written down here.
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Capped at MAX_CODE_ATTEMPTS wrong guesses before the code is dead.
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = _created_at()