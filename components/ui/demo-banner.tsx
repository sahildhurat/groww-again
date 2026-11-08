"use client";

import React from "react";
import Link from "next/link";
import { useDemo } from "@/lib/demo-context";

// One quiet strip under the top bar: which demo you are looking at, that it is demo data, and where your additions live.
export function DemoBanner() {
  const { saveError, clearSaveError, version, scenario } = useDemo();

  return (
    <>
      <div className="w-full bg-paper border-b border-gray-200/80 px-4 py-1.5 flex items-start justify-between gap-3 text-[12px] leading-snug text-gray-600 no-print">
        <span>
          <span className="font-medium text-gray-800">
            Version {version} ·{" "}
            {scenario === "stopped" ? "Stopped SIP" : scenario === "stale" ? "Status can't be confirmed" : "Running SIP"}
          </span>
          <span className="text-gray-500"> · Demo data. What you add stays here.</span>
        </span>
        <span className="flex items-center gap-3 flex-shrink-0">
          <Link href="/demo-tools" className="underline underline-offset-2 hover:text-gray-900">
            Demo tools
          </Link>
          <Link href="/your-data" className="underline underline-offset-2 hover:text-gray-900">
            Your data
          </Link>
        </span>
      </div>

      {saveError && (
        <div role="alert" className="w-full bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center justify-between text-[12px] text-red-800 no-print">
          <span className="font-medium">{saveError}</span>
          <button type="button" onClick={clearSaveError} className="ml-2 underline flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
