import { Link } from "react-router-dom";
import { Button, Card, Chip } from "../../components/ui/index.jsx";
import { useAuth } from "../../lib/auth.jsx";

/**
 * Account profile. Read-only for now — it shows what the session already
 * knows (name from GET /auth/me, email from the token) and marks the rest
 * as not yet wired, rather than rendering editable fields that quietly
 * discard whatever you type. Editing lands with the profile PATCH endpoint.
 */
export default function Profile() {
  const { session, logout } = useAuth();
  if (!session) return null;

  const fullName =
    session.firstName && session.lastName
      ? `${session.firstName} ${session.lastName}`
      : null;

  const initials = fullName
    ? `${session.firstName[0]}${session.lastName[0]}`.toUpperCase()
    : session.email.slice(0, 2).toUpperCase();

  const FIELDS = [
    ["Name", fullName, "Not on file yet"],
    ["Email", session.email, null],
    ["Account ID", session.userId ?? null, "Unavailable"],
  ];

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center gap-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-lg font-semibold text-paper">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="h-section">{fullName ?? "Your profile"}</h1>
          <p className="mt-1.5 break-all text-[15px] text-ink-70">
            {session.email}
          </p>
        </div>
      </div>

      <Card className="mt-9 bg-white">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Account</p>
          <Chip tone="quiet">Read only</Chip>
        </div>
        <div className="mt-4 divide-y divide-rule border-t border-rule">
          {FIELDS.map(([label, value, fallback]) => (
            <div
              key={label}
              className="grid gap-1 py-3.5 sm:grid-cols-[160px_1fr] sm:gap-4"
            >
              <span className="text-sm text-ink-50">{label}</span>
              {value ? (
                <span className="break-all text-sm text-ink">{value}</span>
              ) : (
                <span className="text-sm text-ink-30">{fallback}</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-ink-50">
          Editing your name, password and notification settings lands here
          next. Until then, nothing on this page can be changed by accident.
        </p>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="eyebrow">Your progress</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-70">
            Scores, streak and the rubric heat map live on the dashboard.
          </p>
          <Button to="/dashboard" variant="bordered" size="sm" className="mt-5">
            Open dashboard
          </Button>
        </Card>
        <Card>
          <p className="eyebrow">Plan</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-70">
            5,000 tokens free every month. Pro raises that to 250,000 for $5.
          </p>
          <Button to="/pricing" variant="bordered" size="sm" className="mt-5">
            See plans
          </Button>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-rule pt-6">
        <Button variant="ghost" size="sm" onClick={logout}>
          Log out
        </Button>
        <Link to="/privacy" className="text-[13px] text-ink-50 hover:text-ink">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
