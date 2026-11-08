"use client";

import React from "react";
import { useDemo } from "@/lib/demo-context";

// Owner, 9 Nov 2026: no strip under the top bar any more (Demo tools and Your data are in the footer). Only a save
// error is shown here, when something you added couldn't be kept on this device.
export function DemoBanner() {
  const { saveError, clearSaveError } = useDemo();

  return (
    <>

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
