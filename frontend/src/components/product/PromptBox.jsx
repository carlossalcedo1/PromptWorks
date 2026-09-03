import { estimateTokens, estimateCost } from "../../lib/grader.js";
import { Button, cn } from "../ui/index.jsx";

export const MODELS = [
  { id: "claude-sonnet", label: "claude-sonnet" },
  { id: "claude-haiku", label: "claude-haiku" },
  { id: "gpt-class", label: "gpt-class" },
];

const MAX_TOKENS = 2000;

/**
 * The prompt textarea, model selector and live token/cost meter.
 * Efficiency is part of the skill, so the cost is visible while you type —
 * not revealed afterwards.
 */
export function PromptBox({
  value,
  onChange,
  model,
  onModelChange,
  onRun,
  running,
  rows = 12,
  runLabel = "Run prompt",
  placeholder = "Write the prompt that produces the deliverable described on the left…",
}) {
  const tokensIn = estimateTokens(value);
  const tokensOut = Math.round(tokensIn * 0.55) || 0;
  const cost = estimateCost(tokensIn, tokensOut);
  const over = tokensIn > MAX_TOKENS;

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="prompt" className="text-sm font-medium">
          Your prompt
        </label>
        {onModelChange && (
          <label className="flex items-center gap-2 text-[13px] text-ink-50">
            Model
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="rounded-lg border border-rule-strong bg-white px-2.5 py-1 font-mono text-[12.5px] text-ink"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <textarea
        id="prompt"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck="false"
        className={cn(
          "w-full resize-y rounded-xl border bg-white p-4 font-mono text-base leading-relaxed sm:text-[13px]",
          "placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30",
          over ? "border-warn" : "border-rule-strong",
        )}
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="text-[12.5px] text-ink-50">
          <span className={cn("tabular-nums", over && "text-warn")}>
            {tokensIn.toLocaleString()} / {MAX_TOKENS.toLocaleString()} tokens
          </span>
          <span className="px-2 text-ink-30">·</span>
          <span className="tabular-nums">
            Est. {tokensIn} in / {tokensOut} out
          </span>
          <span className="px-2 text-ink-30">·</span>
          <span className="tabular-nums">~${cost.toFixed(4)} per run</span>
        </div>

        <Button
          onClick={onRun}
          disabled={!value.trim() || running}
          variant="filled"
          size="md"
        >
          {running ? "Grading…" : runLabel}
        </Button>
      </div>
    </div>
  );
}
