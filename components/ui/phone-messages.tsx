"use client";

// Final feature (8 Nov): "The second message", shown the way it would arrive on the phone: the bank's SMS, then
// Groww's message saying what the money became. Tapping a Groww message opens that month in the passbook.
import React from "react";
import Link from "next/link";
import { Landmark, BookOpen } from "lucide-react";
import type { PhoneMessage } from "@/lib/second-message";
import { formatDateTime } from "@/lib/format";

export function MessageBubble({ m, href, dark = false }: { m: PhoneMessage; href?: string; dark?: boolean }) {
  const isGroww = m.from === "groww";
  const inner = (
    <div
      className={`flex gap-3 rounded-2xl px-3.5 py-3 text-left ${
        dark ? "bg-white/[0.12] text-white backdrop-blur-sm" : "bg-white border border-gray-200/70"
      } ${href ? "hover:ring-2 hover:ring-emerald-300/60 transition-shadow" : ""}`}
      data-testid={isGroww ? "groww-message" : "bank-message"}
    >
      <span
        className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
          isGroww ? "bg-emerald-600 text-white" : dark ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
        }`}
        aria-hidden
      >
        {isGroww ? <BookOpen className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-[12px] font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
            {isGroww ? "Groww" : "Your bank"}
            {isGroww && <span className={`font-normal ${dark ? "text-white/70" : "text-gray-500"}`}> · {m.title}</span>}
          </span>
          <span className={`text-[11px] whitespace-nowrap ${dark ? "text-white/60" : "text-gray-500"}`}>{formatDateTime(m.at).replace(/ \d{4},/, ",").replace(" IST", "")}</span>
        </div>
        <p className={`text-[13px] leading-snug mt-0.5 ${dark ? "text-white/90" : "text-gray-700"}`}>{m.body}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
      {inner}
    </Link>
  ) : (
    inner
  );
}
