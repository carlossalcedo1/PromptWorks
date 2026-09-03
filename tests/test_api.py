"""
HTTP-level tests for backend/main.py.

The routes that need a database use the `db_session` fixture and skip
without one. The rest — health, the /admin/spend auth gate, request
validation, the rate-limit parser — run everywhere, because none of them
should have needed a database in the first place.

Run with: pytest tests/test_api.py -v
"""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from backend import main
from backend.db.base import get_db
from backend.db.models import Attempt, DIMENSIONS, User


@pytest.fixture
def client():
    """A client with no database behind it.

    `get_db` is still overridden, because FastAPI resolves dependencies
    before it rejects a malformed body — so without this, a 422 test would
    fail on "DATABASE_URL is not set" instead. The stub raises if a handler
    actually tries to use it, which keeps these tests honest about not
    needing a database.
    """

    class NoDatabase:
        def __getattr__(self, name):
            raise AssertionError(
                f"this test should not have reached the database (called {name!r})"
            )

    main.app.dependency_overrides[get_db] = lambda: NoDatabase()
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture
def db_client(db_session):
    """A client whose routes all share the test's rolled-back session."""
    main.app.dependency_overrides[get_db] = lambda: db_session
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


def grade_result(total: int = 24, score: int = 4, tokens=(1200, 340)):
    return {
        "scores": {dim: score for dim in DIMENSIONS},
        "feedback": {dim: f"Feedback on {dim}." for dim in DIMENSIONS},
        "total": total,
        "tokens": {"input": tokens[0], "output": tokens[1]},
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# /admin/spend auth gate
# ---------------------------------------------------------------------------


def test_admin_spend_is_disabled_without_a_token(client, monkeypatch):
    # Fails closed: an unset ADMIN_TOKEN must not mean "open to everyone",
    # which is what this endpoint used to be.
    monkeypatch.delenv("ADMIN_TOKEN", raising=False)
    assert client.get("/admin/spend").status_code == 503


def test_admin_spend_rejects_a_missing_token(client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "s3cret-admin-token")
    assert client.get("/admin/spend").status_code == 401


def test_admin_spend_rejects_a_wrong_token(client, monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "s3cret-admin-token")
    response = client.get(
        "/admin/spend", headers={"Authorization": "Bearer wrong-token"}
    )
    assert response.status_code == 401


def test_admin_spend_accepts_the_right_token(client, monkeypatch, tmp_path):
    monkeypatch.setenv("ADMIN_TOKEN", "s3cret-admin-token")
    monkeypatch.setenv("PROMPTWORKS_SPEND_LOG", str(tmp_path / "spend.jsonl"))

    response = client.get(
        "/admin/spend", headers={"Authorization": "Bearer s3cret-admin-token"}
    )
    assert response.status_code == 200
    assert set(response.json()) == {"today_usd", "month_usd", "all_time_usd"}


# ---------------------------------------------------------------------------
# Request validation
# ---------------------------------------------------------------------------


def test_attempts_rejects_an_oversized_prompt(client):
    response = client.post(
        "/attempts", json={"scenario_id": "x", "prompt": "a" * 8001}
    )
    assert response.status_code == 422


def test_request_code_rejects_a_non_email(client):
    response = client.post("/auth/request-code", json={"email": "not-an-email"})
    assert response.status_code == 422


def test_verify_code_requires_both_fields(client):
    assert client.post("/auth/verify-code", json={"email": "a@b.com"}).status_code == 422


# ---------------------------------------------------------------------------
# The rate-limit parser
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "spec,expected",
    [
        ("3/minute", (3, 60)),
        ("10/minute", (10, 60)),
        ("1/second", (1, 1)),
        ("100/hour", (100, 3600)),
        ("5/day", (5, 86400)),
        ("2/5minutes", (2, 300)),
        (" 7 / minute ", (7, 60)),
    ],
)
def test_parse_rate_limit(spec, expected):
    assert main.parse_rate_limit(spec) == expected


def test_parse_rate_limit_falls_back_on_nonsense():
    assert main.parse_rate_limit("banana") == (3, 60)


# ---------------------------------------------------------------------------
# CORS origins
# ---------------------------------------------------------------------------


def test_allowed_origins_defaults_to_the_dev_server(monkeypatch):
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    assert "http://localhost:5173" in main._allowed_origins()


