#!/usr/bin/env bash
#
# Live-tail a promptworks container's logs.
#
#   ./deploy/logs.sh            caddy (default)
#   ./deploy/logs.sh api
#   ./deploy/logs.sh postgres
#   ./deploy/logs.sh cloudflared
#
# Ctrl-C just detaches from the stream — the container keeps running.

set -euo pipefail

SERVICE="${1:-caddy}"
CONTAINER="promptworks-${SERVICE}"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
	echo "No container named $CONTAINER. Running containers:" >&2
	docker ps --format '  {{.Names}}' >&2
	exit 1
fi

exec docker logs -f --tail 50 "$CONTAINER"
