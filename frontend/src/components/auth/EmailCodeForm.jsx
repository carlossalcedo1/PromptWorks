import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, cn } from "../ui/index.jsx";
import { ROLE_TRACKS } from "../../data/tracks.js";
import {
  requestLoginCode,
  verifyLoginCode,
  completeProfile,
  ApiError,
} from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

// 16px, not 15 — iOS Safari auto-zooms the whole page on focusing any text
// input under 16px, and that zoom then persists across every page you
// navigate to next, which is exactly what "the site is too big on mobile"
// turns out to mean when there's no actual layout overflow behind it.
const field =
  "w-full rounded-xl border border-rule-strong bg-white px-4 py-2.5 text-base " +
  "placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30";

const RESEND_COOLDOWN_MS = 20_000;

/**
 * The whole passwordless flow: email -> 6-digit code -> (new account only)
 * name + track -> session.
 *
 * Login and signup are the same backend call (POST /auth/verify-code "is
 * signup as well as login" — see backend/main.py), so there is one form, not
 * two that could drift apart. The only branch is what happens after the code
 * is verified: an existing account goes straight to the dashboard, a new one
 * gets the extra questions "Start free" already asks, then goes to the
 * dashboard.
 */
export function EmailCodeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [step, setStep] = useState("email"); // "email" | "code" | "profile"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState(null); // set once verify-code succeeds

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [track, setTrack] = useState(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const codeValid = /^\d{6}$/.test(code);
  const profileValid = firstName.trim() && lastName.trim() && track;

  function finish(sessionResult, destination) {
    login(sessionResult);
    navigate(destination, { replace: true });
  }

  async function sendCode(e) {
    e?.preventDefault();
    if (!emailValid || busy) return;
    setBusy(true);
    setError("");
    try {
      await requestLoginCode(email);
      setStep("code");
      setResendAt(Date.now() + RESEND_COOLDOWN_MS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e) {
    e.preventDefault();
    if (!codeValid || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await verifyLoginCode(email, code);
      if (result.is_new_user) {
        // Hold the token in local state rather than the auth context yet —
        // complete-profile still needs to run before this is a real session.
        setSession(result);
        setStep("profile");
      } else {
        finish(result, location.state?.from || "/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitProfile(e) {
    e.preventDefault();
    if (!profileValid || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeProfile(session.access_token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        trackSlug: track,
      });
      finish(session, location.state?.from || "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const canResend = Date.now() >= resendAt;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="h-section text-balance">
        {step === "email"
          ? "Log in or sign up"
          : step === "code"
            ? "Check your email"
            : "One more thing"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
        {step === "email"
          ? "Your learning partner for what's to come"
          : step === "code"
            ? `We sent a 6-digit code to ${email}`
            : "Sets your default track. You can change it later."}
      </p>

      {step === "email" && (
        <form onSubmit={sendCode} className="mt-8 space-y-5">
          <div>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              placeholder="Enter your email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            as="button"
            type="submit"
            variant="filled"
            disabled={!emailValid || busy}
            className="w-full disabled:opacity-100!"
          >
            {busy ? "Sending…" : "Continue with email"}
          </Button>

          <p className="text-[13px] leading-relaxed text-ink-30">
            By continuing, you acknowledge our{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-ink-50">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={submitCode} className="mt-8 space-y-5">
          <div>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="six-digit code"
              className={field}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            as="button"
            type="submit"
            variant="filled"
            disabled={!codeValid || busy}
            className="w-full"
          >
            {busy ? "Verifying…" : "Verify"}
          </Button>

          <div className="flex items-center justify-between text-[13px] text-ink-50">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="underline underline-offset-4 hover:text-ink"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={!canResend || busy}
              onClick={sendCode}
              className="underline underline-offset-4 hover:text-ink disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={submitProfile} className="mt-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
                First name
              </label>
              <input
                id="firstName"
                autoFocus
                autoComplete="given-name"
                className={field}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
                Last name
              </label>
              <input
                id="lastName"
                autoComplete="family-name"
                className={field}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">What do you do?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLE_TRACKS.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setTrack(t.slug)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    track === t.slug
                      ? "border-ink bg-ink text-paper"
                      : "border-rule-strong bg-white hover:border-ink",
                  )}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            as="button"
            type="submit"
            variant="filled"
            disabled={!profileValid || busy}
            className="w-full"
          >
            {busy ? "Saving…" : "Finish"}
          </Button>
        </form>
      )}
    </div>
  );
}
