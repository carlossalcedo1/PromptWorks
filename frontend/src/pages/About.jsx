import { Button, Card, Chip, Section, SectionHead } from "../components/ui/index.jsx";

// The technical background lives here, not on the homepage. Understated.
const STACK = [
  [
    "Grading",
    "A rubric plus an LLM-as-judge returning strict JSON — six integer scores and six feedback strings. Stage 3 fine-tunes a small grader on accumulated graded attempts: cheaper, faster, and more consistent than a general model asked nicely.",
  ],
  [
    "Model layer",
    "A provider-agnostic adapter behind one interface, so the product is not a bet on a single vendor. Stage 1 is mocked; stage 2 goes live.",
  ],
  [
    "Evals",
    "The rubric is the eval. Grader agreement against hand-scored attempts is measured before any grader change ships, because a scoring system nobody trusts is worse than no score.",
  ],
  [
    "Analytics",
    "Attempts and org rollups are relational-shaped. Content stays in Mongo; if team reporting gets heavy, analytics moves to Postgres rather than being forced into documents.",
  ],
];

export default function About() {
  return (
    <>
      <Section className="pb-7 pt-14 md:pb-9 md:pt-21">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Chip tone="quiet">About</Chip>
            <h1 className="mt-6 h-display text-balance">Why this exists.</h1>
            <div className="mt-8 max-w-[62ch] space-y-5 text-lg leading-relaxed text-ink-70">
              <p>
                Almost every company bought AI licences. Almost none of them can
                say whether anyone got better at using them. The default fix is a
                training vendor: videos, a completion certificate, and a
                completion rate that measures attendance.
              </p>
              <p>
                Prompting is a skill, and skills are trained the way skills have
                always been trained — reps, feedback, and a score you can compare
                to last month's. That is the entire idea. Everything else here is
                implementation.
              </p>
              <p>
                The second half matters more than the practice: the prompts that
                score well become templates the whole team runs. One person gets
                it right, forty people use it, and the asset stays when the
                person leaves.
              </p>
            </div>
          </div>

          <div className="lg:pt-24">
            <div className="aspect-[4/5] w-full rounded-2xl border border-dashed border-rule-strong bg-paper-2/60" />
            <p className="mt-3 text-[13px] text-ink-30">
              Photo placeholder — swap before launch.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-y border-rule bg-paper-2/40">
        <SectionHead
          eyebrow="Under the hood"
          title="For the people who ask how it works."
          lede="This section is deliberately not on the homepage. Buyers care about the number; engineers care about how the number is produced. Both are reasonable."
        />
        <div className="mt-12 divide-y divide-rule border-y border-rule">
          {STACK.map(([t, b]) => (
            <div key={t} className="grid gap-2 py-6 md:grid-cols-[200px_1fr] md:gap-10">
              <p className="text-sm font-medium">{t}</p>
              <p className="max-w-[70ch] text-[15px] leading-relaxed text-ink-70">
                {b}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <p className="eyebrow">Where it is</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
              Stage 1: the frontend you are looking at. Mock data, deterministic
              grading, no backend. Real enough to run a customer interview
              against.
            </p>
          </Card>
          <Card>
            <p className="eyebrow">What is next</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
              Stage 2 makes the grading real: an API, live model calls, and the
              homepage widget wired to the actual grader.
            </p>
          </Card>
          <Card>
            <p className="eyebrow">The honest part</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
              There are no customers yet, so there are no testimonials, no logos
              and no case study. The placeholders on this site stay empty until
              that changes.
            </p>
          </Card>
        </div>

        <div className="mt-12">
          <Button to="/contact" variant="filled" size="lg">
            Get in touch
          </Button>
        </div>
      </Section>
    </>
  );
}
