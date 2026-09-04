import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingHeader } from "./MarketingHeader.jsx";
import { AppHeader } from "./AppHeader.jsx";
import { Footer } from "./Footer.jsx";
import { useAuth } from "../../lib/auth.jsx";

/** Top of the page on navigation — except when the URL names a section,
 *  in which case scroll to that section instead. */
function ScrollToTop() {
  // `key` changes on every navigation, including one to the URL you are
  // already on — so clicking "For Business" a second time still jumps.
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // scrollIntoView honours the scroll-margin-top set in index.css, which is
    // what keeps the section clear of the sticky header.
    const jump = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView();
      return !!el;
    };
    // The effect runs after commit, so on a same-page link the target is
    // already there. A cross-page link can land a tick early — hence the
    // retry. A timeout rather than requestAnimationFrame, which browsers
    // suspend entirely while the tab is not being painted.
    if (jump()) return;
    const timer = setTimeout(() => {
      if (!jump()) window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);
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

/**
 * For a page that is linked from both navs and needs no account — the public
 * prompt library is the one.
 *
 * Without this the library sits in one layout or the other, and whichever
 * half of the site you did not come from swaps its header out from under you
 * on click. Picking the chrome by session keeps the nav you were just using.
 */
export function AdaptiveLayout() {
  const { session } = useAuth();
  return session ? <AppLayout /> : <MarketingLayout />;
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
