#!/usr/bin/env bash
#
# Promptworks status indicator.
#
#   ./deploy/status.sh
#
# Set PROMPTWORKS_DOMAIN in your environment (or edit the default below) so the
# public check knows what to hit.

DOMAIN="${PROMPTWORKS_DOMAIN:-yourdomain.com}"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

G='\033[0;32m'; R='\033[0;31m'; D='\033[0;90m'; N='\033[0m'
ok()   { printf "  ${G}●${N} %s ${D}%s${N}\n" "$1" "${2:-}"; }
bad()  { printf "  ${R}●${N} %s ${D}%s${N}\n" "$1" "${2:-}"; }

printf "\n  ${D}promptworks${N}\n\n"

# --- containers -------------------------------------------------------------
for c in promptworks-caddy promptworks-cloudflared promptworks-api promptworks-postgres; do
  running=$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)
  if [ "$running" = "true" ]; then
    since=$(docker inspect -f '{{.State.StartedAt}}' "$c" 2>/dev/null | cut -c1-16 | tr 'T' ' ')
    restarts=$(docker inspect -f '{{.RestartCount}}' "$c" 2>/dev/null)
    note="since $since"
    [ "${restarts:-0}" -gt 0 ] && note="$note · ${restarts} restarts"
    ok "${c#promptworks-}" "$note"
  else
    bad "${c#promptworks-}" "not running"
  fi
done

# --- local http -------------------------------------------------------------
if curl -fsS -o /dev/null --max-time 3 http://127.0.0.1:8080/ 2>/dev/null; then
  ok "caddy serving" "127.0.0.1:8080"
else
  bad "caddy serving" "no response on :8080"
fi

# --- spa fallback -----------------------------------------------------------
if curl -fsS --max-time 3 http://127.0.0.1:8080/pricing 2>/dev/null | grep -qi '<!doctype html'; then
  ok "spa fallback" "deep links resolve"
else
  bad "spa fallback" "/pricing is not returning index.html"
fi

# --- api --------------------------------------------------------------------
# Checked through Caddy rather than directly, so this exercises the /api/*
# route too — the API being up but unroutable looks identical to users.
if curl -fsS --max-time 3 http://127.0.0.1:8080/api/health 2>/dev/null | grep -q '"ok"'; then
  ok "api" "/api/health through caddy"
else
  bad "api" "/api/health not responding"
fi

# --- database ---------------------------------------------------------------
if docker exec promptworks-postgres pg_isready -U promptworks -d promptworks >/dev/null 2>&1; then
  psql_q() { docker exec promptworks-postgres psql -U promptworks -d promptworks -tAc "$1" 2>/dev/null | tr -d '[:space:]'; }

  rev=$(psql_q "select version_num from alembic_version")
  if [ -n "$rev" ]; then
    ok "migrations" "at $rev"
  else
    bad "migrations" "alembic_version empty — run: alembic upgrade head"
  fi

  scenarios=$(psql_q "select count(*) from scenarios")
  attempts=$(psql_q "select count(*) from attempts")
  users=$(psql_q "select count(*) from users")
  if [ "${scenarios:-0}" -gt 0 ] 2>/dev/null; then
    ok "content" "${scenarios} scenarios seeded"
  else
    bad "content" "no scenarios — run: python scripts/seed_scenarios.py"
  fi
  ok "data" "${attempts:-0} attempts · ${users:-0} users"
else
  bad "database" "postgres not accepting connections"
fi

# --- public -----------------------------------------------------------------
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://${DOMAIN}" 2>/dev/null)
if [ "$code" = "200" ]; then
  ok "public site" "https://${DOMAIN}"
else
  bad "public site" "https://${DOMAIN} returned ${code:-no response}"
fi

# --- build ------------------------------------------------------------------
DIST="$DEPLOY_DIR/../frontend/dist/index.html"
if [ -f "$DIST" ]; then
  built=$(date -r "$DIST" '+%Y-%m-%d %H:%M')
  commit=$(git -C "$DEPLOY_DIR/.." rev-parse --short HEAD 2>/dev/null)
  ok "build" "$built · ${commit:-unknown}"
else
  bad "build" "frontend/dist/index.html missing"
fi

# --- sleep guard ------------------------------------------------------------
if systemctl is-enabled sleep.target 2>/dev/null | grep -q masked; then
  ok "suspend" "masked"
else
  bad "suspend" "NOT masked — this box can sleep and take the site down"
fi

printf "\n"
