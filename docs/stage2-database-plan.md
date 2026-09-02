# Promptworks Stage 2 — data layer implementation plan

Handoff doc for building the Postgres data layer and passwordless auth on top of the existing FastAPI app (`backend/main.py`, `backend/llm_grader.py`, `backend/spend_tracker.py`). Written to be followed top to bottom without needing to re-derive decisions already made in the design conversation — those are recapped below, then the rest is build detail.

## Decisions already locked in

- **Postgres only.** No Mongo. Flexible/nested fields (constraints, examples, rubric weights) live in JSONB columns on otherwise normal relational tables.
- **Scenarios authored as JSON files in the repo**, loaded into the `scenarios` table by a seed script. The files are the reviewable source; the table is what the app actually queries.
- **No passwords.** Auth is email + a 6-digit code, like Claude's own sign-in. No `password_hash` anywhere.
- **UUID primary keys**, generated in Python (`uuid.uuid4()`), not a Postgres extension — one less thing to install on the NUC.
- Every table gets `created_at`; tables that get edited after creation also get `updated_at`.

## New dependencies

Add to `requirements.txt`:

```
sqlalchemy>=2.0
alembic>=1.13
psycopg[binary]>=3.1
pyjwt>=2.9.0
resend>=0.8.0
```

SQLAlchemy + Alembic is the standard FastAPI/Postgres pairing — typed models, versioned migrations, nothing exotic. `psycopg` (v3) is the driver. `pyjwt` issues/verifies the session token. `resend` is the official SDK for the email provider already named in the Stage 2 tech stack, now used for login codes too instead of a new service.

## New environment variables

Add to `deploy/.env.example` (and your real `.env`):

```
DATABASE_URL=postgresql+psycopg://promptworks:changeme@postgres:5432/promptworks
JWT_SECRET=generate-a-long-random-value
JWT_EXPIRY_MINUTES=10080
LOGIN_CODE_EXPIRY_MINUTES=10
LOGIN_CODE_RATE_LIMIT=3/minute
RESEND_API_KEY=
RESEND_FROM_EMAIL=login@yourdomain.com
```

`DATABASE_URL` points at `postgres` (the compose service hostname) in production and `localhost` in local dev. `JWT_EXPIRY_MINUTES` defaults to 7 days — fine for a JWT with no refresh flow yet.

## Docker Compose

Add a `postgres` service to `deploy/docker-compose.yml`, following the exact pattern the file already uses for isolation — no published port, internal network only, matching the reasoning already written for the (now-dropped) `mongo` service:

```yaml
  postgres:
    image: postgres:16-alpine
    container_name: promptworks-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=promptworks
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?set in .env}
      - POSTGRES_DB=promptworks
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - web
```

Add `pgdata:` under `volumes:`. Do not publish a port — a database with a port open to the LAN is exactly the mistake the hosting plan already called out for Mongo.

The `api` service (FastAPI itself) is a separate, already-flagged gap in the compose file — out of scope for this plan, which is about the data layer. Local development against this Postgres container works fine by running `uvicorn` directly against `DATABASE_URL=postgresql+psycopg://promptworks:...@localhost:5432/promptworks` while the `postgres` container runs.

## Directory layout after this work

```
backend/
  main.py                 # updated: DB-backed scenarios, auth-protected routes, real attempt writes
  llm_grader.py            # unchanged
  spend_tracker.py         # unchanged for now (see "Retiring spend_tracker" below)
  db/
    __init__.py
    base.py                # engine + session factory, reads DATABASE_URL
    models.py               # every SQLAlchemy model
  auth/
    __init__.py
    codes.py                # generate/hash/verify login codes, send via Resend
    jwt.py                   # issue/verify JWT
    dependencies.py          # get_current_user / get_current_user_optional
alembic/
  env.py
  versions/
alembic.ini
scripts/
  seed_scenarios.py         # loads data/scenarios/*.json into the DB
data/
  tracks.json               # the small, stable list of tracks
  scenarios/
    denied-claim-email.json # one file per scenario — clean PR diffs when editing one
    ...
```

One file per scenario, not one big array, so editing a single scenario's rubric weight is a one-line diff in review rather than a diff against a 3,000-line array.

