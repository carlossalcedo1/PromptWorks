// Mock org, learner and workflow data. Stage 2 replaces this module with the
// API reads described in the brief; nothing else should need to change.

export const LEARNER = {
  name: "Carlos",
  track: "Service & Claims",
  trackSlug: "service-claims",
  level: 4,
  streak: 12,
  repsThisWeek: 7,
  repsGoal: 10,
  medianScore: 22,
  medianDelta: 3,
  workflowsShipped: 3,
  workflowUses: 41,
  // Same six dimensions, same order, everywhere.
  profile: {
    clarity: 4.6,
    context: 3.9,
    constraints: 3.2,
    format: 2.4,
    audience: 4.4,
    examples: 3.0,
  },
  queue: [
    {
      scenario: "escalation-note",
      title: "Escalation note to a supervisor",
      track: "Service & Claims",
      difficulty: "Intermediate",
      status: "not started",
    },
    {
      scenario: "coverage-gap-no-jargon",
      title: "Explain a coverage gap without jargon",
      track: "Service & Claims",
      difficulty: "Intermediate",
      status: "1 attempt",
    },
    {
      scenario: "summarise-a-call",
      title: "Summarise a 40-minute call",
      track: "Foundations",
      difficulty: "Beginner",
      status: "completed 26/30",
    },
  ],
};

export const WORKFLOWS = [
  {
    slug: "claim-denial-email",
    title: "Claim denial email",
    track: "Service & Claims",
    variables: ["customer_name", "denial_reason", "policy_section"],
    usage: 41,
    uniqueUsers: 19,
    helpful: 92,
    sourceScore: 26,
    author: "C. Salcedo",
    visibility: "Team",
    sourceScenario: "denial-explanation-email",
    template: `You are a senior claims correspondent. Write an email to {{customer_name}}, whose claim was denied because {{denial_reason}}.

Audience: the policyholder. Upset, not an insurance expert.

Requirements:
- Empathetic, plain English. Acknowledge the loss in the first sentence.
- Do not admit liability.
- Under 150 words.
- Cite {{policy_section}} by name and number.
- Close with exactly one next step: the appeal route and its deadline.

Output format:
Subject: <one line, under 8 words>
Body: <2-3 short paragraphs>`,
  },
  {
    slug: "discovery-call-summary",
    title: "Discovery call summary",
    track: "Sales",
    variables: ["notes", "prospect_name"],
    usage: 33,
    uniqueUsers: 11,
    helpful: 88,
    sourceScore: 27,
    author: "M. Reyes",
    visibility: "Team",
    sourceScenario: "discovery-call-summary",
    template: `Summarise the discovery call with {{prospect_name}} for the sales engineer building the demo.

Quote stated pain verbatim. Split needs into must-have and nice-to-have. Name the decision maker, economic buyer and likely blocker. Where the notes are silent, write "not stated" - do not invent.

Output: table, columns Topic | What they said | Demo implication.

Notes: {{notes}}`,
  },
  {
    slug: "policy-answer-with-citation",
    title: "Policy answer with citation",
    track: "Service & Claims",
    variables: ["question", "policy_document", "customer_tier", "tone"],
    usage: 28,
    uniqueUsers: 14,
    helpful: 85,
    sourceScore: 25,
    author: "A. Chen",
    visibility: "Team",
    sourceScenario: "untrusted-document-summary",
    template: `Answer {{question}} using only {{policy_document}}.

Cite the section number for every claim. If the document does not answer it, say "not covered in the policy" - never infer. Register: {{tone}}. Customer tier: {{customer_tier}}.

Output: answer, then CITATIONS as a list.`,
  },
  {
    slug: "variance-explanation-memo",
    title: "Variance explanation memo",
    track: "Finance",
    variables: ["period", "variance_table", "threshold", "audience", "forecast_basis"],
    usage: 12,
    uniqueUsers: 4,
    helpful: 75,
    sourceScore: 24,
    author: "J. Patel",
    visibility: "Team",
    sourceScenario: "variance-explanation-memo",
    template: `Draft the {{period}} variance memo for {{audience}}.

Use only the figures in {{variance_table}}. Never invent or extrapolate a number. Explain every line over {{threshold}}, cause before consequence, one paragraph per driver. Close with the full-year impact on {{forecast_basis}}.`,
  },
  {
    slug: "job-description-draft",
    title: "Job description draft",
    track: "HR",
    variables: ["role", "notes", "salary_band"],
    usage: 9,
    uniqueUsers: 3,
    helpful: 80,
    sourceScore: 23,
    author: "L. Gomez",
    visibility: "Team",
    sourceScenario: "job-description-draft",
    template: `Write a job description for {{role}} from {{notes}}.

Inclusive, bias-free language. Requirements section lists only what is genuinely required; everything else goes under "helpful". State {{salary_band}} exactly. Under 400 words, scannable subheadings.`,
  },
];

