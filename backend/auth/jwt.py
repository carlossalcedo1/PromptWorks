"""
Issue and verify the session JWT.

Stateless by design: there is no `sessions` table. The token carries the user
id, email and org id, is signed with JWT_SECRET, and expires on its own — so
there is nothing to store server-side and nothing to clean up.

The trade-off, worth being explicit about: a stateless token cannot be
revoked before it expires. JWT_EXPIRY_MINUTES is the blast radius of a leaked
token, which is why the default is a week rather than a year. If revocation
is ever needed, that's when a refresh flow (or a token version column on
`users`) gets added.

Note on the module name: this file is `backend.auth.jwt` and it imports the
`jwt` package (PyJWT). Python 3's absolute imports mean `import jwt` here
resolves to PyJWT, not to this module.
"""

from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

ALGORITHM = "HS256"
DEFAULT_EXPIRY_MINUTES = 60 * 24 * 7  # 7 days


class AuthTokenError(Exception):
    """The token is missing, malformed, expired, or wrongly signed."""


@dataclass(frozen=True)
class TokenPayload:
    user_id: uuid.UUID
    email: str
    org_id: uuid.UUID | None
    expires_at: datetime


def get_secret() -> str:
    """Read JWT_SECRET at call time, not import time.

    Import-time reads would make an unset secret a crash on `import main`,
    and would freeze the value before a test could point it somewhere else.
    """
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not set. Generate a long random value and put it in "
            "your .env — tokens signed with a guessable secret are forgeable."
        )
    return secret


def expiry_minutes() -> int:
    raw = os.environ.get("JWT_EXPIRY_MINUTES")
    if not raw:
        return DEFAULT_EXPIRY_MINUTES
    try:
        return int(raw)
    except ValueError:
        return DEFAULT_EXPIRY_MINUTES


def issue_token(
    user_id: uuid.UUID,
    email: str,
    org_id: uuid.UUID | None = None,
    expires_in_minutes: int | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    minutes = expiry_minutes() if expires_in_minutes is None else expires_in_minutes

    payload = {
        "sub": str(user_id),
        "email": email,
        "org_id": str(org_id) if org_id else None,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }

    return jwt.encode(payload, get_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> TokenPayload:
    """Verify and decode a bearer token.

    Raises AuthTokenError for every failure mode — expired, tampered, signed
    with the wrong secret, or structurally wrong — so callers have one thing
    to catch and can't accidentally treat one of them as success.
    """
    if not token:
        raise AuthTokenError("No token supplied.")

    try:
        # `algorithms` is pinned on purpose: accepting whatever the token's
        # own header claims is the classic JWT forgery hole.
        claims = jwt.decode(token, get_secret(), algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise AuthTokenError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthTokenError("Token is invalid.") from exc

    try:
        user_id = uuid.UUID(claims["sub"])
        email = claims["email"]
        raw_org = claims.get("org_id")
        org_id = uuid.UUID(raw_org) if raw_org else None
        expires_at = datetime.fromtimestamp(claims["exp"], tz=timezone.utc)
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthTokenError("Token payload is malformed.") from exc

    return TokenPayload(
        user_id=user_id, email=email, org_id=org_id, expires_at=expires_at
    )
