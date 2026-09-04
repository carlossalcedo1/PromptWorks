"""
Promptworks Stage 2 — FastAPI app.

Endpoints:
    POST /auth/request-code   email -> a 6-digit code, sent by email
    POST /auth/verify-code    email + code -> a JWT (this is signup too)
    POST /attempts            grade a prompt, write an `attempts` row
    GET  /health
    GET  /admin/spend

`POST /attempts` returns exactly the shape the Stage 1 frontend's
gradePrompt() produced, so ScorePanel, RubricBreakdown and the rest need no
changes — just point the app at this URL instead of the mocked lib/grader.js.

Run locally (with Postgres up and DATABASE_URL set):
    uvicorn backend.main:app --reload
"""

from __future__ import annotations

import logging
import os
import re
import statistics
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from dotenv import load_dotenv

# Load .env before anything else runs, including the imports below —
# llm_grader reads ANTHROPIC_API_KEY lazily on first use, but loading here
# keeps this file the single source of truth for env setup.
load_dotenv()

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.auth.codes import (
    CodeStatus,
    EmailNotConfigured,
    MAX_CODE_ATTEMPTS,
    create_login_code,
    normalize_email,
    send_login_code_email,
    verify_login_code,
)
from backend.auth.dependencies import get_current_user, get_current_user_optional
from backend.auth.jwt import issue_token
from backend.db.base import get_db
from backend.db.models import Attempt, LoginCode, Track, User, Workflow
from backend.db.models import Scenario as ScenarioRow
from backend.llm_grader import MODEL, DIMENSIONS, GraderError, Scenario, grade_prompt
from backend.llm_grader import CalibrationExample, grade_freeform_prompt, HAIKU_MODEL
from backend.spend_tracker import BudgetExceededError, check_budget, record_usage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("promptworks")


# ---------------------------------------------------------------------------
# Scenario loading — from the database, seeded by scripts/seed_scenarios.py
# ---------------------------------------------------------------------------


def _to_grader_scenario(row: ScenarioRow) -> Scenario:
    """Build the grader's dataclass from a `scenarios` row.

    The dataclass and the table are meant to stay in lockstep; this function
    is the one place that assumption is cashed in, so a mismatch shows up
    here rather than as a confusing grade.
    """
    return Scenario(
        id=row.slug,
        brief=row.brief,
        context=row.context or "",
        constraints=list(row.constraints or []),
        output_format=row.output_format or "",
        role_and_audience=row.role_and_audience or "",
        examples=list(row.examples or []),
        reference_prompt=row.reference_prompt or "",
        rubric_weights=dict(row.rubric_weights or {}),
        calibration_examples=[
            CalibrationExample(prompt=ex["prompt"], scores=ex["scores"])
            for ex in (row.calibration_examples or [])
        ],
    )


def get_scenario_row(session: Session, slug: str) -> ScenarioRow:
    row = session.scalars(
        select(ScenarioRow).where(ScenarioRow.slug == slug)
    ).first()
    if row is None:
        raise HTTPException(
            status_code=404, detail=f"Unknown scenario_id: {slug!r}"
        )
    return row


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

ATTEMPTS_RATE_LIMIT = os.environ.get("ATTEMPTS_RATE_LIMIT", "10/minute")
# Freeform grading has no signup gate at all (fully anonymous, unlike
# /attempts which at least ties to a scenario), so it gets its own,
# independently-tunable limit rather than sharing ATTEMPTS_RATE_LIMIT.
FREEFORM_RATE_LIMIT = os.environ.get("FREEFORM_RATE_LIMIT", "5/minute")
LOGIN_CODE_RATE_LIMIT = os.environ.get("LOGIN_CODE_RATE_LIMIT", "3/minute")

_PERIOD_SECONDS = {
    "second": 1,
    "minute": 60,
    "hour": 3600,
    "day": 86400,
}