## Schema

All tables live in `backend/db/models.py` as SQLAlchemy 2.0 declarative models. Field lists below; exact typing follows SQLAlchemy conventions (`Mapped[...]`, `mapped_column(...)`).

### `orgs`
- `id` (UUID, PK)
- `name` (str, not null)
- `plan` (str — `"free" | "pro" | "teams" | "enterprise"`)
- `seats` (int, nullable)
- `sso_config` (JSONB, nullable) — reserved for Stage 3, unused for now
- `settings` (JSONB, default `{}`)
- `created_at`, `updated_at`

### `users`
- `id` (UUID, PK)
- `email` (str, unique, not null) — the login identifier
- `first_name`, `last_name` (str)
- `org_id` (FK → `orgs.id`, **nullable** — free-tier individuals aren't in an org)
- `primary_track_id` (FK → `tracks.id`, nullable) — the track chosen during onboarding
- `level` (int, default 0) — cached/derived, not hand-edited; recomputed from `attempts` (exact leveling formula is an open decision, not blocking schema work)
- `streak_count` (int, default 0)
- `last_active_date` (date, nullable) — required alongside `streak_count` to know whether a new day should increment or reset it
- `created_at`, `updated_at`

No `password_hash`. No separate `scenarios_done` or `scenarios_created` field — both are queries, not columns (see below).

### `tracks`
- `id` (UUID, PK)
- `slug` (str, unique)
- `title`, `description` (str)
- `level` (str — beginner/intermediate/advanced)
- `created_at`, `updated_at`

### `scenarios`
- `id` (UUID, PK)
- `slug` (str, unique)
- `title` (str)
- `track_id` (FK → `tracks.id`)
- `difficulty` (str)
- `brief` (text) — the task
- `context` (text) — background info the prompt should draw on
- `constraints` (JSONB, list of str)
- `output_format` (text)
- `role_and_audience` (text)
- `examples` (JSONB, list of str) — few-shot examples
- `reference_prompt` (text)
- `rubric_weights` (JSONB, dict of the six dimension keys → float, default equal weight)
- `calibration_examples` (JSONB, list of `{prompt, scores}`)
- `created_by` (FK → `users.id`, nullable) — null for curated content shipped via the seed script; set when an Enterprise org authors their own scenario later
- `created_at`, `updated_at`

This is the table `llm_grader.py`'s `Scenario` dataclass already models field-for-field — the DB row and the dataclass should stay in lockstep; `main.py` will construct a `Scenario` from the DB row rather than the current hardcoded dict.

### `attempts`
The central fact table — the score screen, the learner dashboard, the team heat map, and cost tracking all read from this, nothing else stores its own copy.

- `id` (UUID, PK)
- `user_id` (FK → `users.id`, **nullable** — see "Anonymous attempts" below)
- `scenario_id` (FK → `scenarios.id`)
- `org_id` (FK → `orgs.id`, nullable) — denormalized from `user.org_id` on write, so org-scoped dashboard queries skip a join
- `prompt_text` (text)
- `model` (str)
- `model_output` (text, nullable) — see note below; not populated until the "does grading also run the prompt" question is resolved
- six score columns: `task_clarity_score`, `context_supplied_score`, `constraints_score`, `output_format_score`, `role_and_audience_score`, `examples_score` (smallint, 0–5) — real columns, not a JSON blob, because the heat map and `org_analytics_daily` need `PERCENTILE_CONT`/`GROUP BY` per dimension, which is cheap against columns and awkward against JSON
- matching six feedback columns (text)
- `total` (smallint, 0–30) — always recomputed server-side from the six scores at write time, never trusted from the model or the client (matches what `llm_grader.py` already does)
- `rubric_weights_snapshot` (JSONB) — a copy of the scenario's `rubric_weights` at grading time, so a later change to a scenario's weighting doesn't retroactively reinterpret old scores
- `tokens_input`, `tokens_output` (int)
- `cost_usd` (numeric(10,6))
- `created_at`

**Anonymous attempts:** the homepage's "Try one now" widget runs with no signup, per the design brief. `user_id` and `org_id` are nullable specifically so that path can still insert a row (useful for seeing conversion funnel data later) without requiring auth. `main.py`'s `create_attempt` should accept an optional bearer token: present and valid → `user_id` set, absent → `user_id` null, grading happens identically either way.

**`model_output` gap, flagged not solved here:** the design brief's flow is "run the prompt, then grade the output," and the score screen has a "Your output" tab — but `llm_grader.py` currently only grades the submitted prompt text, never executes it. Leaving `model_output` nullable lets the schema support either answer without a migration; deciding whether to add a second Claude call (roughly doubling cost per attempt, which `spend_tracker`'s budget cap needs to account for) is a product decision to make separately, not a blocker for this data-layer work.

