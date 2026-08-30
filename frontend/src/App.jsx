import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MarketingLayout, AppLayout } from "./components/layout/Layouts.jsx";
import { Button, Section } from "./components/ui/index.jsx";

import Home from "./pages/Home.jsx";
import Platform from "./pages/Platform.jsx";
import Tracks from "./pages/Tracks.jsx";
import ForTeams from "./pages/ForTeams.jsx";
import Pricing from "./pages/Pricing.jsx";
import Resources from "./pages/Resources.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

import Onboarding from "./pages/app/Onboarding.jsx";
import Dashboard from "./pages/app/Dashboard.jsx";
import Practice from "./pages/app/Practice.jsx";
import Player from "./pages/app/Player.jsx";
import Workflows from "./pages/app/Workflows.jsx";
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
      <Routes>
        {/* Marketing */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/for-teams" element={<ForTeams />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* App — different header, no marketing footer */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:slug" element={<Player />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/team" element={<Team />} />
        </Route>

        {/* Onboarding — no chrome at all */}
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
  );
}
