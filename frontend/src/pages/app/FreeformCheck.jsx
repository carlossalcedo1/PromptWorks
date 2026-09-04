import { useState } from "react";
import { Link } from "react-router-dom";
import { RUBRIC_MAX } from "../../data/rubric.js";
import { RubricBreakdown } from "../../components/product/RubricBreakdown.jsx";
import { Button, Chip } from "../../components/ui/index.jsx";
import { useAuth } from "../../lib/auth.jsx";
import {
  gradeFreeform,
  getLibraryCategories,
  postLibraryPrompt,
  ApiError,
} from "../../lib/api.js";

const PLACEHOLDER =
  "Paste a prompt you actually use for work — a real one, not a practice " +
  "scenario. It doesn't need to be about anything in particular.";

/**
 * Freeform prompt check — no scenario, no signup, unlimited. Grades on the
 * same six dimensions as scenario-based practice, but on general
 * prompt-engineering craft rather than fit to a known task, so this is
 * deliberately NOT saved as an attempt and does NOT count toward the
 * tracked skill score on /dashboard or the team heat map.
 */
export default function FreeformCheck() {
  const { session } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [posted, setPosted] = useState(false);

  async function run() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setError("");
    setCopied(false);
    setShowPostForm(false);
    setPosted(false);
    try {
      const r = await gradeFreeform(prompt);
      setResult(r);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function openPostForm() {
    setShowPostForm(true);
    setPostError("");
    if (categories.length === 0) {
      try {
        setCategories(await getLibraryCategories());
      } catch {
        // Leave categories empty — the select will just show nothing to
        // pick, and submitting will fail with a clear server-side message
        // rather than a confusing client-side crash.
      }
    }
  }

  async function submitToLibrary(e) {
    e.preventDefault();
    if (!postTitle.trim() || !postCategory || posting) return;
    setPosting(true);
    setPostError("");
    try {
      await postLibraryPrompt(session.token, {
        title: postTitle.trim(),
        promptTemplate: result.improved_prompt,
        category: postCategory,
      });
      setPosted(true);
      setShowPostForm(false);
    } catch (err) {
      setPostError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  function reset() {
    setResult(null);
    setError("");
    setCopied(false);
  }

  async function copyImproved() {
    try {
      await navigator.clipboard.writeText(result.improved_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="ink">No scenario needed</Chip>
        <Chip tone="quiet">Free · unlimited</Chip>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.025em]">
        Check a prompt
      </h1>
      <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-ink-70">
        Paste any prompt and get real feedback on the same six dimensions used
        everywhere else in Promptworks — no scenario to pick, no signup. This
        doesn't feed your tracked skill score; it's a quick, standalone check.
      </p>

      {!result ? (
        <div className="mt-8 rounded-2xl border border-rule bg-white p-6">
          <label htmlFor="freeform-prompt" className="text-sm font-medium">
            Your prompt
          </label>
          <textarea
            id="freeform-prompt"
            rows={12}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck="false"
            className="mt-2.5 w-full resize-y rounded-xl border border-rule-strong bg-white p-4 font-mono text-base leading-relaxed placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30 sm:text-[13px]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={run}
              disabled={!prompt.trim() || running}
              variant="filled"
              size="md"
            >
              {running ? "Grading…" : "Grade my prompt"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-rule bg-white p-7 md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
                {result.total}
                <span className="text-2xl text-ink-30 md:text-3xl"> / {RUBRIC_MAX}</span>
              </p>
              <p className="mt-2 text-[13px] text-ink-50">
                Not counted toward your tracked score
              </p>
              <p className="mt-1 text-[13px] tabular-nums text-ink-50">
                {result.tokens} tokens · ${result.cost_usd.toFixed(6)} — real cost, not an estimate
              </p>
            </div>
            <Button variant="bordered" size="sm" onClick={reset}>
              Check another prompt
            </Button>
          </div>

          <div className="mt-8 border-t border-rule pt-2">
            <p className="pb-1 pt-4 text-xs text-ink-50">
              Rubric breakdown — same six dimensions, judged on general craft
              rather than fit to a specific scenario.
            </p>
            <RubricBreakdown scores={result.scores} feedback={result.feedback} />
          </div>

          <div className="mt-8 border-t border-rule pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Improved prompt</p>
              <button
                onClick={copyImproved}
                className="rounded-full border border-rule-strong px-3 py-1 text-[12.5px] transition-colors hover:border-ink"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-50">
              Fixes the gaps above while keeping your original intent. Paste
              this straight into whatever LLM you're using.
            </p>
            <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-signal/25 bg-signal-wash/50 p-4 font-mono text-[12.5px] leading-relaxed text-ink">
              {result.improved_prompt}
            </pre>

            <div className="mt-4">
              {posted ? (
                <p className="text-[13px] text-good">
                  Posted to the{" "}
                  <Link to="/library" className="underline underline-offset-4">
                    library
                  </Link>
                  .
                </p>
              ) : session ? (
                !showPostForm ? (
                  <Button variant="bordered" size="sm" onClick={openPostForm}>
                    Post this to the library
                  </Button>
                ) : (
                  <form
                    onSubmit={submitToLibrary}
                    className="mt-2 space-y-3 rounded-xl border border-rule bg-paper-2/40 p-4"
                  >
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" htmlFor="post-title">
                        Title
                      </label>
                      <input
                        id="post-title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Give this prompt a short name"
                        className="w-full rounded-lg border border-rule-strong bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-signal/30 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[13px] font-medium" htmlFor="post-category">
                        Category
                      </label>
                      <select
                        id="post-category"
                        value={postCategory}
                        onChange={(e) => setPostCategory(e.target.value)}
                        className="w-full rounded-lg border border-rule-strong bg-white px-3 py-2 text-base sm:text-sm"
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {postError && <p className="text-[13px] text-red-600">{postError}</p>}

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="bordered"
                        size="sm"
                        type="button"
                        onClick={() => setShowPostForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        as="button"
                        type="submit"
                        variant="filled"
                        size="sm"
                        disabled={!postTitle.trim() || !postCategory || posting}
                      >
                        {posting ? "Posting…" : "Publish"}
                      </Button>
                    </div>
                  </form>
                )
              ) : (
                <Link
                  to="/login"
                  state={{ from: "/check" }}
                  className="text-[13px] text-ink-70 underline underline-offset-4 hover:text-ink"
                >
                  Log in to post this to the library
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}