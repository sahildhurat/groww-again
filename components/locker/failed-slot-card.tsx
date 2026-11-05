"use client";

import React from "react";
import Link from "next/link";
import { DemoInstalment } from "@/lib/seed";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { AlertCircle, ArrowRight, Wrench } from "lucide-react";

interface FailedSlotCardProps {
  instalment: DemoInstalment;
}

export function FailedSlotCard({ instalment }: FailedSlotCardProps) {
  const dateFormatted = new Date(instalment.due_date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  // Deterministic copy per cause (§3 & §8)
  let headline = "This instalment did not go through.";
  let explanation = "";
  let fixText = "";

  if (instalment.failure_code === "bank_account_issue") {
    explanation =
      "The AutoPay for this SIP is linked to a bank account you no longer use.";
    fixText =
      "To fix it, set up AutoPay on your current account and link it to this SIP.";
  } else if (instalment.failure_code === "balance_insufficient") {
    explanation =
      "NACH debit returned: insufficient funds in the linked account on the debit date.";
    fixText =
      "To keep this month, you can use Pay Now within 2 working days or pause the SIP.";
  } else {
    explanation =
      instalment.failure_text || "The scheduled debit was not completed.";
    fixText = "Review the next steps to resolve or restart this instalment.";
  }

  return (
    <article
      id={instalment.id}
      className="bg-amber-50/40 rounded-2xl p-4 border-2 border-dashed border-amber-300 shadow-sm space-y-3"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-gray-900 tracking-tight">
            {dateFormatted}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
            Empty slot
          </span>
        </div>
        <CheckedBadge status="checked" />
      </div>

      {/* Primary Message */}
      <div className="space-y-1.5 text-xs text-gray-800 leading-relaxed">
        <p className="font-semibold text-gray-900">{headline}</p>
        <p className="text-gray-700">{explanation}</p>
        {instalment.failure_text && (
          <p className="text-[11px] text-gray-500 italic bg-white/60 p-1.5 rounded-lg border border-amber-200/40">
            {instalment.failure_text}
          </p>
        )}
        <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/60 text-xs text-gray-800 flex items-start space-x-2">
          <Wrench className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{fixText}</span>
        </div>
      </div>

      {/* Fix / Action CTA */}
      <div className="pt-1 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          Missed instalments: 1 of 3
        </span>
        <Link
          href={`/break?inst_id=${instalment.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
        >
          <span>Find out why &amp; fix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
