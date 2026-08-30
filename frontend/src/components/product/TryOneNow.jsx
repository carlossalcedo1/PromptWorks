import { useState } from "react";
import { Link } from "react-router-dom";
import { HOMEPAGE_SCENARIO } from "../../data/scenarios.js";
import { RUBRIC, RUBRIC_MAX } from "../../data/rubric.js";
import { gradePrompt, mockOutput } from "../../lib/grader.js";
import { PromptBox } from "./PromptBox.jsx";
import { Button, Chip, ScoreBar, cn } from "../ui/index.jsx";

const scenario = HOMEPAGE_SCENARIO;

/**
 * A live mini-exercise embedded in the homepage, no signup. One scenario, one
 * prompt box, one real score. Grading is the stage-1 deterministic scorer, so
 * this works with no backend and still tells the truth about the prompt.
 */
export function TryOneNow() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    // A beat of latency so the score reads as a response, not a re-render.
    setTimeout(() => {
      const r = gradePrompt(prompt, scenario);
      setResult(r);
      setOutput(mockOutput(prompt, scenario, r));
      setRunning(false);
    }, 550);
  };

  const reset = () => {
    setResult(null);
    setOutput("");
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-rule bg-white">
      <div className="grid lg:grid-cols-[38%_1fr]">
        {/* Scenario */}
        <div className="border-b border-rule bg-paper-2/40 p-6 md:p-8 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="ink">Live exercise</Chip>
            <Chip tone="quiet">No signup</Chip>
          </div>

          <h3 className="mt-5 h-card">Scenario</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-70">
            {scenario.brief}
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-50">
            Constraints
          </p>
          <ul className="mt-2.5 space-y-2">
            {scenario.constraints.map((c, i) => {
              const met = result?.met?.[i];
              return (
                <li key={c.label} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={cn(
                      "mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded text-[10px] font-bold transition-colors",
                      met
                        ? "bg-signal text-white"
                        : "border border-rule-strong text-transparent",
                    )}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className={met ? "text-ink" : "text-ink-70"}>{c.label}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-rule pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
              Audience
            </p>
            <p className="mt-1.5 text-sm text-ink-70">{scenario.audience}</p>
          </div>
        </div>

        {/* Prompt + score */}
        <div className="p-6 md:p-8">
          {!result ? (
            <>
              <PromptBox
                value={prompt}
                onChange={setPrompt}
                onRun={run}
                running={running}
                rows={9}
                runLabel="Score it"
                placeholder={
                  "You are a senior claims correspondent. Write an email to…\n\nTell the model who it is, who is reading, what it must not say, how long it should be, and what shape the answer takes."
                }
              />
              <p className="mt-4 text-[13px] leading-relaxed text-ink-50">
                Scored against the same six dimensions the whole product uses.
                The reference prompt stays hidden until you submit — that is the
                exercise.
              </p>
            </>
          ) : (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-semibold tracking-tight tabular-nums">
                    {result.total}
                    <span className="text-2xl text-ink-30"> / {RUBRIC_MAX}</span>
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm text-ink-50 underline underline-offset-4 hover:text-ink"
                >
                  Edit the prompt
                </button>
              </div>
              <p className="mt-2 text-[15px] text-ink-70">{result.headline}</p>

              <div className="mt-6 space-y-3">
                {RUBRIC.map((d) => (
                  <div
                    key={d.key}
                    className="grid grid-cols-[128px_minmax(0,1fr)_26px] items-center gap-3"
                  >
                    <span className="truncate text-[13px] text-ink-70">{d.name}</span>
                    <ScoreBar
                      value={result.scores[d.key]}
                      tone={result.scores[d.key] <= 2 ? "ink" : "signal"}
                    />
                    <span
                      className={cn(
                        "text-right text-[13px] font-medium tabular-nums",
                        result.scores[d.key] <= 2 ? "text-warn" : "text-ink",
                      )}
                    >
                      {result.scores[d.key]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Lead with the weakest dimension — the feedback is the product. */}
              {(() => {
                const weakest = [...RUBRIC].sort(
                  (a, b) => result.scores[a.key] - result.scores[b.key],
                )[0];
                return (
                  <div className="mt-6 rounded-xl bg-paper-2/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                      Biggest gap — {weakest.name}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-70">
                      {result.feedback[weakest.key]}
                    </p>
                  </div>
                );
              })()}

              <details className="mt-4 rounded-xl border border-rule p-4">
                <summary className="cursor-pointer text-sm font-medium">
                  What the model gave back
                </summary>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink-70">
                  {output}
                </pre>
              </details>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button to="/practice/denial-explanation-email" variant="filled">
                  See the reference prompt
                </Button>
                <Link
                  to="/onboarding"
                  className="text-sm text-ink-70 underline underline-offset-4 hover:text-ink"
                >
                  Start practicing free
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
