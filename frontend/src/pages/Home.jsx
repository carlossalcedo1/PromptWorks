import { Link } from "react-router-dom";
import { RUBRIC } from "../data/rubric.js";
import { ROLE_TRACKS, ADVANCED_STRIP } from "../data/tracks.js";
import { TEAM } from "../data/org.js";
import {
  Button,
  Chip,
  Eyebrow,
  Placeholder,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import { TryOneNow } from "../components/product/TryOneNow.jsx";
import { PlayerShot, TeamShot, WorkflowShot } from "../components/product/ProductShot.jsx";

const TRUST = [
  "Scored in seconds by a fine-tuned grader",
  "120+ role-based scenarios",
  "SSO ready — your prompts never train our models",
];

const VALUE_PROP = [
  {
    who: "For the employee",
    line: "Stop guessing. Get a score, a rewrite, and the reason the rewrite was better.",
    sub: "Ten minutes a week, not a half-day workshop.",
  },
  {
    who: "For the manager",
    line: "See who is actually fluent — not who finished the video.",
    sub: "Find the team's weakest dimension and assign the fix in one click.",
  },
  {
    who: "For the business",
    line: "Fewer rewrites, fewer wasted tokens, fewer hours. Measured, not claimed.",
    sub: "A skill baseline that moves, plus a library of prompts the team keeps using.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick a scenario",
    body: "A real task from your role's track. Constraints stated up front, the way a real brief states them.",
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
    title: "Compare and ship",
    body: "Reference prompt side by side with yours, plus a diff. Save the better one as a reusable team workflow.",
  },
];

const PRICING_TEASER = [
  { name: "Free", line: "Foundations track, 10 graded reps a month, community prompt library." },
  { name: "Pro", line: "All tracks, unlimited reps, model comparison, certification." },
  { name: "Teams", line: "Admin dashboard, assignments, team workflow library, SSO.", featured: true },
  { name: "Enterprise", line: "Custom scenarios from your SOPs, a grader fine-tuned on your rubric, end-to-end rollout." },
];

export default function Home() {
  return (
    <>
      {/* 2 — Hero */}
      <Section className="pb-9 pt-12 md:pb-12 md:pt-18">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="h-display text-balance">
            Your team already has AI. Teach them how to ask.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-70 text-pretty md:text-xl">
            Promptworks turns prompt engineering into reps — real work scenarios,
            scored feedback, and a dashboard that shows the skill actually moving.
          </p>
          <p className="mt-4 text-[15px] text-ink-50">
            Free for individuals. Team plans start where the ROI does.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button to="/onboarding" variant="filled" size="lg">
              Start practicing free
            </Button>
            <Button to="/contact" variant="bordered" size="lg">
              Book a demo
            </Button>
          </div>
        </div>

        {/* Show the product, not an illustration. */}
        <div className="mt-14 md:mt-16">
          <PlayerShot />
        </div>
      </Section>

      {/* 3 — Trust badges */}
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

      {/* 4 — Value proposition */}
      <Section>
        <SectionHead
          eyebrow="Value proposition"
          title="Why do we need this?"
          lede="Three people have to say yes, and each of them is asking a different question."
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
            The full business case →
          </Link>
        </div>
      </Section>

      {/* 5 — The problem */}
      <Section className="bg-ink text-paper" >
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow text-paper/50">The problem</p>
            <h2 className="mt-4 h-section text-balance">
              The tools are on everyone's desk. The prompts are the bottleneck.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">
              You bought the licences and that line item is visible. Almost
              nobody's actual work changed, and that part is not visible — which
              is worse.
            </p>
          </div>

          <div className="grid gap-px self-start overflow-hidden rounded-2xl bg-paper/15">
            {[
              [
                "Who is actually using it?",
                "Licence seats are not usage, and usage is not skill.",
              ],
              [
                "Are they any good at it?",
                "Nobody has a number. A completion rate measures attendance.",
              ],
              [
                "What did we get back?",
                "The question the board asks last and you answer first.",
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

      {/* 6 — How it works */}
      <Section>
        <SectionHead
          eyebrow="How it works"
          title="One loop, repeated until it is a habit."
          lede="Scenario, prompt, score, rewrite, ship. Ten minutes at a time."
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

      {/* 7 — Try one now */}
      <Section id="try" className="bg-paper-2/50">
        <SectionHead
          eyebrow="Try one now"
          title="Write one prompt. Get one real score."
          lede="No signup, no email. The same rubric your team would be measured against."
        />
        <div className="mt-12">
          <TryOneNow />
        </div>
      </Section>

      {/* 8 — Tracks by role */}
      <Section>
        <SectionHead
          eyebrow="Tracks by role"
          title="Scenarios from the job, not from a textbook."
          lede="Foundations first, then your role, then the advanced material. Preview any three scenarios free."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_TRACKS.map((t) => (
            <Link
              key={t.slug}
              to="/tracks"
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

      {/* 9 — The rubric */}
      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="The rubric"
          title="Six dimensions, identical everywhere in the product."
          lede="The same six on your score screen, your dashboard and your manager's heat map. That is what makes the number comparable between two people."
        />
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIC.map((d, i) => (
            <div key={d.key}>
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs tabular-nums text-ink-30">
                  0{i + 1}
                </span>
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
          Scored 0–5 each. Thirty points total.
        </p>
      </Section>

      {/* 10 — Advanced tracks strip */}
      <Section tight>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Eyebrow>Advanced tracks</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {ADVANCED_STRIP.map((t) => (
              <Link key={t.slug} to="/tracks">
                <Chip className="transition-colors hover:border-ink hover:text-ink">
                  {t.title}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* 11 — AI-powered workflows */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="AI-powered workflows"
              title="Practice is where prompts get good. Workflows are where they get used."
              lede="Save a validated prompt with variables, publish it to the team library, and track how often it runs. Non-experts run an expert's prompt without writing one."
            />
            <ul className="mt-8 space-y-3.5">
              {[
                "Prompt template with {{variable}} slots filled by a small form.",
                "The source attempt stays linked — you can see how it scored.",
                "Usage, unique users and helpful-ratings reported per workflow.",
              ].map((l) => (
                <li key={l} className="flex gap-3 text-[15px] text-ink-70">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-lg rounded-xl bg-paper-2/70 p-5 text-sm leading-relaxed text-ink-70">
              Realistically about 15% of any team will practice. The workflow
              library is how the other 85% produce expert-quality output anyway —
              one person gets the prompt right, forty people run it.
            </p>
          </div>
          <WorkflowShot />
        </div>
      </Section>

      {/* 12 — For Teams teaser */}
      <Section className="bg-paper-2/50">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="For teams"
              title="Proficiency, adoption, hours returned."
              lede="Assign a track, watch the six-dimension heat map, find the gap and assign the fix. Benchmarked against the anonymised platform median for your role."
            />
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                ["Median score", `${TEAM.medianScore}/30`, `+${TEAM.medianDelta} this month`],
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
            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/for-teams" variant="filled">
                See the team dashboard
              </Button>
              <Button to="/contact" variant="bordered">
                Book a demo
              </Button>
            </div>
          </div>
          <TeamShot />
        </div>
      </Section>

      {/* 13 — Security & data handling */}
      <Section id="security">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SectionHead
            eyebrow="Security & data handling"
            title="Answered before you ask."
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            {[
              ["No training on your data", "Prompts and outputs are never used to train models. Not ours, not a provider's."],
              ["SSO / SAML and SCIM", "Provisioning and deprovisioning through your identity provider. Teams tier and above."],
              ["Configurable retention", "You set how long attempts are kept. Deletion is real deletion."],
              ["Security review before signature", "Not after. Documentation is available before the first call if you want it."],
            ].map(([t, b]) => (
              <div key={t} className="bg-paper p-6">
                <h3 className="h-card">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 14 — Case study slot */}
      <Section tight>
        <Placeholder title="Case study — placeholder">
          Reserved for the first pilot result: change in median rubric score,
          per-dimension movement, workflows published and their run counts. It
          stays empty until a real customer has real numbers. No fabricated
          quotes, no invented logo wall.
        </Placeholder>
      </Section>

      {/* 15 — Pricing teaser */}
      <Section>
        <SectionHead
          eyebrow="Pricing"
          title="Free for one person. Priced for a team."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TEASER.map((p) => (
            <div
              key={p.name}
              className={p.featured ? "bg-paper-2/80 p-6" : "bg-paper p-6"}
            >
              <div className="flex items-center gap-2">
                <h3 className="h-card">{p.name}</h3>
                {p.featured && <Chip tone="signal">Most teams</Chip>}
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-70">{p.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button to="/pricing" variant="bordered">
            Compare plans
          </Button>
          <p className="text-[13px] text-ink-30">
            Figures land after five customer conversations.
          </p>
        </div>
      </Section>

      {/* 16 — Final CTA */}
      <Section className="bg-ink text-paper">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="h-section text-balance">
            Give your team ten minutes a week.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-paper/70">
            One rep. One score. One prompt worth keeping.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              to="/onboarding"
              size="lg"
              className="bg-paper text-ink hover:bg-paper-2"
            >
              Start practicing free
            </Button>
            <Button
              to="/contact"
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
