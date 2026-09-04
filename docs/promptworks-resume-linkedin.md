# PromptWorks — Resume & LinkedIn Copy
Carlos Salcedo · drafted Sept 3, 2026 · sourced from `carlossalcedo1/PromptWorks` @ `517c8f5`

---

## 1. Resume — Projects entry

Formatted to match your existing PROJECTS section (title, stack, date, three bullets).

> **PromptWorks — AI Prompt-Engineering Training Platform (React, FastAPI, PostgreSQL)** — Aug 2026 – Present
>
> - Co-built a full-stack B2B SaaS platform where employees practice prompting against real work scenarios and receive rubric-based scores; owned the **Stage 2 backend, database, auth, and self-hosted infrastructure**.
> - Engineered an **LLM-as-judge grading service** returning strict JSON across 6 rubric dimensions, with a prompt-injection guardrail verified by adversarial tests, and **two-tier model routing** that grades on a cheaper model and escalates only ambiguous scores — cutting per-grade inference cost ~3x.
> - Designed a **6-table PostgreSQL schema** with Alembic migrations and shipped passwordless email 2FA (hashed 6-digit codes, 10-min expiry, 5-attempt lockout, JWT sessions), per-IP rate limiting, and a spend tracker with a daily budget cap; **146 automated tests** across the API, auth, grader, and schema.
> - Self-hosted the production stack on a personal Intel NUC via **Docker Compose (Caddy + Cloudflare Tunnel + PostgreSQL)**, delivering a publicly reachable HTTPS deployment from a CGNAT network with no inbound ports and $0 hosting cost.

### Shorter 3-bullet version (if space is tight)

> - Co-built a full-stack AI training platform (React 19 + Vite frontend, FastAPI + PostgreSQL backend); owned the Stage 2 backend, schema, auth, and deployment.
> - Engineered an LLM-as-judge grader scoring prompts across 6 rubric dimensions in strict JSON, hardened against prompt injection, with two-tier model routing that cut per-grade inference cost ~3x and a daily spend cap enforced before every call.
> - Shipped passwordless email 2FA, per-IP rate limiting, and 146 automated tests; deployed via Docker Compose (Caddy + Cloudflare Tunnel + PostgreSQL) on a self-hosted NUC behind CGNAT at $0 hosting cost.

### Skills section updates

Add to **Developer Technologies:** `PostgreSQL, SQLAlchemy, Alembic, Docker, Tailwind CSS, Vite, Pytest, Cloudflare`
Add to **Other Skills:** `LLM Integration, Prompt Engineering, API Design, CI/Test Automation`
Consider dropping `MongoDB` — the project moved to PostgreSQL, so Postgres is now the truthful and stronger claim.

---

## 2. LinkedIn profile copy

### Headline

**Option A (internship-hunting, direct):**
> CS @ University of Florida | Building AI-powered developer tools | Prev. Technology Solutions Intern @ Brown & Brown

**Option B (project-forward):**
> CS @ UF | Co-founder & Engineer @ PromptWorks — LLM-graded prompt-engineering training for teams | Ex-Brown & Brown

**Option C (role-targeted):**
> Computer Science @ UF | Full-Stack & AI Engineering | FastAPI · React · PostgreSQL · LLM Systems | Seeking Summer 2027 SWE Internship

### About section

> I build software that makes AI useful to people who aren't engineers.
>
> At Brown & Brown this summer I shipped three AI virtual agents in Copilot Studio wired into ServiceNow, including an image-recognition feature that reads error screenshots and auto-fills incident reports — cutting ticket creation time by 53%.
>
> Right now I'm co-building **PromptWorks**, a platform where employees train prompting the way developers train on Exercism: real work scenarios, write a prompt, get scored against a fixed six-dimension rubric, get a rewrite, do it again. Companies can see the AI license line item; they can't see whether anyone's work actually changed. PromptWorks measures the skill instead.
>
> I own the backend and infrastructure: an LLM-as-judge grading service that returns strict JSON and holds up against learners trying to prompt-inject their own scores, a PostgreSQL schema built for team-level analytics, passwordless email 2FA, and a two-tier model router that grades cheaply and escalates only when the score is ambiguous. The whole stack runs on a Docker Compose deployment I self-host on an Intel NUC, published through a Cloudflare Tunnel because my network sits behind CGNAT and port forwarding was never an option.
>
> I care most about the unglamorous parts — rate limits, spend caps, migrations, a test suite you can trust — because those are what separate a demo from a product.
>
> Studying CS with a Business Administration minor at the University of Florida (3.80 GPA), Career Prep Fellow at Management Leadership for Tomorrow, and looking for Summer 2027 software engineering internships.

