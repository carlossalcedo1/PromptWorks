import { useState } from "react";
import { TEAM, WORKFLOWS } from "../../data/org.js";
import { HeatMap, HeatMapLegend } from "../../components/product/HeatMap.jsx";
import { Button, Card, Chip, ScoreBar, Stat, cn } from "../../components/ui/index.jsx";

const RANGES = ["Last 7 days", "Last 30 days", "Last quarter"];

export default function Team() {
  const [range, setRange] = useState(RANGES[1]);
  const [assigned, setAssigned] = useState(false);
  // Hours returned is an estimate, and the inputs belong to the customer.
  const [minutes, setMinutes] = useState(9);
  const [rate, setRate] = useState(48);

  // Org-wide runs drive the estimate; the library table below lists the top five.
  const runs = TEAM.workflowRuns;
  const topFiveRuns = WORKFLOWS.reduce((n, w) => n + w.usage, 0);
  const hours = (runs * minutes) / 60;
  const value = hours * rate;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">
            Team — {TEAM.name}
          </h1>
          <p className="mt-1.5 text-sm text-ink-50">
            {TEAM.seatsActive} of {TEAM.seatsTotal} seats active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-rule-strong bg-white px-3 py-1.5 text-base sm:text-sm"
          >
            {RANGES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <Button variant="bordered" size="sm">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top row */}
      <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6">
          <Stat
            label="Seats active"
            value={`${TEAM.seatsActive} / ${TEAM.seatsTotal}`}
            sub={`${Math.round((TEAM.seatsActive / TEAM.seatsTotal) * 100)}% adoption`}
          />
          <ScoreBar className="mt-4" value={TEAM.seatsActive} max={TEAM.seatsTotal} />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Median score"
            value={`${TEAM.medianScore}/30`}
            sub={`+${TEAM.medianDelta} vs. last month`}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Reps this week"
            value={TEAM.repsThisWeek}
            sub={`${(TEAM.repsThisWeek / TEAM.seatsActive).toFixed(1)} per active user`}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Hours returned"
            value={`~${Math.round(hours)}`}
            sub="estimate — your assumptions"
            tone="signal"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Heat map — the screenshot that sells the product */}
        <Card className="bg-white">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="h-card">Proficiency heat map</h2>
            <p className="text-[13px] text-ink-50">people × rubric dimension</p>
          </div>
          <div className="mt-5">
            <HeatMap people={TEAM.people} />
            <HeatMapLegend note="Output format is the org-wide gap." />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white">
            <p className="eyebrow">Weakest dimension</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
              {TEAM.weakest.name} — team avg {TEAM.weakest.avg} / 5
            </h3>
            <p className="mt-1.5 text-sm text-ink-70">
              {TEAM.weakest.below} of {TEAM.weakest.of} people below 3.
            </p>
            <Button
              variant={assigned ? "bordered" : "filled"}
              size="sm"
              className="mt-5"
              onClick={() => setAssigned(true)}
              disabled={assigned}
            >
              {assigned
                ? `Assigned to ${TEAM.weakest.of} people`
                : `Assign “${TEAM.weakest.assign}” track`}
            </Button>
          </Card>

          <Card className="bg-white">
            <p className="eyebrow">Benchmark</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
              Your median{" "}
              <span className="font-semibold text-ink">{TEAM.medianScore}</span>{" "}
              vs. platform median{" "}
              <span className="font-semibold text-ink">{TEAM.benchmarkMedian}</span>{" "}
              for {TEAM.benchmarkPeer}.
            </p>
            <div className="mt-4 space-y-2.5">
              {[
                ["Your org", TEAM.medianScore, "bg-signal"],
                ["Platform median", TEAM.benchmarkMedian, "bg-ink-30"],
              ].map(([label, v, color]) => (
                <div key={label} className="grid grid-cols-[110px_1fr_34px] items-center gap-3">
                  <span className="text-[13px] text-ink-50">{label}</span>
                  <div className="h-1.5 w-full rounded-full bg-paper-2">
                    <div
                      className={cn("h-full rounded-full", color)}
                      style={{ width: `${(v / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-[13px] font-medium tabular-nums">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Assignments */}
        <Card className="bg-white">
          <h2 className="h-card">Assignments</h2>
          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase tracking-wider text-ink-50">
                <th className="pb-2 font-medium">Track</th>
                <th className="pb-2 font-medium">Due</th>
                <th className="pb-2 text-right font-medium">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {TEAM.assignments.map((a) => (
                <tr key={a.track}>
                  <td className="py-3.5">
                    <span className="font-medium">{a.track}</span>
                    {a.status === "not sent" && (
                      <Chip tone="quiet" className="ml-2">
                        not sent
                      </Chip>
                    )}
                  </td>
                  <td className="py-3.5 text-ink-70">{a.due}</td>
                  <td className="py-3.5">
                    <div className="flex items-center justify-end gap-3">
                      <div className="h-1.5 w-24 rounded-full bg-paper-2">
                        <div
                          className="h-full rounded-full bg-signal"
                          style={{ width: `${(a.done / a.total) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right tabular-nums text-ink-70">
                        {a.done}/{a.total}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Hours returned — the estimate, with the inputs exposed */}
        <Card className="bg-white">
          <div className="flex items-center gap-2">
            <h2 className="h-card">Hours returned</h2>
            <Chip tone="quiet">estimate</Chip>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-70">
            Workflow runs × minutes saved per run × your loaded hourly rate. Every
            input is yours, and every input is visible.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <label htmlFor="minutes" className="text-ink-70">
                  Minutes saved per run
                </label>
                <span className="font-medium tabular-nums">{minutes}</span>
              </div>
              <input
                id="minutes"
                type="range"
                min="1"
                max="30"
                value={minutes}
                onChange={(e) => setMinutes(+e.target.value)}
                className="mt-2 w-full accent-[var(--color-signal)]"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <label htmlFor="rate" className="text-ink-70">
                  Loaded hourly rate
                </label>
                <span className="font-medium tabular-nums">${rate}</span>
              </div>
              <input
                id="rate"
                type="range"
                min="20"
                max="150"
                value={rate}
                onChange={(e) => setRate(+e.target.value)}
                className="mt-2 w-full accent-[var(--color-signal)]"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-rule pt-5">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{runs}</p>
              <p className="text-[12.5px] text-ink-50">workflow runs</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {Math.round(hours)}
              </p>
              <p className="text-[12.5px] text-ink-50">hours returned</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-signal">
                ${Math.round(value).toLocaleString()}
              </p>
              <p className="text-[12.5px] text-ink-50">at your rate</p>
            </div>
          </div>

          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-30">
            We do not hand you a pre-cooked ROI figure. You set the assumptions,
            you can change them, and you can defend the result because you built
            it.
          </p>
        </Card>
      </div>

      {/* Team workflow library */}
      <Card className="mt-6 bg-white">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="h-card">Team workflow library</h2>
          <p className="text-[13px] text-ink-50">
            Top 5 of {runs} runs in {range.toLowerCase()} · {topFiveRuns} shown
          </p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase tracking-wider text-ink-50">
                <th className="pb-2 font-medium">Workflow</th>
                <th className="pb-2 font-medium">Track</th>
                <th className="pb-2 font-medium">Runs</th>
                <th className="pb-2 font-medium">Unique users</th>
                <th className="pb-2 font-medium">Helpful</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {WORKFLOWS.map((w) => (
                <tr key={w.slug}>
                  <td className="py-3.5 font-medium">{w.title}</td>
                  <td className="py-3.5 text-ink-70">{w.track}</td>
                  <td className="py-3.5 tabular-nums text-ink-70">{w.usage}</td>
                  <td className="py-3.5 tabular-nums text-ink-70">
                    {w.uniqueUsers}
                  </td>
                  <td className="py-3.5 tabular-nums text-ink-70">{w.helpful}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
