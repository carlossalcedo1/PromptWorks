"""
FastAPI dependencies for the bearer-token auth.

Two variants, and which one a route picks is a product decision, not a style
one:

  * `get_current_user` — 401s without a valid token. Anything that writes a
    row owned by a person (workflows, and every future org-admin route).
  * `get_current_user_optional` — returns None instead of 401. Used by
    `POST /attempts`, because the homepage's "Try one now" widget grades
    without a signup and still needs to work.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.auth.jwt import AuthTokenError, decode_token
from backend.db.base import get_db
from backend.db.models import User

# auto_error=False so a missing Authorization header reaches our code as None
# rather than FastAPI raising a 403 before the optional variant can allow it.
_bearer = HTTPBearer(auto_error=False)


def _user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None, session: Session
) -> User | None:
    if credentials is None or not credentials.credentials:
        return None

    try:
        payload = decode_token(credentials.credentials)
    except AuthTokenError:
        return None

    # The token is signed, but the user behind it may have been deleted since
    # it was issued — so the row is looked up rather than trusted from claims.
    return session.get(User, payload.user_id)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: Session = Depends(get_db),
) -> User | None:
    return _user_from_credentials(credentials, session)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: Session = Depends(get_db),
) -> User:
    user = _user_from_credentials(credentials, session)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
