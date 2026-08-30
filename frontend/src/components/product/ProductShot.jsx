import { RUBRIC } from "../../data/rubric.js";
import { TEAM } from "../../data/org.js";
import { HeatMap } from "./HeatMap.jsx";
import { Chip, ScoreBar, cn } from "../ui/index.jsx";

/**
 * Product shots. These are real DOM, not images — the brief asks the homepage
 * to show the product rather than an abstract illustration, and rendering the
 * actual components keeps the marketing page honest as the app changes.
 */

function Frame({ label, children, className }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-rule bg-white shadow-[0_1px_2px_rgba(14,17,22,.04),0_12px_40px_-12px_rgba(14,17,22,.16)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-rule bg-paper-2/60 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
          <span className="h-2 w-2 rounded-full bg-rule-strong" />
        </span>
        <span className="ml-2 truncate text-[11.5px] text-ink-50">{label}</span>
      </div>
      {children}
    </div>
  );
}

const SAMPLE_SCORES = [5, 4, 3, 2, 5, 3];

/** The exercise player + score, as shown in the hero. */
export function PlayerShot({ className }) {
  return (
    <Frame
      label="Practice › Service & Claims › Denial explanation email"
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[38%_1fr]">
        {/* Left pane — scenario */}
        <div className="border-b border-rule p-4 sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-1.5">
            <Chip tone="quiet">Intermediate</Chip>
            <span className="text-[11px] text-ink-30">Attempt 1</span>
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-50">
            Scenario
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-70">
            A customer's claim was denied because the policy excludes flood
            damage. Write the prompt that produces the email to them.
          </p>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-50">
            Constraints
          </p>
          <ul className="mt-1.5 space-y-1">
            {[
              "Empathetic, plain english",
              "No admission of liability",
              "Under 150 words",
              "Cite the policy section",
              "End with one clear next step",
            ].map((c, i) => (
              <li key={c} className="flex items-start gap-1.5 text-[12px] text-ink-70">
                <span
                  className={cn(
                    "mt-[3px] grid h-3 w-3 shrink-0 place-items-center rounded-[3px] text-[8px] font-bold",
                    i < 3 ? "bg-signal text-white" : "border border-rule-strong text-transparent",
                  )}
                >
                  ✓
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Right pane — prompt + score */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-50">
              Your prompt
            </span>
            <span className="rounded border border-rule-strong px-1.5 py-0.5 font-mono text-[10px] text-ink-50">
              claude-sonnet
            </span>
          </div>
          <div className="mt-1.5 rounded-lg border border-rule-strong p-3 font-mono text-[11px] leading-relaxed text-ink-70">
            You are a senior claims correspondent. Write an email to a
            policyholder whose claim was denied because their policy excludes
            flood damage. Be empathetic and use plain English…
          </div>
          <p className="mt-1.5 text-[10.5px] text-ink-30">
            340 tokens · Est. ~$0.004 per run
          </p>

          <div className="mt-4 rounded-lg bg-paper-2/70 p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">22</span>
              <span className="text-sm text-ink-30">/ 30</span>
              <span className="ml-auto text-[11px] text-ink-50">+140 XP</span>
            </div>
            <div className="mt-3 space-y-2">
              {RUBRIC.map((d, i) => (
                <div key={d.key} className="grid grid-cols-[86px_1fr_18px] items-center gap-2">
                  <span className="truncate text-[10.5px] text-ink-50">{d.short}</span>
                  <ScoreBar
                    value={SAMPLE_SCORES[i]}
                    tone={SAMPLE_SCORES[i] <= 2 ? "ink" : "signal"}
                  />
                  <span className="text-right text-[10.5px] font-medium tabular-nums text-ink-70">
                    {SAMPLE_SCORES[i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-rule pt-2.5 text-[11px] leading-relaxed text-ink-70">
              <span className="font-medium text-ink">Output format 2/5</span> — no
              format given, the model guessed prose when you wanted a subject line
              and body.
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** The team heat map, as shown on the For Teams teaser. */
export function TeamShot({ className }) {
  return (
    <Frame label="Team › Claims Operations › Last 30 days" className={className}>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 border-b border-rule pb-4 sm:grid-cols-4">
          {[
            ["Seats active", "38 / 45", "84% adoption"],
            ["Median score", "22/30", "+3 vs. last month"],
            ["Reps this week", "312", "8.2 per active user"],
            ["Hours returned", "~46", "estimated"],
          ].map(([label, value, sub]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-50">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
              <p className="text-[10.5px] text-ink-30">{sub}</p>
            </div>
          ))}
        </div>
        <div className="pt-4">
          <HeatMap people={TEAM.people.slice(0, 6)} compact />
        </div>
      </div>
    </Frame>
  );
}

/** A saved workflow card, as shown in the workflows section. */
export function WorkflowShot({ className }) {
  return (
    <Frame label="Workflows › Claim denial email" className={className}>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="h-card">Claim denial email</h3>
          <Chip tone="signal">used 41×</Chip>
          <Chip tone="quiet">source score 26/30</Chip>
        </div>
        <p className="mt-1.5 text-[12.5px] text-ink-50">
          Service &amp; Claims · 3 variables · C. Salcedo
        </p>

        <div className="mt-4 space-y-2.5">
          {["customer_name", "denial_reason", "policy_section"].map((v) => (
            <div key={v} className="grid grid-cols-[130px_1fr] items-center gap-3">
              <label className="truncate font-mono text-[11px] text-ink-50">
                {v}
              </label>
              <div className="rounded-md border border-rule bg-paper-2/50 px-2.5 py-1.5 text-[11.5px] text-ink-30">
                —
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-paper-2/70 p-3 font-mono text-[11px] leading-relaxed text-ink-70">
          You are a senior claims correspondent. Write an email to{" "}
          <span className="rounded bg-signal-wash px-1 text-signal-ink">
            {"{{customer_name}}"}
          </span>
          , whose claim was denied because{" "}
          <span className="rounded bg-signal-wash px-1 text-signal-ink">
            {"{{denial_reason}}"}
          </span>
          . Cite{" "}
          <span className="rounded bg-signal-wash px-1 text-signal-ink">
            {"{{policy_section}}"}
          </span>
          …
        </div>

        <p className="mt-3 text-[11.5px] text-ink-50">
          Nineteen people ran this prompt. One of them wrote it.
        </p>
      </div>
    </Frame>
  );
}
