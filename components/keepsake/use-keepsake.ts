"use client";

import { useEffect, useState } from "react";
import { KEEPSAKE_EVENT } from "@/lib/keepsake";

/** Re-renders when anything in the keepsake store changes (same tab). */
export function useKeepsakeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener(KEEPSAKE_EVENT, on);
    return () => window.removeEventListener(KEEPSAKE_EVENT, on);
  }, []);
  return tick;
}
