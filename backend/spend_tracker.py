"""
Promptworks Stage 2 — spend tracking for the grading endpoint.

This is deliberately simple: a local JSONL log file, not a database table.
It exists to answer two questions cheaply, without waiting on Carlos's
MongoDB setup:

    1. "How much has grading cost us today / this month?"
    2. "Should we refuse new grading requests because we've hit a budget cap?"

Once real persistence exists, this can be replaced by writing the same
records into a `spend` collection instead of a file — the interface
(record_usage / get_total_spend / check_budget) doesn't need to change.

Pricing is hardcoded per model below. Anthropic's published pricing changes
over time and varies by model, so double check https://www.anthropic.com/pricing
before trusting these numbers for a real budget decision, and update
PRICING_PER_MILLION_TOKENS if you switch models.
"""

from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# USD per 1M tokens. Update if you change MODEL in llm_grader.py, or if
# Anthropic's pricing changes.
PRICING_PER_MILLION_TOKENS: dict[str, dict[str, float]] = {
    "claude-sonnet-5": {"input": 2.00, "output": 10.00},
}

DEFAULT_PRICING = {"input": 2.00, "output": 10.00}  # fallback if model unlisted

LOG_PATH = Path(os.environ.get("PROMPTWORKS_SPEND_LOG", "spend_log.jsonl"))

# If set, check_budget() raises BudgetExceededError once today's spend hits
# this many dollars. Unset (None) means no cap is enforced.
_daily_cap_env = os.environ.get("PROMPTWORKS_DAILY_BUDGET_USD")
DAILY_BUDGET_USD: float | None = float(_daily_cap_env) if _daily_cap_env else None

# Guards concurrent writes to the log file from multiple requests at once.
_write_lock = threading.Lock()


class BudgetExceededError(Exception):
    """Raised by check_budget() when today's spend has hit the configured cap."""


# ---------------------------------------------------------------------------
# Recording
# ---------------------------------------------------------------------------


def _cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    pricing = PRICING_PER_MILLION_TOKENS.get(model, DEFAULT_PRICING)
    return (
        input_tokens / 1_000_000 * pricing["input"]
        + output_tokens / 1_000_000 * pricing["output"]
    )


def record_usage(
    model: str,
    input_tokens: int,
    output_tokens: int,
    scenario_id: str | None = None,
) -> float:
    """
    Append one grading call's usage to the spend log. Returns the cost in
    USD for this single call.
    """
    cost = _cost_usd(model, input_tokens, output_tokens)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost, 6),
        "scenario_id": scenario_id,
    }

    with _write_lock:
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")

    return cost


# ---------------------------------------------------------------------------
# Reading
# ---------------------------------------------------------------------------


def _read_entries() -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    entries = []
    with LOG_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # skip corrupted lines rather than fail the whole read
    return entries


def get_total_spend(period: str = "today") -> float:
    """
    period: "today", "month", or "all".
    Returns total USD spent in that period, based on the log file.
    """
    now = datetime.now(timezone.utc)
    total = 0.0

    for entry in _read_entries():
        try:
            ts = datetime.fromisoformat(entry["timestamp"])
        except (KeyError, ValueError):
            continue

        if period == "today":
            if ts.date() != now.date():
                continue
        elif period == "month":
            if (ts.year, ts.month) != (now.year, now.month):
                continue
        elif period != "all":
            raise ValueError(f"Unknown period: {period!r}")

        total += entry.get("cost_usd", 0.0)

    return round(total, 6)


# ---------------------------------------------------------------------------
# Budget enforcement
# ---------------------------------------------------------------------------


def check_budget() -> None:
    """
    Raises BudgetExceededError if PROMPTWORKS_DAILY_BUDGET_USD is set and
    today's spend has already reached it. No-op if the cap isn't configured.

    Call this BEFORE making a grading call, so you refuse the request
    instead of paying for it and refusing the next one.
    """
    if DAILY_BUDGET_USD is None:
        return

    spent_today = get_total_spend(period="today")
    if spent_today >= DAILY_BUDGET_USD:
        raise BudgetExceededError(
            f"Daily budget of ${DAILY_BUDGET_USD:.2f} reached "
            f"(${spent_today:.2f} spent today). Grading is paused until "
            f"tomorrow (UTC) or the cap is raised."
        )
