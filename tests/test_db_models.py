"""
Integration tests against a real Postgres.

These are the tests that can't be mocked usefully: whether the foreign keys
and check constraints are actually enforced, whether JSONB survives a round
trip with its types intact, and whether re-running the seed script is really
idempotent. A mocked version of any of those would only test the mock.

Every test runs inside a transaction that is rolled back on teardown (see
conftest.py), so nothing is left behind. Without a reachable database the
whole module skips rather than failing:

    TEST_DATABASE_URL=postgresql+psycopg://promptworks:...@localhost:5432/promptworks pytest tests/test_db_models.py -v

Run with: pytest tests/test_db_models.py -v
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import DataError, IntegrityError

from backend.db.models import (
    DIMENSIONS,
    Assignment,
    AssignmentCompletion,
    Attempt,
    LoginCode,
    Org,
    Scenario,
    Track,
    User,
    Workflow,
)


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------


def make_track(session, slug: str = "test-track") -> Track:
    track = Track(slug=slug, title="Test track", description="desc", level="Beginner")
    session.add(track)
    session.flush()
    return track


def make_scenario(session, track: Track | None = None, slug: str = "test-scenario"):
    scenario = Scenario(
        slug=slug,
        title="Test scenario",
        track_id=track.id if track else None,
        difficulty="Intermediate",
        brief="Write a prompt.",
        context="Some background.",
        constraints=["Keep it short.", "No jargon."],
        output_format="Subject and body.",
        role_and_audience="A support agent writing to a customer.",
        examples=["An example."],
        reference_prompt="The reference prompt.",
        rubric_weights={dim: 1.0 for dim in DIMENSIONS},
        calibration_examples=[],
    )
    session.add(scenario)
    session.flush()
    return scenario


def make_org(session, name: str = "Test Org") -> Org:
    org = Org(name=name, plan="teams", seats=25, settings={"theme": "dark"})
    session.add(org)
    session.flush()
    return org


def make_user(session, email: str | None = None, org: Org | None = None) -> User:
    user = User(
        email=email or f"user-{uuid.uuid4().hex[:8]}@example.com",
        first_name="Test",
        last_name="User",
        org_id=org.id if org else None,
    )
    session.add(user)
    session.flush()
    return user


def attempt_kwargs(**overrides):
    base = {
        "prompt_text": "A submitted prompt.",
        "model": "claude-sonnet-5",
        "total": 24,
        "rubric_weights_snapshot": {dim: 1.0 for dim in DIMENSIONS},
        "tokens_input": 1200,
        "tokens_output": 340,
        "cost_usd": Decimal("0.005800"),
    }
    base.update({f"{dim}_score": 4 for dim in DIMENSIONS})
    base.update({f"{dim}_feedback": f"Feedback on {dim}." for dim in DIMENSIONS})
    base.update(overrides)
    return base


def expect_integrity_error(session, obj):
    """Add `obj`, assert the flush is rejected, and undo it.

    The savepoint keeps everything the test set up before this point alive —
    a plain rollback would discard it along with the bad row.
    """
    savepoint = session.begin_nested()
    session.add(obj)
    with pytest.raises((IntegrityError, DataError)):
        session.flush()
    savepoint.rollback()


# ---------------------------------------------------------------------------
# Schema basics
# ---------------------------------------------------------------------------


def test_every_table_exists(db_session):
    from backend.db.base import Base

    for table in Base.metadata.tables:
        db_session.execute(select(func.count()).select_from(Base.metadata.tables[table]))


def test_uuid_primary_key_is_generated_in_python(db_session):
    track = Track(slug=f"t-{uuid.uuid4().hex[:8]}", title="T")
    db_session.add(track)
    db_session.flush()

    assert isinstance(track.id, uuid.UUID)


def test_created_at_is_set_by_the_database(db_session):
    track = make_track(db_session, slug=f"t-{uuid.uuid4().hex[:8]}")
    db_session.refresh(track)

    assert track.created_at is not None
    assert track.created_at.tzinfo is not None, "created_at must be timestamptz"


def test_user_email_is_unique(db_session):
    email = f"dupe-{uuid.uuid4().hex[:8]}@example.com"
    make_user(db_session, email=email)
    expect_integrity_error(db_session, User(email=email))


def test_scenario_slug_is_unique(db_session):
    slug = f"s-{uuid.uuid4().hex[:8]}"
    make_scenario(db_session, slug=slug)
    expect_integrity_error(
        db_session, Scenario(slug=slug, title="Another", brief="Brief.")
    )


# ---------------------------------------------------------------------------
# JSONB round trips
# ---------------------------------------------------------------------------


def test_scenario_jsonb_round_trip(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    scenario_id = scenario.id
    db_session.expunge_all()

    loaded = db_session.get(Scenario, scenario_id)

    # Lists come back as lists of str, dicts as dicts of float — not as
    # strings that merely look like JSON.
    assert loaded.constraints == ["Keep it short.", "No jargon."]
    assert loaded.examples == ["An example."]
    assert loaded.rubric_weights == {dim: 1.0 for dim in DIMENSIONS}
    assert all(isinstance(v, float) for v in loaded.rubric_weights.values())
    assert loaded.calibration_examples == []


def test_scenario_jsonb_handles_nested_calibration_examples(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    scenario.calibration_examples = [
        {"prompt": "A prompt.", "scores": {dim: 3 for dim in DIMENSIONS}}
    ]
    db_session.flush()
    scenario_id = scenario.id
    db_session.expunge_all()

    loaded = db_session.get(Scenario, scenario_id)
    assert len(loaded.calibration_examples) == 1
    assert loaded.calibration_examples[0]["scores"]["clarity"] == 3


def test_scenario_jsonb_survives_awkward_strings(db_session):
    # Scenario content is full of quotes, braces and newlines — the reference
    # prompts especially. If any of that broke the JSONB round trip, the
    # grader would receive mangled input.
    nasty = 'He said "{\'not\': json}" \\ and\nthen a newline — plus emoji 🎯'
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    scenario.constraints = [nasty]
    db_session.flush()
    scenario_id = scenario.id
    db_session.expunge_all()

    assert db_session.get(Scenario, scenario_id).constraints == [nasty]


def test_org_settings_defaults_to_empty_dict(db_session):
    org = Org(name="Defaults Inc")
    db_session.add(org)
    db_session.flush()
    db_session.refresh(org)

    assert org.settings == {}
    assert org.sso_config is None


# ---------------------------------------------------------------------------
# attempts — foreign keys
# ---------------------------------------------------------------------------


def test_attempt_requires_a_real_scenario(db_session):
    expect_integrity_error(
        db_session, Attempt(scenario_id=uuid.uuid4(), **attempt_kwargs())
    )


def test_attempt_rejects_an_unknown_user(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    expect_integrity_error(
        db_session,
        Attempt(scenario_id=scenario.id, user_id=uuid.uuid4(), **attempt_kwargs()),
    )


def test_attempt_rejects_an_unknown_org(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    expect_integrity_error(
        db_session,
        Attempt(scenario_id=scenario.id, org_id=uuid.uuid4(), **attempt_kwargs()),
    )


def test_attempt_requires_a_scenario_at_all(db_session):
    expect_integrity_error(db_session, Attempt(scenario_id=None, **attempt_kwargs()))


def test_anonymous_attempt_is_allowed(db_session):
    """The homepage's "Try one now" widget depends on this working."""
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    attempt = Attempt(scenario_id=scenario.id, **attempt_kwargs())
    db_session.add(attempt)
    db_session.flush()

    assert attempt.user_id is None
    assert attempt.org_id is None


