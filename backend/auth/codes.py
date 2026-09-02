"""
Passwordless login codes: generate, hash, verify, and email a 6-digit code.

The decision logic is deliberately split in two:

  * `check_code()` is pure — it takes a record-shaped object and a clock, and
    returns a verdict. Expiry, the consumed check, and the 5-attempt lockout
    all live here, so they can be unit tested without a database.
  * The functions below it do the database work and call `check_code()` for
    the actual verdict.

The plaintext code is never stored. Only its SHA-256 hash goes in the table;
the code itself exists in the email and nowhere else. A 6-digit code has only
a million possibilities, which is exactly why the attempt cap matters more
here than the hash does.
"""

from __future__ import annotations

import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Protocol

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.db.models import LoginCode

logger = logging.getLogger("promptworks.auth")

CODE_LENGTH = 6
# Five wrong guesses kills the code. At 5 tries against 10^6 codes, guessing
# is hopeless; without a cap, a script gets there in an afternoon.
MAX_CODE_ATTEMPTS = 5
DEFAULT_EXPIRY_MINUTES = 10


class CodeStatus(str, Enum):
    OK = "ok"
    NOT_FOUND = "not_found"
    EXPIRED = "expired"
    CONSUMED = "consumed"
    LOCKED_OUT = "locked_out"
    MISMATCH = "mismatch"


class EmailNotConfigured(RuntimeError):
    """RESEND_API_KEY isn't set, so a login code can't actually be delivered."""


class CodeRecord(Protocol):
    """The shape `check_code` needs.

    A `LoginCode` row satisfies this, and so does a plain stub object — which
    is the point: the verdict logic is testable without a database.
    """

    code_hash: str
    expires_at: datetime
    consumed_at: datetime | None
    attempt_count: int


# ---------------------------------------------------------------------------
# Pure helpers
# ---------------------------------------------------------------------------


def normalize_email(email: str) -> str:
    """Lowercase and strip, so one person can't end up with two accounts."""
    return email.strip().lower()


def generate_code() -> str:
    """A cryptographically random 6-digit code, zero-padded.

    `secrets.randbelow` rather than `random` — this is a credential, and the
    `random` module's output is predictable from a few prior samples.
    """
    return f"{secrets.randbelow(10**CODE_LENGTH):0{CODE_LENGTH}d}"


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def verify_code_hash(code: str, code_hash: str) -> bool:
    """Constant-time comparison, so response timing leaks nothing."""
    return secrets.compare_digest(hash_code(code), code_hash)


def expiry_minutes() -> int:
    raw = os.environ.get("LOGIN_CODE_EXPIRY_MINUTES")
    if not raw:
        return DEFAULT_EXPIRY_MINUTES
    try:
        return int(raw)
    except ValueError:
        logger.warning(
            "LOGIN_CODE_EXPIRY_MINUTES=%r is not an integer; using %d",
            raw,
            DEFAULT_EXPIRY_MINUTES,
        )
        return DEFAULT_EXPIRY_MINUTES


def _as_utc(value: datetime) -> datetime:
    """Treat a naive datetime as UTC.

    Postgres hands back tz-aware values for timestamptz columns, but a stub in
    a test (or a row built in Python before a flush) may be naive. Comparing
    the two raises TypeError, which is a confusing way to fail a login.
    """
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def check_code(
    record: CodeRecord | None, submitted_code: str, now: datetime | None = None
) -> CodeStatus:
    """Decide whether `submitted_code` should be accepted for `record`.

    Pure: no database, no clock of its own unless you omit `now`. Order is
    deliberate — the lockout is checked *before* the hash comparison, so a
    code that's already burned through its attempts can't be probed further.
    """
    if record is None:
        return CodeStatus.NOT_FOUND

    now = now or datetime.now(timezone.utc)

    if record.consumed_at is not None:
        return CodeStatus.CONSUMED
    if _as_utc(record.expires_at) <= now:
        return CodeStatus.EXPIRED
    if record.attempt_count >= MAX_CODE_ATTEMPTS:
        return CodeStatus.LOCKED_OUT
    if not verify_code_hash(submitted_code, record.code_hash):
        return CodeStatus.MISMATCH

    return CodeStatus.OK


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------


