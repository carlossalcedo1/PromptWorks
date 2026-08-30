import { Button, Chip, Section, SectionHead, cn } from "../components/ui/index.jsx";

// No dollar figures in the mockup — price after five customer conversations.
const TIERS = [
  {
    name: "Free",
    price: "$0",
    note: "For one person, permanently.",
    features: [
      "Foundations track",
      "10 graded reps / month",
      "Community prompt library",
      "BYOK optional",
    ],
    cta: { label: "Start free", to: "/onboarding", variant: "bordered" },
  },
  {
    name: "Pro",
    price: "$ / month",
    note: "For the individual who is serious about it.",
    features: [
      "All tracks, including advanced",
      "Unlimited graded reps",
      "Model comparison",
      "Certification",
    ],
    cta: { label: "Upgrade", to: "/onboarding", variant: "bordered" },
  },
  {
    name: "Teams",
    price: "$ / seat / month",
    note: "Where the reporting starts.",
    featured: true,
    features: [
      "Everything in Pro",
      "Admin dashboard + heat map",
      "Assignments & nudges",
      "Team workflow library",
      "SSO / SAML",
    ],
    cta: { label: "Book a demo", to: "/contact", variant: "filled" },
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    note: "Implementation, not just a licence.",
    features: [
      "Custom scenarios from your SOPs",
      "Grader fine-tuned on your rubric",
      "End-to-end implementation",
      "Dedicated success manager",
      "SLA + security review",
    ],
    cta: { label: "Book a demo", to: "/contact", variant: "bordered" },
  },
];

const FAQ = [
  [
    "Why are there no prices on this page?",
    "Because we have not had five customer conversations yet, and a number invented before those is a number we would have to walk back. Team pricing is per seat and lands after them.",
  ],
  [
    "What is BYOK?",
    "Bring your own key. You supply a model API key and pay the provider directly for inference on the free tier. It is optional — ten graded reps a month run on ours.",
  ],
  [
    "Is the certification a real assessment?",
    "It is a scored assessment against the same six-dimension rubric, not an attendance badge. If it ever becomes a badge, we will stop calling it certification.",
  ],
  [
    "What happens to our prompts?",
    "They are never used to train models. Retention is configurable on Teams and above, and deletion is real deletion.",
  ],
];

export default function Pricing() {
  return (
    <>
      <Section className="pb-7 pt-14 md:pb-9 md:pt-21">
        <div className="mx-auto max-w-3xl text-center">
          <Chip tone="quiet">Pricing</Chip>
          <h1 className="mt-6 h-display text-balance">
            Free for one person. Priced for a team.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-70">
            The free tier is not a trial. It stays free, because individuals are
            how teams find us.
          </p>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule lg:grid-cols-4">
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
                  Most teams start here
                </p>
              )}
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{t.name}</h2>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {t.price}
              </p>
              <p className="mt-1.5 text-[13px] text-ink-50">{t.note}</p>

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
          Figures are deliberately absent in this prototype. Open question:
          BYOK vs. paid inference on the free tier — BYOK removes the biggest
          cost risk but adds signup friction.
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
