import { Link } from "react-router-dom";
import { Logo } from "./Logo.jsx";

// Direct contact. TODO: replace the phone number before launch — this is a
// reserved fictional number (555-01xx), not a live line.
const CONTACT = {
  email: "csalcedo@ufl.edu",
  phone: "(352) 555-0142",
  phoneHref: "tel:+13525550142",
};

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

            <div className="mt-4 space-y-1">
              <a
                href={`mailto:${CONTACT.email}`}
                className="block text-[13px] text-ink-70 transition-colors hover:text-ink"
              >
                {CONTACT.email}
              </a>
              <a
                href={CONTACT.phoneHref}
                className="block text-[13px] text-ink-70 transition-colors hover:text-ink"
              >
                {CONTACT.phone}
              </a>
              <p className="text-[13px] text-ink-50">Gainesville &amp; Miami, FL</p>
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

        <div className="mt-8 flex flex-col gap-2 border-t border-rule pt-5 text-xs text-ink-50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Promptworks.</p>
          <p className="text-ink-30">
            Stage 1 prototype — mock data, deterministic grading.
          </p>
        </div>
      </div>
    </footer>
  );
}