export const workflowBySlug = (slug) => WORKFLOWS.find((w) => w.slug === slug);

// --- Team admin dashboard ---------------------------------------------------

export const TEAM = {
  name: "Claims Operations",
  seatsActive: 38,
  seatsTotal: 45,
  medianScore: 22,
  medianDelta: 3,
  repsThisWeek: 312,
  // Org-wide workflow runs across the whole library; the table below shows the
  // top five. 307 runs x 9 minutes saved / 60 = the ~46 hours reported above.
  workflowRuns: 307,
  hoursReturned: 46,
  benchmarkMedian: 19,
  benchmarkPeer: "claims teams",
  weakest: {
    dimension: "format",
    name: "Output format",
    avg: 2.3,
    below: 18,
    of: 38,
    assign: "Formatting outputs",
  },
  // people x six rubric dimensions, in RUBRIC order
  people: [
    { name: "A. Chen", reps: 41, scores: [5, 4, 4, 3, 5, 4] },
    { name: "M. Reyes", reps: 38, scores: [5, 4, 3, 2, 4, 4] },
    { name: "J. Patel", reps: 33, scores: [4, 4, 3, 2, 4, 3] },
    { name: "L. Gomez", reps: 29, scores: [4, 3, 3, 2, 4, 3] },
    { name: "D. Okafor", reps: 24, scores: [4, 3, 2, 2, 3, 2] },
    { name: "S. Novak", reps: 19, scores: [3, 3, 2, 1, 3, 2] },
    { name: "T. Brooks", reps: 11, scores: [3, 2, 2, 1, 3, 1] },
  ],
  assignments: [
    { track: "Foundations", due: "Sep 12", done: 31, total: 45, status: "sent" },
    { track: "Claims scenarios", due: "Sep 26", done: 12, total: 45, status: "sent" },
    { track: "Formatting outputs", due: "—", done: 0, total: 45, status: "not sent" },
  ],
};

// --- Resources / prompt library --------------------------------------------

export const RESOURCE_CATEGORIES = [
  {
    slug: "foundations",
    name: "Foundations",
    entries: [
      { title: "Task, context, constraints, format", use: "The four things every prompt needs before you add anything clever." },
      { title: "Stating the deliverable", use: "Turning a vague ask into one unambiguous noun." },
      { title: "Word limits that hold", use: "Why 'be concise' fails and 'under 150 words' does not." },
    ],
  },
  {
    slug: "patterns",
    name: "Patterns",
    entries: [
      { title: "Few-shot with two examples", use: "Locking tone when a description of the tone will not." },
      { title: "Role and audience pairing", use: "Naming who writes and who reads, in one line each." },
      { title: "Refusal instructions", use: "Telling the model what to do when the answer is not available." },
      { title: "Structured output skeletons", use: "Giving the shape so the model stops guessing prose." },
    ],
  },
  {
    slug: "by-role",
    name: "By role",
    entries: [
      { title: "Claims correspondence", use: "Denials, escalations and coverage answers that survive review." },
      { title: "Discovery summaries", use: "Notes to a demo brief without inventing the requirements." },
      { title: "Variance memos", use: "Explaining numbers without generating new ones." },
    ],
  },
  {
    slug: "advanced",
    name: "Advanced",
    entries: [
      { title: "Grounding on a document", use: "Citations, page numbers, and refusing to go beyond the source." },
      { title: "Multi-step plans and tool use", use: "Where agentic prompts break, and the recovery instruction." },
      { title: "Writing a rubric", use: "Turning a quality opinion into something two people score the same." },
      { title: "Fine-tune or prompt", use: "The cost question, answered with a decision table." },
    ],
  },
  {
    slug: "safety",
    name: "Safety",
    entries: [
      { title: "Untrusted input as data", use: "The trust boundary, and the sentence that establishes it." },
      { title: "Prompt injection patterns", use: "What an attempted instruction looks like in a real document." },
      { title: "Data you must not paste", use: "A short list, written for people who are in a hurry." },
    ],
  },
];
