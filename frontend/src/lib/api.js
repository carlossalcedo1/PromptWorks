// Thin fetch wrapper for the passwordless auth endpoints.
//
// Always called with a relative path, /api/... — same-origin in production
// (Caddy proxies it to the api container) and proxied by Vite in dev (see
// vite.config.js). No API_BASE_URL to keep in sync between environments, no
// CORS to configure.

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function post(path, body, token) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // A non-JSON response (e.g. a proxy error page) still needs a message.
  }

  if (!res.ok) {
    throw new ApiError(data?.detail || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

async function get(path, token) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response still needs a message.
  }

  if (!res.ok) {
    throw new ApiError(data?.detail || "Something went wrong. Please try again.", res.status);
  }
  return data;
}

/** Emails a 6-digit login code. Same call for a new or existing account —
 *  the backend doesn't distinguish, so neither does the client. */
export function requestLoginCode(email) {
  return post("/auth/request-code", { email });
}

/** Exchanges the code for a session token. Returns the account as well as
 *  the token; `is_new_user` tells the caller whether this just created one. */
export function verifyLoginCode(email, code) {
  return post("/auth/verify-code", { email, code });
}

/** First/last name + starting track, collected right after a first sign-up.
 *  Needs the token just issued by verifyLoginCode — there's no session
 *  cookie, so it has to be passed explicitly rather than read from context. */
export function completeProfile(token, { firstName, lastName, trackSlug }) {
  return post(
    "/auth/complete-profile",
    { first_name: firstName, last_name: lastName, track_slug: trackSlug },
    token,
  );
}

/** The signed-in user's own profile — name and track live in the database,
 *  not the JWT, so this is how a client gets at them. */
export function getMe(token) {
  return get("/auth/me", token);
}

/** Real learner dashboard stats — reps, median score, rubric profile, and
 *  the queued-scenarios list — computed server-side from the attempts
 *  table. Replaces the hardcoded LEARNER mock in data/org.js. */
export function getDashboard(token) {
  return get("/dashboard", token);
}

/** Real scenario-based grading — POST /attempts. token is optional: an
 *  anonymous visitor can still grade (the homepage widget depends on this),
 *  but a signed-in user's token attributes the attempt to their account so
 *  it counts toward /dashboard. */
export function gradeAttempt(scenarioId, prompt, token) {
  return post("/attempts", { scenario_id: scenarioId, prompt }, token);
}

/** Freeform grading — no scenario_id, no signup required (no token passed
 *  here on purpose). Scores general prompt-engineering craft on the same
 *  six dimensions used everywhere else, but this is NOT written to the
 *  attempts table and does not count toward a tracked skill score — see
 *  backend/main.py's /grade/freeform route for why. */
export function gradeFreeform(prompt) {
  return post("/grade/freeform", { prompt });
}

/** The fixed set of library categories — single source of truth lives on
 *  the backend (main.py's LIBRARY_CATEGORIES) so this never drifts out of
 *  sync with what posting actually accepts. */
export function getLibraryCategories() {
  return get("/library/categories");
}

/** Browse the public prompt library. Fully open — token is optional, only
 *  affects whether has_voted is meaningful on each result. */
export function listLibraryPrompts({ sort, category, q } = {}, token) {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString();
  return get(`/library/prompts${qs ? `?${qs}` : ""}`, token);
}

/** Publish a prompt to the public library. Requires a token — the backend
 *  401s without one. */
export function postLibraryPrompt(token, { title, promptTemplate, category }) {
  return post(
    "/library/prompts",
    { title, prompt_template: promptTemplate, category },
    token,
  );
}

/** Upvote a library prompt. Requires a token; idempotent server-side, so
 *  calling this twice from the same account is safe and harmless. */
export function upvoteLibraryPrompt(token, promptId) {
  return post(`/library/prompts/${promptId}/upvote`, {}, token);
}

/** Marks a prompt as used (e.g. after copying it). No token required —
 *  using a prompt, unlike posting or voting, doesn't need an account. */
export function markLibraryPromptUsed(promptId) {
  return post(`/library/prompts/${promptId}/use`, {});
}

export { ApiError };