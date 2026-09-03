import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "./api.js";

const STORAGE_KEY = "promptworks_auth";

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt or blocked storage — treat as logged out rather than throw.
    return null;
  }
}

const AuthContext = createContext(null);

/** Wraps the app once, near the root. Session lives in localStorage so a
 *  refresh doesn't log you out; the token itself is what every authed API
 *  call sends, not this context — this just makes it available to render. */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  // The JWT only carries email + user_id (see issue_token in backend/main.py)
  // — first/last name lives in the database, so it's fetched separately
  // rather than decoded from the token. Runs once per session: after that
  // fetch, firstName is `null` rather than `undefined` even for someone who
  // never filled it in, so the dependency below doesn't refire forever.
  useEffect(() => {
    if (!session?.token || session.firstName !== undefined) return;
    let cancelled = false;
    getMe(session.token)
      .then((profile) => {
        if (cancelled) return;
        setSession((prev) =>
          prev && prev.token === session.token
            ? { ...prev, firstName: profile.first_name, lastName: profile.last_name }
            : prev,
        );
      })
      .catch(() => {
        // Token may be stale/expired — initials just fall back to the email
        // in that case rather than forcing a logout from inside this effect.
      });
    return () => {
      cancelled = true;
    };
  }, [session?.token, session?.firstName]);

  const login = (tokenResponse) => {
    setSession({
      token: tokenResponse.access_token,
      email: tokenResponse.email,
      userId: tokenResponse.user_id,
    });
  };

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider
      value={{ session, isAuthenticated: !!session, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Gate for the app routes (dashboard, practice, workflows, team). Bounces
 *  to /login and remembers where you were headed, so a refresh mid-session
 *  or a direct link lands you back where you meant to go after signing in. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
