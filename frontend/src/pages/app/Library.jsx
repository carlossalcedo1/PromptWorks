import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import {
  getLibraryCategories,
  listLibraryPrompts,
  postLibraryPrompt,
  upvoteLibraryPrompt,
  markLibraryPromptUsed,
  ApiError,
} from "../../lib/api.js";
import { Button, Card, Chip, cn } from "../../components/ui/index.jsx";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "top", label: "Top" },
];

function UpvoteButton({ prompt, onVoted }) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  async function vote() {
    if (!session?.token || busy || prompt.has_voted) return;
    setBusy(true);
    try {
      await upvoteLibraryPrompt(session.token, prompt.id);
      onVoted(prompt.id);
    } catch {
      // Silent — an upvote failing isn't worth interrupting the browse flow.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={vote}
      disabled={!session || prompt.has_voted || busy}
      title={!session ? "Log in to upvote" : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        prompt.has_voted
          ? "border-signal bg-signal-wash text-signal-ink"
          : "border-rule-strong text-ink-70 hover:border-ink disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span aria-hidden="true">▲</span>
      <span className="tabular-nums">{prompt.upvote_count}</span>
    </button>
  );
}

function PromptCard({ prompt, onVoted }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.prompt_template);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      markLibraryPromptUsed(prompt.id); // fire-and-forget, no auth needed
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="h-card truncate">{prompt.title}</h3>
            <Chip tone="quiet">{prompt.category}</Chip>
          </div>
          <p className="mt-1 text-[13px] text-ink-50">
            by {prompt.author_name} · used {prompt.usage_count}×
          </p>
        </div>
        <UpvoteButton prompt={prompt} onVoted={onVoted} />
      </div>

      <pre className="mt-4 max-h-[160px] overflow-auto whitespace-pre-wrap rounded-xl bg-paper-2/60 p-4 font-mono text-[12px] leading-relaxed text-ink-70">
        {prompt.prompt_template}
      </pre>

      <div className="mt-3 flex justify-end">
        <button
          onClick={copy}
          className="rounded-full border border-rule-strong px-3.5 py-1.5 text-[12.5px] transition-colors hover:border-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </Card>
  );
}

function PostForm({ categories, onPosted, onCancel }) {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !promptTemplate.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await postLibraryPrompt(session.token, {
        title: title.trim(),
        promptTemplate,
        category,
      });
      onPosted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white">
      <h3 className="h-card">Post a prompt</h3>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="lib-title">
            Title
          </label>
          <input
            id="lib-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-rule-strong bg-white px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-signal/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="lib-category">
            Category
          </label>
          <select
            id="lib-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-rule-strong bg-white px-3 py-2.5 text-base"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="lib-prompt">
            Prompt
          </label>
          <textarea
            id="lib-prompt"
            rows={8}
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full resize-y rounded-xl border border-rule-strong bg-white p-4 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-signal/30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <Button variant="bordered" size="sm" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button
            as="button"
            type="submit"
            variant="filled"
            size="sm"
            disabled={!title.trim() || !promptTemplate.trim() || busy}
          >
            {busy ? "Posting…" : "Publish"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function Library() {
  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);

  useEffect(() => {
    getLibraryCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await listLibraryPrompts({ sort, category: category || undefined, q: q || undefined }, session?.token);
      setPrompts(r.prompts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the library.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category]);

  function handleVoted(promptId) {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === promptId ? { ...p, has_voted: true, upvote_count: p.upvote_count + 1 } : p,
      ),
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">Prompt library</h1>
          <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-ink-70">
            Real prompts, posted by real people, free to browse and use.
          </p>
        </div>
        {session ? (
          <Button variant="filled" size="sm" onClick={() => setShowPostForm((v) => !v)}>
            {showPostForm ? "Close" : "Post a prompt"}
          </Button>
        ) : (
          <Link
            to="/login"
            state={{ from: "/library" }}
            className="text-sm text-ink-70 underline underline-offset-4 hover:text-ink"
          >
            Log in to post a prompt
          </Link>
        )}
      </div>

      {showPostForm && session && (
        <div className="mt-6">
          <PostForm
            categories={categories}
            onCancel={() => setShowPostForm(false)}
            onPosted={() => {
              setShowPostForm(false);
              load();
            }}
          />
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search prompts…"
          className="w-64 rounded-full border border-rule-strong bg-white px-4 py-1.5 text-base placeholder:text-ink-30 focus:outline-none focus:ring-2 focus:ring-signal/30 sm:text-sm"
        />
        <Button variant="bordered" size="sm" onClick={load}>
          Search
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              category === "" ? "bg-ink text-paper" : "text-ink-70 hover:bg-paper-2",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                category === c ? "bg-ink text-paper" : "text-ink-70 hover:bg-paper-2",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                sort === s.key ? "bg-paper-2 font-medium text-ink" : "text-ink-50 hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink-50">Loading…</p>
      ) : error ? (
        <p className="py-16 text-center text-red-600">{error}</p>
      ) : prompts.length === 0 ? (
        <p className="py-16 text-center text-ink-50">
          Nothing here yet{q ? ` for "${q}"` : ""}. Be the first to post one.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} onVoted={handleVoted} />
          ))}
        </div>
      )}
    </div>
  );
}