def parse_rate_limit(spec: str) -> tuple[int, int]:
    """Turn slowapi's "3/minute" into (3, 60).

    Used for the per-email half of the login-code limit: slowapi's decorator
    keys off the request (the IP), and the email only exists once the body is
    parsed, so that half is counted in the database instead.
    """
    match = re.fullmatch(r"\s*(\d+)\s*/\s*(\d+)?\s*(second|minute|hour|day)s?\s*", spec)
    if not match:
        logger.warning("Could not parse rate limit %r; falling back to 3/minute", spec)
        return 3, 60
    count = int(match.group(1))
    multiple = int(match.group(2) or 1)
    return count, multiple * _PERIOD_SECONDS[match.group(3)]


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Promptworks API", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]


def _allowed_origins() -> list[str]:
    """CORS origins from ALLOWED_ORIGINS, comma-separated.

    Defaults to the Vite dev server only. The deployed frontend's origin has
    to be set explicitly in .env — a wildcard here would let any site on the
    internet spend your Anthropic credit through a visitor's browser.
    """
    raw = os.environ.get("ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class AttemptRequest(BaseModel):
    scenario_id: str  # the scenario's slug
    prompt: str = Field(max_length=8000)  # guards against absurd input sizes


class DimensionScores(BaseModel):
    clarity: int
    context: int
    constraints: int
    format: int
    audience: int
    examples: int


class DimensionFeedback(BaseModel):
    clarity: str
    context: str
    constraints: str
    format: str
    audience: str
    examples: str


class FreeformGradeRequest(BaseModel):
    prompt: str = Field(max_length=8000)


class FreeformGradeResponse(BaseModel):
    scores: DimensionScores
    feedback: DimensionFeedback
    total: int
    # Same prompt-length-estimate contract as AttemptResponse.tokens — see
    # that model's comment for why this isn't API usage.
    tokens: int


class AttemptResponse(BaseModel):
    scores: DimensionScores
    feedback: DimensionFeedback
    total: int
    # NOTE: this is the SUBMITTED PROMPT's own estimated token count — same
    # formula as frontend/src/lib/grader.js's estimateTokens() (~4 chars per
    # token) — used by ScorePanel's TokenDelta to compare against
    # scenario.referenceTokens. It is NOT Claude API usage, which is tracked
    # separately via spend_tracker.py and the attempts row's
    # tokens_input/tokens_output columns.
    tokens: int
    # The row this grade was written to. Additive — the Stage 1 frontend
    # ignores it — but a client needs it to later save the attempt as a
    # workflow (`workflows.source_attempt_id`). None if the write failed.
    attempt_id: str | None = None


class RequestCodeRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=12)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    org_id: str | None = None
    is_new_user: bool = False


class CompleteProfileRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    # The frontend's track catalogue (frontend/src/data/tracks.js) and the
    # seeded `tracks` table (data/tracks.json) share slugs by convention —
    # this is the one place that convention gets checked at runtime.
    track_slug: str


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    track_slug: str | None = None


class QueueItem(BaseModel):
    scenario: str  # slug — matches the frontend's /practice/{slug} route
    title: str
    track: str
    difficulty: str
    status: str  # "not started" | "N attempts" | "completed X/30"


class DimensionScoresFloat(BaseModel):
    # Same six dimensions as DimensionScores, but floats — RubricProfile
    # renders these with .toFixed(1), matching org.js's mock LEARNER.profile
    # shape exactly (e.g. 4.6, not 5).
    clarity: float
    context: float
    constraints: float
    format: float
    audience: float
    examples: float


class DashboardResponse(BaseModel):
    name: str
    track: str | None = None
    trackSlug: str | None = None
    level: int
    streak: int
    repsThisWeek: int
    repsGoal: int
    medianScore: float
    medianDelta: float
    workflowsShipped: int
    workflowUses: int
    profile: DimensionScoresFloat
    queue: list[QueueItem]


