import { RUBRIC, RUBRIC_MAX } from "../data/rubric.js";

/**
 * Stage 1 grading: a deterministic scorer that reads the prompt for the things
 * the rubric actually asks about. No model, no network, no randomness — the
 * same prompt always gets the same score, which is what makes it demoable.
 *
 * Stage 2 replaces this whole module with `POST /attempts` returning the same
 * shape: six integer scores, six feedback strings, a total. Keep the shape.
 */

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");

const hits = (text, terms) => terms.filter((t) => text.includes(t)).length;

// Vocabulary that is scenario-independent.
const DELIVERABLE = [
  "write", "draft", "produce", "summarise", "summarize", "generate",
  "explain", "compose", "rewrite", "create", "turn ", "convert",
];
const FORMAT = [
  "format", "subject:", "subject line", "bullet", "numbered", "table",
  "json", "heading", "paragraph", "output:", "structure", "template",
  "one line per", "columns", "list", "markdown", "section",
];
const ROLE = ["you are", "act as", "as a", "your role", "speaking as"];
const EXAMPLE = [
  "example", "e.g.", "for instance", "like this:", "few-shot", "sample:",
  "such as:",
];
const HEDGE_FREE_STRUCTURE = ["-", "•", "1.", "2."];

const clamp = (n) => Math.max(0, Math.min(5, Math.round(n)));

/** Rough token estimate — ~4 characters per token, good enough for a UI meter. */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.round(text.trim().length / 4));
}

/** Stage-1 cost model. Placeholder rates; stage 2 reads them from the adapter. */
export function estimateCost(tokensIn, tokensOut) {
  const cost = (tokensIn / 1000) * 0.003 + (tokensOut / 1000) * 0.015;
  return cost;
}

function scoreClarity(text, words) {
  const verb = hits(text, DELIVERABLE);
  let s = 0;
  if (verb > 0) s += 2.5;
  if (verb > 1) s += 0.5;
  if (words >= 25) s += 1;
  if (words >= 60) s += 1;
  if (hits(text, HEDGE_FREE_STRUCTURE) > 0) s += 0.5;
  if (words < 8) s = Math.min(s, 1);
  const score = clamp(s);
  const feedback =
    score >= 5
      ? "Clear ask, no ambiguity about the deliverable."
      : score >= 4
        ? "The deliverable is clear. Naming it in the first line would make it clearer."
        : score >= 2
          ? "The task is implied rather than stated. Open with the verb and the artefact: 'Write the email that…'."
          : "No stated deliverable. The model has to guess what you want made.";
  return { score, feedback };
}

function scoreContext(text, scenario) {
  const n = hits(text, scenario.contextMatch);
  const total = scenario.contextMatch.length;
  const ratio = n / total;
  const score = clamp(ratio * 6.5);
  const missing = scenario.contextMatch.filter((t) => !text.includes(t)).slice(0, 2);
  const feedback =
    score >= 5
      ? "You supplied the facts the model could not infer."
      : score >= 3
        ? `Good grounding. Still missing: ${missing.join(", ")}.`
        : score >= 1
          ? "Thin on context. The model is filling gaps with invention — that is where wrong answers come from."
          : "No context from the brief made it into the prompt.";
  return { score, feedback };
}

function scoreConstraints(text, scenario) {
  const met = scenario.constraints.map((c) => hits(text, c.match) > 0);
  const n = met.filter(Boolean).length;
  const total = scenario.constraints.length;
  const score = clamp((n / total) * 5.4);
  const missed = scenario.constraints.filter((_, i) => !met[i]);
  const feedback =
    n === total
      ? "Every stated constraint made it into the prompt."
      : n > 0
        ? `${n} of ${total} constraints stated. Left implicit: ${missed
            .map((c) => `"${c.label.toLowerCase()}"`)
            .slice(0, 2)
            .join(", ")}.`
        : "None of the brief's constraints are in the prompt. They were the brief.";
  return { score, feedback, met };
}

function scoreFormat(text) {
  const n = hits(text, FORMAT);
  let s = n * 1.6;
  if (/output format|output:/.test(text)) s += 1.5;
  if (/<[a-z_ ]+>/.test(text)) s += 1; // an explicit output skeleton
  const score = clamp(s);
  const feedback =
    score >= 5
      ? "Output shape is specified. The model has nothing left to guess."
      : score >= 3
        ? "Format is partly specified. Give the skeleton, not just the word 'format'."
        : score >= 1
          ? "Format is gestured at, not given. Show the shape you want back."
          : "No output format given — the model will guess prose when you may need a subject line and body.";
  return { score, feedback };
}

