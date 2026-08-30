import { RUBRIC } from "../../data/rubric.js";
import { cn } from "../ui/index.jsx";

// Darker = stronger. One hue, five steps — a sequential ramp, because the
// underlying scale is sequential. Text label on every cell so the chart does
// not rely on colour alone.
// Text stays dark until the ramp is dark enough for white to clear 4.5:1.
const STEPS = [
  "bg-signal/10 text-ink-50",
  "bg-signal/22 text-ink-70",
  "bg-signal/40 text-ink",
  "bg-signal/65 text-ink",
  "bg-signal text-white",
];

/**
 * Proficiency heat map: people (rows) x six rubric dimensions (columns).
 * This is the screenshot that sells the product.
 */
export function HeatMap({ people, className, compact = false }) {
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)}>
      <table className="w-full min-w-[540px] border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr>
            <th className="w-[140px] px-2 pb-2 text-left text-xs font-medium uppercase tracking-wider text-ink-50">
              {compact ? "" : "Person"}
            </th>
            {RUBRIC.map((d) => (
              <th
                key={d.key}
                scope="col"
                className="px-1 pb-2 text-center text-xs font-medium text-ink-50"
              >
                {d.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.name}>
              <th
                scope="row"
                className="whitespace-nowrap px-2 text-left text-sm font-normal text-ink-70"
              >
                {p.name}
              </th>
              {p.scores.map((s, i) => (
                <td key={RUBRIC[i].key} className="px-0.5">
                  <div
                    className={cn(
                      "grid place-items-center rounded-md text-xs font-semibold tabular-nums",
                      compact ? "h-7" : "h-9",
                      STEPS[Math.max(0, Math.min(4, s - 1))],
                    )}
                    title={`${p.name} — ${RUBRIC[i].name}: ${s}/5`}
                  >
                    {s}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HeatMapLegend({ note }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-50">
      <span className="flex items-center gap-1.5">
        <span className="text-ink-30">Weaker</span>
        {STEPS.map((s, i) => (
          <span key={i} className={cn("h-3 w-5 rounded-sm", s.split(" ")[0])} />
        ))}
        <span className="text-ink-30">Stronger</span>
      </span>
      {note && <span>{note}</span>}
    </div>
  );
}
