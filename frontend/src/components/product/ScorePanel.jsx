import { useState } from "react";
import { RUBRIC_MAX } from "../../data/rubric.js";
import { diffLines } from "../../lib/diff.js";
import { RubricBreakdown } from "./RubricBreakdown.jsx";
import { Button, Chip, cn } from "../ui/index.jsx";

const TABS = ["Your output", "Reference prompt", "Diff"];

function TokenDelta({ yours, reference }) {
  const diff = yours - reference;
  const pct = Math.round((diff / reference) * 100);
  const worse = diff > 0;
  return (
    <div className="text-right text-[13px] leading-snug">
      <p className="text-ink-70">
        Your prompt:{" "}
        <span className="font-semibold tabular-nums text-ink">{yours}</span>{" "}
        tokens · Reference:{" "}
        <span className="font-semibold tabular-nums text-ink">{reference}</span>
      </p>
      <p className={cn("mt-0.5", worse ? "text-warn" : "text-good")}>
        {worse
          ? `${pct}% more tokens for the same job`
          : `${Math.abs(pct)}% leaner than the reference`}
      </p>
    </div>
  );
}

/**
 * Score & feedback. Total, the six-dimension breakdown, then the three tabs.
 * The reference prompt is only reachable from here — never before submission.
 */
export function ScorePanel({
  result,
  scenario,
  promptText,
  output,
  onRetry,
  onNext,
  onSave,
  saved,
  compact = false,
}) {
  const [tab, setTab] = useState(TABS[0]);
  const diff = tab === "Diff" ? diffLines(promptText, scenario.referencePrompt) : null;

  return (
    <div className={cn("rounded-2xl border border-rule bg-white", compact ? "p-6" : "p-7 md:p-9")}>
      {/* Headline row */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <div>
            <p className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
              {result.total}
              <span className="text-2xl text-ink-30 md:text-3xl"> / {RUBRIC_MAX}</span>
            </p>
            {!compact && (
              <p className="mt-2 text-[13px] text-ink-50">
                +{Math.max(20, result.total * 6)} XP · Level 4 · 12 day streak
              </p>
            )}
          </div>
          <p className="max-w-[34ch] pt-2 text-[15px] leading-relaxed text-ink-70">
            {result.headline}
          </p>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-2">
            <Button variant="bordered" size="sm" onClick={onRetry}>
              Try again
            </Button>
            <Button variant="bordered" size="sm" onClick={onNext}>
              Next scenario
            </Button>
            <Button variant="filled" size="sm" onClick={onSave} disabled={saved}>
              {saved ? "Saved to workflows" : "Save as workflow"}
            </Button>
          </div>
        )}
      </div>

      {/* Rubric */}
      <div className="mt-8 border-t border-rule pt-2">
        <p className="pb-1 pt-4 text-xs text-ink-50">
          Rubric breakdown — the same six dimensions on every screen in the product.
        </p>
        <RubricBreakdown scores={result.scores} feedback={result.feedback} />
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
                  tab === t
                    ? "border-ink font-medium text-ink"
                    : "border-transparent text-ink-50 hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="pb-2">
            <TokenDelta yours={result.tokens} reference={scenario.referenceTokens} />
          </div>
        </div>

        <div className="pt-5">
          {tab === "Your output" && (
            <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap rounded-xl bg-paper-2/60 p-5 font-sans text-sm leading-relaxed text-ink-70">
              {output}
            </pre>
          )}

          {tab === "Reference prompt" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Chip tone="quiet">Yours</Chip>
                  <span className="text-xs text-ink-30">{result.tokens} tokens</span>
                </div>
                <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap rounded-xl border border-rule p-4 font-mono text-[12.5px] leading-relaxed text-ink-70">
                  {promptText || "(empty)"}
                </pre>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Chip tone="signal">Reference</Chip>
                  <span className="text-xs text-ink-30">
                    {scenario.referenceTokens} tokens
                  </span>
                </div>
                <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap rounded-xl border border-signal/25 bg-signal-wash/50 p-4 font-mono text-[12.5px] leading-relaxed text-ink">
                  {scenario.referencePrompt}
                </pre>
              </div>
            </div>
          )}

          {tab === "Diff" && (
            <div className="max-h-[420px] overflow-auto rounded-xl border border-rule font-mono text-[12.5px] leading-relaxed">
              {diff.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3 px-4 py-0.5",
                    line.type === "added" && "bg-signal-wash text-signal-ink",
                    line.type === "removed" && "bg-warn/8 text-warn",
                    line.type === "same" && "text-ink-50",
                  )}
                >
                  <span className="w-3 shrink-0 select-none text-ink-30">
                    {line.type === "added" ? "+" : line.type === "removed" ? "−" : ""}
                  </span>
                  <span className="whitespace-pre-wrap break-words">
                    {line.text || " "}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <p className="mt-7 max-w-[70ch] border-t border-rule pt-6 text-sm leading-relaxed text-ink-50">
          Cost efficiency is scored too. A prompt that gets the same answer in
          fewer tokens is a better prompt — and it is the cleanest ROI number the
          team dashboard has.
        </p>
      )}
    </div>
  );
}