function scoreAudience(text, scenario) {
  const aud = hits(text, scenario.audienceMatch);
  const role = hits(text, ROLE);
  let s = aud * 1.5 + role * 1.6;
  const score = clamp(s);
  const feedback =
    score >= 5
      ? "Named the reader and their state of mind. This is a strong habit — keep it."
      : score >= 3
        ? "Audience is named. Add who is *writing* as well, and the reader's state of mind."
        : score >= 1
          ? "Partial. 'You are a…' plus one line on the reader changes the register more than any adjective."
          : "No role and no audience. The model defaults to a generic voice, and generic is the thing you are trying to avoid.";
  return { score, feedback };
}

function scoreExamples(text) {
  const n = hits(text, EXAMPLE);
  const quoted = (text.match(/"[^"]{12,}"/g) || []).length;
  let s = n * 2 + quoted * 1.2;
  const score = clamp(s);
  const feedback =
    score >= 5
      ? "Examples do the work that adjectives cannot. Well used."
      : score >= 3
        ? "One example present. A second, deliberately different one would pin the range."
        : score >= 1
          ? "You gestured at an example without giving one. Paste the actual text."
          : "No examples. One sample of the tone you want would lock it in place.";
  return { score, feedback };
}

/**
 * Grade a prompt against a scenario.
 * @returns {{scores: object, feedback: object, total: number, met: boolean[],
 *            tokens: number, headline: string}}
 */
export function gradePrompt(promptText, scenario) {
  const text = norm(promptText || "");
  const words = text.split(" ").filter(Boolean).length;

  const clarity = scoreClarity(text, words);
  const context = scoreContext(text, scenario);
  const constraints = scoreConstraints(text, scenario);
  const format = scoreFormat(text);
  const audience = scoreAudience(text, scenario);
  const examples = scoreExamples(text);

  const parts = { clarity, context, constraints, format, audience, examples };
  const scores = {};
  const feedback = {};
  for (const { key } of RUBRIC) {
    scores[key] = parts[key].score;
    feedback[key] = parts[key].feedback;
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const tokens = estimateTokens(promptText);

  // Name the two weakest dimensions — that is the coaching, not the number.
  const ranked = [...RUBRIC].sort((a, b) => scores[a.key] - scores[b.key]);
  const gap = ranked.slice(0, 2).filter((d) => scores[d.key] < 4);

  let headline;
  if (total >= 27) headline = "Strong. This is close to the reference prompt.";
  else if (total >= 20)
    headline = `Solid. ${gap.length ? "Two dimensions are costing you most of the gap." : "Tighten the weakest dimension and this is a workflow."}`;
  else if (total >= 12)
    headline = "Halfway. The task is there; the specification around it is not.";
  else headline = "This is a request, not a prompt. Add context, constraints and a format.";

  return {
    scores,
    feedback,
    total,
    max: RUBRIC_MAX,
    met: constraints.met,
    tokens,
    headline,
    gap: gap.map((d) => d.name),
  };
}

/**
 * Canned model output. It reacts to whether the prompt specified a format,
 * because that is the lesson the scenario is teaching.
 */
export function mockOutput(promptText, scenario, result) {
  const structured = result.scores.format >= 3;
  const empathetic = result.scores.audience >= 3;

  if (scenario.slug !== "denial-explanation-email") {
    return structured
      ? `[mock output — stage 1]\n\nThe model returned a structured response in the shape you specified.\n\nBecause you named the format, the sections came back predictable enough to paste into the tool that consumes them.\n\nStage 2 replaces this with a live model call.`
      : `[mock output — stage 1]\n\nThe model returned four paragraphs of prose. Readable, but nothing in your prompt told it what shape the answer should take, so it chose one.\n\nStage 2 replaces this with a live model call.`;
  }

  const opening = empathetic
    ? "I'm sorry about the damage to your home, and I know this isn't the answer you were hoping for."
    : "We have completed our review of your recent claim.";

  const body = `${opening} After reviewing your policy, we are unable to cover this loss. Your policy excludes damage caused by flooding${
    result.scores.constraints >= 3 ? " under Section 4.2 — Water and Flood" : ""
  }.

${
  result.scores.constraints >= 4
    ? "If you would like this reviewed again, you can file an appeal within 30 days by replying to this email with any additional documentation."
    : "Please let us know if you have any questions about this decision."
}`;

  return structured
    ? `Subject: About your recent claim\n\n${body}`
    : body;
}
