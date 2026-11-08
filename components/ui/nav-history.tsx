"use client";

// Link check, 9 Nov 2026: back arrows used fixed targets, so Every month → a month → back landed on the passbook, and
// Your data or Quality & Safety always went to one fixed page. This keeps a short list of the pages visited in this tab;
// the back arrow returns to the page you came from, and only falls back to the page's own parent when you landed
// directly (a shared link or a reload).
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "sip_passbook_nav_v1";

function read(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function NavHistory() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const s = read();
      if (s[s.length - 1] === pathname) return;
      if (s[s.length - 2] === pathname) s.pop();
      else s.push(pathname);
      sessionStorage.setItem(KEY, JSON.stringify(s.slice(-30)));
    } catch {
      /* private mode: the back arrow uses the parent page */
    }
  }, [pathname]);
  return null;
}

export function cameFromInsideApp(): boolean {
  return read().length >= 2;
}
