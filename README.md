# Promptworks

**Work in Progress** 

**A prompt-engineering practice platform. Employees train prompting the way developers train on Exercism: real work scenarios, write a prompt, get scored against a fixed rubric, get a rewrite, do it again.**

Companies bought AI licences for most of the org. That line item is visible. Whether anyone's actual work changed is not — which is worse, because it is the part the board asks about. The default fix is a training vendor selling videos and a 92% "completion rate" that measures attendance, not skill.

Promptworks measures the skill instead: a score out of 30, per person, per dimension, tracked over time — and a library of validated prompts the team keeps using after the practice stops.

> **Status:** Stage 1 — frontend complete, running on mock data with a deterministic grader. No backend yet. See [Roadmap](#roadmap).

---

## Contents

- [`frontend/`](frontend) — the React application ([implementation notes](frontend/README.md))
- [`promptworks-brief.md`](promptworks-brief.md) — product and design brief, site map, data model
- [`promptworks-value-proposition.md`](promptworks-value-proposition.md) — the commercial argument, written for a CFO
- [`promptworks_wireframes.pdf`](promptworks_wireframes.pdf) — 15-page wireframe set this build follows

## Quick start

```bash
cd frontend && npm install && npm run dev
```

Then open `http://localhost:5173`. No API keys, no services, no `.env` — Stage 1 runs entirely in the browser.

---

## What is actually built

14 routes, ~5,300 lines of application code, zero runtime dependencies beyond React, React Router and Tailwind.

| | Screen | Notable behaviour |
|---|---|---|
| **Marketing** | Homepage | Live mini-exercise embedded in the page, no signup |
| | Platform, Tracks, For Teams, Pricing, Resources, About, Contact | Filter/search/sort on Tracks; Contact shows the payload Stage 2 would POST rather than faking a send |
| **App** | Exercise player + score screen | The core loop. Constraint checklist, live token/cost meter, six-dimension grading, side-by-side reference, line diff |
| | Learner dashboard | Rubric profile, weakest-dimension callout, queued scenarios |
| | Workflows library | `{{variable}}` templates filled live from a form |
| | Team admin dashboard | Proficiency heat map, assignments, benchmark, ROI model with editable assumptions |
| | Onboarding | Three questions, then straight into a rep — signup completes *after* the first score |

Content: 12 tracks, 10 fully playable scenarios across 8 of them, 5 workflow templates, 7-person team dataset.

### Things that work rather than merely render

- **The grader is real, just not a model yet.** It reads a prompt for what the rubric asks about and returns six integer scores plus six specific feedback strings.
- **The scenario teaches through the output.** Omit the output-format constraint and the mocked model returns prose instead of a subject line and body — the failure mode is demonstrated, not described.
- **The score screen's Diff tab** is an LCS line diff between your prompt and the reference.
- **The team ROI figure is a model, not a number.** Minutes-saved-per-run and loaded hourly rate are sliders; hours returned recomputes. Labelled an estimate, because it is one.

---

## The rubric is the spine

Six dimensions, scored 0–5, 30 total:

`Task clarity · Context supplied · Constraints · Output format · Role & audience · Examples (few-shot)`

They are defined once in [`data/rubric.js`](frontend/src/data/rubric.js) and every surface renders from that array — the score screen, the learner profile, the team heat map. That is a product decision expressed as an architectural one: a score only means something to a manager if it means the same thing on every screen, and the cheapest way to guarantee that is to make a second definition impossible to write.

## Stage 1 grading

[`lib/grader.js`](frontend/src/lib/grader.js) scores each dimension by checking the prompt against the scenario's context vocabulary, its constraint matchers, output-format skeletons, role/audience phrasing, and few-shot examples. It is pure and deterministic — same input, same score, same feedback, no network, no randomness.

It also has to be *monotonic* to be worth demoing, so it is:

| Prompt | Score |
|---|---|
| empty | 0 / 30 |
| "write an email about the denied claim" | 3 / 30 |
| a reasonable attempt | 15 / 30 |
| the reference prompt | 29 / 30 |

**The Stage 2 seam:** `gradePrompt()` returns `{ scores, feedback, total, tokens }`. Replacing it with `POST /attempts` returning that same shape requires no UI changes. The `match` arrays in [`data/scenarios.js`](frontend/src/data/scenarios.js) exist only for Stage 1 and are deleted when a grader model takes over.

---

## Architecture

```
frontend/src/
  data/         mock content — the Stage 2 swap surface
    rubric.js     six dimensions, fixed and ordered
    tracks.js     track catalogue
    scenarios.js  briefs, constraints, reference prompts, grader matchers
    org.js        learner, workflows, team, resources
  lib/
    grader.js     deterministic scorer + token/cost estimation
    diff.js       LCS line diff
  components/
    ui/           Button, Card, Chip, Stat, ScoreBar, Placeholder, Section
    layout/       2-row marketing header, 1-row app header, footer
    product/      RubricBreakdown, HeatMap, PromptBox, ScorePanel,
                  TryOneNow, ProductShot
  pages/          marketing pages; pages/app/ holds authenticated screens
```

**Stack:** React 19, Vite, Tailwind v4 (CSS-first `@theme` tokens, no config file), React Router 7. Deploys to Vercel as a static build; `vercel.json` rewrites all paths to `index.html` so client-side routes survive a refresh.

### Planned backend (Stage 2) -> 80% done

FastAPI on Render, MongoDB Atlas, a provider-agnostic LLM adapter behind one interface. Grading becomes rubric + LLM-as-judge returning strict JSON — six integers, six strings. Collections and the rough API surface are specified in the [brief](promptworks-brief.md#data-model-stage-2--mongo-collections).

One noted constraint: attempts and analytics are relational-shaped. Content stays in Mongo; if team reporting gets heavy, analytics moves to Postgres rather than being forced into documents.

---

## Engineering decisions worth explaining

**Product screenshots are real DOM, not images.** The hero, the For Teams teaser and the workflow card render the actual components. Marketing pages that embed PNGs drift from the product within one sprint; these cannot.

**Nothing is fabricated.** No invented testimonials, no logo wall, no dollar figures. Case-study slots ship as labelled placeholders. This is a constraint from the brief, and it is the right one — a customer-facing number that turns out to be decoration costs more than an empty box does.

**Verified without screenshots.** The screenshot pipeline in my dev environment was returning blank frames, so correctness was checked by querying the live DOM: all 14 routes rendered, console clean, and `scrollWidth === clientWidth` asserted at 375px and 1440px. That caught a genuine bug — a grid item's default `min-width: auto` let the heat map's scroll container widen its own column on mobile, breaking the page's horizontal overflow. Fixed at the `Card` primitive so it cannot recur.

**One spec inconsistency, resolved explicitly.** The wireframes specify both "~46 hours returned" and a workflow table summing to 123 runs; those cannot both drive the same estimate at any plausible minutes-saved figure. Resolved by making 307 org-wide runs the basis (307 × 9 min ÷ 60 = 46 h) and labelling the table "Top 5 of 307 runs", so the homepage teaser, the dashboard stat and the calculator all agree.

**Accessibility is not deferred.** Heat map cells carry their numeric value as text rather than encoding data in colour alone, and the sequential ramp keeps text contrast above 4.5:1 at every step.

---

## Roadmap

| Stage | Scope |
|---|---|
| **1 — done** | Frontend on mock data, deterministic grading, all screens, deployable |
| **2** | FastAPI + MongoDB, live model calls, real rubric grading via LLM-as-judge, auth, the homepage widget wired to the real grader, hard rate-limiting on `POST /attempts` — the only endpoint that costs money |
| **3** | Team dashboard on real data, assignments, SSO/SAML, and a small grader model fine-tuned on accumulated Stage 2 attempts — cheaper, faster and more consistent than prompting a general model, and the point at which the scoring becomes a moat |

**The real work is the scenarios.** 122 quality scenarios is the product moat, not the application code. Stage 1 ships 10 hand-written ones; the plan is LLM-drafted from job-function descriptions, then hand-edited.

---

## Open questions

Carried from the brief, deliberately unresolved:

- **BYOK vs. paid inference on the free tier.** Bring-your-own-key removes the largest cost risk but adds signup friction. Current lean: BYOK optional, 10 free reps on ours.
- **Is certification an assessment or a badge?** If it is a badge, it should not be called certification.
- **Pricing.** No figures until five customer conversations have happened.

---

*Built by Carlos Salcedo & RJ Cooke. Copyright reserved.*
