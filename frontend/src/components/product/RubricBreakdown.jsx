import { RUBRIC } from "../../data/rubric.js";
import { ScoreBar, cn } from "../ui/index.jsx";

/**
 * The six-dimension readout. Same component, same order, on the score screen
 * and the learner dashboard — that consistency is what makes the manager
 * dashboard legible later.
 */
export function RubricBreakdown({ scores, feedback, max = 5, className }) {
  return (
    <div className={cn("divide-y divide-rule", className)}>
      {RUBRIC.map((dim) => {
        const value = scores[dim.key];
        const weak = value <= 2;
        return (
          <div
            key={dim.key}
            className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-2 py-4 md:grid-cols-[190px_44px_minmax(0,1fr)] md:items-baseline"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{dim.name}</span>
            </div>

            <div className="flex items-baseline gap-1 md:justify-end">
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  weak ? "text-warn" : "text-ink",
                )}
              >
                {value}
              </span>
              <span className="text-xs text-ink-30">/{max}</span>
            </div>

            <div className="min-w-0">
              <ScoreBar value={value} max={max} tone={weak ? "ink" : "signal"} />
              {feedback?.[dim.key] && (
                <p className="mt-2 text-sm leading-relaxed text-ink-70">
                  {feedback[dim.key]}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact profile version — no feedback lines. Learner dashboard, right rail. */
export function RubricProfile({ profile, className }) {
  return (
    <div className={cn("space-y-3.5", className)}>
      {RUBRIC.map((dim) => {
        const value = profile[dim.key];
        return (
          <div key={dim.key} className="grid grid-cols-[120px_minmax(0,1fr)_34px] items-center gap-3">
            <span className="truncate text-sm text-ink-70">{dim.name}</span>
            <ScoreBar value={value} tone={value < 3 ? "ink" : "signal"} />
            <span
              className={cn(
                "text-right text-sm font-medium tabular-nums",
                value < 3 ? "text-warn" : "text-ink",
              )}
            >
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
