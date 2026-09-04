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

/** Freeform grading — no scenario_id, no signup required (no token passed
 *  here on purpose). Scores general prompt-engineering craft on the same
 *  six dimensions used everywhere else, but this is NOT written to the
 *  attempts table and does not count toward a tracked skill score — see
 *  backend/main.py's /grade/freeform route for why. */
export function gradeFreeform(prompt) {
  return post("/grade/freeform", { prompt });
}

export { ApiError };