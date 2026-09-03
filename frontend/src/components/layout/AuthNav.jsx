import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/index.jsx";
import { useClickOutside } from "../../lib/useClickOutside.js";

// Same links as MarketingHeader's nav — the login/signup pages have no
// header of their own, so this is the way back into the rest of the site
// without hitting the browser back button.
const NAV = [
  { to: "/platform", label: "Platform" },
  { to: "/tracks", label: "Tracks" },
  { to: "/for-teams", label: "For Teams" },
  { to: "/pricing", label: "Pricing" },
  { to: "/resources", label: "Resources" },
];

/** Top-right hamburger + dropdown for the chrome-less auth pages. */
export function AuthNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="absolute right-6 top-6 z-50 md:right-10 md:top-8">
      <button
        className="rounded-lg border border-rule-strong bg-paper/90 p-2 backdrop-blur-md"
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

      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-xl border border-rule bg-paper p-3 shadow-lg">
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2.5 py-2 text-sm text-ink-70 hover:bg-paper-2 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            to="/"
            variant="bordered"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            Back to homepage
          </Button>
        </div>
      )}
    </div>
  );
}
