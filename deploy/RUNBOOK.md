# Promptworks — NUC setup runbook

Ubuntu Server + Docker + Caddy + Cloudflare Tunnel. Wi-Fi, no router admin access, no port forwarding.

Every phase ends with a **verify** step. Do not move past a failed verify — the single most expensive mistake in this build is stacking a broken tunnel on top of a broken web server and then debugging both at once.

Estimated time: ~3 hours, of which maybe 40 minutes is waiting on downloads and DNS.

Replace throughout:
- `carlos` — your Ubuntu username
- `wlp2s0` — your actual Wi-Fi interface name (Phase 3 shows you how to find it)
- `promptworks.tld` — your real domain once you own it

---

## Phase 0 — Before you touch the NUC

- [ ] **Push the repo to GitHub.** The NUC pulls from a remote; it does not get files copied to it. If `git remote -v` in the project folder prints nothing, create the repo and push first.
- [ ] Confirm `frontend/dist` is gitignored (it is). The NUC builds its own — never commit build output.
- [ ] Have your Wi-Fi SSID and password written down. The Ubuntu Server installer asks for them in a text UI with no copy-paste.
- [ ] Ubuntu Server LTS ISO on a USB stick (`https://ubuntu.com/download/server`), written with Rufus or balenaEtcher.
- [ ] A monitor and keyboard for the NUC, for the install only. Everything after Phase 3 is over SSH.
- [ ] Domain: not needed yet. Phase 7 proves the whole chain works on a throwaway URL before you spend a cent.

---

## Phase 1 — Install Ubuntu Server

1. Boot the USB, pick **Ubuntu Server** (not minimized).
2. At **Network connections**, select the `wl…` interface → **Edit Wifi** → enter SSID and passphrase. Wait for it to show a DHCP address before continuing — if it doesn't, nothing later will work.
3. Storage: use the whole disk. No LVM encryption unless you want to type a passphrase at every boot — a headless server that won't boot unattended defeats the point.
4. Profile: set your name, **server name `nuc`**, username, password.
5. **Tick "Install OpenSSH server."** Miss this and you are stuck at the physical keyboard.
6. Skip every snap on the featured-server-snaps screen. You want Docker from Docker's own repo, not the snap.
7. Reboot, pull the USB, log in at the console.

**Verify**

```bash
ip a          # a wl… interface with an inet address
ping -c3 1.1.1.1
```

---

## Phase 2 — Base system

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl git iw avahi-daemon
sudo hostnamectl set-hostname nuc
```

`avahi-daemon` makes the box answer to `nuc.local` from your PC regardless of what IP the router hands it. This is the fix for having no router admin access.

**Verify** — from your Windows PC:

```powershell
ping nuc.local
```

If that resolves, you never need to know the NUC's IP again. If it doesn't, find the IP with `ip a` at the console and use that instead; `.local` resolution fails on some networks with client isolation.

---

## Phase 3 — Wi-Fi hardening

An idle server that lets its Wi-Fi card nap produces random tunnel drops that look exactly like a Cloudflare problem and are not. Fix it now.

Find your interface name:

```bash
iw dev | grep Interface     # e.g. wlp2s0
```

Ubuntu **Server** uses netplan + systemd-networkd, so power save is set with a small boot service (substitute your interface):

```bash
sudo tee /etc/systemd/system/wifi-powersave-off.service >/dev/null <<'EOF'
[Unit]
Description=Disable WiFi power saving
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/iw dev wlp2s0 set power_save off
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now wifi-powersave-off.service
```

> If you installed Ubuntu **Desktop** instead, it uses NetworkManager and the equivalent is a `wifi.powersave = 2` drop-in under `/etc/NetworkManager/conf.d/`. Check with `nmcli -v` — "command not found" means you're on Server and the unit above is correct.

**Verify**

```bash
iw dev wlp2s0 get power_save     # Power save: off
```

---

## Phase 4 — Remote access

### Tailscale

This replaces the DHCP reservation you can't make. The NUC gets a permanent address and name that survive any router behaviour, and you can reach it from outside the house.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```

