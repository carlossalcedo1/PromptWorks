import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RUBRIC } from "../../data/rubric.js";
import { RubricProfile } from "../../components/product/RubricBreakdown.jsx";
import { Button, Card, Chip, ScoreBar, Stat } from "../../components/ui/index.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { getDashboard, ApiError } from "../../lib/api.js";

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="h-8 w-64 animate-pulse rounded bg-paper-2" />
      <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;

    setLoading(true);
    setError("");
    getDashboard(session.token)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load your dashboard. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-5 py-16 text-center">
        <p className="text-ink-70">{error}</p>
        <Button
          variant="bordered"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const hasQueue = data.queue.length > 0;
  const weakest = [...RUBRIC].sort(
    (a, b) => data.profile[a.key] - data.profile[b.key],
  )[0];
  const firstUp = hasQueue ? data.queue[0] : null;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">
            Welcome back, {data.name}
          </h1>
          <p className="mt-1.5 text-sm text-ink-50">
            {data.track ? `${data.track} track · ` : ""}Level {data.level} ·{" "}
            {data.streak} day streak
          </p>
        </div>
        {firstUp ? (
          <Button to={`/practice/${firstUp.scenario}`} variant="filled">
            Do today's rep
          </Button>
        ) : (
          <Button to="/practice" variant="filled">
            Start practicing
          </Button>
        )}
      </div>

      {/* Top row */}
      <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6">
          <Stat
            label="Reps this week"
            value={data.repsThisWeek}
            sub={`goal ${data.repsGoal}`}
          />
          <ScoreBar className="mt-4" value={data.repsThisWeek} max={data.repsGoal} />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Median score"
            value={`${data.medianScore}/30`}
            sub={
              data.medianDelta === 0
                ? "no change vs. last month"
                : `${data.medianDelta > 0 ? "+" : ""}${data.medianDelta.toFixed(1)} this month`
            }
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Weakest dimension"
            value={weakest.name}
            sub={`avg ${data.profile[weakest.key].toFixed(1)}/5`}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Workflows shipped"
            value={data.workflowsShipped}
            sub={`used ${data.workflowUses} times`}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Continue where you left off */}
        <Card className="bg-white">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="h-card">Continue where you left off</h2>
            <Link
              to="/practice"
              className="text-[13px] text-ink-50 underline underline-offset-4 hover:text-ink"
            >
              All scenarios
            </Link>
          </div>

          {hasQueue ? (
            <ul className="mt-5 divide-y divide-rule border-t border-rule">
              {data.queue.map((q) => (
                <li
                  key={q.scenario}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{q.title}</p>
                    <p className="mt-0.5 text-[13px] text-ink-50">
                      {q.track} · {q.difficulty} · {q.status}
                    </p>
                  </div>
                  <Button to={`/practice/${q.scenario}`} variant="bordered" size="sm">
                    {q.status.startsWith("completed") ? "Review" : "Practice"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 border-t border-rule pt-5 text-sm leading-relaxed text-ink-50">
              Nothing queued right now — either you've mastered every scenario
              in your track, or you haven't picked a track yet. Head to{" "}
              <Link to="/practice" className="underline underline-offset-4 hover:text-ink">
                Practice
              </Link>{" "}
              to pick your next one.
            </p>
          )}
        </Card>

        {/* Rubric profile */}
        <Card className="bg-white">
          <h2 className="h-card">Your rubric profile</h2>
          <p className="mt-1.5 text-[13px] text-ink-50">
            Rolling average across your last 20 attempts.
          </p>
          <RubricProfile profile={data.profile} className="mt-6" />

          <div className="mt-6 rounded-xl bg-paper-2/70 p-4">
            <p className="text-sm leading-relaxed text-ink-70">
              <span className="font-medium text-ink">{weakest.name}</span> is your
              gap.{" "}
              {hasQueue
                ? "Scenarios are queued for it."
                : "Practice a scenario to start closing it."}
            </p>
            <Button
              to={firstUp ? `/practice/${firstUp.scenario}` : "/practice"}
              variant="filled"
              size="sm"
              className="mt-4"
            >
              Work on {weakest.name.toLowerCase()}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-rule bg-white px-6 py-5">
        <Chip tone="signal">Streak {data.streak} days</Chip>
        <p className="text-sm text-ink-70">
          Ten minutes a week keeps the number moving. One rep is about four
          minutes.
        </p>
      </div>
    </div>
  );
}
