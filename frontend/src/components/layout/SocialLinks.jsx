// Contact + social icon row for one person. Shared by the footer and the
// About page so the two never drift apart. A link that is still blank is
// dropped entirely rather than rendered as an anchor that goes nowhere.

function GitHubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}

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

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M3 6.5l9 6 9-6" strokeLinecap="round" />
    </svg>
  );
}

export function SocialLinks({ person, className = "", iconClassName = "h-4 w-4" }) {
  const items = [
    person.github && {
      key: "github",
      href: person.github,
      label: `${person.name} on GitHub`,
      Icon: GitHubIcon,
    },
    person.linkedin && {
      key: "linkedin",
      href: person.linkedin,
      label: `${person.name} on LinkedIn`,
      Icon: LinkedInIcon,
    },
    person.facebook && {
      key: "facebook",
      href: person.facebook,
      label: `${person.name} on Facebook`,
      Icon: FacebookIcon,
    },
    person.email && {
      key: "email",
      href: `mailto:${person.email}`,
      label: `Email ${person.name}`,
      Icon: MailIcon,
      external: false,
    },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {items.map(({ key, href, label, Icon, external = true }) => (
        <a
          key={key}
          href={href}
          aria-label={label}
          title={label}
          {...(external
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
          className="text-ink-30 transition-colors hover:text-ink"
        >
          <Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
