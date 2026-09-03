import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingHeader } from "./MarketingHeader.jsx";
import { AppHeader } from "./AppHeader.jsx";
import { Footer } from "./Footer.jsx";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper-2/30">
      <ScrollToTop />
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
