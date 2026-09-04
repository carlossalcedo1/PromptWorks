import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SCENARIOS, scenarioBySlug } from "../../data/scenarios.js";
import { trackBySlug } from "../../data/tracks.js";
import { gradeAttempt, ApiError } from "../../lib/api.js";
import { computeHeadline } from "../../lib/headline.js";
import { useAuth } from "../../lib/auth.jsx";
import { ScorePanel } from "../../components/product/ScorePanel.jsx";
import { Button, Chip } from "../../components/ui/index.jsx";

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
  const { session } = useAuth();
  const scenario = scenarioBySlug(slug) ?? SCENARIOS[0];
  const track = trackBySlug(scenario.track);

  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [saved, setSaved] = useState(false);
  const scoreRef = useRef(null);

  const next = useMemo(() => {
    const i = SCENARIOS.findIndex((s) => s.slug === scenario.slug);
    return SCENARIOS[(i + 1) % SCENARIOS.length];
  }, [scenario.slug]);

  async function run() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setError("");
    try {
      const r = await gradeAttempt(scenario.slug, prompt, session?.token);
      setResult({ ...r, headline: computeHeadline(r.scores, r.total) });
      requestAnimationFrame(() =>
        scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  const retry = () => {
    setResult(null);
    setError("");
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
          {/* No per-constraint checkmarks: the real judge returns six
              dimension scores, not a boolean per constraint, so there's no
              honest per-item "met" signal to show anymore. A plain list is
              more accurate than a fabricated checkmark would be. */}
          <ul className="mt-2.5 space-y-2">
            {scenario.constraints.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-sm">
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-30"
                  aria-hidden="true"
                />
                <span className="text-ink-70">{c.label}</span>
              </li>
            ))}
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

        {/* Right pane — prompt, score */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-rule bg-white p-6">
            <label htmlFor="prompt" className="text-sm font-medium">
              Your prompt
            </label>
            <textarea
              id="prompt"
              rows={14}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write the prompt that produces the deliverable described on the left…"
              spellCheck="false"
              className="mt-2.5 w-full resize-y rounded-xl border border-rule-strong bg-white p-4 font-mono text-base leading-relaxed placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30 sm:text-[13px]"
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-3 flex justify-end">
              <Button onClick={run} disabled={!prompt.trim() || running} variant="filled" size="md">
                {running ? "Grading…" : "Run prompt"}
              </Button>
            </div>
          </div>

          {result && (
            <div className="rounded-2xl border border-rule bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                Cost of this run
              </p>
              <p className="mt-1.5 text-sm text-ink-70">
                <span className="font-medium tabular-nums text-ink">
                  ${result.cost_usd.toFixed(6)}
                </span>{" "}
                — the real cost of this grading call, not an estimate.
              </p>
            </div>
          )}

          <div ref={scoreRef} className="scroll-mt-20">
            {result && (
              <ScorePanel
                result={result}
                scenario={scenario}
                promptText={prompt}
                output={
                  "Live model output isn't available yet in this version — the " +
                  "grader evaluates your prompt directly rather than running it " +
                  "against a model first. This panel will show a real generated " +
                  "response in a future update."
                }
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