Open the printed URL, sign in, approve the machine. Install Tailscale on your PC and phone under the same account.

```bash
tailscale status
tailscale ip -4
```

### SSH keys

On your **Windows PC** (skip the keygen if `~/.ssh/id_ed25519.pub` already exists):

```powershell
ssh-keygen -t ed25519 -C "carlos@pc"

ssh carlos@nuc.local "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
scp $env:USERPROFILE\.ssh\id_ed25519.pub carlos@nuc.local:~/.ssh/authorized_keys
ssh carlos@nuc.local "chmod 600 ~/.ssh/authorized_keys"
```

> That `scp` **overwrites** `authorized_keys`. Correct on a fresh box; if you're adding a second key later, append instead.

**Verify before hardening:** open a new terminal and run `ssh carlos@nuc.local`. It must log in without asking for a password.

### Disable password login

**Keep your working SSH session open** while you do this. If you lock yourself out, that session is the only way back short of a monitor and keyboard.

```bash
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf >/dev/null <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF

sudo sshd -t && sudo systemctl restart ssh
```

`sshd -t` validates the config before the restart. If it prints an error, fix it — do not restart.

**Verify** — in a *second* terminal: `ssh carlos@nuc.local` still works. Only then close the first one.

---

## Phase 5 — Firewall and patching

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw enable

sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades      # answer Yes
```

> **The one thing to know about Docker and ufw:** Docker writes its own iptables rules and *bypasses ufw entirely*. A container published on `0.0.0.0` is reachable on your LAN no matter what ufw says. This is why `docker-compose.yml` binds Caddy to `127.0.0.1:8080` and nothing else. Leave it that way.

**Verify**

```bash
sudo ufw status verbose      # deny (incoming), OpenSSH allowed, nothing else
```

At the end of this whole build that list should still contain only OpenSSH. If you ever needed to open a port, the tunnel is misconfigured.

---

## Phase 6 — Docker and Node

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker run --rm hello-world

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v            # must be >= 20.19 — Vite 8 refuses older
```

---

## Phase 7 — Build and serve locally

```bash
cd ~
git clone https://github.com/<you>/<repo>.git promptworks
cd promptworks/frontend
npm ci
npm run build          # produces dist/
ls dist/index.html

cd ../deploy
chmod +x deploy.sh
docker compose up -d caddy      # caddy only — no tunnel token yet
```

**Verify — this is the gate that matters**

```bash
curl -I http://127.0.0.1:8080/                       # HTTP/1.1 200
curl -s http://127.0.0.1:8080/pricing | head -c 120  # index.html, NOT a 404
```

The second check is the SPA fallback doing the job `vercel.json` used to. If `/pricing` 404s, react-router will break on every refresh and shared link.

To see it in a browser, forward the port from your PC — no firewall changes needed:

```powershell
ssh -L 8080:127.0.0.1:8080 carlos@nuc.local
```

Then open `http://localhost:8080`.

---

## Phase 8 — Smoke-test the tunnel, free, before buying anything

This proves the entire chain end to end on a throwaway URL. Do it before you spend money on a domain.

```bash
docker run --rm --network promptworks_web \
  cloudflare/cloudflared:latest tunnel --url http://caddy:80
```

It prints a `https://<random-words>.trycloudflare.com` URL. Open it **on your phone with Wi-Fi off**. Cell data is the point — loading it over your own Wi-Fi proves nothing about whether the tunnel works.

Site loads on cell data → the NUC is publicly reachable, without port forwarding, on a network you don't administer. `Ctrl-C` to stop; the URL dies with it.

Now go buy the domain, with the pre-purchase checklist from the hosting plan.

---

## Phase 9 — Named tunnel on your real domain

