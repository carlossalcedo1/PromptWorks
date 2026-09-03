import { useEffect } from "react";

/** Closes a dropdown/menu on a click anywhere outside `ref`. The listener is
 *  only attached while `active` is true, so a closed dropdown costs nothing. */
export function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onOutside();
      }
    }
    // mousedown, not click — fires before a click on another button's own
    // handler, so opening a different dropdown closes this one in the same
    // gesture rather than needing a second click.
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [active, ref, onOutside]);
}