# ---------------------------------------------------------------------------
# Routes — health and admin
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/admin/spend")
def spend_summary(request: Request) -> dict[str, float]:
    """Spend totals. Requires ADMIN_TOKEN as a bearer token.

    If ADMIN_TOKEN isn't configured this refuses outright rather than serving
    the numbers to anyone who asks — an unset variable should fail closed.
    """
    from backend.spend_tracker import get_total_spend

    admin_token = os.environ.get("ADMIN_TOKEN")
    if not admin_token:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_TOKEN is not configured; /admin/spend is disabled.",
        )

    header = request.headers.get("authorization", "")
    supplied = header[7:] if header.lower().startswith("bearer ") else ""
    import secrets as _secrets

    if not _secrets.compare_digest(supplied, admin_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authorised.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "today_usd": get_total_spend("today"),
        "month_usd": get_total_spend("month"),
        "all_time_usd": get_total_spend("all"),
    }


# ---------------------------------------------------------------------------
# Routes — passwordless auth
# ---------------------------------------------------------------------------


@app.post("/auth/request-code", status_code=202)
@limiter.limit(LOGIN_CODE_RATE_LIMIT)
def request_code(
    request: Request,
    body: RequestCodeRequest,
    session: Session = Depends(get_db),
) -> dict[str, str]:
    """Email a 6-digit login code.

    Rate limited twice over: the decorator caps requests per IP, and the
    check below caps them per email address. Both matter — this endpoint
    sends real email to an address the caller hasn't proved they own, so
    without the per-email cap it's a free way to spam a stranger's inbox,
    and without the per-IP cap it's a free way to burn your Resend quota.

    The response is deliberately identical whether or not the email already
    has an account: replying differently would turn this into an endpoint
    for checking who has signed up.
    """
    email = normalize_email(body.email)

    count, window_seconds = parse_rate_limit(LOGIN_CODE_RATE_LIMIT)
    since = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    recent = session.scalar(
        select(func.count())
        .select_from(LoginCode)
        .where(LoginCode.email == email, LoginCode.created_at >= since)
    )
    if recent is not None and recent >= count:
        raise HTTPException(
            status_code=429,
            detail="Too many codes requested for this email. Try again shortly.",
        )

    record, code = create_login_code(session, email)

    try:
        send_login_code_email(email, code)
    except EmailNotConfigured as exc:
        session.rollback()
        logger.error("Login code not sent: %s", exc)
        raise HTTPException(
            status_code=500, detail="Email delivery is not configured."
        )
    except Exception as exc:  # noqa: BLE001 — provider errors vary by SDK
        # Roll back the code row: a code nobody received is a code that only
        # burns the user's rate limit.
        session.rollback()
        logger.error("Login code delivery failed for %s: %s", email, exc)
        raise HTTPException(
            status_code=502, detail="Could not send the code. Please try again."
        )

    session.commit()
    logger.info("Issued login code %s for %s", record.id, email)

    return {"status": "sent"}


@app.post("/auth/verify-code", response_model=TokenResponse)
def verify_code(
    body: VerifyCodeRequest,
    session: Session = Depends(get_db),
) -> TokenResponse:
    """Exchange a code for a JWT. This is signup as well as login.

    Every rejection returns the same 401 text. Distinguishing "no such code"
    from "wrong code" would tell an attacker which emails have a live code
    outstanding.
    """
    email = normalize_email(body.email)
    status_result, _record = verify_login_code(session, email, body.code)

    if status_result is not CodeStatus.OK:
        session.commit()  # keep the incremented attempt_count
        if status_result is CodeStatus.LOCKED_OUT:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"That code has been entered incorrectly {MAX_CODE_ATTEMPTS} "
                    "times and is no longer valid. Request a new one."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="That code is not valid. Request a new one.",
        )

    user = session.scalars(select(User).where(User.email == email)).first()
    is_new_user = user is None
    if user is None:
        user = User(email=email)
        session.add(user)
        session.flush()

    token = issue_token(user_id=user.id, email=user.email, org_id=user.org_id)
    session.commit()

    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        org_id=str(user.org_id) if user.org_id else None,
        is_new_user=is_new_user,
    )