def create_login_code(session: Session, email: str) -> tuple[LoginCode, str]:
    """Issue a fresh code for `email`, invalidating any still-live one.

    Returns the row and the plaintext code. The caller emails the plaintext
    and then forgets it — it is not recoverable from the row.

    Invalidating the previous code matters: without it, requesting a second
    code leaves the first one working, so every request widens the window
    rather than replacing it.
    """
    normalized = normalize_email(email)
    now = datetime.now(timezone.utc)

    session.execute(
        update(LoginCode)
        .where(
            LoginCode.email == normalized,
            LoginCode.consumed_at.is_(None),
        )
        .values(consumed_at=now)
    )

    code = generate_code()
    record = LoginCode(
        email=normalized,
        code_hash=hash_code(code),
        expires_at=now + timedelta(minutes=expiry_minutes()),
        attempt_count=0,
    )
    session.add(record)
    session.flush()

    return record, code


def get_active_code(session: Session, email: str) -> LoginCode | None:
    """The newest unconsumed code for this email, if there is one."""
    return session.scalars(
        select(LoginCode)
        .where(
            LoginCode.email == normalize_email(email),
            LoginCode.consumed_at.is_(None),
        )
        .order_by(LoginCode.created_at.desc())
        .limit(1)
    ).first()


def verify_login_code(
    session: Session, email: str, submitted_code: str
) -> tuple[CodeStatus, LoginCode | None]:
    """Check a submitted code and record the consequence.

    A mismatch increments `attempt_count` (that increment is what the lockout
    counts); a success marks the code consumed so it can't be replayed.
    The caller owns the commit.
    """
    record = get_active_code(session, email)
    status = check_code(record, submitted_code)

    if record is None:
        return status, None

    if status is CodeStatus.MISMATCH:
        record.attempt_count += 1
        session.flush()
    elif status is CodeStatus.OK:
        record.consumed_at = datetime.now(timezone.utc)
        session.flush()

    return status, record


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------

_SUBJECT = "Your Promptworks sign-in code"


def _body_text(code: str) -> str:
    return (
        f"Your Promptworks sign-in code is {code}\n\n"
        f"It expires in {expiry_minutes()} minutes and can be used once.\n"
        "If you didn't ask to sign in, you can ignore this email."
    )


def send_login_code_email(email: str, code: str) -> None:
    """Send the code via Resend.

    With no RESEND_API_KEY set this raises, rather than silently succeeding
    while nobody receives anything. For local development, setting
    LOGIN_CODE_DEV_ECHO=1 logs the code to the server console instead — never
    turn that on anywhere real, it writes a live credential to the logs.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    from_email = os.environ.get("RESEND_FROM_EMAIL")

    if not api_key:
        if os.environ.get("LOGIN_CODE_DEV_ECHO") == "1":
            logger.warning(
                "LOGIN_CODE_DEV_ECHO is on — login code for %s is %s "
                "(no email sent; never enable this outside local dev)",
                email,
                code,
            )
            return
        raise EmailNotConfigured(
            "RESEND_API_KEY is not set, so the login code cannot be delivered. "
            "Set it in .env, or set LOGIN_CODE_DEV_ECHO=1 to log codes to the "
            "console during local development."
        )

    if not from_email:
        raise EmailNotConfigured(
            "RESEND_FROM_EMAIL is not set. Resend needs a verified sender address."
        )

    import resend

    resend.api_key = api_key
    resend.Emails.send(
        {
            "from": from_email,
            "to": [email],
            "subject": _SUBJECT,
            "text": _body_text(code),
        }
    )
