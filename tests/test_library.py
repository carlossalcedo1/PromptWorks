"""
Tests for the public prompt library routes (backend/main.py's /library/*).

All of these need a database -- creating/listing/upvoting real rows -- so
they all use db_client/db_session and skip without a reachable test
Postgres, same as the rest of test_api.py.

Run with: pytest tests/test_library.py -v
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from backend import main
from backend.auth.jwt import issue_token
from backend.db.base import get_db
from backend.db.models import User, Workflow


@pytest.fixture
def client():
    """A client with no database behind it — for routes that shouldn't
    need one (categories is a static constant)."""

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
    main.app.dependency_overrides[get_db] = lambda: db_session
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture
def user_and_token(db_session):
    user = User(email=f"poster-{uuid.uuid4().hex[:8]}@example.com", first_name="Alex")
    db_session.add(user)
    db_session.flush()
    token = issue_token(user_id=user.id, email=user.email)
    return user, token


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def post_a_prompt(db_client, token, **overrides):
    body = {
        "title": "A test prompt",
        "prompt_template": "You are a helpful assistant. Do the thing.",
        "category": "Writing",
        **overrides,
    }
    response = db_client.post("/library/prompts", json=body, headers=auth_headers(token))
    assert response.status_code == 200, response.text
    return response.json()


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


def test_categories_returns_the_fixed_list(client):
    response = client.get("/library/categories")
    assert response.status_code == 200
    assert response.json() == main.LIBRARY_CATEGORIES


# ---------------------------------------------------------------------------
# Posting -- requires auth
# ---------------------------------------------------------------------------


def test_posting_without_a_token_is_rejected(db_client, db_session):
    response = db_client.post(
        "/library/prompts",
        json={"title": "x", "prompt_template": "y", "category": "Writing"},
    )
    assert response.status_code == 401


def test_posting_with_an_unknown_category_is_rejected(db_client, user_and_token):
    _, token = user_and_token
    response = db_client.post(
        "/library/prompts",
        json={"title": "x", "prompt_template": "y", "category": "Not A Real Category"},
        headers=auth_headers(token),
    )
    assert response.status_code == 422


def test_posting_succeeds_and_returns_the_prompt(db_client, user_and_token):
    _, token = user_and_token
    result = post_a_prompt(db_client, token, title="My great prompt")
    assert result["title"] == "My great prompt"
    assert result["category"] == "Writing"
    assert result["usage_count"] == 0
    assert result["upvote_count"] == 0
    assert result["has_voted"] is False


def test_posted_prompt_shows_author_display_name_not_email(db_client, user_and_token):
    user, token = user_and_token
    result = post_a_prompt(db_client, token)
    assert result["author_name"] == "Alex"  # first_name, not the raw email
    assert user.email not in result["author_name"]


def test_author_without_a_first_name_falls_back_to_email_prefix(db_client, db_session):
    user = User(email=f"noname-{uuid.uuid4().hex[:8]}@example.com")  # no first_name set
    db_session.add(user)
    db_session.flush()
    token = issue_token(user_id=user.id, email=user.email)

    main.app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(main.app)
    try:
        result = post_a_prompt(client, token)
    finally:
        main.app.dependency_overrides.clear()

    assert result["author_name"] == user.email.split("@")[0]


# ---------------------------------------------------------------------------
# Listing -- fully open, no auth required
# ---------------------------------------------------------------------------


def test_listing_requires_no_auth(db_client, user_and_token):
    _, token = user_and_token
    post_a_prompt(db_client, token, title="Findable prompt")

    response = db_client.get("/library/prompts")  # no Authorization header at all
    assert response.status_code == 200
    titles = [p["title"] for p in response.json()["prompts"]]
    assert "Findable prompt" in titles


def test_category_filter_only_returns_matching_prompts(db_client, user_and_token):
    _, token = user_and_token
    post_a_prompt(db_client, token, title="A writing prompt", category="Writing")
    post_a_prompt(db_client, token, title="A code prompt", category="Code")

    response = db_client.get("/library/prompts", params={"category": "Code"})
    titles = [p["title"] for p in response.json()["prompts"]]
    assert "A code prompt" in titles
    assert "A writing prompt" not in titles


def test_search_matches_title_and_body(db_client, user_and_token):
    _, token = user_and_token
    post_a_prompt(
        db_client, token,
        title="Completely unrelated title",
        prompt_template="This one mentions unicorns specifically.",
    )
    post_a_prompt(db_client, token, title="Nothing special here", prompt_template="Plain text.")

    response = db_client.get("/library/prompts", params={"q": "unicorns"})
    titles = [p["title"] for p in response.json()["prompts"]]
    assert "Completely unrelated title" in titles
    assert "Nothing special here" not in titles


def test_private_workflows_never_appear_in_the_library(db_client, db_session, user_and_token):
    """A team-saved private workflow (visibility='private', the default)
    must never leak into the public library listing."""
    user, token = user_and_token
    private_row = Workflow(
        author_id=user.id,
        title="Should stay private",
        prompt_template="secret internal prompt",
        category="Writing",
        visibility="private",
    )
    db_session.add(private_row)
    db_session.flush()

    response = db_client.get("/library/prompts")
    titles = [p["title"] for p in response.json()["prompts"]]
    assert "Should stay private" not in titles


# ---------------------------------------------------------------------------
# Upvoting -- idempotent, requires auth
# ---------------------------------------------------------------------------


def test_upvote_requires_auth(db_client, user_and_token):
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    response = db_client.post(f"/library/prompts/{prompt['id']}/upvote")
    assert response.status_code == 401


def test_upvote_increments_the_count(db_client, user_and_token):
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    response = db_client.post(
        f"/library/prompts/{prompt['id']}/upvote", headers=auth_headers(token)
    )
    assert response.status_code == 200
    assert response.json()["upvote_count"] == 1


def test_upvoting_twice_from_the_same_user_does_not_double_count(db_client, user_and_token):
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    r1 = db_client.post(f"/library/prompts/{prompt['id']}/upvote", headers=auth_headers(token))
    r2 = db_client.post(f"/library/prompts/{prompt['id']}/upvote", headers=auth_headers(token))

    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["upvote_count"] == 1
    assert r2.json()["upvote_count"] == 1  # NOT 2 -- the second vote is a no-op


def test_has_voted_reflects_the_requesters_own_vote(db_client, user_and_token):
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    before = db_client.get("/library/prompts", headers=auth_headers(token)).json()["prompts"]
    assert next(p for p in before if p["id"] == prompt["id"])["has_voted"] is False

    db_client.post(f"/library/prompts/{prompt['id']}/upvote", headers=auth_headers(token))

    after = db_client.get("/library/prompts", headers=auth_headers(token)).json()["prompts"]
    assert next(p for p in after if p["id"] == prompt["id"])["has_voted"] is True


def test_upvoting_a_nonexistent_prompt_is_a_404(db_client, user_and_token):
    _, token = user_and_token
    fake_id = str(uuid.uuid4())
    response = db_client.post(f"/library/prompts/{fake_id}/upvote", headers=auth_headers(token))
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Usage tracking -- no auth required, not idempotent
# ---------------------------------------------------------------------------


def test_marking_used_increments_usage_count_with_no_auth(db_client, user_and_token):
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    response = db_client.post(f"/library/prompts/{prompt['id']}/use")
    assert response.status_code == 200
    assert response.json()["usage_count"] == 1


def test_marking_used_twice_counts_twice(db_client, user_and_token):
    """Unlike voting, repeated real usage should genuinely accumulate."""
    _, token = user_and_token
    prompt = post_a_prompt(db_client, token)

    db_client.post(f"/library/prompts/{prompt['id']}/use")
    response = db_client.post(f"/library/prompts/{prompt['id']}/use")
    assert response.json()["usage_count"] == 2


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------


def test_sort_top_orders_by_upvotes_then_usage(db_client, user_and_token):
    _, token = user_and_token
    post_a_prompt(db_client, token, title="Low engagement")
    high = post_a_prompt(db_client, token, title="High engagement")

    db_client.post(f"/library/prompts/{high['id']}/upvote", headers=auth_headers(token))

    response = db_client.get("/library/prompts", params={"sort": "top"})
    titles = [p["title"] for p in response.json()["prompts"]]
    assert titles.index("High engagement") < titles.index("Low engagement")
