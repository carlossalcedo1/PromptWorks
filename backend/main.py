"""
Promptworks Stage 2 — FastAPI app exposing POST /attempts.

This is the seam described in the Stage 1 README: the frontend's ScorePanel,
RubricBreakdown, etc. already expect gradePrompt()'s output shape. This
endpoint returns exactly that shape, so no frontend changes are needed —
just point the app at this URL instead of the mocked lib/grader.js.

Run locally:
    uvicorn main:app --reload

Then POST to http://127.0.0.1:8000/attempts with JSON body:
    {"scenario_id": "denied-claim-email", "prompt": "..."}
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

# Load .env before anything else runs, including the llm_grader import
# below — llm_grader reads ANTHROPIC_API_KEY lazily on first use, but
# loading here keeps this file the single source of truth for env setup.
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.llm_grader import MODEL, GraderError, Scenario, grade_prompt
from backend.spend_tracker import BudgetExceededError, check_budget, record_usage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("promptworks")

# ---------------------------------------------------------------------------
# Scenario store — TEMPORARY in-memory placeholder
# ---------------------------------------------------------------------------
# Your real scenarios live in frontend/src/data/scenarios.js. Until Stage 2's
# MongoDB is wired up, this is a stand-in: port your actual scenario fields
# into Scenario objects here (or write a small loader that reads the .js
# data — e.g. via a JSON export step — instead of hand-copying).
#
# The `id` you use as a dict key here is what the frontend must send as
# `scenario_id` in the request body.

SCENARIOS: dict[str, Scenario] = {
    "denied-claim-email": Scenario(
        id="denied-claim-email",
        brief="Write an email to a customer explaining their insurance claim was denied.",
        context=(
            "The claim was denied because the policy lapsed 4 days before the incident "
            "due to a missed payment. The customer has been with the company 6 years."
        ),
        constraints=[
            "Do not admit fault or offer compensation.",
            "Keep it under 200 words.",
            "Offer one concrete next step (reinstatement window).",
        ],
        output_format="Subject line, then a short email body.",
        role_and_audience="You are a claims department writing to a long-tenured customer.",
        examples=[],
        reference_prompt="(the hand-written reference prompt would go here)",
    ),
    # ... add the rest of your 10 Stage 1 scenarios here, same shape.
}


def get_scenario(scenario_id: str) -> Scenario:
    scenario = SCENARIOS.get(scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=404, detail=f"Unknown scenario_id: {scenario_id!r}"
        )
    return scenario


# ---------------------------------------------------------------------------
# Rate limiting — this is the only endpoint that costs real money per your
# roadmap notes, so it gets a hard per-IP limit regardless of anything else.
# Adjust the limit string once you have a sense of real usage patterns.
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

ATTEMPTS_RATE_LIMIT = os.environ.get("ATTEMPTS_RATE_LIMIT", "10/minute")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Promptworks API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# TODO: narrow this to your real deployed frontend origin before shipping —
# "*" or a hardcoded localhost list is fine for local dev only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server default
        "http://127.0.0.1:5173",
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class AttemptRequest(BaseModel):
    scenario_id: str
    prompt: str = Field(max_length=8000)  # guards against absurd input sizes


class DimensionScores(BaseModel):
    task_clarity: int
    context_supplied: int
    constraints: int
    output_format: int
    role_and_audience: int
    examples: int


class DimensionFeedback(BaseModel):
    task_clarity: str
    context_supplied: str
    constraints: str
    output_format: str
    role_and_audience: str
    examples: str


class TokenUsage(BaseModel):
    input: int
    output: int


class AttemptResponse(BaseModel):
    scores: DimensionScores
    feedback: DimensionFeedback
    total: int
    tokens: TokenUsage


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/admin/spend")
def spend_summary() -> dict[str, float]:
    # NOTE: this has no auth on it yet. Fine while it's just you and Carlos
    # testing locally — add an auth check before this is ever deployed
    # anywhere reachable by the public.
    from backend.spend_tracker import get_total_spend

    return {
        "today_usd": get_total_spend("today"),
        "month_usd": get_total_spend("month"),
        "all_time_usd": get_total_spend("all"),
    }


@app.post("/attempts", response_model=AttemptResponse)
@limiter.limit(ATTEMPTS_RATE_LIMIT)
def create_attempt(request: Request, body: AttemptRequest) -> AttemptResponse:
    scenario = get_scenario(body.scenario_id)

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
    if tokens.get("input") or tokens.get("output"):
        record_usage(
            model=MODEL,
            input_tokens=tokens.get("input", 0),
            output_tokens=tokens.get("output", 0),
            scenario_id=body.scenario_id,
        )

    return AttemptResponse(**result)
