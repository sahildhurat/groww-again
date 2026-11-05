"use client";

import React, { useState } from "react";
import { ShieldCheck, FileText, Info } from "lucide-react";

interface CheckedBadgeProps {
  status?: "checked" | "standard";
  reason?: string;
  className?: string;
}

export function CheckedBadge({
  status = "checked",
  reason,
  className = "",
}: CheckedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isChecked = status === "checked";

  const defaultExplanation = isChecked
    ? "Verified by Quality Gate: numbers matched against ledger, no investment advice or projections, and no personal data."
    : "Standard deterministic template served as fallback because AI is in template mode or a safety check was triggered.";

  const explanation = reason || defaultExplanation;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
          isChecked
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
        }`}
        aria-label={isChecked ? "Checked by Quality Gate" : "Standard text"}
      >
        {isChecked ? (
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
        ) : (
          <FileText className="w-3 h-3 text-gray-500" />
        )}
        <span>{isChecked ? "Checked" : "Standard text"}</span>
        <Info className="w-2.5 h-2.5 opacity-60" />
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-lg leading-tight pointer-events-none">
          <p>{explanation}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
