// The six dimensions. Fixed, ordered, and identical on every screen in the
// product — score screen, learner dashboard, team heat map. That consistency
// is what makes the manager dashboard legible.
export const RUBRIC = [
  {
    key: "clarity",
    name: "Task clarity",
    short: "Clarity",
    line: "Can the model tell exactly what deliverable you want?",
  },
  {
    key: "context",
    name: "Context supplied",
    short: "Context",
    line: "The facts the model cannot infer, given up front.",
  },
  {
    key: "constraints",
    name: "Constraints",
    short: "Constr.",
    line: "Limits stated explicitly — length, tone, what not to say.",
  },
  {
    key: "format",
    name: "Output format",
    short: "Format",
    line: "The shape of the answer, so the model stops guessing.",
  },
  {
    key: "audience",
    name: "Role & audience",
    short: "Audience",
    line: "Who is writing, who is reading, and their state of mind.",
  },
  {
    key: "examples",
    name: "Examples (few-shot)",
    short: "Examples",
    line: "One or two samples that lock the tone in place.",
  },
];

export const RUBRIC_MAX = RUBRIC.length * 5; // 30
