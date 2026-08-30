import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SCENARIOS } from "../../data/scenarios.js";
import { TRACKS, trackBySlug } from "../../data/tracks.js";
import { Chip, cn } from "../../components/ui/index.jsx";

/** Challenge library, in-app. Search lives here — this is its scope. */
export default function Practice() {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");

  const playableTracks = useMemo(
    () => TRACKS.filter((t) => SCENARIOS.some((s) => s.track === t.slug)),
    [],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCENARIOS.filter((s) => {
      if (track !== "all" && s.track !== track) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.brief.toLowerCase().includes(q) ||
        s.constraints.some((c) => c.label.toLowerCase().includes(q))
      );
    });
  }, [query, track]);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">Practice</h1>
          <p className="mt-1.5 text-sm text-ink-50">
            {SCENARIOS.length} scenarios playable in this build.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scenarios…"
          className="w-64 rounded-full border border-rule-strong bg-white px-4 py-2 text-sm placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {[{ slug: "all", title: "All" }, ...playableTracks].map((t) => (
          <button
            key={t.slug}
            onClick={() => setTrack(t.slug)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-colors",
              track === t.slug ? "bg-ink text-paper" : "text-ink-70 hover:bg-paper-2",
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-20 text-center text-ink-50">
          Nothing matches “{query}”.
        </p>
      ) : (
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <Link
              key={s.slug}
              to={`/practice/${s.slug}`}
              className="group flex flex-col bg-white p-6 transition-colors hover:bg-paper-2/50"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="h-card group-hover:underline">{s.title}</h2>
                <Chip tone={s.difficulty === "Advanced" ? "signal" : "quiet"}>
                  {s.difficulty}
                </Chip>
              </div>
              <p className="mt-1.5 text-[13px] text-ink-50">
                {trackBySlug(s.track)?.title}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-70">
                {s.brief}
              </p>
              <p className="mt-auto pt-5 text-[13px] text-ink-50">
                {s.constraints.length} constraints · reference {s.referenceTokens} tokens
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
