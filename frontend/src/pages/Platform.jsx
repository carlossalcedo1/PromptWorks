import {
  Button,
  Chip,
  Section,
  SectionHead,
} from "../components/ui/index.jsx";
import { PlayerShot, WorkflowShot } from "../components/product/ProductShot.jsx";
import { RUBRIC } from "../data/rubric.js";

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
    </>
  );
}
