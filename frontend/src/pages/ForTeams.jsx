import {
  Button,
  Card,
  Chip,
  Placeholder,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import { HeatMap, HeatMapLegend } from "../components/product/HeatMap.jsx";
import { TEAM } from "../data/org.js";
import { RUBRIC, RUBRIC_MAX } from "../data/rubric.js";

const PILLARS = [
  {
    title: "Assign",
    body: "Push a track to a team or a person with a due date. Nudges go out by email; you do not chase anyone.",
  },
  {
    title: "Measure",
    body: "A six-dimension heat map across the org. Find the gap, assign the fix in one click.",
  },
  {
    title: "Benchmark",
    body: "Your org against the anonymised platform median, by role. This is the data-science surface.",
  },
  {
    title: "Ship",
    body: "Winning prompts become shared workflows. Usage is tracked and reported, including who never logged in.",
  },
];

const REPORTED = [
  ["Seats active", "Licences are not usage. This is usage."],
  ["Reps completed", "Per person, per week, per track."],
  ["Median rubric score", "Out of thirty, with the month-over-month change."],
  ["Per-dimension medians", "Where the org is strong and where it is not."],
  ["Workflow runs", "Plus unique users and helpful-ratings per workflow."],
  ["Token cost per run", "A fixable, quantified expense once it is visible."],
];

export default function ForTeams() {
  return (
    <>
      <Section className="pb-9 pt-14 md:pb-12 md:pt-21">
        <div className="mx-auto max-w-3xl text-center">
          <Chip tone="quiet">For teams</Chip>
          <h1 className="mt-6 h-display text-balance">
            You bought the licences. Nobody can prove they worked.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-70 text-pretty">
            Promptworks measures prompting skill the way you would measure any
            other one: assign it, score it, watch the number move.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button to="/contact" variant="filled" size="lg">
              Book a demo
            </Button>
            <Button to="/pricing" variant="bordered" size="lg">
              See plans
            </Button>
          </div>
        </div>
      </Section>

      {/* The three questions — straight from the value proposition doc. */}
      <Section tight className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="The three questions"
          title="Your board will ask these. Answer them with a number."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3">
          {[
            ["Who is actually using it?", "Seats active, reps completed, and the people who have never logged in — reported honestly."],
            ["Are they any good at it?", "Median rubric score out of thirty, per person, per dimension, tracked over time."],
            ["What did we get back?", "Workflow runs times minutes saved times your loaded rate. Your assumptions, visible and editable."],
          ].map(([q, a]) => (
            <div key={q} className="bg-paper p-7">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-balance">
                {q}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">{a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-ink pt-5">
              <h3 className="h-card">{p.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-70">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The six-point scale. This is the unit every number on the dashboard is
          denominated in, so it gets explained before the heat map, not after. */}
      <Section className="border-y border-rule">
        <SectionHead
          eyebrow="The six-point scale"
          title="One rubric. Six dimensions. Thirty points."
          lede="Every prompt anyone on your team writes is scored the same way, on the same six things. That is what makes one person's number comparable to another's — and what makes a team average mean something."
        />

        {/* The arithmetic, stated plainly. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink bg-ink text-paper sm:grid-cols-3">
          {[
            ["0–5", "per dimension", "Scored individually, never averaged away."],
            ["× 6", "dimensions", "Fixed. The same six on every screen."],
            [`= ${RUBRIC_MAX}`, "points total", "One number you can track month to month."],
          ].map(([big, label, sub]) => (
            <div key={label} className="bg-ink p-7">
              <p className="text-5xl font-semibold tracking-tight tabular-nums">
                {big}
              </p>
              <p className="mt-2 text-sm font-medium">{label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-paper/60">{sub}</p>
            </div>
          ))}
        </div>

        {/* The six, named. These are the heat map's columns. */}
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIC.map((d, i) => (
            <div key={d.key} className="bg-paper p-6">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs tabular-nums text-ink-30">0{i + 1}</span>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">
                  {d.name}
                </h3>
              </div>
              <p className="mt-2 pl-7 text-sm leading-relaxed text-ink-70">
                {d.line}
              </p>
              <p className="mt-3 pl-7 text-xs text-ink-30">Scored 0–5</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-[70ch] text-[15px] leading-relaxed text-ink-70">
          A completion rate tells you someone sat through a video. A score of{" "}
          <span className="font-semibold text-ink">18/{RUBRIC_MAX}</span> that
          becomes{" "}
          <span className="font-semibold text-ink">24/{RUBRIC_MAX}</span> over a
          quarter tells you what changed, on which dimension, and for whom. The
          heat map below is those same six columns, one row per person.
        </p>
      </Section>

      <Section className="bg-paper-2/50">
        <SectionHead
          eyebrow="Team admin dashboard"
          title="Proficiency, person by person, dimension by dimension."
          lede="Darker is stronger. The column that is pale across every row is the thing to fix first — and it is usually the same column."
        />
        <Card className="mt-12 bg-white">
          <HeatMap people={TEAM.people} />
          <HeatMapLegend note="Output format is the org-wide gap in this view." />
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <p className="eyebrow">Weakest dimension</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
              {TEAM.weakest.name} — team avg {TEAM.weakest.avg} / 5
            </h3>
            <p className="mt-2 text-sm text-ink-70">
              {TEAM.weakest.below} of {TEAM.weakest.of} people below 3.
            </p>
            <Button variant="filled" size="sm" className="mt-5">
              Assign “{TEAM.weakest.assign}” track
            </Button>
          </Card>
          <Card>
            <p className="eyebrow">Benchmark</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
              Your median{" "}
              <span className="font-semibold text-ink">{TEAM.medianScore}</span>{" "}
              vs. platform median{" "}
              <span className="font-semibold text-ink">{TEAM.benchmarkMedian}</span>{" "}
              for {TEAM.benchmarkPeer}.
            </p>
            <p className="mt-3 text-[13px] text-ink-50">
              Anonymised and aggregated. No other org's data is identifiable, and
              yours is not identifiable to them.
            </p>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <SectionHead
            eyebrow="What gets reported"
            title="Hard numbers as facts. Estimates labelled as estimates."
            lede="We do not hand you a pre-cooked ROI figure. You set the assumptions, you can change them, and you can defend the result to your own board because you built it."
          />
          <div className="divide-y divide-rule border-y border-rule">
            {REPORTED.map(([t, b]) => (
              <div key={t} className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
                <p className="text-sm font-medium">{t}</p>
                <p className="text-sm text-ink-70">{b}</p>
              </div>
            ))}
            <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <p className="text-sm font-medium">
                Hours returned{" "}
                <Chip tone="quiet" className="ml-1">
                  estimate
                </Chip>
              </p>
              <p className="text-sm text-ink-70">
                Workflow runs × minutes saved per run × your loaded hourly rate.
                Every input is set by you and visible on the dashboard.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="security" className="border-y border-rule bg-paper-2/40">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SectionHead eyebrow="Security" title="Reviewed before signature, not after." />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            {[
              ["SSO / SAML", "Your identity provider, your session policy."],
              ["SCIM provisioning", "Joiners and leavers handled where you already handle them."],
              ["Retention controls", "You decide how long attempts live. Deletion is real."],
              ["No training on your data", "Prompts and outputs are never used to train models."],
            ].map(([t, b]) => (
              <div key={t} className="bg-paper p-6">
                <h3 className="h-card">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-70">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHead
          eyebrow="Enterprise"
          title="End-to-end implementation, not a licence and a login."
          lede="Scenarios authored from your own SOPs and documents, a grader fine-tuned on your rubric, rollout and adoption reporting, a dedicated success manager and an SLA."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Card>
            <p className="eyebrow">The pilot we propose</p>
            <ul className="mt-5 space-y-4">
              {[
                ["Scope", "One team, 25–40 seats, 90 days. Fifteen scenarios written from that team's real work."],
                ["Baseline on day one", "Every participant's starting rubric score, recorded before any training. Without it there is nothing to compare to."],
                ["Reported at day 90", "Change in median score, per-dimension movement, workflows published and their run counts, token cost per run, hours returned on your assumptions."],
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
          </Card>

          <div className="space-y-6">
            <Card>
              <p className="eyebrow">Why this does not churn</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">
                Training gets completed, and completed things get cancelled. That
                is the entire history of the category. Workflows get used — a
                service team running a validated denial-explanation prompt nine
                times a shift does not cancel it.
              </p>
            </Card>
            <Placeholder title="Proof — placeholder">
              Reserved for a real case study with a real number. No fabricated
              logo wall and no invented customer quote in this mockup.
            </Placeholder>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button to="/contact" variant="filled" size="lg">
            Book a demo
          </Button>
          <Button to="/pricing" variant="bordered" size="lg">
            See plans
          </Button>
        </div>
      </Section>
    </>
  );
}
