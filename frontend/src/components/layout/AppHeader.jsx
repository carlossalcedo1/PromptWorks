import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo.jsx";
import { cn } from "../ui/index.jsx";
import { LEARNER } from "../../data/org.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/practice", label: "Practice" },
  { to: "/workflows", label: "Workflows" },
  { to: "/team", label: "Team" },
];

/** App header — one row, different from the marketing header by design. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center gap-8 px-5 md:px-8">
        <Link to="/dashboard" aria-label="Promptworks dashboard">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-paper-2 font-medium text-ink"
                    : "text-ink-70 hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Streak + level — the Duolingo retention loop, borrowed without the style. */}
          <span className="hidden items-center gap-1.5 text-[13px] font-medium text-ink-70 sm:flex">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-signal" aria-hidden="true">
              <path
                d="M8 1.5s3.5 3 3.5 6a3.5 3.5 0 1 1-7 0c0-1 .5-2 1-2.5 0 1 .5 1.5 1 1.5 .8 0 .5-3 1.5-5z"
                fill="currentColor"
              />
            </svg>
            {LEARNER.streak} day streak
          </span>
          <span className="rounded-full border border-rule-strong px-2.5 py-0.5 text-[13px] font-medium">
            Lvl {LEARNER.level}
          </span>
          <span
            className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper"
            aria-label="Account"
          >
            CS
          </span>
        </div>
      </div>
    </header>
  );
}
