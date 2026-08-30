import { useState } from "react";
import { RESOURCE_CATEGORIES } from "../data/org.js";
import { Chip, Section, SectionHead, cn } from "../components/ui/index.jsx";

/** Docs-style layout: left sidebar of categories, right column of entries. */
export default function Resources() {
  const [active, setActive] = useState(RESOURCE_CATEGORIES[0].slug);
  const [copied, setCopied] = useState(null);
  const category = RESOURCE_CATEGORIES.find((c) => c.slug === active);

  const copy = async (entry) => {
    try {
      await navigator.clipboard.writeText(
        `# ${entry.title}\n${entry.use}\n\n(Prompt pattern body lands in stage 2.)`,
      );
      setCopied(entry.title);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <Section className="pb-7 pt-14 md:pb-9 md:pt-18">
        <SectionHead
          eyebrow="Resources"
          title="The prompt library."
          lede="Patterns, not platitudes. Every entry is a pattern you can copy, with the one situation it is for."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-10 border-t border-rule pt-10 lg:grid-cols-[210px_1fr] lg:gap-16">
          <nav aria-label="Categories" className="lg:sticky lg:top-32 lg:self-start">
            <ul className="flex flex-wrap gap-1 lg:flex-col">
              {RESOURCE_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <button
                    onClick={() => setActive(c.slug)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      active === c.slug
                        ? "bg-paper-2 font-medium text-ink"
                        : "text-ink-70 hover:text-ink",
                    )}
                  >
                    {c.name}
                    <span className="ml-2 text-xs text-ink-30">
                      {c.entries.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                {category.name}
              </h2>
              <Chip tone="quiet">{category.entries.length} entries</Chip>
            </div>

            <ul className="mt-6 divide-y divide-rule border-y border-rule">
              {category.entries.map((e) => (
                <li
                  key={e.title}
                  className="flex flex-wrap items-start justify-between gap-4 py-5"
                >
                  <div className="min-w-0 max-w-[62ch]">
                    <h3 className="text-[15px] font-medium">{e.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-70">
                      {e.use}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(e)}
                    className="shrink-0 rounded-full border border-rule-strong px-3.5 py-1.5 text-[13px] transition-colors hover:border-ink"
                  >
                    {copied === e.title ? "Copied" : "Copy"}
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[13px] text-ink-30">
              Stage 1 ships titles and use cases. The pattern bodies land with
              the backend, alongside the guides and the blog.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