### Projects entry (LinkedIn "Projects" section)

**PromptWorks** · Aug 2026 – Present · Associated with University of Florida
Contributors: Carlos Salcedo, RJ Cooke

> A prompt-engineering practice platform for teams. Employees train on real work scenarios, submit a prompt, and get scored 0–30 across six rubric dimensions by an LLM-as-judge grader, plus a reference rewrite and a line diff.
>
> I co-built the platform and own the Stage 2 backend: FastAPI service with an LLM grading pipeline, a 6-table PostgreSQL schema with Alembic migrations, passwordless email 2FA with JWT sessions, per-IP rate limiting, cost tracking with a daily budget cap, and two-tier model routing that cuts inference cost ~3x. 146 automated tests. Self-hosted on a Docker Compose stack (Caddy + Cloudflare Tunnel + PostgreSQL) running on an Intel NUC.
>
> Stack: React 19, Vite, Tailwind v4, React Router 7, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16, Docker, Caddy, Cloudflare Tunnel, Anthropic API, Pytest.

---

## 3. LinkedIn announcement post

> **Stage 2 of PromptWorks is done.**
>
> Back in August I shared that I was building PromptWorks — a platform where employees practice prompt engineering the way developers practice on Exercism. Real work scenarios, write a prompt, get scored against a fixed rubric, get a rewrite, run it again.
>
> Stage 1 was the frontend running on a deterministic grader and mock data. It looked like a product. It wasn't one yet.
>
> Stage 2 is what makes it real:
>
> → **A live LLM-as-judge grader.** Six rubric dimensions, strict JSON, scores recomputed server-side so the model can never hand itself a total. Learners *will* try to prompt-inject a 30/30 — so the guardrail is tested against real attempts, not assumed.
>
> → **Two-tier model routing.** Grade on the cheap model first, escalate to the stronger one only when the score lands in the ambiguous band. Roughly 3x cheaper per grade with no drop in quality where it matters.
>
> → **A real database.** PostgreSQL with a schema built for team analytics from day one, Alembic migrations, and a seeding pipeline that validates scenario content before it ever touches a table.
>
> → **Accounts.** Passwordless email 2FA — hashed 6-digit codes, expiry, attempt lockout, JWT sessions.
>
> → **Cost control.** Per-IP rate limits and a daily spend cap enforced *before* the API call, because the grading endpoint is the only one that costs money.
>
> → **146 automated tests**, and a stack I self-host on an Intel NUC through Docker and a Cloudflare Tunnel — my network is behind CGNAT, so port forwarding was never on the table. It's live, on my own domain, at $0 in hosting.
>
> Plus a long list of frontend fixes: mobile layout bugs, navigation, account menus, a new "Why" page.
>
> Huge thank you to **RJ Cooke** for building this with me. Half the good decisions in this repo started as an argument between the two of us, and the product is better for every one of them.
>
> Next up: Stage 3 — team dashboards on real data, assignments, SSO, and eventually a fine-tuned grader model trained on accumulated attempts.
>
> Still very much a work in progress. Always open to feedback.
>
> #SoftwareEngineering #AI #LLM #FastAPI #React #PostgreSQL #BuildInPublic

### Notes on the post

- Tag RJ Cooke with an actual @mention so he gets notified.
- Attach a screenshot of the score screen or the team heat map — LinkedIn posts with an image get materially more reach than text-only.
- If you have the live URL ready to share publicly, put it in the **first comment**, not the post body (LinkedIn suppresses reach on posts with outbound links).

---

## Metric honesty check

Every number above traces to something in the repo:

| Claim | Source |
|---|---|
| 146 automated tests | `grep -c "def test_"` across `tests/*.py` (28+23+29+2+15+21+22+6) |
| 6 rubric dimensions, 0–30 | `backend/llm_grader.py` `DIMENSIONS`, weighted totals normalized to 30 |
| ~3x cheaper per grade | Haiku 4.5 ($1/$5 per M tokens) vs Sonnet 5 ($3/$15) in `spend_tracker.py` — accurate for non-escalated grades |
| 6-table schema | `orgs`, `users`, `tracks`, `scenarios`, `attempts`, `login_codes` in `backend/db/models.py` |
| Injection guardrail tested | `tests/test_injection_live.py` — real API calls against escalating injection attempts |
| $0 hosting | Self-hosted NUC + free Cloudflare Tunnel; excludes electricity and Anthropic API spend |

Avoid claiming user counts, revenue, or adoption — there aren't any yet, and "Stage 2 complete, pre-launch" is a stronger story than a number an interviewer can puncture.
