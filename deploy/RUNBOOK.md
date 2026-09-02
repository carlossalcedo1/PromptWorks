# Promptworks — NUC hosting runbook (as-built)

**Status: live.** Ubuntu Desktop 22.04 on an Intel NUC, Wi-Fi only, behind CGNAT, no port forwarding, no router admin access, zero inbound ports open.

This document was rewritten after the build. The first draft assumed Ubuntu Server and included two steps that were unnecessary and one that caused an outage — all corrected below. If you are rebuilding this box, follow this version.

---

## What is actually running

```
npm run build → frontend/dist ─┐
                               ↓
                             Caddy (container, :80)
                               ├── /api/*  → api (FastAPI, :8000)
                               │                ↓
                               │              postgres (:5432, internal only)
                               └── everything else → static SPA
                               ↓ docker network "promptworks_web"
                             cloudflared (container, outbound only)
                               ↓ TLS, outbound 443
                             Cloudflare edge
                               ↓
                             yourdomain.com
```

Five containers, one compose file, one `.env`. Nothing listens on a public port — Caddy and uptime-kuma bind to `127.0.0.1`, and `api` and `postgres` publish nothing at all. `ufw` denies all incoming traffic and always should.

The API sits under `/api/*` on the **same hostname** as the frontend, so the browser never makes a cross-origin request and CORS is not in play for normal use.

| Piece | Where | Notes |
|---|---|---|
| Repo | `~/promptworks` | Cloned from GitHub; NUC pulls, nothing is copied to it |
| Static build | `frontend/dist` | Bind-mounted read-only into Caddy |
| API image | `deploy/Dockerfile.api` | Built from the repo root; rebuilt by `deploy.sh` |
| Database | `pgdata` volume | The only data here you cannot rebuild by redeploying |
| Spend log | `api_data` volume | `spend_tracker`'s JSONL; the budget cap reads it back |
| Stack | `deploy/docker-compose.yml` | `docker compose up -d` |
| Secrets | `deploy/.env` | Tunnel token, DB password, JWT secret, API keys. Gitignored. |
| Routing | Cloudflare Zero Trust | Tunnel `promptworks-nuc`, two published application routes |

---

## Operational answers

**Does it survive a reboot?** Yes. `restart: unless-stopped` on both containers plus `docker.service` enabled at boot. Nothing needs a login session — Docker Engine is a systemd service. **This only holds if the machine never sleeps** (see below).

**Does it survive moving to a different Wi-Fi network?** Yes, and this is the real payoff of a tunnel. cloudflared makes an *outbound* connection, so it works from any network that gives the NUC internet — a different house, a phone hotspot, a hotel. No config change, no DNS update, no router involvement. The only thing that breaks it is a captive portal, which blocks traffic until someone authenticates in a browser.

**Does it survive a router reboot?** Yes. cloudflared retries continuously and re-registers within roughly 10–60 seconds of the network returning. Expect a brief outage the length of the router's boot, not a manual fix.

**What it does NOT survive:** the NUC sleeping. Ubuntu Desktop suspends on idle by default, and a suspended server is a dead site. This is the single most likely cause of a mystery outage on this build.

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
systemctl status sleep.target      # should read "masked"
```

Also set Settings → Power → Automatic Suspend → Off, and Screen Blank to whatever you like (blanking the screen is fine; suspending is not).

---

## Build procedure (corrected)

### Phase 0 — Before you start

- Push the repo to GitHub, **including `deploy/`**. The NUC pulls from the remote; files are never copied to it.
- `frontend/dist` stays gitignored. The NUC builds its own.
- Have the Wi-Fi SSID and password to hand.
- Domain: not required until Phase 7. Phase 6 proves the whole chain for free first.

### Phase 1 — Install Ubuntu

Desktop or Server both work. **This box runs Desktop**, which changes three things versus the Server install:

- `openssh-server` is **not** installed by default — you must add it (Phase 3).
- Networking is NetworkManager, not netplan/systemd-networkd. Use `nmcli`, and the power-save fix is a NetworkManager drop-in, not a systemd unit.
- It suspends on idle. Mask the sleep targets (above) or the site dies overnight.

### Phase 2 — Base system

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl git iw avahi-daemon
sudo hostnamectl set-hostname nuc
```

`avahi-daemon` gives you `nuc.local` from other machines regardless of what IP the router hands out. This is what replaces a DHCP reservation when you have no router admin access.

**Verify** from another machine: `ping nuc.local`

### Phase 3 — Wi-Fi power save, and SSH

