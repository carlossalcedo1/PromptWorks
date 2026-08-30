import { Link } from "react-router-dom";

export const cn = (...parts) => parts.filter(Boolean).join(" ");

/* -------------------------------------------------------------------------- */
/* Button — filled is the B2B action, bordered is the self-serve action.       */
/* The brief pairs them everywhere: never one without the other.               */
/* -------------------------------------------------------------------------- */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-colors duration-150 whitespace-nowrap disabled:opacity-40 " +
  "disabled:cursor-not-allowed";

const VARIANTS = {
  filled: "bg-ink text-paper hover:bg-ink-70",
  bordered: "border border-rule-strong text-ink hover:border-ink hover:bg-paper-2",
  signal: "bg-signal text-white hover:bg-signal-ink",
  ghost: "text-ink-70 hover:text-ink hover:bg-paper-2",
};

const SIZES = {
  sm: "text-[13px] px-3.5 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-[15px] px-6 py-3.5",
};

export function Button({
  as,
  to,
  href,
  variant = "filled",
  size = "md",
  className,
  children,
  ...rest
}) {
  const classes = cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className);
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const Tag = as || "button";
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */

export function Section({ id, className, children, tight = false }) {
  return (
    <section
      id={id}
      className={cn(
        "px-6 md:px-10",
        tight ? "py-12 md:py-18" : "py-18 md:py-24",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHead({ eyebrow, title, lede, className, children }) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="h-section text-balance">{title}</h2>
      {lede && (
        <p className="mt-5 text-lg leading-relaxed text-ink-70 text-pretty">
          {lede}
        </p>
      )}
      {children}
    </div>
  );
}

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        // min-w-0 so a Card used as a grid/flex item cannot be widened past
        // its column by an overflow-scrolling child (the heat map table).
        "min-w-0 rounded-2xl border border-rule bg-white/70 p-6 md:p-7",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Chip({ children, tone = "neutral", className }) {
  const tones = {
    neutral: "border-rule-strong text-ink-70",
    signal: "border-signal/30 bg-signal-wash text-signal-ink",
    ink: "border-ink bg-ink text-paper",
    quiet: "border-transparent bg-paper-2 text-ink-50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Big number + label + one line of qualifier. Used on every dashboard. */
export function Stat({ value, label, sub, tone = "ink", className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-50">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-4xl font-semibold tracking-tight tabular-nums",
          tone === "signal" && "text-signal",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-sm text-ink-50">{sub}</p>}
    </div>
  );
}

/** A labelled 0–5 bar. The same component on the score screen and dashboard. */
export function ScoreBar({ value, max = 5, tone = "signal", className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-paper-2", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "signal" ? "bg-signal" : "bg-ink",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Placeholder we are allowed to ship — labelled, never fabricated. */
export function Placeholder({ title, children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-rule-strong bg-paper-2/50 p-7",
        className,
      )}
    >
      <Eyebrow>{title}</Eyebrow>
      <p className="mt-3 text-sm leading-relaxed text-ink-50">{children}</p>
    </div>
  );
}
