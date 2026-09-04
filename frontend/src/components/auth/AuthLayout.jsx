import { Link } from "react-router-dom";
import { Logo } from "../layout/Logo.jsx";
import { AuthNav } from "../layout/AuthNav.jsx";

/* The argument half of the screen. Copy is deliberately short — this panel
   is read once, by someone who is three seconds from typing an email. */
const PROOFS = [
  {
    title: "No password to forget",
    body: "One email, one six-digit code. Nothing to reset at 11pm, nothing to leak.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
        <path d="M3 6.5l9 6 9-6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Scored on six dimensions",
    body: "Clarity, context, constraints, format, audience, examples. Nought to five each, thirty total.",
    // The logo's own glyph — the six squares are the rubric.
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="2" width="8.6" height="8.6" rx="2.2" fill="currentColor" />
        <rect x="13.4" y="2" width="8.6" height="8.6" rx="2.2" fill="currentColor" opacity=".45" />
        <rect x="2" y="13.4" width="8.6" height="8.6" rx="2.2" fill="currentColor" opacity=".45" />
        <rect x="13.4" y="13.4" width="8.6" height="8.6" rx="2.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "5,000 tokens free every month",
    body: "It resets and it stays free. Then bring your own key, or Pro for 250,000.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
];

/**
 * The split shell behind /login and /signup.
 *
 * Both routes render the same thing — EmailCodeForm handles login and signup
 * in one flow, because POST /auth/verify-code is one call for both — so this
 * exists to stop the two pages drifting apart rather than to differentiate
 * them. Light on both sides: paper-2 panel, paper form, one rule between.
 */
export function AuthLayout({ children }) {
  return (
    // Stacked, the panel is a cap sized to its own content and the form
    // takes the rest — without the explicit rows the two split the viewport
    // evenly and the email field lands below the fold on a phone.
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <AuthNav />

      {/* Left on desktop, a cap above the form on a phone. */}
      <aside className="relative flex flex-col justify-between gap-10 overflow-hidden border-b border-rule bg-paper-2 px-6 py-8 md:px-10 lg:border-b-0 lg:border-r lg:py-9">
        {/* Paper grain, not pattern — masked so it fades out across the
            panel. Inline because the mask is two functions deep and reads
            worse as an arbitrary Tailwind value than it does here. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(14,17,22,.10) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(115% 85% at 18% 12%, #000 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(115% 85% at 18% 12%, #000 0%, transparent 70%)",
          }}
        />
        {/* One cool wash behind the mark, so the panel is not a flat slab. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-52 h-[460px] w-[460px]"
          style={{
            background:
              "radial-gradient(circle, rgba(43,89,255,.11) 0%, transparent 62%)",
          }}
        />

        <Link to="/" aria-label="Promptworks home" className="relative z-10">
          <Logo />
        </Link>

        <div className="relative z-10">
          <h2 className="h-section max-w-[17ch] text-balance">
            Get good at prompting, ten minutes at a time.
          </h2>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-ink-70">
            Real scenarios from the work you actually do, a score out of thirty,
            and a rewrite that tells you why it was better.
          </p>

          {/* Dropped on a phone: three cards ahead of the email field would
              push it below the fold for the sake of copy nobody reads there. */}
          <div className="mt-7 hidden flex-col gap-2.5 lg:flex">
            {PROOFS.map((p) => (
              <div
                key={p.title}
                className="grid grid-cols-[34px_1fr] items-start gap-3.5 rounded-xl border border-rule bg-white p-4"
              >
                <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-signal-wash text-signal-ink">
                  <span className="block h-[17px] w-[17px]">{p.icon}</span>
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em]">
                    {p.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-50">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 hidden text-xs text-ink-30 lg:block">
          © {new Date().getFullYear()} Promptworks, CarlosTechSolutions.
        </p>
      </aside>

      {/* Right — the form does one job, so it gets nothing else. */}
      <div className="flex items-center justify-center bg-paper px-6 py-12 md:px-10 md:py-14">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