An idle server letting its wireless card sleep produces intermittent drops that look exactly like a Cloudflare problem. On NetworkManager (Desktop):

```bash
sudo tee /etc/NetworkManager/conf.d/wifi-powersave.conf >/dev/null <<'EOF'
[connection]
wifi.powersave = 2
EOF
sudo systemctl restart NetworkManager

iw dev                                # find the interface, e.g. wlp0s20f3
iw dev wlp0s20f3 get power_save       # Power save: off
```

`2` means off. `3` means on. Yes, that's backwards.

SSH server, since Desktop doesn't ship one:

```bash
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
ss -tlnp | grep :22
```

Then, **on your Windows PC** (PowerShell — not on the NUC):

```powershell
ssh-keygen -t ed25519 -C "carlos@pc"     # empty passphrase is fine for a homelab

ssh carlos@nuc.local "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
scp $env:USERPROFILE\.ssh\id_ed25519.pub carlos@nuc.local:~/.ssh/authorized_keys
ssh carlos@nuc.local "chmod 600 ~/.ssh/authorized_keys"
```

The keygen passphrase is a **new** passphrase encrypting the key file. It is not your NUC password.

Confirm the key works before hardening:

```powershell
ssh -o PasswordAuthentication=no carlos@nuc.local
```

Then, on the NUC, keeping a working session open:

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF

sudo sshd -t && sudo systemctl restart ssh
```

### Phase 4 — Firewall and patching

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw enable

sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Docker writes its own iptables rules and **bypasses ufw**. A container published on `0.0.0.0` is LAN-reachable regardless of what ufw reports. This is why the compose file binds Caddy to `127.0.0.1:8080`. Leave it.

`sudo ufw status verbose` should list OpenSSH and nothing else — today and forever. If you ever need to open a port, the tunnel is misconfigured.

### Phase 5 — Docker and Node

**Run these as separate commands, not one paste.** The Docker script contains a `sleep 20` that swallows anything queued behind it on stdin.

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker $USER
```

Now **log out and back in** — group membership is fixed at login, so existing terminals and desktop sessions keep the old list. `newgrp docker` works as a stopgap in one shell only.

```bash
docker run --rm hello-world
```

If that fails with `error getting credentials`, Docker Desktop left a credential helper behind:

```bash
mv ~/.docker/config.json ~/.docker/config.json.bak
docker run --rm hello-world
```

Node, separately:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v            # >= 20.19; Vite 8 refuses older
```

Verify the lot:

```bash
id -nG | grep docker
sudo systemctl is-enabled docker     # "enabled" — this is what makes reboots work
docker context ls                    # "default" starred, not desktop-linux
```

> If Docker **Desktop** is installed on this machine, it is the wrong Docker for a server: it runs containers in a VM tied to your login session and will not come back on boot. Install Engine as above and `docker context use default`.

### Phase 6 — Build and serve locally

```bash
cd ~
git clone https://github.com/carlossalcedo1/PromptWorks.git promptworks
cd promptworks/frontend
npm ci
npm run build
ls dist/index.html

cd ../deploy
cp .env.example .env          # required before ANY compose command, see note
chmod +x deploy.sh
docker compose up -d caddy
```

> The compose file declares `TUNNEL_TOKEN` as required, and Compose validates the whole file even when you start a single service. So `.env` must exist with *some* value before `docker compose up -d caddy` will parse. The placeholder in `.env.example` satisfies it.

**The gate that matters:**

```bash
curl -I http://127.0.0.1:8080/                       # HTTP/1.1 200
curl -s http://127.0.0.1:8080/pricing | head -c 120  # index.html, NOT a 404
```

The second check is the SPA fallback doing the job `vercel.json` used to. A 404 there means react-router breaks on every refresh and shared link.

To view it in a browser from your PC, without opening any firewall:

```powershell
ssh -L 8080:127.0.0.1:8080 carlos@nuc.local
```

`npm run dev` plays no part in any of this. Vite's dev server is for development only. What serves the site is Caddy reading the static files in `dist/` — you could uninstall Node and the site would keep running; you just couldn't build a new version.

### Phase 7 — Optional free smoke test

Only worth doing if you don't have a domain yet:

```bash
docker run --rm --network promptworks_web \
  cloudflare/cloudflared:latest tunnel --url http://caddy:80