def test_attributed_attempt_keeps_its_user_and_org(db_session):
    org = make_org(db_session)
    user = make_user(db_session, org=org)
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")

    attempt = Attempt(
        scenario_id=scenario.id,
        user_id=user.id,
        org_id=org.id,
        **attempt_kwargs(),
    )
    db_session.add(attempt)
    db_session.flush()
    attempt_id = attempt.id
    db_session.expunge_all()

    loaded = db_session.get(Attempt, attempt_id)
    assert loaded.user.email == user.email
    assert loaded.org.name == org.name
    assert loaded.scenario.slug == scenario.slug


def test_deleting_a_user_keeps_the_attempt(db_session):
    # ON DELETE SET NULL, not CASCADE: an attempt is the fact table the
    # dashboards aggregate, and deleting a person shouldn't silently rewrite
    # the org's history.
    user = make_user(db_session)
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    attempt = Attempt(scenario_id=scenario.id, user_id=user.id, **attempt_kwargs())
    db_session.add(attempt)
    db_session.flush()
    attempt_id = attempt.id

    db_session.delete(user)
    db_session.flush()
    db_session.expunge_all()

    loaded = db_session.get(Attempt, attempt_id)
    assert loaded is not None
    assert loaded.user_id is None


def test_scenario_in_use_cannot_be_deleted(db_session):
    # ON DELETE RESTRICT — deleting a scenario that has graded attempts would
    # orphan them, so the database refuses.
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    db_session.add(Attempt(scenario_id=scenario.id, **attempt_kwargs()))
    db_session.flush()

    savepoint = db_session.begin_nested()
    db_session.delete(scenario)
    with pytest.raises(IntegrityError):
        db_session.flush()
    savepoint.rollback()