1. Add the domain to Cloudflare (Add a site → Free plan) and switch nameservers at the registrar. Skip this if you registered at Cloudflare. Wait for the zone to read **Active** — usually minutes, occasionally hours.
2. **Zero Trust** dashboard → **Networks → Tunnels → Create a tunnel** → **Cloudflared** → name it `promptworks-nuc`.
3. On the install screen, copy the long token out of the displayed command. Ignore the rest of the command — Compose runs the container.
4. **Public Hostname** tab → Add:
   - Subdomain: *(leave empty)* · Domain: `promptworks.tld` · Type: `HTTP` · URL: `caddy:80`
   - Add a second for subdomain `www`, same service.

On the NUC:

```bash
cd ~/promptworks/deploy
cp .env.example .env
nano .env                 # paste the token
docker compose up -d
docker compose ps         # both services Up
docker compose logs -f cloudflared
```

Healthy logs say `Registered tunnel connection` about four times — Cloudflare opens redundant connections to different edge locations.

**Verify** — phone, cell data again: `https://promptworks.tld`. Then hard-refresh on a deep link like `https://promptworks.tld/pricing` to confirm the SPA fallback survives the trip through Cloudflare.

The Tunnels dashboard should show **HEALTHY**.

---

## Phase 10 — Make it survive you not being there

**Power-cut test.** Nothing here is real until this passes:

```bash
sudo reboot
# wait ~60s, then from your PC:
curl -I https://promptworks.tld
```

`restart: unless-stopped` should have brought both containers back with no intervention. If it didn't, fix that now rather than discovering it during a power flicker at 3am.

**Deploys.** From then on, shipping is one command:

```bash
~/promptworks/deploy/deploy.sh
```

Because Caddy serves `dist` through a bind mount, a finished build is live immediately — no restart, no downtime.

**Keep images current.** Monthly, or on a cron:

```bash
cd ~/promptworks/deploy && docker compose pull && docker compose up -d
```

**Monitoring.** Uncomment the `uptime-kuma` service in `docker-compose.yml`, `docker compose up -d`, reach it at `http://127.0.0.1:3001` over an SSH tunnel, and point a monitor at your public URL with email or Discord alerts. Free, and it means you learn the site is down from a notification rather than from a customer.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Cloudflare **502** | cloudflared can't reach Caddy | Service URL must be `caddy:80` (the container name), not `localhost`. Both must be on the `promptworks_web` network. |
| Tunnel shows **DOWN** | Bad or missing token | `docker compose logs cloudflared`. Re-copy the token; check `.env` has no trailing space or quotes. |
| Works on LAN, not cell data | DNS or hostname mapping | `dig promptworks.tld` should return Cloudflare IPs. Re-check the Public Hostname entry. |
| **404 on refreshing a subpage** | SPA fallback broken | `try_files {path} /index.html` in the Caddyfile. Test with `curl -s localhost:8080/pricing`. |
| Deploy done, browser shows old site | `index.html` cached | Hard refresh. Confirm the `no-cache` header. Purge Cloudflare cache if needed. |
| Port reachable on LAN despite ufw | Docker bypasses ufw | Bind published ports to `127.0.0.1`, as the compose file does. |
| Random brief outages | Wi-Fi power save | Phase 3. Check `iw dev … get power_save`. |
| `npm ci` fails on the NUC | Node too old | `node -v` must be ≥ 20.19. |

---

## When Stage 2 arrives

Nothing here gets thrown away:

- Add `api` (FastAPI) and `mongo` services to the same `docker-compose.yml`. **Do not publish Mongo's port** — the internal network is the only thing that needs to reach it.
- Uncomment the `handle /api/*` block in the `Caddyfile` so the API lives behind the same hostname. Same origin, no CORS.
- Put Cloudflare Access in front of `/admin` — free for small teams, and it's the groundwork for the Stage 3 SSO story.
- Rate-limit `POST /attempts` at Cloudflare *and* in FastAPI. It is the only endpoint that spends real money.
- `mongodump` on a cron, copied off the NUC. A backup on the same disk is not a backup.
