#!/usr/bin/env bash
#
# Ship a new version of the Promptworks frontend.
#
#   ./deploy/deploy.sh
#
# Caddy serves ../frontend/dist through a bind mount, so a fresh build is live
# the moment it lands on disk. No container restart, no downtime.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

step "Checking for local changes"
if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "Working tree is dirty. Commit or stash before deploying." >&2
	git status --short >&2
	exit 1
fi

step "Pulling latest"
git pull --ff-only

step "Installing dependencies"
cd frontend
npm ci

step "Building"
npm run build

step "Verifying build output"
test -f dist/index.html || { echo "dist/index.html missing — build failed" >&2; exit 1; }

step "Checking the site answers"
if curl -fsS -o /dev/null http://127.0.0.1:8080/; then
	echo "Local check OK."
else
	echo "WARNING: http://127.0.0.1:8080/ did not respond. Is the stack up?" >&2
	echo "  cd deploy && docker compose ps" >&2
fi

step "Deployed"
echo "Commit: $(git -C "$REPO_ROOT" rev-parse --short HEAD)"
echo "Built:  $(date -Is)"
