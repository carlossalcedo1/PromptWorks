import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SCENARIOS, scenarioBySlug } from "../../data/scenarios.js";
import { trackBySlug } from "../../data/tracks.js";
import { gradePrompt, mockOutput } from "../../lib/grader.js";
import { PromptBox } from "../../components/product/PromptBox.jsx";
import { ScorePanel } from "../../components/product/ScorePanel.jsx";
import { Button, Chip, cn } from "../../components/ui/index.jsx";

/**
 * Remount on scenario change rather than resetting six pieces of state in an
 * effect — a new scenario is a genuinely new exercise.
 */
export default function Player() {
  const { slug } = useParams();
  return <PlayerScreen key={slug} slug={slug} />;
}

function PlayerScreen({ slug }) {
  const navigate = useNavigate();
  const scenario = scenarioBySlug(slug) ?? SCENARIOS[0];
  const track = trackBySlug(scenario.track);

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("claude-sonnet");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [output, setOutput] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [saved, setSaved] = useState(false);
  const scoreRef = useRef(null);

  const next = useMemo(() => {
    const i = SCENARIOS.findIndex((s) => s.slug === scenario.slug);
    return SCENARIOS[(i + 1) % SCENARIOS.length];
  }, [scenario.slug]);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const r = gradePrompt(prompt, scenario);
      setResult(r);
      setOutput(mockOutput(prompt, scenario, r));
      setRunning(false);
      requestAnimationFrame(() =>
        scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }, 650);
  };

  const retry = () => {
    setResult(null);
    setOutput("");
    setSaved(false);
    setAttempt((a) => a + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-6 md:px-8 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-50">
        <Link to="/practice" className="hover:text-ink">
          Practice
        </Link>
        <span className="text-ink-30">›</span>
        <Link to="/scenarios" className="hover:text-ink">
          {track?.title ?? scenario.track}
        </Link>
        <span className="text-ink-30">›</span>
        <span className="text-ink">{scenario.title}</span>
      </nav>

      <div className="mt-5 grid gap-6 lg:grid-cols-[38%_1fr]">
        {/* Left pane — scenario brief */}
        <aside className="rounded-2xl border border-rule bg-white p-6 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={scenario.difficulty === "Advanced" ? "signal" : "quiet"}>
              {scenario.difficulty}
            </Chip>
            <span className="text-[13px] text-ink-50">
              Attempt {attempt} of unlimited
            </span>
          </div>

          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
            {scenario.title}
          </h1>

          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-50">
            Scenario
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-70">
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

          {!result && (
            <p className="mt-6 rounded-xl bg-paper-2/70 p-4 text-[13px] leading-relaxed text-ink-50">
              The reference prompt is hidden until you submit. That is the whole
              exercise.
            </p>
          )}
        </aside>

        {/* Right pane — prompt, output, score */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-rule bg-white p-6">
            <PromptBox
              value={prompt}
              onChange={setPrompt}
              model={model}
              onModelChange={setModel}
              onRun={run}
              running={running}
              rows={14}
            />
          </div>

          {(running || output) && (
            <div className="rounded-2xl border border-rule bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                Model output
              </p>
              {running ? (
                <div className="mt-4 space-y-2.5" aria-live="polite">
                  {[100, 92, 78].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-paper-2"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                  <p className="pt-2 text-[13px] text-ink-30">
                    Running against {model}, then grading…
                  </p>
                </div>
              ) : (
                <pre className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink-70">
                  {output}
                </pre>
              )}
            </div>
          )}

          <div ref={scoreRef} className="scroll-mt-20">
            {result && (
              <ScorePanel
                result={result}
                scenario={scenario}
                promptText={prompt}
                output={output}
                saved={saved}
                onRetry={retry}
                onNext={() => navigate(`/practice/${next.slug}`)}
                onSave={() => setSaved(true)}
              />
            )}
          </div>

          {result && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rule bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                  Up next
                </p>
                <p className="mt-1 text-[15px] font-medium">{next.title}</p>
                <p className="text-[13px] text-ink-50">
                  {trackBySlug(next.track)?.title} · {next.difficulty}
                </p>
              </div>
              <Button to={`/practice/${next.slug}`} variant="filled" size="sm">
                Next scenario
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
