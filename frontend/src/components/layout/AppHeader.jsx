import { useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo.jsx";
import { Button, cn } from "../ui/index.jsx";
import { LEARNER } from "../../data/org.js";
import { useAuth } from "../../lib/auth.jsx";
import { useClickOutside } from "../../lib/useClickOutside.js";
import { AccountMenu } from "./AccountMenu.jsx";

// Dashboard lives in the account menu now, not the top nav — it's the
// signed-in person's own page, same reasoning as the avatar next to it.
const NAV = [
  { to: "/practice", label: "Practice" },
  { to: "/check", label: "Check a prompt" },
  { to: "/workflows", label: "Workflows" },
  { to: "/team", label: "Team" },
];

/** App header — one row, different from the marketing header by design. */
export function AppHeader() {
  const { session } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef(null);
  useClickOutside(navRef, () => setNavOpen(false), navOpen);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center gap-4 px-4 sm:gap-6 sm:px-5 md:gap-8 md:px-8">
        {/* Home, not the dashboard — the account menu's avatar (below) is
            the way back to the dashboard once you're logged in, so the logo
            is free to be the usual "take me to the marketing site" link. */}
        <Link to="/" aria-label="Promptworks home" className="shrink-0">
          <Logo />
        </Link>

        {/* Inline on desktop; below md it collapses into the dropdown next
            to the avatar instead of scrolling sideways. */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors",
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

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          {/* Mobile nav dropdown — same links as the row above, just
              collapsed behind a toggle next to the avatar. */}
          <div ref={navRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              aria-label="Toggle navigation"
              className="rounded-lg border border-rule-strong p-2"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path
                  d={navOpen ? "M4 4l12 12M16 4L4 16" : "M2 5h16M2 10h16M2 15h16"}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>

            {navOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-xl border border-rule bg-paper p-2 shadow-lg">
                <nav className="flex flex-col gap-0.5">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setNavOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "rounded-lg px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-paper-2 font-medium text-ink"
                            : "text-ink-70 hover:bg-paper-2 hover:text-ink",
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {session ? (
            <>
              {/* Streak + level — the Duolingo retention loop, borrowed without
                  the style. Still LEARNER mock data (org.js) either way; only
                  the identity below is real. Hidden below sm so a phone-width
                  header is just nav + avatar, not four things fighting for
                  space. */}
              <span className="hidden items-center gap-1.5 text-[13px] font-medium text-ink-70 sm:flex">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-signal" aria-hidden="true">
                  <path
                    d="M8 1.5s3.5 3 3.5 6a3.5 3.5 0 1 1-7 0c0-1 .5-2 1-2.5 0 1 .5 1.5 1 1.5 .8 0 .5-3 1.5-5z"
                    fill="currentColor"
                  />
                </svg>
                {LEARNER.streak} day streak
              </span>
              <span className="hidden rounded-full border border-rule-strong px-2.5 py-0.5 text-[13px] font-medium sm:inline">
                Lvl {LEARNER.level}
              </span>

              <AccountMenu session={session} />
            </>
          ) : (
            <Button to="/login" variant="bordered" size="sm">
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}