import { Link } from "react-router-dom";
import { LEARNER } from "../../data/org.js";
import { RUBRIC } from "../../data/rubric.js";
import { RubricProfile } from "../../components/product/RubricBreakdown.jsx";
import { Button, Card, Chip, ScoreBar, Stat } from "../../components/ui/index.jsx";

export default function Dashboard() {
  const weakest = [...RUBRIC].sort(
    (a, b) => LEARNER.profile[a.key] - LEARNER.profile[b.key],
  )[0];

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">
            Welcome back, {LEARNER.name}
          </h1>
          <p className="mt-1.5 text-sm text-ink-50">
            {LEARNER.track} track · Level {LEARNER.level} · {LEARNER.streak} day
            streak
          </p>
        </div>
        <Button to={`/practice/${LEARNER.queue[0].scenario}`} variant="filled">
          Do today's rep
        </Button>
      </div>

      {/* Top row */}
      <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6">
          <Stat
            label="Reps this week"
            value={LEARNER.repsThisWeek}
            sub={`goal ${LEARNER.repsGoal}`}
          />
          <ScoreBar
            className="mt-4"
            value={LEARNER.repsThisWeek}
            max={LEARNER.repsGoal}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Median score"
            value={`${LEARNER.medianScore}/30`}
            sub={`+${LEARNER.medianDelta} this month`}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Weakest dimension"
            value={weakest.name}
            sub={`avg ${LEARNER.profile[weakest.key].toFixed(1)}/5`}
          />
        </div>
        <div className="bg-white p-6">
          <Stat
            label="Workflows shipped"
            value={LEARNER.workflowsShipped}
            sub={`used ${LEARNER.workflowUses} times`}
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

          <ul className="mt-5 divide-y divide-rule border-t border-rule">
            {LEARNER.queue.map((q) => (
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
                <Button
                  to={`/practice/${q.scenario}`}
                  variant="bordered"
                  size="sm"
                >
                  {q.status.startsWith("completed") ? "Review" : "Practice"}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Rubric profile */}
        <Card className="bg-white">
          <h2 className="h-card">Your rubric profile</h2>
          <p className="mt-1.5 text-[13px] text-ink-50">
            Rolling average across your last 20 attempts.
          </p>
          <RubricProfile profile={LEARNER.profile} className="mt-6" />

          <div className="mt-6 rounded-xl bg-paper-2/70 p-4">
            <p className="text-sm leading-relaxed text-ink-70">
              <span className="font-medium text-ink">{weakest.name}</span> is your
              gap. Three scenarios are queued for it.
            </p>
            <Button
              to={`/practice/${LEARNER.queue[0].scenario}`}
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
        <Chip tone="signal">Streak {LEARNER.streak} days</Chip>
        <p className="text-sm text-ink-70">
          Ten minutes a week keeps the number moving. One rep is about four
          minutes.
        </p>
      </div>
    </div>
  );
}
