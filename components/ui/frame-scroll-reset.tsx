"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// On desktop the app scrolls inside the phone frame (#app-scroll), not the window, so a new page must start at the top.
// Owner, 9 Nov (08:50): the passbook lists every month in one scroll, so going back (the back arrow or the browser's)
// returns to where you were in it, on a phone (the window scrolls) and on desktop (the frame scrolls).
const KEY = "sip_passbook_scroll_v1";
type Pos = { w: number; f: number };

function readAll(): Record<string, Pos> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function savePos(path: string, pos: Pos) {
  try {
    const all = readAll();
    all[path] = pos;
    sessionStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage unavailable: going back simply starts at the top
  }
}

export function FrameScrollReset() {
  const pathname = usePathname();
  const current = useRef(pathname);
  const frozen = useRef(false);
  const popped = useRef(false);

  useEffect(() => {
    const frame = document.getElementById("app-scroll");
    const here = (): Pos => ({ w: window.scrollY, f: frame?.scrollTop ?? 0 });
    // While a page change is under way the old page's position must not be overwritten by the new page's height.
    let unfreeze: ReturnType<typeof setTimeout> | undefined;
    const freeze = () => {
      frozen.current = true;
      clearTimeout(unfreeze);
      unfreeze = setTimeout(() => (frozen.current = false), 3000);
    };
    const onScroll = () => {
      if (!frozen.current) savePos(current.current, here());
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const link = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      const back = el?.closest?.('button[aria-label="Go back"]');
      if ((link && link.origin === window.location.origin && link.target !== "_blank") || back) {
        savePos(current.current, here());
        freeze();
      }
    };
    const onPop = () => {
      popped.current = true;
      freeze();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame?.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      clearTimeout(unfreeze);
      window.removeEventListener("scroll", onScroll);
      frame?.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    current.current = pathname;
    const frame = document.getElementById("app-scroll");
    const wasPop = popped.current;
    popped.current = false;
    const pos = wasPop ? readAll()[pathname] : undefined;
    if (pos && (pos.w > 0 || pos.f > 0)) {
      // The page's content can render a moment after the route changes; keep placing it until it holds.
      let tries = 0;
      let held = 0;
      const place = () => {
        if (frame) frame.scrollTop = pos.f;
        window.scrollTo(0, pos.w);
        const ok = Math.abs((frame?.scrollTop ?? 0) - pos.f) < 2 && Math.abs(window.scrollY - pos.w) < 2;
        held = ok ? held + 1 : 0;
        if (held < 3 && ++tries < 30) setTimeout(place, 50);
        else frozen.current = false;
      };
      place();
      return;
    }
    frozen.current = false;
    if (window.location.hash) return;
    frame?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
