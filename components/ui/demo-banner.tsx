"use client";

import React from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { useDemo } from "@/lib/demo-context";

export function DemoBanner() {
  const { saveError, clearSaveError, version, scenario } = useDemo();

  return (
    <>
      {/* Version and Scenario status strip per SPEC-07 §5 */}
      <div className="w-full bg-gray-100 border-b border-gray-200 px-3 py-1 flex items-center justify-between text-[11px] text-gray-700 no-print">
        <span className="font-medium">
          Version {version} ·{" "}
          {scenario === "stopped" ? "Stopped SIP" : scenario === "stale" ? "Status can't be confirmed" : "Running SIP"}
        </span>
        <Link href="/demo-tools" className="underline text-[11px] text-gray-600 hover:text-gray-900">
          Demo tools
        </Link>
      </div>

      {saveError && (
        <div role="alert" className="w-full bg-red-50 border-b border-red-200 px-3 py-1.5 flex items-center justify-between text-xs text-red-800 no-print">
          <span className="font-medium">{saveError}</span>
          <button type="button" onClick={clearSaveError} className="ml-2 underline text-[11px] flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Final MVP (8 Nov): no sign-in. Demo data; what the investor adds stays in this browser. */}
      <div className="w-full bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-xs text-amber-800 no-print">
        <div className="flex items-center space-x-1.5 truncate">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="font-medium truncate">Demo data. What you add stays here.</span>
        </div>
        <Link
          href="/your-data"
          className="ml-2 font-medium underline text-amber-900 hover:text-amber-950 flex-shrink-0 text-[11px]"
        >
          Your data
        </Link>
      </div>
    </>
  );
}
