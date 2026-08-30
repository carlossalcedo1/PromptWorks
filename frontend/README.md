# Promptworks — Stage 1 frontend

Frontend-only build of the Promptworks prototype: React (Vite) + Tailwind v4 +
React Router. No backend, mock data, deterministic grading. Built to the
`promptworks-brief.md` site map, the wireframe PDF, and the value-proposition
document.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## Routes

| Route | Screen |
|---|---|
| `/` | Homepage — all 17 sections in brief order |
| `/platform` | Platform / how it works |
| `/tracks` | Tracks & challenge library (filter, search, sort) |
| `/for-teams` | The money page |
| `/pricing` | Four tiers, no dollar figures |
| `/resources` | Prompt library, docs-style layout |
| `/about` | Technical background lives here, not the homepage |
| `/contact` | Four-field demo request |
| `/onboarding` | Three screens, then straight into a rep |
| `/dashboard` | Learner dashboard |
| `/practice` | In-app challenge library (search is scoped here) |
| `/practice/:slug` | **Exercise player + score screen — the core screen** |
| `/workflows` | Workflow library with live `{{variable}}` filling |
| `/team` | Team admin dashboard, heat map, editable ROI assumptions |

## How the pieces fit

```
src/
  data/         mock content — swap for API reads in stage 2
    rubric.js     the six dimensions (fixed, ordered, used everywhere)
    tracks.js     track catalogue
    scenarios.js  scenario briefs, constraints, reference prompts
    org.js        learner, workflows, team, resources
  lib/
    grader.js     stage-1 deterministic scorer + token/cost estimates
    diff.js       line diff for the score screen's Diff tab
  components/
    ui/           Button, Card, Chip, Stat, ScoreBar, Placeholder, Section
    layout/       marketing header (2 rows), app header (1 row), footer
    product/      RubricBreakdown, HeatMap, PromptBox, ScorePanel,
                  TryOneNow, ProductShot
  pages/          marketing pages; pages/app/ holds authenticated screens
```

### The rubric is the spine

`data/rubric.js` defines six dimensions in a fixed order. The score screen, the
learner profile and the team heat map all render from that one array, so a
number means the same thing on every screen. Change it in one place.

### Stage-1 grading

`lib/grader.js` scores a prompt 0–5 on each dimension by reading it for what the
rubric actually asks about — the scenario's context vocabulary, its constraint
matchers, format skeletons, role/audience phrasing and few-shot examples. It is
deterministic: the same prompt always produces the same score and the same
feedback strings.

It behaves monotonically, which is what makes it demoable:

| Prompt | Score |
|---|---|
| empty | 0/30 |
| "write an email about the denied claim" | 3/30 |
| a reasonable attempt | 15/30 |
| the reference prompt | 29/30 |

The canned model output also reacts to the score — if you never specified an
output format, the model comes back with prose instead of a subject line and
body. That is the lesson the scenario is teaching.

### Stage 2 seam

Replace `gradePrompt()` with `POST /attempts` returning the same shape — six
integer scores, six feedback strings, a total — and the UI needs no changes. The
`match` arrays in `scenarios.js` exist only for stage 1 and go away when a
grader model does the scoring.

## Deliberate decisions

- **Product shots are real DOM, not images** (`components/product/ProductShot.jsx`).
  The brief asks the homepage to show the product rather than an abstract
  illustration, and rendering the actual components keeps the marketing page
  honest as the app changes.
- **No search in the marketing header.** Search lives in `/practice`, scoped to
  the challenge library.
- **The reference prompt is unreachable before submission.** That is the exercise.
- **Placeholders stay empty.** No fabricated testimonials, logos or case study.
  The case-study slots are labelled placeholders.
- **No dollar figures.** Per the brief — price after five customer conversations.
- **"Hours returned" is labelled an estimate** and its inputs (minutes saved per
  run, loaded hourly rate) are sliders on the team dashboard. The number moves
  when you change your assumptions, because they are your assumptions.
- The contact form has no backend; submitting shows the JSON stage 2 would post
  rather than pretending a message was sent.

## Deploying

`vercel.json` rewrites all paths to `index.html` so client-side routes survive a
refresh. Build command `npm run build`, output `dist`.
