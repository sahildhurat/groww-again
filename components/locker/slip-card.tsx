"use client";

import React from "react";
import { DemoInstalment } from "@/lib/seed";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { Image as ImageIcon, Mic, FileText, Plus, Sparkles } from "lucide-react";

interface SlipCardProps {
  instalment: DemoInstalment;
  previousPaid?: DemoInstalment | null;
  onOpenMemoryModal: (instalment: DemoInstalment) => void;
}

export function SlipCard({
  instalment,
  previousPaid,
  onOpenMemoryModal,
}: SlipCardProps) {
  const dateFormatted = new Date(instalment.due_date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  // Compute month story text (F2: Your month, your money)
  // Deterministic fallback or computed two sentences:
  let monthStory = "";
  if (instalment.units && instalment.nav) {
    if (previousPaid && previousPaid.nav && previousPaid.units) {
      const navDiff = (instalment.nav - previousPaid.nav).toFixed(2);
      const unitsDiff = Math.abs(instalment.units - previousPaid.units).toFixed(3);
      const isMore = instalment.units >= previousPaid.units;
      const navComparison =
        instalment.nav < previousPaid.nav
          ? `the fund's price was lower than last month, so your ₹${instalment.amount.toLocaleString(
              "en-IN"
            )} bought ${unitsDiff} more units`
          : `the fund's price was higher than last month, so your ₹${instalment.amount.toLocaleString(
              "en-IN"
            )} bought ${unitsDiff} fewer units`;

      const memoryAddition = instalment.memory?.text
        ? ` In the month of "${instalment.memory.text}", ${navComparison}.`
        : ` This month ${navComparison}.`;

      monthStory = `You acquired ${instalment.units.toFixed(
        3
      )} units at a NAV of ₹${instalment.nav.toFixed(2)}.${memoryAddition}`;
    } else {
      const memoryPart = instalment.memory?.text
        ? ` Marked with: "${instalment.memory.text}".`
        : "";
      monthStory = `This month ₹${instalment.amount.toLocaleString(
        "en-IN"
      )} bought ${instalment.units.toFixed(3)} units at a NAV of ₹${instalment.nav.toFixed(
        2
      )}.${memoryPart}`;
    }
  }

  return (
    <article
      id={instalment.id}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 transition-all hover:border-gray-200"
    >
      {/* Top Header: Date and Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-gray-900 tracking-tight">
            {dateFormatted}
          </span>
        </div>
        <CheckedBadge status="checked" />
      </div>

      {/* Slip Primary Record */}
      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-1">
        <p className="text-xs text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">
            ₹{instalment.amount.toLocaleString("en-IN")}
          </span>{" "}
          invested.{" "}
          <span className="font-semibold text-gray-900">
            {instalment.units?.toFixed(3)}
          </span>{" "}
          units at a NAV of{" "}
          <span className="font-semibold text-gray-900">
            ₹{instalment.nav?.toFixed(2)}
          </span>
          .
        </p>

        {/* F2: Your Month, Your Money (Two Checked Sentences) */}
        {monthStory && (
          <div className="mt-2 pt-2 border-t border-gray-200/60 text-xs text-gray-600 leading-relaxed">
            <span className="font-medium text-emerald-800 mr-1 inline-flex items-center">
              <Sparkles className="w-3 h-3 inline mr-1 text-emerald-600" />
              Your month, your money:
            </span>
            {monthStory}
          </div>
        )}
      </div>

      {/* Memory Attachment (if any) or Add Memory prompt */}
      {instalment.memory ? (
        <div className="bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 flex items-start space-x-3">
          {instalment.memory.illustration && (
            <img
              src={instalment.memory.illustration}
              alt="Memory illustration"
              className="w-10 h-10 rounded-lg flex-shrink-0 object-contain bg-white p-1 border border-emerald-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Memory for this month
            </p>
            {instalment.memory.text && (
              <p className="text-xs text-gray-700 mt-0.5 italic">
                &ldquo;{instalment.memory.text}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={() => onOpenMemoryModal(instalment)}
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 underline self-start flex-shrink-0"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">
            No memory attached yet
          </span>
          <button
            onClick={() => onOpenMemoryModal(instalment)}
            className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add memory</span>
          </button>
        </div>
      )}
    </article>
  );
}
