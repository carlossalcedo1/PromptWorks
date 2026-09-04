import { Link } from "react-router-dom";
import { RUBRIC, RUBRIC_MAX } from "../data/rubric.js";
import { ROLE_TRACKS, ADVANCED_STRIP } from "../data/tracks.js";
import { TEAM } from "../data/org.js";
import {
  Button,
  Card,
  Chip,
  Eyebrow,
  Placeholder,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import { HeatMap, HeatMapLegend } from "../components/product/HeatMap.jsx";
import { TryOneNow } from "../components/product/TryOneNow.jsx";
import { PlayerShot, TeamShot, WorkflowShot } from "../components/product/ProductShot.jsx";

const TRUST = [
  "Scored in seconds by a fine-tuned grader",
  "120+ scenarios from real work",
  "Free to start — no card, no signup to try one",
];

// The individual comes first now. The team framing is the third card, not the
// first, and it says out loud that it is optional.
const VALUE_PROP = [
  {
    who: "For you",
    line: "Stop guessing. Get a score, a rewrite, and the reason the rewrite was better.",
    sub: "Ten minutes a week, not a half-day workshop.",
  },
  {
    who: "For your work",
    line: "The prompts that score well become templates you actually reuse.",
    sub: "Your own library, built out of the reps you already did.",
  },
  {
    who: "For a team, optionally",
    line: "Bring colleagues and the same score becomes a picture of the team.",
    sub: "Nothing about practising on your own depends on it.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick a scenario",
    body: "A real task from a track you care about. Constraints stated up front, the way a real brief states them.",
  },
  {
    n: "2",
    title: "Write your prompt",
    body: "Scenario and constraint checklist on the left, prompt box and model selector on the right. Token cost updates as you type.",
  },
  {
    n: "3",
    title: "Get scored",
    body: "The prompt runs against a live model. A grader scores six rubric dimensions 0–5 and returns specific feedback.",
  },
  {
    n: "4",
    title: "Compare and keep",
    body: "Reference prompt side by side with yours, plus a diff. Save the better one as a workflow you can run again.",
  },
];

const PRICING_TEASER = [
  {
    name: "Free",
    line: "5,000 tokens every month, Foundations track, community prompt library. Then bring your own key.",
  },
  {
    name: "Pro",
    line: "$5 a month. 250,000 tokens, all tracks, model comparison, certification.",
    featured: true,
  },
  {
    name: "Enterprise",
    line: "Seats, admin dashboard, SSO, custom scenarios from your SOPs. Only if you need it.",
  },
];

/* --- The business half, folded in from the old /for-teams page ----------- */

const BUSINESS_QUESTIONS = [
  [
    "Who is actually using it?",
    "Seats active, reps completed, and the people who have never logged in — reported honestly.",
  ],
  [
    "Are they any good at it?",
    "Median rubric score out of thirty, per person, per dimension, tracked over time.",
  ],
  [
    "What did we get back?",
    "Workflow runs times minutes saved times your loaded rate. Your assumptions, visible and editable.",
  ],
];

const BUSINESS_PILLARS = [
  [
    "Assign",
    "Push a track to a team or a person with a due date. Nudges go out by email; you do not chase anyone.",
  ],
  [
    "Measure",
    "A six-dimension heat map across the org. Find the gap, assign the fix in one click.",
  ],
  [
    "Benchmark",
    "Your org against the anonymised platform median, by role.",
  ],
  [
    "Ship",
    "Winning prompts become shared workflows. Usage is tracked and reported.",
  ],
];

export default function Home() {
  return (
    <>
      {/* Build notice. Sits above the hero rather than in the header, so it
          is scoped to the homepage and can come down in one edit. */}
      <div className="px-6 pt-4 md:px-10">
        <div className="mx-auto w-full max-w-[1180px]">
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] leading-relaxed text-red-800">
            Project is actively being worked on and website content may change
            at any time.{" "}
            <Link
              to="/contact"
              className="font-medium underline underline-offset-2 hover:text-red-900"
            >
              Please reach out to us
            </Link>{" "}
            with any questions.
          </p>
        </div>
      </div>

      {/* Hero — written for one person practising, not for a buyer. */}
      <Section className="pb-9 pt-12 md:pb-12 md:pt-18">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="h-display text-balance">
            You use AI every day. Nobody taught you how to ask.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-70 text-pretty md:text-xl">
            Promptworks turns prompt engineering into reps — real scenarios,
            scored feedback, and a number that shows the skill actually moving.
          </p>
          <p className="mt-4 text-[15px] text-ink-50">
            Free to start, for anyone. Teams are an option, not the point.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button to="/onboarding" variant="filled" size="lg">
              Start practicing free
            </Button>
            <Button to="/#try" variant="bordered" size="lg">
              Try one now
            </Button>
          </div>
        </div>

        {/* Show the product, not an illustration. */}
        <div className="mt-14 md:mt-16">
          <PlayerShot />
        </div>
      </Section>

      {/* Trust badges */}
      <Section tight className="py-7 md:py-9">
        <div className="grid gap-4 border-y border-rule py-6 sm:grid-cols-3">
          {TRUST.map((t) => (
            <p key={t} className="flex items-start gap-2.5 text-sm text-ink-70">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
              {t}
            </p>
          ))}
        </div>
      </Section>

      {/* Value proposition */}
      <Section>
        <SectionHead
          eyebrow="Why bother"
          title="Practice is the part everyone skips."
          lede="Everyone has the tools. Almost nobody has done a single rep with feedback on it."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3">
          {VALUE_PROP.map((v) => (
            <div key={v.who} className="bg-paper p-7 md:p-8">
              <Eyebrow>{v.who}</Eyebrow>
              <p className="mt-4 text-[19px] font-medium leading-snug tracking-[-0.015em] text-balance">
                {v.line}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-50">{v.sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            to="/why"
            className="text-[15px] font-medium underline underline-offset-4 hover:text-signal"
          >
            The longer argument →
          </Link>
        </div>
      </Section>

      {/* The problem */}
      <Section className="bg-ink text-paper">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-paper/50">The problem</p>
            <h2 className="mt-4 h-section text-balance">
              The tool is on your desk. The prompt is the bottleneck.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
              You have access to a model that can do most of the writing in your
              job. What you get out of it is decided almost entirely by how you
              ask — and nobody has ever given you feedback on that.
            </p>
          </div>

          <div className="grid gap-px self-start overflow-hidden rounded-2xl bg-paper/15">
            {[
              [
                "Am I any good at this?",
                "You have no number, and neither does anyone you work with.",
              ],
              [
                "Why did that answer come out badly?",
                "Usually one missing constraint. Knowing which one is the skill.",
              ],
              [
                "How do I keep the good one?",
                "The prompt that worked is three days back in a chat log.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="bg-ink p-6">
                <p className="text-[17px] font-medium">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-paper/60">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHead
          eyebrow="How it works"
          title="One loop, repeated until it is a habit."
          lede="Scenario, prompt, score, rewrite, keep. Ten minutes at a time."
        />
        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-ink pt-5">
              <span className="text-sm font-semibold tabular-nums text-signal">
                {s.n}
              </span>
              <h3 className="mt-3 h-card">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-70">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Try one now */}
      <Section id="try" className="bg-paper-2/50">
        <SectionHead
          eyebrow="Try one now"
          title="Write one prompt. Get one real score."
          lede="No signup, no email. The same rubric everything else here is measured against."
        />
        <div className="mt-12">
          <TryOneNow />
        </div>
      </Section>

      {/* Scenarios */}
      <Section>
        <SectionHead
          eyebrow="Scenarios"
          title="Tasks from the job, not from a textbook."
          lede="Foundations first, then the work you actually do, then the advanced material. Preview any three scenarios free."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_TRACKS.map((t) => (
            <Link
              key={t.slug}
              to="/scenarios"
              className="group bg-paper p-6 transition-colors hover:bg-paper-2/60"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="h-card">{t.title}</h3>
                <span className="text-xs text-ink-30">{t.count}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-70">{t.blurb}</p>
              <p className="mt-4 text-[13px] text-ink-50">
                {t.count} scenarios · {t.level}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* The rubric */}
      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="The rubric"
          title="Six dimensions, identical everywhere in the product."
          lede="The same six on your score screen, your dashboard, and every comparison the product makes. That is what makes the number mean something month to month."
        />
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIC.map((d, i) => (
            <div key={d.key}>
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs tabular-nums text-ink-30">0{i + 1}</span>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">
                  {d.name}
                </h3>
              </div>
              <p className="mt-2 pl-7 text-sm leading-relaxed text-ink-70">
                {d.line}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-50">
          Scored 0–5 each. {RUBRIC_MAX} points total.
        </p>
      </Section>

      {/* Advanced tracks strip */}
      <Section tight>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Eyebrow>Advanced tracks</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {ADVANCED_STRIP.map((t) => (
              <Link key={t.slug} to="/scenarios">
                <Chip className="transition-colors hover:border-ink hover:text-ink">
                  {t.title}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* Workflows */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Workflows"
              title="Practice is where prompts get good. Workflows are where they get used."
              lede="Save a prompt that scored well with variable slots, then run it again next week without rewriting it. Keep it to yourself or publish it to a team."
            />
            <ul className="mt-8 space-y-3.5">
              {[
                "Prompt template with {{variable}} slots filled by a small form.",
                "The source attempt stays linked — you can see how it scored.",
                "Usage and helpful-ratings reported per workflow.",
              ].map((l) => (
                <li key={l} className="flex gap-3 text-[15px] text-ink-70">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-lg rounded-xl bg-paper-2/70 p-5 text-sm leading-relaxed text-ink-70">
              This is the half that survives a busy week. The reps make you
              better; the workflow means you do not have to be at your best to
              get a good output.
            </p>
          </div>
          <WorkflowShot />
        </div>
      </Section>

      {/* For business — the old /for-teams page, folded in as one optional
          section. Everything above works for one person with no org at all. */}
      <Section id="business" className="border-y border-rule bg-paper-2/50">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>For business</Eyebrow>
            <Chip tone="quiet">Optional</Chip>
          </div>
          <h2 className="mt-4 h-section text-balance">
            If it is a team, the same score becomes a picture of the team.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-70 text-pretty">
            Nothing above needs an employer. But if you bought AI licences for
            forty people and cannot say whether any of them got better, this is
            the part that answers it — the same rubric, aggregated.
          </p>
        </div>

        {/* The three questions a buyer actually has. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3">
          {BUSINESS_QUESTIONS.map(([q, a]) => (
            <div key={q} className="bg-paper p-7">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-balance">
                {q}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">{a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESS_PILLARS.map(([title, body]) => (
            <div key={title} className="border-t border-ink pt-5">
              <h3 className="h-card">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-70">{body}</p>
            </div>
          ))}
        </div>

        {/* The admin dashboard, shown rather than described. */}
        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <Card className="bg-white">
            <p className="eyebrow">Team admin dashboard</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
              Proficiency, person by person, dimension by dimension.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-70">
              Darker is stronger. The column that is pale across every row is the
              thing to fix first — and it is usually the same column.
            </p>
            <div className="mt-6">
              <HeatMap people={TEAM.people} />
              <HeatMapLegend note="Output format is the org-wide gap in this view." />
            </div>
          </Card>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              {[
                [
                  "Median score",
                  `${TEAM.medianScore}/${RUBRIC_MAX}`,
                  `+${TEAM.medianDelta} this month`,
                ],
                ["Weekly reps", TEAM.repsThisWeek, "8.2 per active user"],
                ["Hours returned", `~${TEAM.hoursReturned}`, "your assumptions"],
              ].map(([label, value, sub]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-50">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
                  <p className="mt-1 text-[13px] text-ink-50">{sub}</p>
                </div>
              ))}
            </div>

            <Card>
              <p className="eyebrow">Weakest dimension</p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                {TEAM.weakest.name} — team avg {TEAM.weakest.avg} / 5
              </h3>
              <p className="mt-2 text-sm text-ink-70">
                {TEAM.weakest.below} of {TEAM.weakest.of} people below 3. Assign
                the “{TEAM.weakest.assign}” track in one click.
              </p>
            </Card>

            <Card>
              <p className="eyebrow">Estimates, labelled as estimates</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">
                We do not hand you a pre-cooked ROI figure. Hours returned is
                workflow runs × minutes saved × your loaded rate — every input
                set by you, visible on the dashboard, and defensible to your own
                board because you built it.
              </p>
            </Card>
          </div>
        </div>

        {/* The pilot, with the kill criterion stated up front. */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Card className="bg-white">
            <p className="eyebrow">The pilot we propose</p>
            <ul className="mt-5 space-y-4">
              {[
                [
                  "Scope",
                  "One team, 25–40 seats, 90 days. Fifteen scenarios written from that team's real work.",
                ],
                [
                  "Baseline on day one",
                  "Every participant's starting rubric score, recorded before any training. Without it there is nothing to compare to.",
                ],
                [
                  "Reported at day 90",
                  "Change in median score, per-dimension movement, workflows published and their run counts, token cost per run, hours returned on your assumptions.",
                ],
              ].map(([t, b]) => (
                <li key={t} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-5">
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-sm leading-relaxed text-ink-70">{b}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-ink bg-ink p-5 text-paper">
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/50">
                Kill criterion, agreed up front
              </p>
              <p className="mt-2.5 text-[15px] leading-relaxed">
                If the median score has not moved and fewer than five workflows
                are in active use, the pilot failed and you do not renew. Stated
                in writing.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/contact" variant="filled">
                Book a demo
              </Button>
              <Button to="/pricing" variant="bordered">
                See plans
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <TeamShot />
            <Card>
              <p className="eyebrow">Why this does not churn</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">
                Training gets completed, and completed things get cancelled.
                Workflows get used — a service team running a validated
                denial-explanation prompt nine times a shift does not cancel it.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* Security & data handling */}
      <Section id="security">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SectionHead
            eyebrow="Security & data handling"
            title="Answered before you ask."
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            {[
              [
                "No training on your data",
                "Prompts and outputs are never used to train models. Not ours, not a provider's.",
              ],
              [
                "SSO / SAML and SCIM",
                "Provisioning through your identity provider. Enterprise only — an individual account needs none of it.",
              ],
              [
                "Configurable retention",
                "You set how long attempts are kept. Deletion is real deletion.",
              ],
              [
                "Security review before signature",
                "Not after. Documentation is available before the first call if you want it.",
              ],
            ].map(([t, b]) => (
              <div key={t} className="bg-paper p-6">
                <h3 className="h-card">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Case study slot */}
      <Section tight>
        <Placeholder title="Case study — placeholder">
          Reserved for the first pilot result: change in median rubric score,
          per-dimension movement, workflows published and their run counts. It
          stays empty until a real customer has real numbers. No fabricated
          quotes, no invented logo wall.
        </Placeholder>
      </Section>

      {/* Pricing teaser */}
      <Section>
        <SectionHead eyebrow="Pricing" title="5,000 tokens free, every month." />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_TEASER.map((p) => (
            <div
              key={p.name}
              className={p.featured ? "bg-paper-2/80 p-6" : "bg-paper p-6"}
            >
              <div className="flex items-center gap-2">
                <h3 className="h-card">{p.name}</h3>
                {p.featured && <Chip tone="signal">Most people</Chip>}
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-70">{p.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button to="/pricing" variant="bordered">
            Compare plans
          </Button>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="bg-ink text-paper">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="h-section text-balance">
            Give yourself ten minutes a week.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-paper/70">
            One rep. One score. One prompt worth keeping.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              to="/onboarding"
              variant="custom"
              size="lg"
              className="bg-paper text-ink hover:bg-paper-2"
            >
              Start practicing free
            </Button>
            <Button
              to="/contact"
              variant="custom"
              size="lg"
              className="border border-paper/30 text-paper hover:bg-paper/10"
            >
              Book a demo
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
