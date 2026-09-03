import { Link } from "react-router-dom";
import { Logo } from "./Logo.jsx";

// linkedin/facebook: intentionally blank — fill in once the pages exist.
const CONTACTS = [
  {
    name: "Carlos Salcedo",
    email: "csalcedo@ufl.edu",
    phone: "(305) 763-2541",
    phoneHref: "tel:+13057632541",
    location: "Miami, FL",
    linkedin: "",
    facebook: "",
  },
  {
    name: "RJ Cooke",
    // No real address yet — shown as plain text below, not a mailto link.
    emailPlaceholder: "email — coming soon",
    phone: "(321) 291-1637",
    phoneHref: "tel:+13212911637",
    location: "Orlando, FL",
    linkedin: "",
    facebook: "",
  },
];

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  );
}

const COLUMNS = [
  {
    title: "Product",
    links: [
      ["Platform", "/platform"],
      ["Tracks", "/tracks"],
      ["Workflows", "/workflows"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "Learn",
    links: [
      ["Prompt library", "/resources"],
      ["Guides", "/resources"],
      ["Blog", "/resources"],
      ["Certification", "/pricing"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Security", "/for-teams#security"],
      ["Book a demo", "/contact"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper-2/40">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-10 md:px-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:gap-10">
          <div>
            <Logo />
            {/* The one-line company value proposition. Also the meta description. */}
            <p className="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-ink-70">
              Prompt engineering, turned from a training video into a measurable
              skill.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {CONTACTS.map((c) => (
                <div key={c.phoneHref} className="space-y-1">
                  {c.name && (
                    <p className="text-[13px] font-medium text-ink">{c.name}</p>
                  )}
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="block text-[13px] text-ink-70 transition-colors hover:text-ink"
                    >
                      {c.email}
                    </a>
                  ) : (
                    <p className="text-[13px] text-ink-30">{c.emailPlaceholder}</p>
                  )}
                  <a
                    href={c.phoneHref}
                    className="block text-[13px] text-ink-70 transition-colors hover:text-ink"
                  >
                    {c.phone}
                  </a>
                  <p className="text-[13px] text-ink-50">{c.location}</p>
                  <div className="flex gap-2 pt-0.5">
                    <a
                      href={c.linkedin}
                      aria-label={`${c.name ?? "LinkedIn"} on LinkedIn`}
                      className="text-ink-30 transition-colors hover:text-ink"
                    >
                      <LinkedInIcon className="h-4 w-4" />
                    </a>
                    <a
                      href={c.facebook}
                      aria-label={`${c.name ?? "Facebook"} on Facebook`}
                      className="text-ink-30 transition-colors hover:text-ink"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-semibold">{col.title}</p>
              <ul className="mt-3 space-y-1.5">
                {col.links.map(([label, to]) => (
                  <li key={label + to}>
                    <Link
                      to={to}
                      className="text-[13px] text-ink-70 transition-colors hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule pt-5 text-xs text-ink-50">
          <p>© {new Date().getFullYear()} Promptworks.</p>
          <Link to="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
