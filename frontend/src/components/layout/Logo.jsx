/**
 * Logo mark + wordmark. Mark space is reserved to the left of the wordmark,
 * per the brief — the six squares are the six rubric dimensions, two of them
 * filled, which is the product in one glyph.
 */
export function Logo({ className = "", mark = true, wordmark = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark && (
        <svg
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px] shrink-0"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="9.5" height="9.5" rx="2.5" className="fill-ink" />
          <rect x="13.5" y="1" width="9.5" height="9.5" rx="2.5" className="fill-signal" />
          <rect x="1" y="13.5" width="9.5" height="9.5" rx="2.5" className="fill-ink/25" />
          <rect x="13.5" y="13.5" width="9.5" height="9.5" rx="2.5" className="fill-ink" />
        </svg>
      )}
      {wordmark && (
        <span className="text-[17px] font-semibold tracking-[-0.02em]">
          Promptworks
        </span>
      )}
    </span>
  );
}