### `workflows`
- `id` (UUID, PK)
- `org_id` (FK → `orgs.id`, nullable — individuals can save personal workflows too)
- `author_id` (FK → `users.id`)
- `title` (str)
- `prompt_template` (text)
- `variables` (JSONB, list of str)
- `source_attempt_id` (FK → `attempts.id`, nullable)
- `usage_count` (int, default 0)
- `visibility` (str — `"private" | "org" | "public"`)
- `created_at`, `updated_at`

### `assignments` (schema now, build later)
Included so the migration exists, but wiring this up is a Stage 3 team-dashboard concern, not needed for the core practice loop.

- `id` (UUID, PK)
- `org_id` (FK → `orgs.id`)
- `track_id` (FK → `tracks.id`)
- `due_date` (date)
- `status` (str)
- `created_at`

- `assignment_completions` — join table: `assignment_id`, `user_id`, `status`. A join table instead of an array of assignee IDs, so per-person completion is trackable, which an array field can't do cleanly.

### `login_codes`
Backs the passwordless flow.

- `id` (UUID, PK)
- `email` (str, not null)
- `code_hash` (str, not null) — SHA-256 of the 6-digit code; never store the plaintext code
- `expires_at` (timestamptz)
- `consumed_at` (timestamptz, nullable)
- `attempt_count` (int, default 0) — capped at 5 wrong guesses before the code is dead
- `created_at`

No `sessions` table — the JWT is stateless with an expiry, so there's nothing to store server-side after issuance.

## Alembic setup

`alembic init alembic`, point `env.py` at `backend.db.models.Base.metadata` and `DATABASE_URL` from the environment, then `alembic revision --autogenerate -m "initial schema"` for the first migration covering every table above. All later schema changes go through new Alembic revisions, not hand-edited tables — that's the entire point of adding it now while the schema is still small.

## Scenario seed script

`scripts/seed_scenarios.py`: reads `data/tracks.json` and every file in `data/scenarios/`, upserts each into its table by `slug` (insert if new, update if the slug already exists — so re-running the script after editing a JSON file is safe and idempotent). Run manually for now (`python scripts/seed_scenarios.py`); wiring it into deploy automation is a later step once the deploy flow itself is revisited.

Port the existing Stage 1 content two ways: the 10 scenarios currently in `frontend/src/data/scenarios.js` become the first 10 files in `data/scenarios/`, and the one scenario already hand-written into `backend/main.py`'s `SCENARIOS` dict (`denied-claim-email`) is the reference shape for the rest.

## Passwordless auth

**`POST /auth/request-code`** — body `{"email": str}`. Generates a 6-digit code, hashes it, stores a `login_codes` row with a 10-minute expiry, invalidates any still-live code for that email, and sends it via Resend. Rate-limited with the same `slowapi` pattern already used on `/attempts` (`LOGIN_CODE_RATE_LIMIT`, both per-IP and per-email) — this endpoint sends real email to an address the caller doesn't have to prove they own yet, so it's exactly the kind of endpoint that gets abused without a limit.

**`POST /auth/verify-code`** — body `{"email": str, "code": str}`. Looks up the newest unconsumed code for that email, checks it's not expired, hashes the submitted code and compares, increments `attempt_count` on mismatch and rejects once it hits 5. On success: marks the code consumed, creates a `users` row if the email is new (this is signup, not just login), and returns a JWT (`sub` = user id, plus email and org_id, `JWT_EXPIRY_MINUTES` expiry, HS256 signed with `JWT_SECRET`).

