import {
  Button,
  Chip,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import { PlayerShot, WorkflowShot } from "../components/product/ProductShot.jsx";
import { RUBRIC } from "../data/rubric.js";

// The "Why prompt training?" argument, written for the person signing the
// invoice rather than the person writing the prompts. Plain language, and the
// cost case first — this is the business half of the value proposition.
const WHY = [
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

const STEPS = [
  {
    n: "1",
    title: "Pick a scenario",
    body: "A real task from your role: a claims email, a discovery-call summary, a job description, a variance explanation. Constraints stated up front, the way a real brief states them.",
    detail: [
      "Difficulty chip, target audience and an attempt counter, so you know what you are walking into.",
      "Foundations first if you are new; your role's track once you are not.",
    ],
  },
  {
    n: "2",
    title: "Write your prompt",
    body: "Scenario and constraint checklist on the left, prompt box and model selector on the right. The token and cost estimate updates live — efficiency is part of the skill, not an afterthought.",
    detail: [
      "Monospace box, because a prompt is closer to code than to prose.",
      "Switch models to see which instructions actually carried.",
    ],
  },
  {
    n: "3",
    title: "Get scored",
    body: "The prompt runs against a live model. A grader model scores six rubric dimensions 0–5 and returns specific feedback — not \"be more specific\" but \"no output format given, the model guessed prose\".",
    detail: [
      "Six integer scores, six feedback strings, one total out of thirty.",
      "The same rubric every time, so two attempts are comparable.",
    ],
  },
  {
    n: "4",
    title: "Compare and ship",
    body: "The reference prompt appears side by side with yours, plus a line diff. Save the better one as a reusable team workflow with variables. Practice output becomes a team asset.",
    detail: [
      "The reference is hidden until you submit. That is the whole exercise.",
      "Token counts compared, because the cheaper prompt is usually the better one.",
    ],
  },
];

export default function Platform() {
  return (
    <>
      <Section className="pb-7 pt-14 md:pb-10 md:pt-21">
        <div className="mx-auto max-w-3xl text-center">
          <Chip tone="quiet">Platform</Chip>
          <h1 className="mt-6 h-display text-balance">
            One loop, repeated until it is a habit.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-70">
            Scenario, prompt, score, rewrite, ship. Ten minutes at a time.
          </p>
        </div>
        <div className="mt-14">
          <PlayerShot />
        </div>
      </Section>

      {/* Why prompt training — the business case, before the mechanics. */}
      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="Why prompt training?"
          title="What a company gets back for it."
          lede="No jargon, and nothing here depends on understanding how any of it works underneath. Six reasons, in the order a finance team tends to care about them."
        />

        <ul className="mt-12 grid gap-x-12 gap-y-9 md:grid-cols-2">
          {WHY.map((w) => (
            <li key={w.title} className="flex gap-4">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.015em]">
                  {w.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-70">
                  {w.body}
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

      <Section>
        <div className="divide-y divide-rule border-t border-ink">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="grid gap-x-12 gap-y-4 py-10 md:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1fr)] md:py-12"
            >
              <span className="text-sm font-semibold tabular-nums text-signal md:w-8">
                {s.n}
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                  {s.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-70">
                  {s.body}
                </p>
              </div>
              <ul className="space-y-3 md:pt-1">
                {s.detail.map((d) => (
                  <li key={d} className="flex gap-3 text-sm leading-relaxed text-ink-50">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-30" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="The rubric"
          title="What the grader is actually looking for."
          lede="Six dimensions, 0–5 each, thirty total. Identical on the score screen, the learner dashboard and the team heat map."
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
              <p className="mt-2 pl-7 text-sm leading-relaxed text-ink-70">{d.line}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Workflows"
              title="Where the practice stops being training."
              lede="A prompt that scored well becomes a template with variables. Publish it, and the people who never practiced still send expert-quality output."
            />
            <Button to="/workflows" variant="bordered" className="mt-8">
              See the workflow library
            </Button>
          </div>
          <WorkflowShot />
        </div>
      </Section>

      <Section className="bg-ink text-paper">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="h-section text-balance">Do one rep.</h2>
          <p className="mt-5 text-lg text-paper/70">
            It takes about four minutes and you will know immediately whether
            this is real.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button
              to="/practice/denial-explanation-email"
              size="lg"
              className="bg-paper text-ink hover:bg-paper-2"
            >
              Open the player
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
