# Promptworks — website design brief

Context handoff document. Same format as the Carlos Tech Solutions brief. Stage 1 = frontend only (mock/static data, fake grading). Stage 2 = backend + live LLM grading. Stage 3 = teams, SSO, fine-tuned grader.

**Working name:** Promptworks. Swap freely — but avoid "PromptGym" (existing Android app) and "PromptCoach" (existing direct competitor, see references). Alternates: Repwork, Draftroom, Signal, Cadence.

## Business

- A prompt-engineering practice platform. Employees train prompting the way developers train on Exercism: real work scenarios, write a prompt, get scored, get a rewrite, do it again.
- **B2B-led with a free individual tier.** Individuals sign up free and become the funnel; the money page is For Teams (manager dashboard, assignments, proficiency data, workflow library).
- The wedge: every direct competitor found is individual-only. PromptCoach — the closest match, "#1 Prompt Engineering Practice Platform" — has an evaluator, curriculum tracks, competitions and a community library, but **no team or enterprise offering at all**. Learn Prompting sells courses to individuals with a bolt-on business page. Section and Sana sell enterprise but sell *programs and video*, not reps. Nobody is selling scored, measurable practice with a manager dashboard behind it.
- Recruiter-facing secondary purpose: this demonstrates LLMs, fine-tuned models, agentic frameworks, evals and data science in one product. Keep that understated — it lives on About, not the homepage.

## Value proposition (say it explicitly, three audiences)

This is a named section on the homepage, not just an implied benefit.

- **For the employee:** "Stop guessing. Get a score, a rewrite, and the reason the rewrite was better."
- **For the manager:** "See who is actually fluent — not who finished the video."
- **For the business:** "Fewer rewrites, fewer wasted tokens, fewer hours. Measured, not claimed."

One-line company value proposition (used in the footer and meta description): *"Promptworks turns prompt engineering from a training video into a measurable skill."*

## Tagline / copy already decided

- Homepage H1: "Your team already has AI. Teach them how to ask."
- Subhead: "Promptworks turns prompt engineering into reps — real work scenarios, scored feedback, and a dashboard that shows the skill actually moving."
- Supporting line: "Free for individuals. Team plans start where the ROI does."
- Hero CTAs (2): "Start practicing free" (primary) / "Book a demo" (secondary)
- Trust badges (3): "Scored in seconds by a fine-tuned grader" / "120+ role-based scenarios" / "SSO ready — your prompts never train our models"

## The core mechanic (this drives the whole UI — decide it before anything else)

Four steps, and the homepage explains them in exactly this order:

1. **Pick a scenario** from your role's track — e.g. "Draft a customer email explaining a denied claim. Empathetic, no admission of liability, under 150 words."
2. **Write your prompt** in the player. Left pane: the scenario + constraints. Right pane: your prompt box.
3. **Run it.** The prompt hits a live LLM; the output and a **fine-tuned grader model** score it on six rubric dimensions and return targeted feedback.
4. **Compare and ship.** See the reference prompt side by side with yours, then save the better one as a reusable team workflow.

**Rubric — six dimensions, fixed, shown as a radar/bar block on every score screen:**
Task clarity · Context supplied · Constraints · Output format · Role & audience · Examples (few-shot)

Score 0–5 per dimension, 30 total. Same six dimensions everywhere: the score screen, the learner dashboard, the team heat map. That consistency is what makes the manager dashboard legible.

## Site map

**Marketing**
1. Homepage
2. Platform / How it works
3. Tracks & challenge library (public preview, gated after 3 reps)
4. For Teams (the money page)
5. Pricing
6. Resources (prompt library, guides, blog)
7. About
8. Contact / Book a demo

**App (authenticated)**
9. Learner dashboard
10. Exercise player
11. Score & feedback screen
12. Workflows library
13. Team admin dashboard
14. Auth / onboarding (role + goal picker)

**Global**
15. Header + footer (present on every page)

## Global header — 2 rows

**Row 1 (utility bar):** left: "Why prompt training?", "For business", "Docs". Right: "English | Español", "Log in".

**Row 2 (main row):** logo mark (space reserved left of the wordmark), "Promptworks" wordmark, nav — Platform · Tracks · For Teams · Pricing · Resources — then "Start free" (bordered CTA) and "Book a demo" (filled CTA).

No search in the marketing header. Search belongs in the app, scoped to the challenge library.

**App header (different, 1 row):** logo, Dashboard · Practice · Workflows · Team, then streak counter, level chip, account icon.

## Homepage section order