**`backend/auth/dependencies.py`** — `get_current_user` (required) and `get_current_user_optional` (returns `None` instead of 401 if no/invalid token) as FastAPI dependencies, decoding the bearer token and loading the user row. `create_attempt` uses the optional variant (anonymous attempts allowed); anything that writes a `workflows` row, or any future org-admin route, uses the required variant.

Frontend contract, for whoever wires up the UI later: the JWT comes back in the response body, not a cookie — the frontend holds it and sends `Authorization: Bearer <token>` on subsequent requests. Simplest option given this is a single first-party frontend, not a scenario needing cross-site cookie handling.

## Wiring into `main.py`

- Replace the hardcoded `SCENARIOS` dict and `get_scenario()` with a DB query (`SELECT ... FROM scenarios WHERE slug = ...` via SQLAlchemy), constructing a `llm_grader.Scenario` from the row.
- `create_attempt`: after `grade_prompt()` succeeds, insert an `attempts` row (see anonymous-attempt handling above) instead of only calling `spend_tracker.record_usage()`. Both can run for now — see next section.
- Add the two `/auth` routes and mount the auth dependencies where needed.
- CORS origin restriction (already flagged as a pre-existing TODO in the file) and `/admin/spend` auth are unrelated to this plan but worth doing in the same pass since you'll already be touching this file.

## Retiring `spend_tracker`'s JSONL log

Not required for this plan, but worth doing once `attempts.cost_usd` exists: `spend_tracker.py`'s own docstring already says the file-based log is a stopgap "until Stage 2's MongoDB is wired up... this can be replaced by writing the same records into a collection instead of a file." Once `attempts` exists, `get_total_spend()` and `check_budget()` can query `SUM(cost_usd) FROM attempts WHERE ...` directly and the JSONL file and its write lock go away. Safe to leave as a follow-up rather than bundling into this change.

## Tests to add

Follow the existing style — fully mocked unit tests, no real network calls, plus one deliberately-real integration path:

- `tests/test_auth_codes.py` — pure functions: code generation, hashing, verification, expiry, and the 5-attempt lockout, without touching the DB.
- `tests/test_jwt.py` — issue/decode round trip, expiry rejection, tampered-signature rejection.
- `tests/test_db_models.py` — run against the real `postgres` container (docker compose already provides it), wrapped in a transaction per test that rolls back on teardown, matching the standard SQLAlchemy testing pattern. Covers the `attempts` FK constraints actually being enforced, the `scenarios` JSONB round-trip, and the seed script's upsert-by-slug idempotency.
- Update `tests/test_llm_grader.py`'s fixtures if `Scenario` construction changes shape (it shouldn't — the dataclass itself is untouched, only how `main.py` builds one).

## Build order

1. Add dependencies, env vars, and the `postgres` compose service. Confirm `docker compose up postgres` runs and is reachable from `localhost`.
2. Write `backend/db/base.py` and `backend/db/models.py` for every table above. Run `alembic init` and the first autogenerated migration. Verify: `alembic upgrade head` creates every table with no errors.
3. Write `data/tracks.json`, port the 10 existing scenarios into `data/scenarios/*.json`, write and run `scripts/seed_scenarios.py`. Verify: querying `scenarios` returns 10 rows with correct JSONB fields.
4. Build `backend/auth/` (codes, jwt, dependencies) and the two `/auth` routes. Verify: `test_auth_codes.py` and `test_jwt.py` pass; a manual `curl` round trip (request-code → check email → verify-code) returns a valid JWT.
5. Wire `main.py` to the DB for scenarios and attempts, add the optional-auth handling for anonymous attempts. Verify: existing `test_llm_grader.py` still passes unchanged; a new attempt via `POST /attempts` produces a row in `attempts` with the right FKs.
6. Full test suite green, including the new DB tests. This is the point at which Stage 2's "make it real" line item for the database is actually done.

## Open decisions, not blockers

- Whether grading also executes the prompt (populating `model_output`) — affects cost and the score screen's "Your output" tab.
- The `level` field's leveling formula.
- `workflows.visibility` default for a brand-new save.
- Whether `assignments` gets built now or deferred fully to Stage 3 — schema exists either way.