# ---------------------------------------------------------------------------
# attempts — check constraints
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("dimension", DIMENSIONS)
def test_score_above_five_is_rejected(db_session, dimension):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    expect_integrity_error(
        db_session,
        Attempt(scenario_id=scenario.id, **attempt_kwargs(**{f"{dimension}_score": 6})),
    )


def test_negative_score_is_rejected(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    expect_integrity_error(
        db_session,
        Attempt(scenario_id=scenario.id, **attempt_kwargs(clarity_score=-1)),
    )


def test_total_above_thirty_is_rejected(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    expect_integrity_error(
        db_session, Attempt(scenario_id=scenario.id, **attempt_kwargs(total=31))
    )


def test_score_boundaries_are_accepted(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")

    for score, total in ((0, 0), (5, 30)):
        attempt = Attempt(
            scenario_id=scenario.id,
            **attempt_kwargs(
                total=total, **{f"{dim}_score": score for dim in DIMENSIONS}
            ),
        )
        db_session.add(attempt)
        db_session.flush()


def test_scores_and_feedback_properties_rebuild_the_api_shape(db_session):
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    attempt = Attempt(scenario_id=scenario.id, **attempt_kwargs())
    db_session.add(attempt)
    db_session.flush()

    assert attempt.scores == {dim: 4 for dim in DIMENSIONS}
    assert set(attempt.feedback) == set(DIMENSIONS)


def test_cost_keeps_six_decimal_places(db_session):
    # A single grading call costs fractions of a cent; rounding to 2dp here
    # would make every attempt cost $0.00 and the spend rollup useless.
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    attempt = Attempt(
        scenario_id=scenario.id, **attempt_kwargs(cost_usd=Decimal("0.004321"))
    )
    db_session.add(attempt)
    db_session.flush()
    attempt_id = attempt.id
    db_session.expunge_all()

    assert db_session.get(Attempt, attempt_id).cost_usd == Decimal("0.004321")


def test_summing_cost_across_attempts(db_session):
    # This is the query that eventually replaces spend_tracker's JSONL file.
    scenario = make_scenario(db_session, slug=f"s-{uuid.uuid4().hex[:8]}")
    for _ in range(3):
        db_session.add(
            Attempt(scenario_id=scenario.id, **attempt_kwargs(cost_usd=Decimal("0.001")))
        )
    db_session.flush()

    total = db_session.scalar(
        select(func.sum(Attempt.cost_usd)).where(Attempt.scenario_id == scenario.id)
    )
    assert total == Decimal("0.003000")


# ---------------------------------------------------------------------------
# Other tables
# ---------------------------------------------------------------------------


def test_workflow_requires_an_author(db_session):
    expect_integrity_error(
        db_session,
        Workflow(author_id=uuid.uuid4(), title="W", prompt_template="T"),
    )


def test_workflow_defaults(db_session):
    user = make_user(db_session)
    workflow = Workflow(author_id=user.id, title="W", prompt_template="T")
    db_session.add(workflow)
    db_session.flush()
    db_session.refresh(workflow)

    assert workflow.visibility == "private"
    assert workflow.usage_count == 0
    assert workflow.variables == []


def test_assignment_completion_pair_is_unique(db_session):
    org = make_org(db_session)
    track = make_track(db_session, slug=f"t-{uuid.uuid4().hex[:8]}")
    user = make_user(db_session, org=org)

    assignment = Assignment(org_id=org.id, track_id=track.id, due_date=date(2026, 12, 1))
    db_session.add(assignment)
    db_session.flush()

    db_session.add(
        AssignmentCompletion(assignment_id=assignment.id, user_id=user.id)
    )
    db_session.flush()

    expect_integrity_error(
        db_session,
        AssignmentCompletion(assignment_id=assignment.id, user_id=user.id),
    )


def test_user_streak_fields_default_sensibly(db_session):
    user = make_user(db_session)
    db_session.refresh(user)

    assert user.level == 0
    assert user.streak_count == 0
    assert user.last_active_date is None


def test_login_code_round_trip(db_session):
    now = datetime.now(timezone.utc)
    record = LoginCode(
        email="carlos@example.com",
        code_hash="a" * 64,
        expires_at=now + timedelta(minutes=10),
    )
    db_session.add(record)
    db_session.flush()
    db_session.refresh(record)

    assert record.attempt_count == 0
    assert record.consumed_at is None
    assert record.expires_at.tzinfo is not None