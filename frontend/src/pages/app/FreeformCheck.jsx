import { useState } from "react";
import { RUBRIC_MAX } from "../../data/rubric.js";
import { RubricBreakdown } from "../../components/product/RubricBreakdown.jsx";
import { Button, Chip } from "../../components/ui/index.jsx";
import { gradeFreeform, ApiError } from "../../lib/api.js";

const PLACEHOLDER =
  "Paste a prompt you actually use for work — a real one, not a practice " +
  "scenario. It doesn't need to be about anything in particular.";

/**
 * Freeform prompt check — no scenario, no signup, unlimited. Grades on the
 * same six dimensions as scenario-based practice, but on general
 * prompt-engineering craft rather than fit to a known task, so this is
 * deliberately NOT saved as an attempt and does NOT count toward the
 * tracked skill score on /dashboard or the team heat map.
 */
export default function FreeformCheck() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setError("");
    try {
      const r = await gradeFreeform(prompt);
      setResult(r);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="ink">No scenario needed</Chip>
        <Chip tone="quiet">Free · unlimited</Chip>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.025em]">
        Check a prompt
      </h1>
      <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-ink-70">
        Paste any prompt and get real feedback on the same six dimensions used
        everywhere else in Promptworks — no scenario to pick, no signup. This
        doesn't feed your tracked skill score; it's a quick, standalone check.
      </p>

      {!result ? (
        <div className="mt-8 rounded-2xl border border-rule bg-white p-6">
          <label htmlFor="freeform-prompt" className="text-sm font-medium">
            Your prompt
          </label>
          <textarea
            id="freeform-prompt"
            rows={12}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck="false"
            className="mt-2.5 w-full resize-y rounded-xl border border-rule-strong bg-white p-4 font-mono text-base leading-relaxed placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30 sm:text-[13px]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={run}
              disabled={!prompt.trim() || running}
              variant="filled"
              size="md"
            >
              {running ? "Grading…" : "Grade my prompt"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-rule bg-white p-7 md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
                {result.total}
                <span className="text-2xl text-ink-30 md:text-3xl"> / {RUBRIC_MAX}</span>
              </p>
              <p className="mt-2 text-[13px] text-ink-50">
                Not counted toward your tracked score
              </p>
            </div>
            <Button variant="bordered" size="sm" onClick={reset}>
              Check another prompt
            </Button>
          </div>

          <div className="mt-8 border-t border-rule pt-2">
            <p className="pb-1 pt-4 text-xs text-ink-50">
              Rubric breakdown — same six dimensions, judged on general craft
              rather than fit to a specific scenario.
            </p>
            <RubricBreakdown scores={result.scores} feedback={result.feedback} />
          </div>
        </div>
      )}
    </div>
  );
}
