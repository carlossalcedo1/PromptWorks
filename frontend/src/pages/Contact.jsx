import { useState } from "react";
import { Button, Card, Chip, Section } from "../components/ui/index.jsx";

const SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

/**
 * Four fields, no more. Stage 1 has no backend, so submitting shows what would
 * be sent rather than pretending a message went somewhere.
 */
export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", size: "", fix: "" });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const ready = form.name && form.email && form.fix;

  // 16px, not 15 — iOS Safari auto-zooms the whole page on focusing any text
  // input under 16px, and that zoom then persists across every page you
  // navigate to next. Below 16px here looks fine on desktop and silently
  // breaks every page on an iPhone the moment someone taps into a field.
  const field =
    "w-full rounded-xl border border-rule-strong bg-white px-4 py-2.5 text-base " +
    "placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30";

  return (
    <Section className="pt-14 md:pt-21">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <Chip tone="quiet">Contact</Chip>
          <h1 className="mt-6 h-display text-balance">Book a demo.</h1>
          <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-ink-70">
            Twenty minutes. We will sit in the problem before showing you
            anything — the three questions your board asks, and whether you can
            answer them today.
          </p>

          <div className="mt-10 divide-y divide-rule border-y border-rule">
            {[
              ["Email", "csalcedo@ufl.edu"],
              ["Where", "Gainesville and Miami, FL"],
              ["Calendar", "Link lands with the backend in stage 2"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-4 py-3.5 text-sm">
                <span className="text-ink-50">{k}</span>
                <span className="text-ink-70">{v}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-[52ch] text-sm leading-relaxed text-ink-50">
            If you would rather see it before you talk to anyone, the homepage
            has a live exercise and the player is open — no account needed.
          </p>
        </div>

        <Card className="bg-white">
          {sent ? (
            <div>
              <p className="eyebrow">Not actually sent</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                This form has no backend yet.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-70">
                Stage 1 is frontend-only, so nothing left your browser. Here is
                what stage 2 would post to <code className="font-mono text-[13px]">/demo-requests</code>:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-paper-2/70 p-4 font-mono text-[12.5px] leading-relaxed text-ink-70">
{JSON.stringify(form, null, 2)}
              </pre>
              <Button
                variant="bordered"
                size="sm"
                className="mt-5"
                onClick={() => setSent(false)}
              >
                Back to the form
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-5"
            >
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Name
                </label>
                <input id="name" className={field} value={form.name} onChange={set("name")} />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  className={field}
                  value={form.email}
                  onChange={set("email")}
                />
              </div>

              <div>
                <label htmlFor="size" className="mb-1.5 block text-sm font-medium">
                  Company size
                </label>
                <select id="size" className={field} value={form.size} onChange={set("size")}>
                  <option value="">Select…</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fix" className="mb-1.5 block text-sm font-medium">
                  What are you trying to fix?
                </label>
                <textarea
                  id="fix"
                  rows={4}
                  className={field + " resize-y"}
                  value={form.fix}
                  onChange={set("fix")}
                  placeholder="We rolled out licences in March and cannot tell whether anything changed."
                />
              </div>

              <Button as="button" type="submit" variant="filled" disabled={!ready} className="w-full">
                Request a demo
              </Button>
              <p className="text-[13px] text-ink-30">
                Four fields, no more. Prototype — nothing is transmitted.
              </p>
            </form>
          )}
        </Card>
      </div>
    </Section>
  );
}
