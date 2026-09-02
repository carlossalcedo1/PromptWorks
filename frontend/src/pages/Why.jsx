import {
  Button,
  Card,
  Chip,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";

/**
 * "Why prompt training?" — the business argument, in specifics.
 *
 * This is the detailed version of the homepage value proposition, written for
 * the person signing the invoice rather than the person writing the prompts.
 * Plain language throughout: no rubric mechanics, no model talk. For Teams
 * sells the dashboard; this page argues the case.
 */

const BOARD_QUESTIONS = [
  ["Who is actually using it?", "Seats bought is not seats used, and seats used is not skill."],
  ["Are they any good at it?", "Nobody has a number. A completion rate measures attendance."],
  ["What did we get back?", "The question asked last, and the one you have to answer first."],
];

const REASONS = [
  {
    title: "A number that means something",
    body: "A score out of 30, per person, tracked month to month. A completion rate tells you who sat through the video. This tells you who can actually do the work.",
  },
  {
    title: "An asset that stays",
    body: "The prompts that score well get saved as fill-in-the-blank templates. Training walks out the door when the employee does. The template library does not — and new hires inherit it on day one.",
  },
  {
    title: "Reach past the volunteers",
    body: "Realistically, about 15% of any team will practice. The other 85% still send expert-quality work, because they are running a template someone else already got right.",
  },
  {
    title: "A cost line that goes down",
    body: "Every prompt is scored on efficiency, not just quality. A team paying more than it needs for the same answer is a fixable, quantified expense — but only once somebody is measuring it.",
  },
  {
    title: "Fewer rewrites",
    body: "The expensive part of AI at work is not the subscription. It is the draft that comes back wrong and gets redone by hand, by someone whose time you are already paying for.",
  },
  {
    title: "Ten minutes a week",
    body: "Not a half-day workshop, not a video course nobody finishes, and no one leaves their desk. The practice fits inside the working day.",
  },
];

const VS_VENDOR = [
  {
    title: "A number, not a completion rate",
    vendor: "92% of staff completed the course.",
    us: "Median score 22 out of 30, up 3 this quarter, weakest on output format — with the 18 people below a 3 named.",
  },
  {
    title: "An asset, not an expense",
    vendor: "You buy a claim about human capital that leaves when the human does.",
    us: "You end up owning a library of validated prompts. It stays, it compounds, and it is inventory rather than a subscription line.",
  },
  {
    title: "Coverage, not attendance",
    vendor: "Whoever showed up learned something. Probably.",
    us: "One person gets the prompt right and forty people run it — including everyone who never logged in.",
  },
  {
    title: "A cost you can act on",
    vendor: "No visibility into what the AI spend is actually buying.",
    us: "Cost per run is measured and scored, so overspending becomes a line item somebody owns.",
  },
];

const HARD = [
  "Seats active",
  "Reps completed",
  "Median score out of 30, and its month-over-month change",
  "Per-dimension medians across the team",
  "Workflow runs, and unique users per workflow",
  "Helpful-rating per workflow",
  "Cost per run",
];

const ESTIMATED = [
  "Hours returned = workflow runs × minutes saved per run × your loaded hourly rate",
];

const OBJECTIONS = [
  {
    q: "“Prompting will matter less as models improve.”",
    a: "Possibly true. The workflow library is the hedge — a versioned library of validated, measured AI workflows keeps its value even if the term goes out of fashion.",
  },
  {
    q: "“Our people won't use it.”",
    a: "Most won't practice. That is priced in, and it is exactly why the workflow library exists. Adoption is reported honestly, including the people who never log in.",
  },
  {
    q: "“What happens to our data?”",
    a: "Prompts and outputs are never used to train models. SSO/SAML, SCIM provisioning, configurable retention, and a security review before signature rather than after.",
  },
  {
    q: "“We already have a shared prompt doc.”",
    a: "Everyone does, and nobody opens it, because nothing in it has a quality score, a version, an owner or a usage count. That is the whole difference.",
  },
];

export default function Why() {
  return (
    <>
      <Section className="pb-7 pt-14 md:pb-9 md:pt-21">
        <div className="mx-auto max-w-3xl text-center">
          <Chip tone="quiet">Why prompt training?</Chip>
          <h1 className="mt-6 h-display text-balance">
            You bought the tools. The skill was the part nobody budgeted for.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-70 text-pretty">
            This page is the argument, in specifics, with no jargon. Nothing
            below depends on understanding how any of it works underneath.
          </p>
        </div>
      </Section>

      {/* The three questions the argument has to answer. */}
      <Section tight className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="Start here"
          title="Three questions you cannot currently answer."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule md:grid-cols-3">
          {BOARD_QUESTIONS.map(([q, a]) => (
            <div key={q} className="bg-paper p-7">
              <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-balance">
                {q}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">{a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-[70ch] text-[15px] leading-relaxed text-ink-70">
          The default fix is a training vendor: videos, a completion
          certificate, and a 92% completion rate that measures attendance rather
          than skill. It answers none of the three.
        </p>
      </Section>

      {/* The six reasons. */}
      <Section>
        <SectionHead
          eyebrow="What you get back"
          title="Six reasons, in the order a finance team tends to care about them."
        />
        <ul className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
          {REASONS.map((r) => (
            <li key={r.title} className="flex gap-4">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">
                  {r.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-70">
                  {r.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-12 max-w-[70ch] border-t border-rule pt-7 text-[15px] leading-relaxed text-ink-70">
          The short version: you are already paying for the licences and for the
          hours spent rewriting what comes back. This makes both of those numbers
          visible, and then makes them smaller.
        </p>
      </Section>

      {/* Against the alternative. */}
      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="Versus a training vendor"
          title="The same budget, spent on something that leaves a mark."
        />
        <div className="mt-12 divide-y divide-rule border-y border-rule">
          {VS_VENDOR.map((v) => (
            <div key={v.title} className="py-6">
              <h3 className="text-[17px] font-semibold tracking-[-0.015em]">
                {v.title}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 md:gap-10">
                <div className="rounded-xl bg-paper p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-30">
                    A training vendor
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-50">
                    {v.vendor}
                  </p>
                </div>
                <div className="rounded-xl border border-signal/25 bg-signal-wash/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-signal-ink">
                    Promptworks
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-70">
                    {v.us}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* How the return is calculated. */}
      <Section>
        <SectionHead
          eyebrow="How the return is calculated"
          title="Facts reported as facts. Estimates labelled as estimates."
          lede="We do not hand you a pre-cooked ROI figure. You set the assumptions, you can change them, and you can defend the result to your own board because you built it."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <p className="eyebrow">Measured</p>
              <Chip tone="quiet">fact</Chip>
            </div>
            <ul className="mt-5 space-y-2.5">
              {HARD.map((h) => (
                <li key={h} className="flex gap-3 text-[15px] text-ink-70">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-30" />
                  {h}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <p className="eyebrow">Modelled</p>
              <Chip tone="signal">estimate</Chip>
            </div>
            <ul className="mt-5 space-y-2.5">
              {ESTIMATED.map((e) => (
                <li key={e} className="flex gap-3 text-[15px] text-ink-70">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-signal" />
                  {e}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-ink-50">
              Every input is set by you and visible on the dashboard. Change the
              assumptions and the number changes in front of you — which is the
              only way it survives a finance review.
            </p>
          </Card>
        </div>
      </Section>

      {/* Objections. */}
      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="Objections"
          title="Worth raising before you do."
        />
        <div className="mt-10 divide-y divide-rule border-y border-rule">
          {OBJECTIONS.map((o) => (
            <div
              key={o.q}
              className="grid gap-2 py-6 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10"
            >
              <h3 className="text-[15px] font-medium text-balance">{o.q}</h3>
              <p className="text-[15px] leading-relaxed text-ink-70">{o.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The proposal, and the kill criterion. */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <SectionHead
            eyebrow="If the argument lands"
            title="A 90-day pilot with a stated failure condition."
            lede="One team, 25–40 seats, fifteen scenarios written from that team's real work. Every participant's starting score recorded on day one — without a baseline there is nothing to compare to and no honest claim to make at the end."
          />
          <div>
            <div className="rounded-2xl border border-ink bg-ink p-7 text-paper">
              <p className="text-xs font-semibold uppercase tracking-wider text-paper/50">
                Kill criterion, agreed up front
              </p>
              <p className="mt-3 text-[17px] leading-relaxed">
                If the median score has not moved and fewer than five workflows
                are in active use at day 90, the pilot failed and you do not
                renew. Stated in writing, before you sign.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/contact" variant="filled" size="lg">
                Book a demo
              </Button>
              <Button to="/for-teams" variant="bordered" size="lg">
                See the team dashboard
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
