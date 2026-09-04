import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MarketingLayout, AppLayout } from "./components/layout/Layouts.jsx";
import { Button, Section } from "./components/ui/index.jsx";
import { AuthProvider, RequireAuth } from "./lib/auth.jsx";

import Home from "./pages/Home.jsx";
import Platform from "./pages/Platform.jsx";
import Why from "./pages/Why.jsx";
import Tracks from "./pages/Tracks.jsx";
import Pricing from "./pages/Pricing.jsx";
import Resources from "./pages/Resources.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Privacy from "./pages/Privacy.jsx";

import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";

import Onboarding from "./pages/app/Onboarding.jsx";
import Dashboard from "./pages/app/Dashboard.jsx";
import Practice from "./pages/app/Practice.jsx";
import FreeformCheck from "./pages/app/FreeformCheck.jsx";
import Player from "./pages/app/Player.jsx";
import Workflows from "./pages/app/Workflows.jsx";
import Profile from "./pages/app/Profile.jsx";
import Team from "./pages/app/Team.jsx";

function NotFound() {
  return (
    <Section className="py-32 text-center">
      <h1 className="h-section">That page does not exist.</h1>
      <p className="mt-4 text-ink-70">
        It may be a stage 2 screen that has not been built yet.
      </p>
      <Button to="/" variant="filled" className="mt-8">
        Back to the homepage
      </Button>
    </Section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Marketing */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/why" element={<Why />} />
            {/* Named "Scenarios" in the nav; /tracks stays live because it
                is the URL every existing link and bookmark points at. */}
            <Route path="/scenarios" element={<Tracks />} />
            <Route path="/tracks" element={<Tracks />} />
            {/* The business case lives on the homepage now. The old URL
                is kept because it is linked from outside the app. */}
            <Route
              path="/for-teams"
              element={<Navigate to="/#business" replace />}
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* App — different header, no marketing footer. Practice itself
              stays reachable without an account (see Onboarding below); the
              rest is a signed-in person's own data, so it's gated. */}
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="/practice" element={<Practice />} />
            <Route path="/practice/:slug" element={<Player />} />
            <Route path="/check" element={<FreeformCheck />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/workflows"
              element={
                <RequireAuth>
                  <Workflows />
                </RequireAuth>
              }
            />
            <Route
              path="/team"
              element={
                <RequireAuth>
                  <Team />
                </RequireAuth>
              }
            />
          </Route>

          {/* Onboarding, login, signup — no chrome at all */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}