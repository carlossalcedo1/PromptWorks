"""
Unit tests for backend/auth/codes.py.

No database and no network: `check_code` is a pure function over a
record-shaped object, so expiry, replay, the attempt cap and the hash
comparison can all be driven directly with a stub and an explicit clock.

Run with: pytest tests/test_auth_codes.py -v
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import pytest

from backend.auth.codes import (
    CODE_LENGTH,
    MAX_CODE_ATTEMPTS,
    CodeStatus,
    EmailNotConfigured,
    check_code,
    generate_code,
    hash_code,
    normalize_email,
    send_login_code_email,
    verify_code_hash,
)

NOW = datetime(2026, 9, 2, 12, 0, 0, tzinfo=timezone.utc)


@dataclass
class StubCode:
    """Satisfies the CodeRecord protocol without touching the database."""

    code_hash: str
    expires_at: datetime
    consumed_at: datetime | None = None
    attempt_count: int = 0


def make_record(code: str = "123456", **overrides) -> StubCode:
    defaults = {
        "code_hash": hash_code(code),
        "expires_at": NOW + timedelta(minutes=10),
    }
    return StubCode(**{**defaults, **overrides})


# ---------------------------------------------------------------------------
# Generation and hashing
# ---------------------------------------------------------------------------


def test_generate_code_is_six_digits():
    for _ in range(200):
        code = generate_code()
        assert len(code) == CODE_LENGTH
        assert code.isdigit()


def test_generate_code_pads_leading_zeros(monkeypatch):
    # The zero-padding is the easy thing to get wrong: without it a code of
    # 42 would be sent as "42" and never match a 6-character comparison.
    monkeypatch.setattr("backend.auth.codes.secrets.randbelow", lambda n: 42)
    assert generate_code() == "000042"


def test_generate_code_varies():
    codes = {generate_code() for _ in range(100)}
    assert len(codes) > 50, "codes look far too predictable"


def test_hash_code_is_deterministic_and_not_the_plaintext():
    assert hash_code("123456") == hash_code("123456")
    assert hash_code("123456") != hash_code("123457")
    assert "123456" not in hash_code("123456")
    assert len(hash_code("123456")) == 64  # sha256 hex


def test_verify_code_hash():
    assert verify_code_hash("123456", hash_code("123456")) is True
    assert verify_code_hash("654321", hash_code("123456")) is False


def test_normalize_email():
    assert normalize_email("  Carlos@Example.COM ") == "carlos@example.com"


# ---------------------------------------------------------------------------
# check_code verdicts
# ---------------------------------------------------------------------------


def test_correct_code_is_accepted():
    assert check_code(make_record("123456"), "123456", now=NOW) is CodeStatus.OK


def test_wrong_code_is_a_mismatch():
    assert check_code(make_record("123456"), "999999", now=NOW) is CodeStatus.MISMATCH


def test_missing_record_is_not_found():
    assert check_code(None, "123456", now=NOW) is CodeStatus.NOT_FOUND


def test_expired_code_is_rejected():
    record = make_record("123456", expires_at=NOW - timedelta(seconds=1))
    assert check_code(record, "123456", now=NOW) is CodeStatus.EXPIRED


def test_code_expiring_exactly_now_is_expired():
    # Boundary: expiry is inclusive, so a code is dead the instant it hits
    # its expiry rather than a second later.
    record = make_record("123456", expires_at=NOW)
    assert check_code(record, "123456", now=NOW) is CodeStatus.EXPIRED


def test_code_one_second_before_expiry_still_works():
    record = make_record("123456", expires_at=NOW + timedelta(seconds=1))
    assert check_code(record, "123456", now=NOW) is CodeStatus.OK


def test_consumed_code_cannot_be_replayed():
    record = make_record("123456", consumed_at=NOW - timedelta(minutes=1))
    assert check_code(record, "123456", now=NOW) is CodeStatus.CONSUMED


def test_naive_expiry_is_treated_as_utc():
    # A stub (or a row built in Python before a flush) can carry a naive
    # datetime; comparing it to an aware `now` would otherwise raise
    # TypeError and turn a valid login into a 500.
    record = make_record("123456", expires_at=NOW.replace(tzinfo=None) + timedelta(minutes=5))
    assert check_code(record, "123456", now=NOW) is CodeStatus.OK


# ---------------------------------------------------------------------------
# The attempt cap
# ---------------------------------------------------------------------------


def test_lockout_at_max_attempts():
    record = make_record("123456", attempt_count=MAX_CODE_ATTEMPTS)
    assert check_code(record, "123456", now=NOW) is CodeStatus.LOCKED_OUT


def test_one_attempt_below_the_cap_still_works():
    record = make_record("123456", attempt_count=MAX_CODE_ATTEMPTS - 1)
    assert check_code(record, "123456", now=NOW) is CodeStatus.OK


def test_lockout_beats_a_correct_code():
    # The cap is checked before the hash comparison on purpose: once a code
    # has been hammered, even the right value must not open it.
    record = make_record("123456", attempt_count=MAX_CODE_ATTEMPTS + 3)
    assert check_code(record, "123456", now=NOW) is CodeStatus.LOCKED_OUT


def test_five_wrong_guesses_then_lockout():
    """The full sequence a brute-forcing client would see."""
    record = make_record("123456")

    for _ in range(MAX_CODE_ATTEMPTS):
        assert check_code(record, "000000", now=NOW) is CodeStatus.MISMATCH
        record.attempt_count += 1  # what verify_login_code does on mismatch

    assert check_code(record, "000000", now=NOW) is CodeStatus.LOCKED_OUT
    assert check_code(record, "123456", now=NOW) is CodeStatus.LOCKED_OUT


def test_expired_beats_locked_out():
    # An expired code reports EXPIRED regardless of its attempt count — both
    # are refusals, but the user-facing advice ("request a new one") is the
    # same and the ordering shouldn't be accidental.
    record = make_record(
        "123456",
        expires_at=NOW - timedelta(minutes=1),
        attempt_count=MAX_CODE_ATTEMPTS,
    )
    assert check_code(record, "123456", now=NOW) is CodeStatus.EXPIRED


# ---------------------------------------------------------------------------
# Delivery guards
# ---------------------------------------------------------------------------


def test_send_raises_when_resend_is_not_configured(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.delenv("LOGIN_CODE_DEV_ECHO", raising=False)

    with pytest.raises(EmailNotConfigured):
        send_login_code_email("carlos@example.com", "123456")


def test_send_raises_without_a_from_address(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_fake")
    monkeypatch.delenv("RESEND_FROM_EMAIL", raising=False)

    with pytest.raises(EmailNotConfigured):
        send_login_code_email("carlos@example.com", "123456")


def test_dev_echo_logs_instead_of_sending(monkeypatch, caplog):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setenv("LOGIN_CODE_DEV_ECHO", "1")

    with caplog.at_level("WARNING", logger="promptworks.auth"):
        send_login_code_email("carlos@example.com", "123456")

    assert "123456" in caplog.text


def test_send_uses_resend_when_configured(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_fake")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "login@example.com")

    sent = {}

    class FakeEmails:
        @staticmethod
        def send(payload):
            sent.update(payload)

    fake_resend = type("resend", (), {"api_key": None, "Emails": FakeEmails})
    monkeypatch.setitem(__import__("sys").modules, "resend", fake_resend)

    send_login_code_email("carlos@example.com", "123456")

    assert sent["to"] == ["carlos@example.com"]
    assert sent["from"] == "login@example.com"
    assert "123456" in sent["text"]
