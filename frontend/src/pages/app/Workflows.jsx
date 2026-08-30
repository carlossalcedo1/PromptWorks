import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { WORKFLOWS } from "../../data/org.js";
import { Button, Card, Chip, cn } from "../../components/ui/index.jsx";

const FILTERS = ["All", "Mine", "Team", "Service & Claims", "Sales", "Most used"];

/** Fill the {{variables}} in a template from a small form. */
function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key) =>
    values[key]?.trim() ? values[key] : m,
  );
}

function WorkflowDetail({ workflow }) {
  const [values, setValues] = useState({});
  const [copied, setCopied] = useState(false);

  const filled = useMemo(
    () => fill(workflow.template, values),
    [workflow.template, values],
  );
  const remaining = (filled.match(/\{\{\w+\}\}/g) || []).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h-card">{workflow.title}</h2>
          <p className="mt-1 text-[13px] text-ink-50">
            {workflow.track} · {workflow.author} · source score{" "}
            {workflow.sourceScore}/30
          </p>
        </div>
        <div className="flex gap-2">
          <Chip tone="signal">used {workflow.usage}×</Chip>
          <Chip tone="quiet">{workflow.uniqueUsers} people</Chip>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
            Inputs
          </p>
          <div className="mt-3 space-y-3">
            {workflow.variables.map((v) => (
              <div key={v}>
                <label
                  htmlFor={`var-${v}`}
                  className="mb-1 block font-mono text-[11.5px] text-ink-50"
                >
                  {v}
                </label>
                <input
                  id={`var-${v}`}
                  value={values[v] ?? ""}
                  onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                  className="w-full rounded-lg border border-rule-strong bg-white px-3 py-2 text-sm placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30"
                  placeholder="—"
                />
              </div>
            ))}
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-ink-50">
            Non-experts run an expert's prompt without writing one. The source
            attempt stays linked, so you can see how it was scored.
          </p>
          <Link
            to={`/practice/${workflow.sourceScenario}`}
            className="mt-2 inline-block text-[13px] underline underline-offset-4 hover:text-signal"
          >
            Open the source scenario
          </Link>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
              Prompt
            </p>
            <button
              onClick={copy}
              className="rounded-full border border-rule-strong px-3 py-1 text-[12.5px] transition-colors hover:border-ink"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl bg-paper-2/60 p-4 font-mono text-[12px] leading-relaxed text-ink-70">
            {filled}
          </pre>
          <p className="mt-2 text-[12.5px] text-ink-30">
            {remaining === 0
              ? "All variables filled — ready to run."
              : `${remaining} variable${remaining > 1 ? "s" : ""} still empty.`}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function Workflows() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(WORKFLOWS[0].slug);

  const list = useMemo(() => {
    let l = [...WORKFLOWS];
    if (filter === "Mine") l = l.filter((w) => w.author === "C. Salcedo");
    else if (filter === "Service & Claims" || filter === "Sales")
      l = l.filter((w) => w.track === filter);
    if (filter === "Most used") l.sort((a, b) => b.usage - a.usage);
    return l;
  }, [filter]);

  const workflow = WORKFLOWS.find((w) => w.slug === selected) ?? WORKFLOWS[0];

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">Workflows</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-70">
            Prompts that scored well, saved with variables, shared with the team.
            This is where practice pays for itself.
          </p>
        </div>
        <Button variant="filled" size="sm">
          + New workflow
        </Button>
      </div>

      <div className="mt-7 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-colors",
              filter === f ? "bg-ink text-paper" : "text-ink-70 hover:bg-paper-2",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-rule bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs uppercase tracking-wider text-ink-50">
              <th className="px-5 py-3 font-medium">Workflow</th>
              <th className="px-5 py-3 font-medium">Track</th>
              <th className="px-5 py-3 font-medium">Inputs</th>
              <th className="px-5 py-3 font-medium">Usage</th>
              <th className="px-5 py-3 font-medium">Source score</th>
              <th className="px-5 py-3 font-medium">Author</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {list.map((w) => (
              <tr
                key={w.slug}
                onClick={() => setSelected(w.slug)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-paper-2/50",
                  selected === w.slug && "bg-signal-wash/60",
                )}
              >
                <td className="px-5 py-3.5 font-medium">{w.title}</td>
                <td className="px-5 py-3.5 text-ink-70">{w.track}</td>
                <td className="px-5 py-3.5 text-ink-70">
                  {w.variables.length} variables
                </td>
                <td className="px-5 py-3.5 tabular-nums text-ink-70">
                  used {w.usage}×
                </td>
                <td className="px-5 py-3.5 tabular-nums text-ink-70">
                  {w.sourceScore}/30
                </td>
                <td className="px-5 py-3.5 text-ink-70">{w.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <WorkflowDetail key={workflow.slug} workflow={workflow} />

        <Card>
          <p className="eyebrow">Why this section exists</p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-70">
            Practice alone is a training product, and training products churn.
            Workflows make the skill produce something the org keeps using —
            which is the renewal argument and the ROI story at once.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-70">
            It is also where “AI-powered workflows” stops being a buzzword and
            becomes a screen.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-rule pt-5">
            {[
              ["Runs", WORKFLOWS.reduce((n, w) => n + w.usage, 0)],
              ["People", WORKFLOWS.reduce((n, w) => n + w.uniqueUsers, 0)],
              ["Published", WORKFLOWS.length],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-2xl font-semibold tabular-nums">{v}</p>
                <p className="text-[12.5px] text-ink-50">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
