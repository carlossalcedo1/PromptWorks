import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLE_TRACKS } from "../../data/tracks.js";
import { SCENARIOS } from "../../data/scenarios.js";
import { Logo } from "../../components/layout/Logo.jsx";
import { Button, cn } from "../../components/ui/index.jsx";

const ROLES = [...ROLE_TRACKS.map((t) => ({ slug: t.slug, label: t.title })), {
  slug: "other",
  label: "Other",
}];

const GOALS = [
  { key: "faster", label: "Write faster" },
  { key: "consistent", label: "Get more consistent output" },
  { key: "rewrites", label: "Stop rewriting what the model gives me" },
  { key: "team", label: "Train my team" },
];

/**
 * Three screens, one question each, then straight into a rep.
 * Signup completes AFTER the first score, not before.
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [goal, setGoal] = useState(null);

  // The role picker sets the default track; the goal sets the first scenario.
  const firstScenario =
    SCENARIOS.find((s) => s.track === role && s.difficulty === "Beginner") ??
    SCENARIOS.find((s) => s.track === role) ??
    SCENARIOS.find((s) => s.difficulty === "Beginner") ??
    SCENARIOS[0];

  const steps = [
    {
      title: "What do you do?",
      sub: "Sets your default track. You can change it later.",
      options: ROLES.map((r) => ({ key: r.slug, label: r.label })),
      value: role,
      set: (v) => {
        setRole(v);
        setStep(1);
      },
    },
    {
      title: "What do you want to fix?",
      sub: "Sets your first scenario.",
      options: GOALS,
      value: goal,
      set: (v) => {
        setGoal(v);
        setStep(2);
      },
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <span className="text-[13px] text-ink-50">Step {step + 1} of 3</span>
      </div>

      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-ink" : "bg-rule",
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center py-14">
        {step < 2 ? (
          <div>
            <h1 className="h-section text-balance">{steps[step].title}</h1>
            <p className="mt-3 text-[15px] text-ink-50">{steps[step].sub}</p>

            <div className="mt-9 grid gap-2.5 sm:grid-cols-2">
              {steps[step].options.map((o) => (
                <button
                  key={o.key}
                  onClick={() => steps[step].set(o.key)}
                  className={cn(
                    "rounded-xl border px-5 py-4 text-left text-[15px] transition-colors",
                    steps[step].value === o.key
                      ? "border-ink bg-ink text-paper"
                      : "border-rule-strong bg-white hover:border-ink",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="mt-8 text-sm text-ink-50 underline underline-offset-4 hover:text-ink"
              >
                Back
              </button>
            )}
          </div>
        ) : (
          <div>
            <h1 className="h-section text-balance">Do one rep now.</h1>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-70">
              No tour. You get a real scenario from your track, you write a
              prompt, and you get a real score. Account creation happens after
              that — there is no point signing up for something you have not
              tried.
            </p>

            <div className="mt-8 rounded-2xl border border-rule bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-50">
                Your first scenario
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
                {firstScenario.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-70">
                {firstScenario.brief}
              </p>
              <p className="mt-4 text-[13px] text-ink-50">
                {firstScenario.difficulty} · {firstScenario.constraints.length}{" "}
                constraints · about four minutes
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => navigate(`/practice/${firstScenario.slug}`)}
                variant="filled"
                size="lg"
              >
                Start the rep
              </Button>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-ink-50 underline underline-offset-4 hover:text-ink"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[13px] text-ink-30">
        Prototype — no account is created and nothing is stored.
      </p>
    </div>
  );
}