@app.get("/auth/me", response_model=ProfileResponse)
def me(user: User = Depends(get_current_user)) -> ProfileResponse:
    """The signed-in user's own profile.

    The JWT only carries email and user_id (see issue_token) — first/last
    name and track live in the database, not the token, so a client that
    wants them (the header's initials, for one) has to ask here rather than
    decode the token itself.
    """
    return ProfileResponse(
        user_id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        track_slug=user.primary_track.slug if user.primary_track else None,
    )


@app.post("/auth/complete-profile", response_model=ProfileResponse)
def complete_profile(
    body: CompleteProfileRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProfileResponse:
    """First/last name and a starting track, collected right after a first
    sign-up rather than on the request-code/verify-code forms themselves —
    those two stay just an email, so returning users never see extra fields.

    Requires a real token (not the optional dependency /attempts uses): this
    writes to a specific person's row, so there must be one.
    """
    track = session.scalars(
        select(Track).where(Track.slug == body.track_slug)
    ).first()
    if track is None:
        raise HTTPException(status_code=422, detail="Unknown track.")

    user.first_name = body.first_name.strip()
    user.last_name = body.last_name.strip()
    user.primary_track_id = track.id
    session.commit()

    return ProfileResponse(
        user_id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        track_slug=track.slug,
    )


# ---------------------------------------------------------------------------
# Routes — learner dashboard
# ---------------------------------------------------------------------------

# Not yet a per-user setting — a flat weekly target for everyone, matching
# the mock LEARNER.repsGoal in the frontend's data/org.js.
REPS_GOAL = 10

# A scenario counts as "mastered" (no longer worth queuing) once a single
# attempt has hit this total. Matches the 24+/30 threshold the mock queue
# statuses implied ("completed 26/30").
MASTERY_THRESHOLD = 24


@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DashboardResponse:
    """
    Real learner stats computed from the attempts table — the replacement
    for the hardcoded LEARNER mock in frontend/src/data/org.js. A brand new
    user with zero attempts gets honest zeros/empties back, not an error.
    """
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = this_month_start - timedelta(seconds=1)
    last_month_start = last_month_end.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    all_attempts = list(
        session.scalars(
            select(Attempt)
            .where(Attempt.user_id == user.id)
            .order_by(Attempt.created_at.desc())
        )
    )

    reps_this_week = sum(1 for a in all_attempts if a.created_at >= week_start)

    this_month_totals = [a.total for a in all_attempts if a.created_at >= this_month_start]
    last_month_totals = [
        a.total for a in all_attempts if last_month_start <= a.created_at < this_month_start
    ]

    if this_month_totals:
        median_score = float(statistics.median(this_month_totals))
    elif all_attempts:
        median_score = float(statistics.median(a.total for a in all_attempts))
    else:
        median_score = 0.0

    median_delta = (
        median_score - float(statistics.median(last_month_totals))
        if last_month_totals
        else 0.0
    )

    # Rolling profile: last 20 attempts, per-dimension average — matches the
    # mock's "Rolling average across your last 20 attempts" label exactly.
    recent = all_attempts[:20]
    if recent:
        profile = {
            dim: round(statistics.mean(getattr(a, f"{dim}_score") for a in recent), 1)
            for dim in DIMENSIONS
        }
    else:
        profile = {dim: 0.0 for dim in DIMENSIONS}

    workflows = list(session.scalars(select(Workflow).where(Workflow.author_id == user.id)))
    workflows_shipped = len(workflows)
    workflow_uses = sum(w.usage_count for w in workflows)

    # Queue: up to 3 not-yet-mastered scenarios in the user's primary track.
    queue: list[QueueItem] = []
    if user.primary_track_id is not None:
        track_scenarios = session.scalars(
            select(ScenarioRow).where(ScenarioRow.track_id == user.primary_track_id)
        )
        for s in track_scenarios:
            if len(queue) >= 3:
                break
            attempts_for_s = [a for a in all_attempts if a.scenario_id == s.id]
            if not attempts_for_s:
                status_str = "not started"
            else:
                best = max(a.total for a in attempts_for_s)
                if best >= MASTERY_THRESHOLD:
                    continue  # mastered — nothing left to queue here
                n = len(attempts_for_s)
                status_str = f"{n} attempt{'s' if n != 1 else ''}"

            queue.append(
                QueueItem(
                    scenario=s.slug,
                    title=s.title,
                    track=user.primary_track.title if user.primary_track else "",
                    difficulty=s.difficulty,
                    status=status_str,
                )
            )

    return DashboardResponse(
        name=user.first_name or user.email.split("@")[0],
        track=user.primary_track.title if user.primary_track else None,
        trackSlug=user.primary_track.slug if user.primary_track else None,
        level=user.level,
        streak=user.streak_count,
        repsThisWeek=reps_this_week,
        repsGoal=REPS_GOAL,
        medianScore=median_score,
        medianDelta=median_delta,
        workflowsShipped=workflows_shipped,
        workflowUses=workflow_uses,
        profile=DimensionScoresFloat(**profile),
        queue=queue,
    )


# ---------------------------------------------------------------------------
# Routes — grading
# ---------------------------------------------------------------------------


def _estimate_prompt_tokens(text: str) -> int:
    """
    Mirrors frontend/src/lib/grader.js's estimateTokens() exactly (~4 chars
    per token), so ScorePanel's token-efficiency comparison against
    scenario.referenceTokens behaves identically to Stage 1. Deliberately
    NOT the actual Claude API usage — that's tracked separately via
    spend_tracker.py and the attempts row's tokens_input/tokens_output.
    """
    if not text:
        return 0
    return max(1, round(len(text.strip()) / 4))


@app.post("/grade/freeform", response_model=FreeformGradeResponse)
@limiter.limit(FREEFORM_RATE_LIMIT)
def grade_freeform(
    request: Request,
    body: FreeformGradeRequest,
) -> FreeformGradeResponse:
    """
    Grade any prompt on general prompt-engineering craft — no scenario_id,
    no signup required. This is deliberately NOT written to the attempts
    table and never feeds a tracked skill score or the team dashboard: the
    judge has no known-correct scenario to check the prompt against here,
    so these scores aren't comparable to scenario-based ones. See the
    product discussion in llm_grader.grade_freeform_prompt()'s docstring.
    """
    try:
        check_budget()
    except BudgetExceededError as exc:
        logger.warning("Freeform grading refused, budget exceeded: %s", exc)
        raise HTTPException(status_code=429, detail=str(exc))

    try:
        result = grade_freeform_prompt(body.prompt)
    except GraderError as exc:
        logger.error("Freeform grading failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Grading failed. Please try again in a moment.",
        )
    except RuntimeError as exc:
        logger.error("Grader misconfigured: %s", exc)
        raise HTTPException(status_code=500, detail="Server is misconfigured.")

    tokens = result["tokens"]
    if tokens["input"] or tokens["output"]:
        record_usage(
            model=HAIKU_MODEL,
            input_tokens=tokens["input"],
            output_tokens=tokens["output"],
            scenario_id=None,  # no scenario — this is what marks a freeform grade in the spend log
        )

    return FreeformGradeResponse(
        scores=result["scores"],
        feedback=result["feedback"],
        total=result["total"],
        tokens=_estimate_prompt_tokens(body.prompt),
    )


@app.post("/attempts", response_model=AttemptResponse)
@limiter.limit(ATTEMPTS_RATE_LIMIT)
def create_attempt(
    request: Request,
    body: AttemptRequest,
    session: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> AttemptResponse:
    """Grade a prompt and record the attempt.

    Auth is optional: a valid bearer token attributes the attempt to its
    user, no token records it anonymously. The homepage's "Try one now"
    widget depends on the second path, and grading is identical either way.
    """
    scenario_row = get_scenario_row(session, body.scenario_id)
    scenario = _to_grader_scenario(scenario_row)

    try:
        check_budget()
    except BudgetExceededError as exc:
        logger.warning("Grading refused, budget exceeded: %s", exc)
        raise HTTPException(status_code=429, detail=str(exc))

    try:
        result = grade_prompt(scenario=scenario, submitted_prompt=body.prompt)
    except GraderError as exc:
        logger.error("Grading failed for scenario %s: %s", body.scenario_id, exc)
        raise HTTPException(
            status_code=502,
            detail="Grading failed. Please try again in a moment.",
        )
    except RuntimeError as exc:
        # ANTHROPIC_API_KEY missing — a config problem, not a client error.
        logger.error("Grader misconfigured: %s", exc)
        raise HTTPException(status_code=500, detail="Server is misconfigured.")

    # Only record spend for calls that actually hit the API — the empty-
    # prompt short-circuit in grade_prompt() returns 0 tokens, so this is
    # a true no-op for that case rather than logging a $0.00 entry.
    tokens = result.get("tokens", {})
    cost = Decimal("0")
    if tokens.get("input") or tokens.get("output"):
        cost = Decimal(
            str(
                record_usage(
                    model=MODEL,
                    input_tokens=tokens.get("input", 0),
                    output_tokens=tokens.get("output", 0),
                    scenario_id=body.scenario_id,
                )
            )
        )

    attempt_id = _record_attempt(
        session=session,
        scenario_row=scenario_row,
        user=user,
        prompt_text=body.prompt,
        result=result,
        cost=cost,
    )

    return AttemptResponse(
        scores=result["scores"],
        feedback=result["feedback"],
        total=result["total"],
        tokens=_estimate_prompt_tokens(body.prompt),
        attempt_id=attempt_id,
    )


def _record_attempt(
    session: Session,
    scenario_row: ScenarioRow,
    user: User | None,
    prompt_text: str,
    result: dict,
    cost: Decimal,
) -> str | None:
    """Write the `attempts` row. Returns its id, or None if the write failed.

    A failed insert is logged loudly but does not fail the request: the
    Anthropic call has already been paid for at this point, and throwing away
    a grade the learner is waiting for — to report a database problem they
    can do nothing about — is the worse of the two outcomes. The log line
    carries the scores so the row can be reconstructed if it ever matters.
    """
    scores = result["scores"]
    feedback = result["feedback"]
    tokens = result.get("tokens", {})

    attempt = Attempt(
        user_id=user.id if user else None,
        # Denormalized at write time so org dashboards skip the join.
        org_id=user.org_id if user else None,
        scenario_id=scenario_row.id,
        prompt_text=prompt_text,
        model=MODEL,
        # model_output stays null: llm_grader grades the submitted prompt
        # without executing it. Whether to add a second call that runs the
        # prompt is still an open product decision.
        model_output=None,
        total=result["total"],
        # Snapshot the weights as they are now, so editing the scenario later
        # doesn't retroactively reinterpret this score.
        rubric_weights_snapshot=dict(scenario_row.rubric_weights or {}),
        tokens_input=tokens.get("input", 0),
        tokens_output=tokens.get("output", 0),
        cost_usd=cost,
        **{f"{dim}_score": scores[dim] for dim in DIMENSIONS},
        **{f"{dim}_feedback": feedback[dim] for dim in DIMENSIONS},
    )

    try:
        session.add(attempt)
        session.commit()
        return str(attempt.id)
    except Exception as exc:  # noqa: BLE001 — never lose a paid-for grade
        session.rollback()
        logger.error(
            "Failed to write attempt row for scenario=%s user=%s scores=%s "
            "total=%s tokens=%s: %s",
            scenario_row.slug,
            user.id if user else None,
            scores,
            result["total"],
            tokens,
            exc,
        )
        return None