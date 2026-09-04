import { useState } from "react";
import { Section } from "../components/ui/index.jsx";
import { SocialLinks } from "../components/layout/SocialLinks.jsx";
import { PEOPLE } from "../data/people.js";

/** Headshot slot. Falls back to the labelled dashed box when the image is
 *  not there yet, so an empty /public/headshots does not ship a broken img. */
function Headshot({ person }) {
  const [failed, setFailed] = useState(false);
  if (!person.headshot || failed) {
    return (
      <div className="grid aspect-[4/5] w-full place-items-center rounded-2xl border border-dashed border-rule-strong bg-paper-2/60">
        <p className="px-4 text-center text-[13px] text-ink-30">
          Headshot placeholder
          <br />
          {person.headshot}
        </p>
      </div>
    );
  }
  return (
    <img
      src={person.headshot}
      alt={person.name}
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full rounded-2xl border border-rule object-cover"
    />
  );
}

/** Two people. Deliberately nothing else. */
export default function About() {
  return (
    <Section className="pt-14 md:pt-21">
      <h1 className="h-display text-balance text-center">About Us</h1>
      <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-14">
        {PEOPLE.map((person) => (
          <div
            key={person.slug}
            className="grid gap-6 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-7"
          >
            <Headshot person={person} />
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-[-0.02em]">
                {person.name}
              </h3>
              <p className="mt-1 text-[13px] font-medium uppercase tracking-wider text-ink-50">
                {person.role}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-70">
                {person.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