1. Header (2-row, above)
2. Hero: H1 + subhead + supporting line + two CTAs + a screenshot of the exercise player (not an abstract illustration — show the product)
3. Trust badges row (3 items, copy above)
4. **Value proposition** (3 columns: employee / manager / business — copy above)
5. The problem: "The tools are on everyone's desk. The prompts are the bottleneck." Short stat block.
6. How it works (4 steps, copy above)
7. **Try one now** — a live mini-exercise embedded in the page, no signup. One scenario, one prompt box, one real score. This is the single highest-converting thing on the page; build it in Stage 1 even with canned grading.
8. Tracks by role (6 tiles: Sales · Service & Claims · HR · Marketing · Finance · Engineering)
9. The rubric (6 dimensions, explained in one line each)
10. Advanced tracks strip: RAG & grounding · Agentic frameworks · Evals & data science · When to fine-tune vs. prompt · Prompt injection & safety
11. **AI-powered workflows**: "Practice is where prompts get good. Workflows are where they get used." Save a validated prompt with variables, publish to the team library, track usage.
12. For Teams teaser: dashboard screenshot + three metrics (proficiency, adoption, hours returned)
13. Security & data handling (enterprise buyers look for this before pricing — SSO, retention, no training on customer data)
14. Testimonial / case study slot (leave a real placeholder, do not fabricate one)
15. Pricing teaser (4 tiers, below)
16. Final CTA banner: "Give your team ten minutes a week."
17. Footer

## Footer — 4 columns

1. Wordmark + the one-line value proposition
2. Product: Platform / Tracks / Workflows / Pricing
3. Learn: Prompt library / Guides / Blog / Certification
4. Company: About / Contact / Security / Book a demo

## Exercise player (the most important screen)

- Breadcrumb: Practice > Track > Scenario name
- **Left pane (40%):** scenario brief, constraints checklist, target audience, difficulty chip, attempt counter
- **Right pane (60%):** prompt textarea (monospace), model selector, token/cost estimate that updates live, "Run" button
- Below on run: model output, then the score panel
- Never show the reference prompt before the first submission. It kills the exercise.

## Score & feedback screen

- Total score (x/30) with a level delta
- Six-dimension bar block, each with one line of specific feedback ("No output format given — the model guessed prose when you needed bullets")
- Tabs: Your output | Reference prompt | Diff
- Actions: "Try again" / "Next scenario" / "Save as workflow"
- Token count vs. the reference prompt's — cost efficiency is part of the skill, and it is the cleanest ROI number on the site

## Team admin dashboard

- Top row: seats active, median score, reps this week, hours returned (estimated)
- Proficiency heat map: people (rows) × six rubric dimensions (columns). This is the screenshot that sells the product.
- Weakest dimension callout with a one-click "assign this track" action
- Assignments table: track, due date, completion
- Team workflow library with usage counts
- Benchmark line: your org vs. anonymized platform median (this is the data-science surface)

## Pricing — 4 tiers

1. **Free** — foundations track, 10 graded reps/month, community prompt library
2. **Pro** — all tracks, unlimited reps, model comparison, certification
3. **Teams** (per seat) — everything in Pro + admin dashboard, assignments, team workflow library, SSO
4. **Enterprise** — custom scenarios generated from your own SOPs and docs, a grader fine-tuned on your rubric, **end-to-end implementation** (discovery, scenario authoring, rollout, adoption reporting), dedicated success manager, SLA

Do not put dollar figures in the wireframes. Price after five customer conversations.

## Tech stack

- **Frontend:** React (Vite) + Tailwind, hosted free on Vercel.
- **Backend (stage 2):** Python + FastAPI on Render — same stack as your event-discovery project, so no new learning curve.
- **Database (stage 2):** MongoDB Atlas free M0. Note: attempts and analytics are relational-shaped; if team reporting gets heavy, move analytics to Postgres and keep Mongo for content.
- **LLM layer:** provider-agnostic adapter behind one interface. Stage 1 mocked, stage 2 live (Anthropic / OpenAI). Consider BYOK for the free tier — it is how PromptCoach keeps its free tier perpetual and it removes your biggest cost risk.
- **Grading:** stage 2 = rubric + LLM-as-judge returning strict JSON (six integer scores + six feedback strings). Stage 3 = fine-tune a small model on your own accumulated graded attempts. Cheaper, faster, more consistent — and it is a genuine differentiator, not a buzzword.
- **Auth:** JWT, single admin at first. Org SSO (SAML/SCIM) in stage 3, gated behind the Teams tier.
- **Jobs:** Render background worker for grading queue + nightly analytics rollups.
- **Email (stage 2):** Resend free tier — demo requests, assignment nudges, streak reminders.

