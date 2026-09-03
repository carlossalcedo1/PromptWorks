import { Chip, Placeholder, Section } from "../components/ui/index.jsx";

export default function Privacy() {
  return (
    <Section className="pt-14 md:pt-21">
      <Chip tone="quiet">Legal</Chip>
      <h1 className="mt-6 h-display text-balance">Privacy Policy</h1>

      <Placeholder title="Not written yet" className="mt-8 max-w-2xl">
        This page is linked from signup so the link isn't dead, but the
        policy itself hasn't been drafted. Nothing here is binding until it
        is.
      </Placeholder>
    </Section>
  );
}
