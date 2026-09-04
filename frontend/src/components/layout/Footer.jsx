import { Link } from "react-router-dom";
import { Logo } from "./Logo.jsx";
import { SocialLinks } from "./SocialLinks.jsx";
import { PEOPLE } from "../../data/people.js";

const COLUMNS = [
  {
    // Mirrors the marketing nav, plus Workflows — which has no nav slot but
    // is the half of the product people actually keep using.
    title: "Product",
    links: [
      ["Platform", "/platform"],
      ["Prompt Library", "/scenarios"],
      ["Workflows", "/workflows"],
      ["For Business", "/#business"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    title: "Learn",
    links: [
      ["Patterns & guides", "/resources"],
      ["How we built this", "/platform"],
      ["Why prompt training?", "/why"],
      ["Business use case", "/#business"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/about"],
      ["Contact", "/contact"],
      ["Security", "/#security"],
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
              {PEOPLE.map((c) => (
                <div key={c.slug} className="space-y-1">
                  <p className="text-[13px] font-medium text-ink">{c.name}</p>
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="block break-all text-[13px] text-ink-70 transition-colors hover:text-ink"
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
                  <SocialLinks person={c} className="pt-0.5" />
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
          <p>© {new Date().getFullYear()} Promptworks, CarlosTechSolutions.</p>
          <Link to="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
