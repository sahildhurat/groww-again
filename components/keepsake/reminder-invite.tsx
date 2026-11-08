"use client";

// Passbook cover (version B, owner 9 Nov 2026): with nothing saved yet, one quiet line points to the Start SIP demo,
// where the reminder (photo, voice note or line) is kept. Hidden next to a stop or a failed instalment, so it never
// reads as guilt or a nudge to restart.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useKeepsakeTick } from "./use-keepsake";
import { getGoal, getReason } from "@/lib/keepsake";

export function ReminderInvite({ hidden }: { hidden: boolean }) {
  const tick = useKeepsakeTick();
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    Promise.all([getGoal(), getReason()]).then(([g, r]) => setEmpty(!g?.photo && !r?.text && !r?.voice));
  }, [tick]);
  if (hidden || !empty) return null;
  return (
    <p className="text-xs text-gray-700" data-testid="reminder-invite">
      Why did you start? Keep a photo, a voice note or a line on the{" "}
      <Link href="/start" className="font-medium text-purple-800 underline">
        Start SIP screen (demo)
      </Link>
      .
    </p>
  );
}
