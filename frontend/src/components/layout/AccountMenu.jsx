import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { useClickOutside } from "../../lib/useClickOutside.js";

/** First + last initial when the profile has a name on file (see
 *  lib/auth.jsx, which fetches it via GET /auth/me); falls back to the
 *  first two letters of the email for an account that never filled it in. */
function initialsFor(session) {
  if (session.firstName && session.lastName) {
    return `${session.firstName[0]}${session.lastName[0]}`.toUpperCase();
  }
  return session.email.slice(0, 2).toUpperCase();
}

/**
 * Avatar + dropdown (email, Profile, Dashboard, Log out) for a signed-in user.
 *
 * Shared between AppHeader and MarketingHeader: a session should look the
 * same — an avatar with a menu — no matter which header you're under when
 * you click it, rather than the marketing header falling back to a "Log in"
 * link that makes navigating there look like it signed you out.
 */
export function AccountMenu({ session }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper transition-opacity hover:opacity-80"
      >
        {initialsFor(session)}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 rounded-xl border border-rule bg-paper p-2 shadow-lg">
          <p className="truncate px-2.5 py-1.5 text-[13px] text-ink-50">
            {session.email}
          </p>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2.5 py-2 text-sm text-ink-70 hover:bg-paper-2 hover:text-ink"
          >
            Profile
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2.5 py-2 text-sm text-ink-70 hover:bg-paper-2 hover:text-ink"
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
            className="block w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-70 hover:bg-paper-2 hover:text-ink"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
