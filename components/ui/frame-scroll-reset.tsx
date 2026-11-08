"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// On desktop the app scrolls inside the phone frame (#app-scroll), not the window, so a new page must start at the top.
export function FrameScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    document.getElementById("app-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
