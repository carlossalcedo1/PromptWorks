// Track catalogue. Counts match the wireframe's tracks + challenge library.
export const TRACKS = [
  {
    slug: "foundations",
    title: "Foundations",
    group: "foundations",
    count: 6,
    level: "Beginner",
    blurb:
      "Anatomy of a prompt, context, constraints, format, few-shot, iteration.",
  },
  {
    slug: "sales",
    title: "Sales",
    group: "role",
    count: 14,
    level: "Mixed",
    blurb: "Discovery summaries, objection handling, outreach that is not spam.",
  },
  {
    slug: "service-claims",
    title: "Service & Claims",
    group: "role",
    count: 16,
    level: "Mixed",
    blurb: "Denial explanations, escalation notes, tone under pressure.",
  },
  {
    slug: "hr",
    title: "HR",
    group: "role",
    count: 12,
    level: "Mixed",
    blurb: "Job descriptions, review summaries, policy answers with citations.",
  },
  {
    slug: "marketing",
    title: "Marketing",
    group: "role",
    count: 12,
    level: "Mixed",
    blurb: "Briefs, variant generation, brand-voice constraint.",
  },
  {
    slug: "finance",
    title: "Finance",
    group: "role",
    count: 10,
    level: "Advanced",
    blurb: "Variance explanation, memo drafting, numbers you must not invent.",
  },
  {
    slug: "engineering",
    title: "Engineering",
    group: "role",
    count: 14,
    level: "Advanced",
    blurb: "Spec to code, review prompts, test generation.",
  },
  {
    slug: "rag-grounding",
    title: "RAG & grounding",
    group: "advanced",
    count: 9,
    level: "Advanced",
    blurb: "Citing sources, refusing to answer, keeping the model on the document.",
  },
  {
    slug: "agentic-frameworks",
    title: "Agentic frameworks",
    group: "advanced",
    count: 8,
    level: "Advanced",
    blurb: "Multi-step plans, tool use, handoffs, failure recovery.",
  },
  {
    slug: "evals-data-science",
    title: "Evals & data science",
    group: "advanced",
    count: 8,
    level: "Advanced",
    blurb: "Writing a rubric, judging outputs, measuring drift.",
  },
  {
    slug: "fine-tune-vs-prompt",
    title: "Fine-tune vs. prompt",
    group: "advanced",
    count: 6,
    level: "Advanced",
    blurb: "When more context is cheaper than more training, and when it is not.",
  },
  {
    slug: "prompt-injection-safety",
    title: "Prompt injection & safety",
    group: "advanced",
    count: 7,
    level: "Advanced",
    blurb: "Untrusted input, tool permissions, the instructions you must not follow.",
  },
];

export const ADVANCED_STRIP = TRACKS.filter((t) => t.group === "advanced");

export const ROLE_TRACKS = TRACKS.filter((t) => t.group === "role");

export const trackBySlug = (slug) => TRACKS.find((t) => t.slug === slug);
