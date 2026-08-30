import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TRACKS } from "../data/tracks.js";
import { SCENARIOS } from "../data/scenarios.js";
import { Chip, Section, SectionHead, cn } from "../components/ui/index.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "foundations", label: "Foundations" },
  { key: "role", label: "By role" },
  { key: "advanced", label: "Advanced" },
];

const SORTS = [
  { key: "difficulty", label: "Difficulty" },
  { key: "size", label: "Scenario count" },
  { key: "az", label: "A–Z" },
];

const LEVEL_ORDER = { Beginner: 0, Mixed: 1, Advanced: 2 };

export default function Tracks() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("difficulty");

  const tracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = TRACKS.filter((t) => filter === "all" || t.group === filter);
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.blurb.toLowerCase().includes(q) ||
          SCENARIOS.some(
            (s) => s.track === t.slug && s.title.toLowerCase().includes(q),
          ),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "size") return b.count - a.count;
      return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || b.count - a.count;
    });
  }, [filter, query, sort]);

  const total = TRACKS.reduce((n, t) => n + t.count, 0);

  return (
    <>
      <Section className="pb-5 pt-14 md:pb-7 md:pt-18">
        <SectionHead
          eyebrow="Tracks & challenge library"
          title="Foundations first, then your role, then the advanced stuff."
          lede={`${total} scenarios across ${TRACKS.length} tracks. Preview any three free — after that, practice needs an account.`}
        />
      </Section>

      <Section tight className="py-0">
        {/* Filters. Search lives here, in the app-adjacent surface — not in the
            marketing header. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-rule py-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  filter === f.key
                    ? "bg-ink text-paper"
                    : "text-ink-70 hover:bg-paper-2",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scenarios…"
              className="w-56 rounded-full border border-rule-strong bg-white px-4 py-1.5 text-sm placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30"
            />
            <label className="flex items-center gap-2 text-[13px] text-ink-50">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-rule-strong bg-white px-2.5 py-1 text-[13px] text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Section>

      <Section className="pt-9">
        {tracks.length === 0 ? (
          <p className="py-16 text-center text-ink-50">
            Nothing matches “{query}”. Try a role, or clear the filter.
          </p>
        ) : (
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t) => {
              const preview = SCENARIOS.filter((s) => s.track === t.slug).slice(0, 3);
              return (
                <div key={t.slug} className="flex flex-col bg-paper p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="h-card">{t.title}</h2>
                    <Chip tone={t.level === "Advanced" ? "signal" : "quiet"}>
                      {t.level}
                    </Chip>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-50">
                    {t.count} scenarios
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-70">
                    {t.blurb}
                  </p>

                  {preview.length > 0 && (
                    <ul className="mt-5 space-y-1.5 border-t border-rule pt-4">
                      {preview.map((s) => (
                        <li key={s.slug}>
                          <Link
                            to={`/practice/${s.slug}`}
                            className="group flex items-baseline justify-between gap-3 text-[13px]"
                          >
                            <span className="truncate text-ink-70 group-hover:text-ink group-hover:underline">
                              {s.title}
                            </span>
                            <span className="shrink-0 text-ink-30">
                              {s.difficulty}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto pt-5">
                    <Link
                      to={preview[0] ? `/practice/${preview[0].slug}` : "/practice"}
                      className="text-sm font-medium underline underline-offset-4 hover:text-signal"
                    >
                      {preview.length ? "Start this track" : "Preview soon"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-[13px] text-ink-30">
          Scenario counts reflect the planned library. Stage 1 ships a working
          subset — the ones with titles listed above are playable now.
        </p>
      </Section>
    </>
  );
}
