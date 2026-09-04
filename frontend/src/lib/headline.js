import { RUBRIC } from "../data/rubric.js";

/**
 * Computes the same "Strong / Solid / Halfway / weak" headline Stage 1's
 * gradePrompt() used to compute server-side. Now that grading is real
 * (POST /attempts), the backend intentionally doesn't return a headline —
 * it's pure arithmetic over scores/total that costs nothing to redo
 * client-side, keeping the API response lean.
 */
export function computeHeadline(scores, total) {
  const ranked = [...RUBRIC].sort((a, b) => scores[a.key] - scores[b.key]);
  const gap = ranked.slice(0, 2).filter((d) => scores[d.key] < 4);

  if (total >= 27) return "Strong. This is close to the reference prompt.";
  if (total >= 20) {
    return gap.length
      ? "Solid. Two dimensions are costing you most of the gap."
      : "Solid. Tighten the weakest dimension and this is a workflow.";
  }
  if (total >= 12) return "Halfway. The task is there; the specification around it is not.";
  return "This is a request, not a prompt. Add context, constraints and a format.";
}
