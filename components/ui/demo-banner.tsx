import React from "react";
import Link from "next/link";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-xs text-amber-800 no-print">
      <div className="flex items-center space-x-1.5 truncate">
        <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span className="font-medium truncate">
          Demo: nothing you add is saved.
        </span>
      </div>
      <Link
        href="/consent"
        className="ml-2 font-medium underline text-amber-900 hover:text-amber-950 flex-shrink-0 text-[11px]"
      >
        Sign in
      </Link>
    </div>
  );
}
