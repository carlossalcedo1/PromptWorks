"""
Unit tests for spend_tracker.py. Uses a temporary log file so it never
touches your real spend_log.jsonl.
"""

from __future__ import annotations

import importlib
from datetime import datetime, timedelta, timezone

import pytest


@pytest.fixture
def tracker(tmp_path, monkeypatch):
    """Reloads spend_tracker with LOG_PATH pointed at a temp file, so tests
    don't read/write your real spend log."""
    monkeypatch.setenv("PROMPTWORKS_SPEND_LOG", str(tmp_path / "spend_log.jsonl"))
    monkeypatch.delenv("PROMPTWORKS_DAILY_BUDGET_USD", raising=False)

    import backend.spend_tracker as spend_tracker

    importlib.reload(spend_tracker)
    return spend_tracker


def test_record_usage_returns_correct_cost(tracker):
    # claude-sonnet-5: $2/M input, $10/M output
    cost = tracker.record_usage(
        model="claude-sonnet-5", input_tokens=1_000_000, output_tokens=0
    )
    assert cost == pytest.approx(2.00)

    cost = tracker.record_usage(
        model="claude-sonnet-5", input_tokens=0, output_tokens=1_000_000
    )
    assert cost == pytest.approx(10.00)


def test_get_total_spend_sums_todays_entries(tracker):
    tracker.record_usage("claude-sonnet-5", 500_000, 0, scenario_id="a")
    tracker.record_usage("claude-sonnet-5", 500_000, 0, scenario_id="b")

    assert tracker.get_total_spend("today") == pytest.approx(2.00)


def test_get_total_spend_excludes_other_days(tracker):
    tracker.record_usage("claude-sonnet-5", 1_000_000, 0)

    # Manually write an entry timestamped yesterday.
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    import json

    with tracker.LOG_PATH.open("a") as f:
        f.write(
            json.dumps(
                {
                    "timestamp": yesterday.isoformat(),
                    "model": "claude-sonnet-5",
                    "input_tokens": 1_000_000,
                    "output_tokens": 0,
                    "cost_usd": 2.00,
                    "scenario_id": None,
                }
            )
            + "\n"
        )

    assert tracker.get_total_spend("today") == pytest.approx(2.00)  # only today's
    assert tracker.get_total_spend("all") == pytest.approx(4.00)  # both entries


def test_check_budget_noop_when_unset(tracker):
    tracker.record_usage("claude-sonnet-5", 10_000_000, 0)  # $20, well over any cap
    tracker.check_budget()  # should not raise, since no cap is configured


def test_check_budget_raises_when_cap_exceeded(tracker, monkeypatch):
    monkeypatch.setenv("PROMPTWORKS_DAILY_BUDGET_USD", "1.00")
    import importlib

    importlib.reload(tracker)

    tracker.record_usage("claude-sonnet-5", 1_000_000, 0)  # $2, over the $1 cap

    with pytest.raises(tracker.BudgetExceededError):
        tracker.check_budget()


def test_corrupted_log_lines_are_skipped_not_fatal(tracker):
    tracker.record_usage("claude-sonnet-5", 500_000, 0)
    with tracker.LOG_PATH.open("a") as f:
        f.write("this is not valid json\n")

    # Should not raise, and should still count the one valid entry.
    assert tracker.get_total_spend("all") == pytest.approx(1.00)