def test_allowed_origins_reads_the_env(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://a.com, https://b.com")
    assert main._allowed_origins() == ["https://a.com", "https://b.com"]


def test_allowed_origins_never_returns_a_wildcard(monkeypatch):
    # A wildcard would let any site on the internet spend Anthropic credit
    # through a visitor's browser.
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    assert "*" not in main._allowed_origins()


# ---------------------------------------------------------------------------
# Scenario lookup and grading — needs a database
# ---------------------------------------------------------------------------


@pytest.fixture
def seeded(db_session):
    from scripts.seed_scenarios import seed

    seed(db_session)
    return db_session


def test_unknown_scenario_is_a_404(db_client, seeded):
    response = db_client.post(
        "/attempts", json={"scenario_id": "no-such-scenario", "prompt": "hello"}
    )
    assert response.status_code == 404


def test_attempt_grades_and_writes_a_row(db_client, seeded, monkeypatch):
    monkeypatch.setattr(main, "grade_prompt", lambda **kw: grade_result())
    monkeypatch.setattr(main, "check_budget", lambda: None)
    monkeypatch.setattr(main, "record_usage", lambda **kw: 0.0058)

    response = db_client.post(
        "/attempts",
        json={"scenario_id": "denial-explanation-email", "prompt": "A real prompt."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 24
    assert body["scores"]["clarity"] == 4
    assert body["attempt_id"] is not None

    attempt = seeded.get(Attempt, uuid.UUID(body["attempt_id"]))
    assert attempt is not None
    assert attempt.user_id is None, "no token supplied — attempt is anonymous"
    assert attempt.prompt_text == "A real prompt."
    assert attempt.total == 24
    assert attempt.cost_usd == Decimal("0.0058")
    assert attempt.tokens_input == 1200
    assert set(attempt.rubric_weights_snapshot) == set(DIMENSIONS)


def test_attempt_builds_the_grader_scenario_from_the_row(db_client, seeded, monkeypatch):
    """The scenario reaching the grader is the seeded row, not a hardcoded dict."""
    captured = {}

    def fake_grade(*, scenario, submitted_prompt):
        captured["scenario"] = scenario
        return grade_result()

    monkeypatch.setattr(main, "grade_prompt", fake_grade)
    monkeypatch.setattr(main, "check_budget", lambda: None)
    monkeypatch.setattr(main, "record_usage", lambda **kw: 0.0)

    db_client.post(
        "/attempts",
        json={"scenario_id": "denial-explanation-email", "prompt": "A prompt."},
    )

    scenario = captured["scenario"]
    assert scenario.id == "denial-explanation-email"
    assert "Section 4.2" in scenario.context
    assert "Under 150 words" in scenario.constraints
    assert set(scenario.rubric_weights) == set(DIMENSIONS)


def test_attempt_is_attributed_when_a_token_is_supplied(db_client, seeded, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    monkeypatch.setattr(main, "grade_prompt", lambda **kw: grade_result())
    monkeypatch.setattr(main, "check_budget", lambda: None)
    monkeypatch.setattr(main, "record_usage", lambda **kw: 0.0)

    user = User(email=f"learner-{uuid.uuid4().hex[:8]}@example.com")
    seeded.add(user)
    seeded.flush()

    from backend.auth.jwt import issue_token

    token = issue_token(user_id=user.id, email=user.email)

    response = db_client.post(
        "/attempts",
        json={"scenario_id": "escalation-note", "prompt": "A prompt."},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    attempt = seeded.get(Attempt, uuid.UUID(response.json()["attempt_id"]))
    assert attempt.user_id == user.id


def test_invalid_token_still_grades_anonymously(db_client, seeded, monkeypatch):
    # The optional-auth path: a bad token must not 401 the homepage widget.
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    monkeypatch.setattr(main, "grade_prompt", lambda **kw: grade_result())
    monkeypatch.setattr(main, "check_budget", lambda: None)
    monkeypatch.setattr(main, "record_usage", lambda **kw: 0.0)

    response = db_client.post(
        "/attempts",
        json={"scenario_id": "escalation-note", "prompt": "A prompt."},
        headers={"Authorization": "Bearer garbage"},
    )

    assert response.status_code == 200
    attempt = seeded.get(Attempt, uuid.UUID(response.json()["attempt_id"]))
    assert attempt.user_id is None


def test_grader_failure_is_a_502_and_writes_nothing(db_client, seeded, monkeypatch):
    from backend.llm_grader import GraderError

    def boom(**kwargs):
        raise GraderError("the model kept returning prose")

    monkeypatch.setattr(main, "grade_prompt", boom)
    monkeypatch.setattr(main, "check_budget", lambda: None)

    before = seeded.scalar(select(func.count()).select_from(Attempt))
    response = db_client.post(
        "/attempts", json={"scenario_id": "escalation-note", "prompt": "A prompt."}
    )

    assert response.status_code == 502
    assert seeded.scalar(select(func.count()).select_from(Attempt)) == before


def test_budget_exceeded_is_a_429(db_client, seeded, monkeypatch):
    from backend.spend_tracker import BudgetExceededError

    def over_budget():
        raise BudgetExceededError("Daily budget of $5.00 reached")

    monkeypatch.setattr(main, "check_budget", over_budget)

    response = db_client.post(
        "/attempts", json={"scenario_id": "escalation-note", "prompt": "A prompt."}
    )
    assert response.status_code == 429


def test_empty_prompt_still_records_an_attempt(db_client, seeded, monkeypatch):
    # grade_prompt short-circuits an empty prompt to 0/30 without an API
    # call. It's still an attempt the learner made, so it still gets a row —
    # at zero cost.
    monkeypatch.setattr(
        main, "grade_prompt", lambda **kw: grade_result(total=0, score=0, tokens=(0, 0))
    )
    monkeypatch.setattr(main, "check_budget", lambda: None)

    response = db_client.post(
        "/attempts", json={"scenario_id": "escalation-note", "prompt": ""}
    )

    assert response.status_code == 200
    attempt = seeded.get(Attempt, uuid.UUID(response.json()["attempt_id"]))
    assert attempt.total == 0
    assert attempt.cost_usd == Decimal("0")


# ---------------------------------------------------------------------------
# Auth round trip — needs a database
# ---------------------------------------------------------------------------


def test_request_then_verify_returns_a_token(db_client, db_session, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")

    sent = {}
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: sent.update(email=email, code=code)
    )

    email = f"newuser-{uuid.uuid4().hex[:8]}@example.com"

    response = db_client.post("/auth/request-code", json={"email": email})
    assert response.status_code == 202
    assert sent["email"] == email
    assert len(sent["code"]) == 6

    response = db_client.post(
        "/auth/verify-code", json={"email": email, "code": sent["code"]}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["email"] == email
    assert body["is_new_user"] is True, "verifying a new email signs them up"

    from backend.auth.jwt import decode_token

    payload = decode_token(body["access_token"])
    assert payload.email == email
    assert str(payload.user_id) == body["user_id"]

    user = db_session.scalars(select(User).where(User.email == email)).one()
    assert user.id == uuid.UUID(body["user_id"])


def test_second_login_is_not_a_new_user(db_client, db_session, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    sent = {}
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: sent.update(code=code)
    )

    email = f"returning-{uuid.uuid4().hex[:8]}@example.com"
    db_session.add(User(email=email))
    db_session.flush()

    db_client.post("/auth/request-code", json={"email": email})
    response = db_client.post(
        "/auth/verify-code", json={"email": email, "code": sent["code"]}
    )

    assert response.status_code == 200
    assert response.json()["is_new_user"] is False


def test_wrong_code_is_rejected(db_client, monkeypatch):
    sent = {}
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: sent.update(code=code)
    )

    email = f"wrong-{uuid.uuid4().hex[:8]}@example.com"
    db_client.post("/auth/request-code", json={"email": email})

    wrong = "000000" if sent["code"] != "000000" else "111111"
    response = db_client.post(
        "/auth/verify-code", json={"email": email, "code": wrong}
    )
    assert response.status_code == 401


def test_code_cannot_be_replayed(db_client, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    sent = {}
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: sent.update(code=code)
    )

    email = f"replay-{uuid.uuid4().hex[:8]}@example.com"
    db_client.post("/auth/request-code", json={"email": email})

    first = db_client.post(
        "/auth/verify-code", json={"email": email, "code": sent["code"]}
    )
    assert first.status_code == 200

    second = db_client.post(
        "/auth/verify-code", json={"email": email, "code": sent["code"]}
    )
    assert second.status_code == 401, "a consumed code must not work twice"


def test_requesting_a_second_code_invalidates_the_first(db_client, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    codes = []
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: codes.append(code)
    )

    email = f"reissue-{uuid.uuid4().hex[:8]}@example.com"
    db_client.post("/auth/request-code", json={"email": email})
    db_client.post("/auth/request-code", json={"email": email})

    if codes[0] == codes[1]:
        pytest.skip("the two random codes collided")

    stale = db_client.post(
        "/auth/verify-code", json={"email": email, "code": codes[0]}
    )
    assert stale.status_code == 401, "the superseded code must be dead"

    fresh = db_client.post(
        "/auth/verify-code", json={"email": email, "code": codes[1]}
    )
    assert fresh.status_code == 200


def test_email_is_case_insensitive(db_client, db_session, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret-long-enough-for-hmac-sha256")
    sent = {}
    monkeypatch.setattr(
        main, "send_login_code_email", lambda email, code: sent.update(code=code)
    )

    suffix = uuid.uuid4().hex[:8]
    db_client.post("/auth/request-code", json={"email": f"Mixed.Case-{suffix}@Example.COM"})
    response = db_client.post(
        "/auth/verify-code",
        json={"email": f"mixed.case-{suffix}@example.com", "code": sent["code"]},
    )

    assert response.status_code == 200
    assert response.json()["email"] == f"mixed.case-{suffix}@example.com"


def test_undeliverable_code_does_not_leave_a_row(db_client, db_session, monkeypatch):
    from backend.auth.codes import EmailNotConfigured
    from backend.db.models import LoginCode

    def cannot_send(email, code):
        raise EmailNotConfigured("RESEND_API_KEY is not set")

    monkeypatch.setattr(main, "send_login_code_email", cannot_send)

    email = f"undeliverable-{uuid.uuid4().hex[:8]}@example.com"
    response = db_client.post("/auth/request-code", json={"email": email})

    assert response.status_code == 500
    # A code nobody received would only burn the caller's rate limit.
    count = db_session.scalar(
        select(func.count()).select_from(LoginCode).where(LoginCode.email == email)
    )
    assert count == 0