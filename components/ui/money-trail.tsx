"use client";

import React from "react";
import { Check, X, RotateCcw, Minus, HelpCircle, Truck } from "lucide-react";
import type { Instalment } from "@/lib/passbook-types";
import { deliveryLine } from "@/lib/delivery";

// One month's money as a three-stop trail: bank debit → order → units. Each stop shows where the money got to.
type Tone = "done" | "wait" | "fail" | "back" | "unknown" | "none";

const TONE: Record<Tone, { dot: string; text: string; icon: React.ReactNode }> = {
  done: { dot: "bg-emerald-600 text-white border-emerald-600", text: "text-emerald-800", icon: <Check className="w-3 h-3" strokeWidth={3} /> },
  wait: { dot: "bg-white text-blue-600 border-blue-500 border-dashed", text: "text-blue-800", icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> },
  fail: { dot: "bg-[#B4433A] text-white border-[#B4433A]", text: "text-[#8E3329]", icon: <X className="w-3 h-3" strokeWidth={3} /> },
  back: { dot: "bg-violet-600 text-white border-violet-600", text: "text-violet-800", icon: <RotateCcw className="w-3 h-3" strokeWidth={2.6} /> },
  unknown: { dot: "bg-gray-200 text-gray-600 border-gray-300", text: "text-gray-700", icon: <HelpCircle className="w-3 h-3" strokeWidth={2.4} /> },
  none: { dot: "bg-gray-100 text-gray-400 border-gray-200", text: "text-gray-400", icon: <Minus className="w-3 h-3" /> },
};

function Stop({ label, status, tone }: { label: string; status: string; tone: Tone }) {
  const t = TONE[tone];
  return (
    <div className="relative flex flex-col items-center text-center min-w-0">
      <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 ${t.dot}`}>{t.icon}</span>
      <span className="mt-1.5 text-[11px] text-gray-500 leading-tight">{label}</span>
      <span className={`mt-0.5 text-[12px] font-semibold leading-tight ${t.text}`}>{status}</span>
    </div>
  );
}

export function MoneyTrail({ inst, paymentRoute, tracker = true }: { inst: Instalment; paymentRoute?: string; tracker?: boolean }) {
  const debit = inst.events.find((e) => e.type === "debit");
  const order = inst.events.find((e) => e.type === "order");
  const allotment = inst.events.find((e) => e.type === "allotment");
  const refund = inst.events.find((e) => e.type === "refund");

  const d: [string, Tone] =
    debit?.status === "confirmed" ? ["Debited", "done"] : debit?.status === "failed" ? ["Not debited", "fail"] : ["Not attempted", "none"];
  const o: [string, Tone] =
    order?.status === "confirmed" ? ["Order placed", "done"] : order?.status === "failed" ? ["Order failed", "fail"] : ["Not attempted", "none"];
  const u: [string, Tone] =
    allotment?.status === "confirmed"
      ? [inst.units ? `${inst.units.toFixed(3)} units` : "Allotted", "done"]
      : allotment?.status === "pending"
      ? ["Units not confirmed yet", "wait"]
      : allotment?.status === "unknown"
      ? ["Can't confirm right now", "unknown"]
      : refund?.status === "confirmed"
      ? ["Refunded", "back"]
      : ["Not attempted", "none"];

  // The line between two stops is solid once the money has moved past the first one.
  const seg1 = d[1] === "done" ? "bg-emerald-500" : "bg-gray-200";
  const seg2 = o[1] === "done" ? (u[1] === "done" ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-blue-300") : d[1] === "done" && o[1] === "fail" ? "bg-gray-200" : "bg-gray-200";

  const line = tracker ? deliveryLine(inst, paymentRoute) : null;
  return (
    <div>
      <div className="relative grid grid-cols-3 gap-1" data-testid="money-trail">
        <span aria-hidden className={`absolute top-3 left-[16.66%] w-[33.33%] h-0.5 ${seg1}`} />
        <span aria-hidden className={`absolute top-3 left-[50%] w-[33.33%] h-0.5 ${seg2}`} />
        <Stop label="Bank debit" status={d[0]} tone={d[1]} />
        <Stop label="Order" status={o[0]} tone={o[1]} />
        <Stop label={refund ? "Money" : "Units"} status={u[0]} tone={u[1]} />
      </div>
      {line && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[12px] text-gray-700 leading-snug" data-testid="delivery-line">
          <Truck className="w-3.5 h-3.5 mt-0.5 text-gray-500 flex-shrink-0" aria-hidden />
          <span>{line}</span>
        </p>
      )}
    </div>
  );
}
