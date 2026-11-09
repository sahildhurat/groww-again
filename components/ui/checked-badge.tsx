"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileText, Info, Ban } from "lucide-react";

// R42 (Claude, 7 Nov 2026): three visible answer states, in plain words, each linking to how answers are checked.
//   Checked  = the AI answer passed every gate check.
//   Declined = an advice question; the fixed decline text with official education links.
//   Standard = the AI answer was not used (off, slow, or failed a check); a fixed answer built from the passbook.
interface CheckedBadgeProps {
  status?: "checked" | "standard" | string;
  declined?: boolean;
  className?: string;
}

const TEXT = {
  checked: {
    label: "Checked against your passbook",
    tip: "Checked by the app, not by a person: this answer passed every check in code. Facts and times come from your passbook or Groww's help pages, with no advice, predictions or personal data.",
  },
  declined: {
    label: "Declined: not advice",
    tip: "Sensecheck does not give investment advice, so this question gets a fixed reply that points to official investor education.",
  },
  standard: {
    label: "Standard answer",
    tip: "The AI answer was not used (it was unavailable or did not pass a check), so you see a fixed answer built from your passbook.",
  },
};

export function CheckedBadge({ status = "checked", declined = false, className = "" }: CheckedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const kind = declined ? "declined" : status === "checked" ? "checked" : "standard";
  const { label, tip } = TEXT[kind];

  const styles =
    kind === "checked"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
      : kind === "declined"
      ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${styles}`}
        aria-label={label}
        data-testid="answer-state"
      >
        {kind === "checked" ? (
          <ShieldCheck className="w-3 h-3" />
        ) : kind === "declined" ? (
          <Ban className="w-3 h-3" />
        ) : (
          <FileText className="w-3 h-3" />
        )}
        <span>{label}</span>
        <Info className="w-2.5 h-2.5 opacity-60" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-1.5 z-50 w-56 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-lg leading-tight pointer-events-none">
          <p>{tip}</p>
        </div>
      )}
    </div>
  );
}

/** Small link shown under every Sensecheck answer. */
export function HowAnswersAreChecked() {
  return (
    <Link href="/quality" className="text-[11px] text-gray-500 hover:text-gray-800 underline">
      How answers are checked
    </Link>
  );
}
