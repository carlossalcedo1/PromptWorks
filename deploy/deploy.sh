#!/usr/bin/env bash
#
# Ship a new version of Promptworks.
#
#   ./deploy/deploy.sh                  frontend + backend
#   ./deploy/deploy.sh --backend-only   skip the npm build
#   ./deploy/deploy.sh --frontend-only  skip the API, migrations and seed
#
# Caddy serves ../frontend/dist through a bind mount, so a fresh frontend
# build is live the moment it lands on disk. The API is a container, so it
# gets rebuilt and restarted.
#
# Migrations run as an explicit step here rather than on API startup. That is
# deliberate: a schema change should happen once, visibly, at a moment you
# chose — not on every container restart, and not concurrently from however
# many replicas happen to boot at the same time.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
cd "$REPO_ROOT"

DO_FRONTEND=1
DO_BACKEND=1

for arg in "$@"; do
	case "$arg" in
		--backend-only)  DO_FRONTEND=0 ;;
		--frontend-only) DO_BACKEND=0 ;;
		-h|--help)       sed -n '2,18p' "${BASH_SOURCE[0]}"; exit 0 ;;
		*) echo "Unknown option: $arg" >&2; exit 2 ;;
	esac
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33mWARNING: %s\033[0m\n' "$1" >&2; }

# All compose commands run from deploy/, so that .env and the relative build
# context resolve the way the compose file expects.
compose() { (cd "$DEPLOY_DIR" && docker compose "$@"); }

step "Checking for local changes"
if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "Working tree is dirty. Commit or stash before deploying." >&2
	git status --short >&2
	exit 1
fi

step "Pulling latest"
git pull --ff-only

# ---------------------------------------------------------------------------
# Config check — before anything is built, so a missing secret fails in two
# seconds rather than after a four-minute npm build.
# ---------------------------------------------------------------------------

if [ "$DO_BACKEND" = "1" ]; then
	step "Checking configuration"

	if [ ! -f "$DEPLOY_DIR/.env" ]; then
		echo "deploy/.env is missing. Copy deploy/.env.example and fill it in." >&2
		exit 1
	fi

	missing=()
	for var in POSTGRES_PASSWORD DATABASE_URL JWT_SECRET ANTHROPIC_API_KEY; do
		if ! grep -qE "^${var}=.+" "$DEPLOY_DIR/.env"; then
			missing+=("$var")
		fi
	done
	if [ ${#missing[@]} -gt 0 ]; then
		echo "deploy/.env is missing values for: ${missing[*]}" >&2
		exit 1
	fi

	# The password appears twice — once for the container, once inside the
	# connection string — and they have to agree or the API cannot connect
	# to the database it just started.
	pg_pass=$(grep -E '^POSTGRES_PASSWORD=' "$DEPLOY_DIR/.env" | head -1 | cut -d= -f2-)
	if ! grep -qE "^DATABASE_URL=.*:${pg_pass}@" "$DEPLOY_DIR/.env"; then
		warn "POSTGRES_PASSWORD does not appear inside DATABASE_URL — check they match."
	fi

	for var in RESEND_API_KEY RESEND_FROM_EMAIL; do
		grep -qE "^${var}=.+" "$DEPLOY_DIR/.env" || \
			warn "$var is empty — /auth/request-code will fail until it is set."
	done

	echo "Configuration looks complete."
fi

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------

if [ "$DO_FRONTEND" = "1" ]; then
	step "Installing frontend dependencies"
	(cd frontend && npm ci)

	step "Building frontend"
	(cd frontend && npm run build)

	step "Verifying build output"
	test -f frontend/dist/index.html || {
		echo "dist/index.html missing — build failed" >&2; exit 1; }
fi

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------

if [ "$DO_BACKEND" = "1" ]; then
	step "Building API image"
	compose build api

	step "Starting database"
	compose up -d postgres

	# `compose up -d` returns as soon as the container is started, which is
	# well before Postgres is accepting queries. Wait for the healthcheck.
	printf 'Waiting for postgres to be ready'
	for _ in $(seq 1 30); do
		if compose exec -T postgres pg_isready -U promptworks -d promptworks >/dev/null 2>&1; then
			printf ' ready\n'
			break
		fi
		printf '.'
		sleep 2
	done
	if ! compose exec -T postgres pg_isready -U promptworks -d promptworks >/dev/null 2>&1; then
		printf '\n'
		echo "Postgres did not become ready. Check: cd deploy && docker compose logs postgres" >&2
		exit 1
	fi

	step "Running migrations"
	# A one-off container rather than the running API, so migrations are not
	# racing a live process. --rm leaves nothing behind.
	compose run --rm --no-deps api alembic upgrade head

	step "Seeding scenarios"
	# Upserts by slug, so this is safe to run on every deploy.
	compose run --rm --no-deps api python scripts/seed_scenarios.py

	step "Restarting API"
	compose up -d api
fi

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

step "Checking the site answers"
if curl -fsS -o /dev/null --max-time 5 http://127.0.0.1:8080/; then
	echo "Frontend OK."
else
	warn "http://127.0.0.1:8080/ did not respond. Is the stack up?"
	echo "  cd deploy && docker compose ps" >&2
fi

if [ "$DO_BACKEND" = "1" ]; then
	printf 'Waiting for the API'
	api_ok=0
	for _ in $(seq 1 20); do
		if curl -fsS -o /dev/null --max-time 3 http://127.0.0.1:8080/api/health 2>/dev/null; then
			api_ok=1
			printf ' ready\n'
			break
		fi
		printf '.'
		sleep 2
	done

	if [ "$api_ok" = "1" ]; then
		echo "API OK: /api/health responded."
	else
		printf '\n'
		warn "/api/health did not respond."
		echo "  cd deploy && docker compose logs --tail=50 api" >&2
		exit 1
	fi
fi

step "Deployed"
echo "Commit: $(git -C "$REPO_ROOT" rev-parse --short HEAD)"
echo "Built:  $(date -Is)"