```

Prints a throwaway `trycloudflare.com` URL. Open it on a phone with Wi-Fi off. `Ctrl-C` kills it.

### Phase 8 — Named tunnel on the real domain

In the Cloudflare dashboard:

1. Domain must read **Active**.
2. **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared**, name it `promptworks-nuc`.
3. On the install screen, pick the **Docker** tab and copy only the long string after `--token` (starts with `eyJ`). Ignore the rest of the command — you are not installing cloudflared on the host, the container *is* cloudflared. No apt repo, no GPG key, no systemd unit.
4. **Published application routes** (older UI calls this "Public Hostnames") — add two:

| Subdomain | Domain | Type | URL |
|---|---|---|---|
| *(empty)* | yourdomain.com | HTTP | `caddy:80` |
| `www` | yourdomain.com | HTTP | `caddy:80` |

`HTTP` not HTTPS — Caddy listens on plain :80 internally, and both hops around it are already encrypted. `caddy:80` not `localhost` — cloudflared is in its own container, where `localhost` means itself.

On the NUC:

```bash
cd ~/promptworks/deploy
nano .env                              # replace placeholder with the real token
grep TUNNEL_TOKEN .env | wc -c         # few hundred chars = pasted whole
docker compose up -d
docker compose logs -f cloudflared     # ~4x "Registered tunnel connection"
```

`.env` must read exactly `TUNNEL_TOKEN=eyJ...` — no quotes, no spaces around `=`, no trailing space. That is the most common reason a correct-looking token yields a DOWN tunnel.

**Verify** on a phone with Wi-Fi off: the domain, then a hard refresh on a deep link like `/pricing`. Dashboard should read HEALTHY.

---

## What we did that turned out to be unnecessary

Recorded so a rebuild doesn't repeat them.

| Step | Why it was dropped |
|---|---|
| **MAC randomization disable** | Was insurance for a DHCP reservation — which needs router admin access we don't have. Bought nothing, and changing the MAC mid-session muddied an unrelated outage. Do not re-add. |
| **Forcing DNS to 1.1.1.1** | A wrong fix for a misdiagnosed problem. Made things worse by fighting the actual cause. Leave DNS on DHCP. |
| **Tailscale** | Genuinely useful for remote SSH, but *not required* for the tunnel and it broke DNS on this box (below). Install it later, deliberately, on its own. |
| **The `ddns.net` hostname** | Dynamic DNS solves "my IP changes." It cannot help when there is no inbound path at all. The tunnel replaces it entirely. |
| **Port forwarding, UPnP, DMZ** | Never needed. The CGNAT address confirmed inbound was never possible anyway. |

---

## What went wrong, and the lesson

| What happened | Actual cause | Lesson |
|---|---|---|
| All DNS resolution died mid-setup; `ping 1.1.1.1` fine, `ping google.com` failed | **Tailscale** was pushing a nameserver at `100.70.0.1` that doesn't answer, overriding the system resolver | The last thing you changed is not automatically the cause. Tailscale had been installed earlier and was invisible in the timeline. |
| Fix appeared not to work | systemd-resolved had cached the failure, and `--accept-dns=false` doesn't clear DNS already registered on the `tailscale0` link | `sudo resolvectl revert tailscale0 && sudo resolvectl flush-caches` |
| `/etc/resolv.conf` looked healthy while DNS was broken | It only says *where apps ask* (`127.0.0.53`, the resolved stub). The upstream servers are one layer deeper | `cat /etc/resolv.conf` answers "where do apps ask"; `resolvectl status` answers "where does that go". The second is where problems live. |
| The `.ts.net` search domain in resolv.conf | Was the actual clue and got skipped past | Read the whole output, not the line you expected to check |
| Half a pasted command block silently didn't run | `get.docker.com` has a `sleep 20` and consumes stdin | Don't paste multi-command blocks when one of them is an installer script |
| `permission denied ... docker.sock` after `usermod` | Group membership is set at login; the running desktop session still had the old list | Log out and back in, don't just open a new terminal |
| `error getting credentials` on `docker run` | Docker **Desktop** had written `credsStore: desktop` into `~/.docker/config.json`, which Engine can't use | Remove the config file; public images need no credentials |
| `docker compose up -d caddy` refused to parse | The `${TUNNEL_TOKEN:?}` guard is evaluated for the whole file even when starting one service | `cp .env.example .env` before any compose command |
| Noisy `NO_PUBKEY` errors on every `apt update` | Stale Google Chrome repo key, unrelated to any of this | Cosmetic, but fix it — it makes real failures hard to spot |

The through-line: **three separate small problems overlapped**, and each one made the others harder to see. When something breaks during a setup, resist attributing it to the step you just did — check what else touches that layer first.

---

## Day-2 operations

**Deploy a change.** Commit and push from your PC, then on the NUC:

```bash
~/promptworks/deploy/deploy.sh
```

Pulls, `npm ci`, builds, verifies `dist/index.html`, curls the local endpoint. Because Caddy serves `dist` through a bind mount, the new build is live the instant it lands — no restart, no downtime, no container rebuild. Hard-refresh to get past the browser cache on `index.html`.

**Update the containers.** Monthly, or when Cloudflare nags:

```bash
cd ~/promptworks/deploy && docker compose pull && docker compose up -d
```

**Check health.**

```bash
docker compose ps
docker compose logs --tail=50 cloudflared
curl -I https://yourdomain.com
```

**Monitoring.** Uncomment `uptime-kuma` in the compose file, reach it at `127.0.0.1:3001` over an SSH tunnel, point a monitor at the public URL with email or Discord alerts. So you learn about downtime from a notification rather than a customer.

---

## Robustness tests worth running

Run these once, now, while nothing depends on the box.

1. **Reboot.** `sudo reboot`, wait 90s, `curl -I https://yourdomain.com`. Must recover with zero intervention.
2. **Hard power cut.** Pull the plug. Harsher than a reboot — it also tests that the filesystem survives and nothing depended on a clean shutdown.
3. **Container kill.** `docker kill promptworks-caddy`, wait 15s, `docker compose ps`. Should be back up on its own.
4. **Network drop.** Unplug the router for 60s. Site should return within a minute of the router, no manual step.
5. **Idle test.** Leave it untouched overnight, check the site in the morning. This is the one that catches suspend and Wi-Fi power save — the two failure modes that only appear when you're not watching.
6. **Deploy test.** Change some visible copy, push, run `deploy.sh`, confirm the change is live.
7. **Deep link + hard refresh** on the public domain. Confirms the SPA fallback survives Cloudflare's edge, not just Caddy.

