"use client";

import React from "react";
import { DemoInstalment } from "@/lib/seed";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { PauseCircle, AlertTriangle } from "lucide-react";

interface HardMonthCardProps {
  instalment: DemoInstalment;
}

export function HardMonthCard({ instalment }: HardMonthCardProps) {
  const dateFormatted = new Date(instalment.due_date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <article
      id={instalment.id}
      className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2.5"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PauseCircle className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-900 tracking-tight">
            {dateFormatted}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-gray-200/70 px-1.5 py-0.5 rounded">
            Hard month
          </span>
        </div>
        <CheckedBadge status="checked" />
      </div>

      {/* Main Copy */}
      <div className="space-y-1 text-xs text-gray-700 leading-relaxed">
        <p className="font-semibold text-gray-900">Skipped by you.</p>
        {instalment.note && (
          <p className="bg-white p-2.5 rounded-xl border border-gray-100 italic text-gray-800">
            Your note: &ldquo;{instalment.note}&rdquo;
          </p>
        )}
      </div>

      {/* Factual Consequence Note (§3 & §4) */}
      <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-gray-500">
        <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
        <span>Skips count toward three missed instalments in a row.</span>
      </div>
    </article>
  );
}
