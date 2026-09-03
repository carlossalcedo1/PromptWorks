import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Logo } from "./Logo.jsx";
import { Button, cn } from "../ui/index.jsx";
import { useClickOutside } from "../../lib/useClickOutside.js";
import { useAuth } from "../../lib/auth.jsx";
import { AccountMenu } from "./AccountMenu.jsx";

const NAV = [
  { to: "/platform", label: "Platform" },
  { to: "/tracks", label: "Tracks" },
  { to: "/for-teams", label: "For Teams" },
  { to: "/pricing", label: "Pricing" },
  { to: "/resources", label: "Resources" },
];

// No search in the marketing header — search lives in the app, scoped to the
// challenge library.
export function MarketingHeader() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  // The toggle button and the panel it opens are both inside <header>, so a
  // click on either is never "outside" — only a click elsewhere on the page
  // closes it, same as the click that opened it stays a single gesture.
  useClickOutside(headerRef, () => setOpen(false), open);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md">
      {/* Row 1 — utility bar */}
      <div className="hidden border-b border-rule md:block">
        <div className="mx-auto flex h-9 w-full max-w-[1180px] items-center justify-between px-6 text-[13px] text-ink-50 md:px-10">
          <nav className="flex items-center gap-6">
            <Link to="/why" className="hover:text-ink">
              Why prompt training?
            </Link>
            <Link to="/for-teams" className="hover:text-ink">
              For business
            </Link>
            <Link to="/resources" className="hover:text-ink">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-5">
            <span className="text-ink-30">
              <button className="text-ink-70 hover:text-ink">English</button>
              <span className="px-1.5">|</span>
              <button className="hover:text-ink">Español</button>
            </span>
            {session ? (
              <AccountMenu session={session} />
            ) : (
              <Link to="/login" className="font-medium text-ink hover:underline">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — main row */}
      <div className="border-b border-rule">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-8 px-6 md:px-10">
          <Link to="/" aria-label="Promptworks home" onClick={() => setOpen(false)}>
            <Logo />
          </Link>

          <nav className="hidden flex-1 items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm transition-colors",
                    isActive ? "font-medium text-ink" : "text-ink-70 hover:text-ink",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            <Button to="/onboarding" variant="bordered" size="sm">
              Start free
            </Button>
            <Button to="/contact" variant="filled" size="sm">
              Book a demo
            </Button>
          </div>

          <button
            className="ml-auto rounded-lg border border-rule-strong p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d={open ? "M4 4l12 12M16 4L4 16" : "M2 5h16M2 10h16M2 15h16"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-rule bg-paper px-6 py-5 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] hover:bg-paper-2"
              >
                {item.label}
              </Link>
            ))}
            {session ? (
              <>
                <p className="truncate px-2 py-1.5 text-[13px] text-ink-50">
                  {session.email}
                </p>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-[15px] text-ink-70 hover:bg-paper-2"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="rounded-lg px-2 py-2.5 text-left text-[15px] text-ink-70 hover:bg-paper-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] text-ink-70 hover:bg-paper-2"
              >
                Log in
              </Link>
            )}
          </nav>
          <div className="mt-4 flex gap-2.5">
            <Button
              to="/onboarding"
              variant="bordered"
              size="sm"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Start free
            </Button>
            <Button
              to="/contact"
              variant="filled"
              size="sm"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Book a demo
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