Also worth turning on in the Cloudflare dashboard now that it's public: **SSL/TLS → Overview → Full**, and **Edge Certificates → Always Use HTTPS**.

---

## Adding more services

The tunnel is not limited to one thing. Each published application route maps a hostname or path to any service on the `promptworks_web` docker network, so Stage 2 slots in without touching the ingress.

**Same hostname, different path** — this is what the API uses, and it means no CORS. Already configured in the Caddyfile:

```
handle_path /api/*  → reverse_proxy api:8000
handle              → static files
```

`handle_path` (not `handle`) strips the prefix, so the browser's `POST /api/attempts` reaches FastAPI as `POST /attempts` and the routes need no prefix of their own.

**Different hostname** — for anything that should be separately addressable:

| Route | Service | Notes |
|---|---|---|
| `status.yourdomain.com` | `uptime-kuma:3001` | Put Cloudflare Access in front |
| `api.yourdomain.com` | `api:8000` | Only if you want it separate from `/api/*` |

**The database does not get a route.** Postgres is in the compose file with **no published port and no tunnel route** — only the internal docker network reaches it, by the hostname `postgres`. A publicly addressable database is how homelabs end up in ransomware writeups. Same for Redis, and for any admin UI that lacks its own authentication.

Rules of thumb as you add services:

- Anything holding data: internal network only, never published, never routed.
- Anything with an admin panel: behind Cloudflare Access, free for small teams and the groundwork for the Stage 3 SSO story.
- Anything that costs money per request (`POST /attempts` hitting an LLM): rate-limit at Cloudflare *and* in the application.
- Back up anything stateful off the NUC. `pg_dump` on a cron. A backup on the same disk is not a backup.

---

## Backend: first bring-up

Everything below is one-time. After this, `./deploy/deploy.sh` does the whole sequence on every deploy.

**1. Fill in `deploy/.env`.** Start from `deploy/.env.example`. The values that must be set or nothing works:

```bash
cd ~/promptworks/deploy
cp .env.example .env

# Generate the two secrets. POSTGRES_PASSWORD must also appear inside
# DATABASE_URL — they are the same credential written twice.
openssl rand -base64 24    # → POSTGRES_PASSWORD, and into DATABASE_URL
openssl rand -base64 48    # → JWT_SECRET
```

Then set `ANTHROPIC_API_KEY` (grading costs real money per call — set `PROMPTWORKS_DAILY_BUDGET_USD` too), and `RESEND_API_KEY` / `RESEND_FROM_EMAIL` if you want the login flow to actually deliver codes. `deploy.sh` checks all of this before it builds anything.