## Data model (stage 2 — Mongo collections)

- `users` — name, email, org_id, role_track, level, streak, created_at
- `orgs` — name, plan, seats, sso_config, settings
- `tracks` — title, slug, description, level, scenario_ids[]
- `scenarios` — title, slug, brief, constraints[], audience, difficulty, reference_prompt, rubric_weights, track_id
- `attempts` — user_id, scenario_id, prompt_text, model, model_output, scores{6 dimensions}, feedback{6 strings}, total, tokens_in, tokens_out, cost, created_at
- `workflows` — org_id, author_id, title, prompt_template, variables[], source_attempt_id, usage_count, visibility
- `assignments` — org_id, track_id, assignee_ids[], due_date, status
- `org_analytics_daily` — org_id, date, active_users, reps, median_score, per_dimension_medians

**API surface (rough):** public reads (`GET /tracks`, `/scenarios`, `/scenarios/{slug}`), authed writes (`POST /attempts` → returns graded result, `POST /workflows`), org-admin reads (`GET /orgs/{id}/analytics`, `/orgs/{id}/members`), org-admin writes (`POST /assignments`). Rate-limit `POST /attempts` hard — it is the only endpoint that costs real money.

## Build order

**Stage 1 — frontend only, no backend.** Homepage, Platform, For Teams, Pricing, exercise player, score screen, learner dashboard, team dashboard — all on mock JSON. Grading is canned (a deterministic scorer that checks for constraint keywords). This is demoable and shippable to Vercel in a weekend, and it is enough to show a recruiter or run a customer interview.

**Stage 2 — make it real.** FastAPI + Mongo, live LLM calls, real rubric grading, auth, the "try one now" homepage widget wired to the real grader.

**Stage 3 — sell it.** Team dashboard on real data, assignments, SSO, workflows library, fine-tuned grader trained on stage-2 attempt data.

## Open questions

- Name and domain — decide before building the header.
- BYOK vs. you pay for inference on the free tier. BYOK is safer; it also adds signup friction. Probably: BYOK optional, 10 free reps on your keys.
- Where the scenarios come from. 120 quality scenarios is the real product moat and the real work. Consider generating drafts with an LLM from job-function descriptions, then hand-editing. Start with 15 across three roles.
- Certification: is it a real assessment or a badge? If it is a badge, do not call it certification.
- Do not fabricate testimonials or customer logos in the mockup. Leave labeled placeholders.

## Reference sites

| Site | Steal this |
|---|---|
| [PromptCoach](https://www.promptcoachlabs.tech/) | Closest direct competitor. The evaluator interaction, the four-dimension score readout, BYOK model, token-cost framing. Note the gap: no teams offering. |
| [Section](https://www.sectionai.com/) | The B2B narrative. "You bought AI. That was the easy part." Problem-first hero, ROI-for-your-CFO framing, enterprise logo wall, case study with a hard number. |
| [Sana](https://sanalabs.com/) | Visual restraint. Generous whitespace, bold sans-serif, dark-on-light, product screenshots doing the explaining instead of illustrations. |
| [Learn Prompting](https://learnprompting.org/) | Course/track IA, certification framing, "3,000,000+ people" social proof bar, dual hero CTA (learn free / business solutions). |
| [HackAPrompt](https://www.hackaprompt.com/) | Competition and leaderboard mechanics — the model for a future team challenge mode. |
| [Exercism](https://exercism.org/) | The practice loop itself: exercise → submit → automated feedback → mentor notes → next. The single best structural reference for your player and dashboard. |
| [Prompting Guide](https://www.promptingguide.ai/) | Docs/reference-library layout for the Resources section. |
| [Coddy](https://coddy.tech/landing/prompts) | Interactive in-browser prompt lessons — reference for the "try one now" homepage widget. |
| [DataCamp for Business](https://www.datacamp.com/blog/best-online-platforms-for-enterprise-upskilling-in-ai) | Skill-assessment and team-reporting presentation for the For Teams page. |
| [Duolingo](https://www.duolingo.com/) | Streaks, levels, daily-rep framing. Borrow the retention loop, not the visual style. |

## Reference files

A 15-page wireframe sketch PDF (`promptworks_wireframes.pdf`) accompanies this brief and covers: header/footer, homepage, platform, tracks library, exercise player, score screen, learner dashboard, workflows, for-teams, team admin dashboard, pricing, resources, about, contact, and onboarding.
