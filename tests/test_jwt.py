"""
Unit tests for backend/auth/jwt.py.

No database, no network. These cover the round trip and — more importantly —
the ways a token is supposed to be rejected: expired, tampered, signed with
the wrong secret, or structurally wrong. A JWT layer that only gets tested on
the happy path is a JWT layer that accepts forgeries.

Run with: pytest tests/test_jwt.py -v
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import jwt as pyjwt
import pytest

from backend.auth.jwt import (
    ALGORITHM,
    AuthTokenError,
    decode_token,
    expiry_minutes,
    issue_token,
)

SECRET = "test-secret-not-used-anywhere-real"
USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
ORG_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture(autouse=True)
def secret(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    monkeypatch.delenv("JWT_EXPIRY_MINUTES", raising=False)


# ---------------------------------------------------------------------------
# Round trip
# ---------------------------------------------------------------------------


def test_issue_and_decode_round_trip():
    token = issue_token(user_id=USER_ID, email="carlos@example.com", org_id=ORG_ID)
    payload = decode_token(token)

    assert payload.user_id == USER_ID
    assert payload.email == "carlos@example.com"
    assert payload.org_id == ORG_ID
    assert payload.expires_at > datetime.now(timezone.utc)


def test_org_id_is_optional():
    token = issue_token(user_id=USER_ID, email="carlos@example.com")
    assert decode_token(token).org_id is None


def test_subject_claim_is_the_user_id():
    token = issue_token(user_id=USER_ID, email="carlos@example.com")
    claims = pyjwt.decode(token, SECRET, algorithms=[ALGORITHM])
    assert claims["sub"] == str(USER_ID)


# ---------------------------------------------------------------------------
# Rejections
# ---------------------------------------------------------------------------


def test_expired_token_is_rejected():
    token = issue_token(
        user_id=USER_ID, email="carlos@example.com", expires_in_minutes=-1
    )
    with pytest.raises(AuthTokenError, match="expired"):
        decode_token(token)


def test_tampered_payload_is_rejected():
    token = issue_token(user_id=USER_ID, email="carlos@example.com")
    header, payload, signature = token.split(".")

    # Re-sign nothing: swap in a different payload but keep the old signature.
    forged_payload = pyjwt.encode(
        {"sub": str(uuid.uuid4()), "email": "attacker@example.com", "exp": 9999999999},
        "some-other-secret-long-enough-for-hmac",
        algorithm=ALGORITHM,
    ).split(".")[1]

    with pytest.raises(AuthTokenError):
        decode_token(f"{header}.{forged_payload}.{signature}")


def test_token_signed_with_another_secret_is_rejected():
    token = pyjwt.encode(
        {"sub": str(USER_ID), "email": "carlos@example.com", "exp": 9999999999},
        "not-the-real-secret-long-enough-for-hmac",
        algorithm=ALGORITHM,
    )
    with pytest.raises(AuthTokenError):
        decode_token(token)


def test_unsigned_alg_none_token_is_rejected():
    # The classic forgery: claim alg=none and hope the verifier believes the
    # token's own header. decode_token pins the algorithm, so it doesn't.
    token = pyjwt.encode(
        {"sub": str(USER_ID), "email": "attacker@example.com", "exp": 9999999999},
        key="",
        algorithm="none",
    )
    with pytest.raises(AuthTokenError):
        decode_token(token)


def test_garbage_is_rejected():
    for bad in ["", "not-a-token", "a.b.c", "....."]:
        with pytest.raises(AuthTokenError):
            decode_token(bad)


def test_valid_signature_but_malformed_payload_is_rejected():
    # Correctly signed, but `sub` isn't a UUID — a signature check alone
    # isn't enough to trust the contents.
    token = pyjwt.encode(
        {"sub": "not-a-uuid", "email": "carlos@example.com", "exp": 9999999999},
        SECRET,
        algorithm=ALGORITHM,
    )
    with pytest.raises(AuthTokenError, match="malformed"):
        decode_token(token)


def test_missing_email_claim_is_rejected():
    token = pyjwt.encode(
        {"sub": str(USER_ID), "exp": 9999999999}, SECRET, algorithm=ALGORITHM
    )
    with pytest.raises(AuthTokenError, match="malformed"):
        decode_token(token)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


def test_missing_secret_raises(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        issue_token(user_id=USER_ID, email="carlos@example.com")


def test_expiry_minutes_defaults_to_a_week():
    assert expiry_minutes() == 60 * 24 * 7


def test_expiry_minutes_reads_the_env(monkeypatch):
    monkeypatch.setenv("JWT_EXPIRY_MINUTES", "30")
    assert expiry_minutes() == 30


def test_unparseable_expiry_falls_back_to_the_default(monkeypatch):
    monkeypatch.setenv("JWT_EXPIRY_MINUTES", "ten thousand")
    assert expiry_minutes() == 60 * 24 * 7


def test_secret_is_read_per_call_not_at_import(monkeypatch):
    # Matters because main.py imports this module at boot: freezing the
    # secret at import time would make it unchangeable afterwards.
    token = issue_token(user_id=USER_ID, email="carlos@example.com")
    monkeypatch.setenv("JWT_SECRET", "a-different-secret-long-enough-for-hmac")
    with pytest.raises(AuthTokenError):
        decode_token(token)