**2. Run the deploy.**

```bash
cd ~/promptworks
./deploy/deploy.sh
```

That builds the frontend and the API image, starts Postgres and waits for it to be genuinely ready, runs `alembic upgrade head`, seeds the scenarios, restarts the API, and verifies `/api/health` answers through Caddy. It refuses to start if the working tree is dirty or `.env` is incomplete.

Flags for iterating: `--backend-only` skips the four-minute npm build, `--frontend-only` skips the API entirely.

**3. Confirm.**

```bash
./deploy/status.sh
```

This now reports the API, the database, which migration is applied, and how many scenarios are seeded — so "the site is up but the API is broken" is visible at a glance instead of a mystery.

**4. Smoke test the API by hand.**

```bash
curl -s http://127.0.0.1:8080/api/health

# Anonymous grading — the homepage "Try one now" path. Costs one API call.
curl -s -X POST http://127.0.0.1:8080/api/attempts \
  -H 'Content-Type: application/json' \
  -d '{"scenario_id":"denial-explanation-email","prompt":"You are a claims correspondent. Write an empathetic email under 150 words explaining the flood exclusion in Section 4.2, cite it, do not admit liability, and close with the appeal deadline."}'
```

A successful response has six scores, six feedback strings, a total out of 30, and an `attempt_id`. Confirm the row landed:

```bash
docker compose exec postgres psql -U promptworks -d promptworks \
  -c "select id, total, tokens_input, cost_usd, created_at from attempts order by created_at desc limit 5;"
```

For the login flow without a verified Resend domain, set `LOGIN_CODE_DEV_ECHO=1` in `.env` and read the code out of `docker compose logs api`. **Never leave that on** — it writes a live credential into your logs.

---

## Database operations

The `postgres` service holds every row the product has: users, scenarios, and the `attempts` fact table that the score screen, the dashboard and the team heat map all read from. It is the only container here whose data you cannot rebuild by redeploying.

### Migrations

The container starts with an **empty** database. Nothing creates tables on boot — that is deliberate, so no deploy can silently reshape a schema. Migrations are an explicit step, run from the repo root with `DATABASE_URL` pointing at the database:

```bash
alembic upgrade head
```

Run this on every deploy that includes a schema change, *before* restarting the API. To see exactly what a migration will do before it touches anything:

```bash
alembic upgrade head --sql
```

After changing a model in `backend/db/models.py`, generate the matching revision rather than editing a table by hand — hand-edits are how the models and the database quietly stop agreeing:

```bash
alembic revision --autogenerate -m "what changed"
```

### Seeding content

Scenarios and tracks live as JSON files in `data/`, and are loaded by:

```bash
python scripts/seed_scenarios.py
```

Every row is upserted by `slug`, so re-running after editing a file updates in place rather than duplicating. `--dry-run` validates the files without connecting to anything, which is the version worth running in CI.

### Backups

`pgdata` is a named volume, so `docker compose down` leaves it alone and only `down -v` destroys it. That is not a backup:

```bash
docker compose exec -T postgres pg_dump -U promptworks promptworks | gzip > promptworks-$(date +%F).sql.gz
```

Put that on a cron and copy the output off the NUC. Restore into a running container with `gunzip -c ... | docker compose exec -T postgres psql -U promptworks promptworks`. Test a restore at least once — an untested backup is a hypothesis.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Cloudflare 502 | cloudflared can't reach Caddy | Route must be `caddy:80`, type HTTP. Both containers on `promptworks_web`. |
| Cloudflare 1016 | No published application route | Connector connected and hostname routed are two separate steps. |
| Works at `www`, not the apex | Only one route added | Both need their own entry. |
| Tunnel DOWN | Bad token | `docker compose logs cloudflared`. Check `.env` for quotes, spaces, truncation. |
| 404 on refreshing a subpage | SPA fallback | `try_files {path} /index.html`. Test `curl -s localhost:8080/pricing`. |
| Deployed, browser shows old site | `index.html` cached | Hard refresh; confirm the `no-cache` header; purge Cloudflare cache. |
| Site dead every morning | Machine suspended | Mask the sleep targets. This is the Desktop-install trap. |
| Random brief outages | Wi-Fi power save | `iw dev … get power_save` must say off. |
| Names don't resolve, IPs do | Something owns the resolver — Tailscale, a VPN, a DNS override | `resolvectl status`, not `cat /etc/resolv.conf`. |
| Port reachable on LAN despite ufw | Docker bypasses ufw | Bind published ports to `127.0.0.1`. |
