import { Button, Chip, Section, SectionHead, cn } from "../components/ui/index.jsx";

// Three tiers. Teams folded into Enterprise — a single seat-based plan was
// splitting the same reporting story across two columns.
const TIERS = [
  {
    name: "Free",
    price: "$0",
    note: "For one person, permanently.",
    highlight: "5,000 tokens free every month",
    features: [
      "5,000 graded tokens / month, on us",
      "Then bring your own key — you pay the provider directly",
      "Foundations track",
      "Community prompt library",
    ],
    cta: { label: "Start free", to: "/onboarding", variant: "bordered" },
  },
  {
    name: "Pro",
    price: "$5 / month",
    note: "For the individual who is serious about it.",
    featured: true,
    highlight: "Up to 250,000 tokens / month",
    features: [
      "250,000 graded tokens / month — no key required",
      "All tracks, including advanced",
      "Model comparison",
      "Certification",
      "BYOK still available past the cap",
    ],
    cta: { label: "Upgrade", to: "/onboarding", variant: "filled" },
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    note: "Implementation and reporting, not just a licence.",
    features: [
      "Everything in Pro, for every seat",
      "Admin dashboard + heat map",
      "Assignments & nudges",
      "Team workflow library",
      "SSO / SAML",
      "Custom scenarios from your SOPs",
      "Grader fine-tuned on your rubric",
      "Dedicated success manager, SLA + security review",
    ],
    cta: { label: "Book a demo", to: "/contact", variant: "bordered" },
  },
];

const FAQ = [
  [
    "What does 5,000 tokens actually get me?",
    "Roughly fifteen to twenty graded reps a month, depending on how long your prompts and the scenario briefs are. It resets on the first of the month and it is not a trial — it stays free.",
  ],
  [
    "What is BYOK?",
    "Bring your own key. You supply a model API key and pay the provider directly for inference, so nothing caps you once the free 5,000 tokens run out. Pro raises the included allowance to 250,000 tokens instead.",
  ],
  [
    "Why do I need Pro?",
    "Want to take practice more seriously or improve your skills faster? Pro gives you more graded reps, access to advanced tracks, and the ability to compare model outputs side by side.",
  ],
  [
    "What happens to our prompts?",
    "They are never used to train models. Retention is configurable on Enterprise, and deletion is real deletion.",
  ],
];

export default function Pricing() {
  return (
    <>
      <Section className="pb-7 pt-14 md:pb-9 md:pt-21">
        <div className="mx-auto max-w-3xl text-center">
          <Chip tone="quiet">Pricing</Chip>
          <h1 className="mt-6 h-display text-balance">
            5,000 tokens free, every month.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-70">
            Not a trial — it resets and it stays free. Past that, bring your own
            key and pay the provider directly, or take Pro for 250,000 tokens a
            month at $5.
          </p>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "flex flex-col p-7",
                t.featured ? "bg-paper-2/80" : "bg-paper",
              )}
            >
              {t.featured && (
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">
                  Most people start here
                </p>
              )}
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{t.name}</h2>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {t.price}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-50">{t.note}</p>
              {t.highlight && (
                <p className="mt-4 rounded-xl bg-signal-wash px-3 py-2 text-[13px] font-medium text-signal-ink">
                  {t.highlight}
                </p>
              )}

              <ul className="mt-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm text-ink-70">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-30" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                to={t.cta.to}
                variant={t.cta.variant}
                size="sm"
                className="mt-8 w-full"
              >
                {t.cta.label}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[13px] text-ink-30">
          Token allowances cover grading and model calls made through
          Promptworks. Bring your own key at any tier and you pay the provider
          directly instead.
        </p>
      </Section>

      <Section className="border-t border-rule">
        <SectionHead title="Questions" />
        <div className="mt-10 divide-y divide-rule border-y border-rule">
          {FAQ.map(([q, a]) => (
            <div key={q} className="grid gap-2 py-6 md:grid-cols-[minmax(0,340px)_1fr] md:gap-10">
              <h3 className="text-[15px] font-medium text-balance">{q}</h3>
              <p className="text-[15px] leading-relaxed text-ink-70">{a}</p>
            </div>
          ))}
        </div>
      </Section>

    </>
  );
}
