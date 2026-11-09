"use client";

import React from "react";
import { Check, X, RotateCcw, Minus, HelpCircle, Truck } from "lucide-react";
import type { Instalment, PassbookEvent } from "@/lib/passbook-types";
import { deliveryLine } from "@/lib/delivery";
import { formatDateTime } from "@/lib/format";

// One month's money as a delivery tracker: bank debit → order → units. Owner, 9 Nov 2026: first-time SIP investors are
// mostly young, heavy online shoppers who already read an order tracker; each stop now says where the money got to in
// delivery words, with the banking term above it and the event's own time below (MVP session: plain banking terms and
// timestamps keep the metaphor honest). Times come from the passbook events; no arrival date is ever predicted.
type Tone = "done" | "wait" | "fail" | "back" | "unknown" | "none";

const TONE: Record<Tone, { dot: string; text: string; icon: React.ReactNode }> = {
  done: { dot: "bg-emerald-600 text-white border-emerald-600", text: "text-emerald-800", icon: <Check className="w-3 h-3" strokeWidth={3} /> },
  wait: { dot: "bg-white text-blue-600 border-blue-500 border-dashed", text: "text-blue-800", icon: <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> },
  fail: { dot: "bg-[#B4433A] text-white border-[#B4433A]", text: "text-[#8E3329]", icon: <X className="w-3 h-3" strokeWidth={3} /> },
  back: { dot: "bg-violet-600 text-white border-violet-600", text: "text-violet-800", icon: <RotateCcw className="w-3 h-3" strokeWidth={2.6} /> },
  unknown: { dot: "bg-gray-200 text-gray-600 border-gray-300", text: "text-gray-700", icon: <HelpCircle className="w-3 h-3" strokeWidth={2.4} /> },
  none: { dot: "bg-gray-100 text-gray-400 border-gray-200", text: "text-gray-400", icon: <Minus className="w-3 h-3" /> },
};

function Stop({ label, status, tone, when, note }: { label: string; status: string; tone: Tone; when?: string; note?: string }) {
  const t = TONE[tone];
  return (
    <div className="relative flex flex-col items-center text-center min-w-0" data-testid="tracker-stop">
      <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 ${t.dot}`}>{t.icon}</span>
      <span className="mt-1.5 text-[11px] text-gray-500 leading-tight">{label}</span>
      <span className={`mt-0.5 text-[12px] font-semibold leading-tight ${t.text}`}>{status}</span>
      {when && <span className="mt-0.5 text-[10.5px] text-gray-500 leading-tight">{when}</span>}
      {note && (
        <span className="text-[10.5px] text-gray-500 leading-tight" data-testid="stop-note">
          {note}
        </span>
      )}
    </div>
  );
}

// "5 Nov, 09:12" for a stop that happened; "checked 6 Nov, 10:00" for one still open
function stopTime(ev?: PassbookEvent): string | undefined {
  if (!ev) return undefined;
  const at = ev.status === "confirmed" || ev.status === "failed" ? ev.effective_at ?? ev.as_of : null;
  const short = (iso: string) => formatDateTime(iso).replace(/ \d{4},/, ",").replace(/ IST$/, "");
  if (at) return short(at);
  return ev.as_of ? `checked ${short(ev.as_of)}` : undefined;
}

// User tests, 9 Nov (P04): "why does the 5 Nov instalment say 4 Nov?" Groww takes the money a bank working day before
// the SIP date; the stop says so whenever the bank's own time falls before the SIP date.
function earlyNote(ev: PassbookEvent | undefined, dueDate: string): string | undefined {
  const at = ev && (ev.status === "confirmed" || ev.status === "failed") ? ev.effective_at : null;
  return at && at.slice(0, 10) < dueDate.slice(0, 10) ? "before the SIP date" : undefined;
}

export function MoneyTrail({ inst, paymentRoute, tracker = true }: { inst: Instalment; paymentRoute?: string; tracker?: boolean }) {
  const debit = inst.events.find((e) => e.type === "debit");
  const order = inst.events.find((e) => e.type === "order");
  const allotment = inst.events.find((e) => e.type === "allotment");
  const refund = inst.events.find((e) => e.type === "refund");

  const d: [string, Tone] =
    debit?.status === "confirmed" ? ["Picked up", "done"] : debit?.status === "failed" ? ["Not picked up", "fail"] : ["Not attempted", "none"];
  const o: [string, Tone] =
    order?.status === "confirmed" ? ["Handed to the fund", "done"] : order?.status === "failed" ? ["Not accepted", "fail"] : ["Not attempted", "none"];
  const u: [string, Tone] =
    allotment?.status === "confirmed"
      ? [inst.units ? `Delivered: ${inst.units.toFixed(3)} units` : "Delivered", "done"]
      : allotment?.status === "pending"
      ? ["On the way", "wait"]
      : allotment?.status === "unknown"
      ? ["Can't confirm right now", "unknown"]
      : refund?.status === "confirmed"
      ? ["Returned to your bank", "back"]
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
        <Stop label="Bank debit" status={d[0]} tone={d[1]} when={stopTime(debit)} note={earlyNote(debit, inst.due_date)} />
        <Stop label="Order" status={o[0]} tone={o[1]} when={stopTime(order)} />
        <Stop label={refund ? "Refund" : "Units"} status={u[0]} tone={u[1]} when={stopTime(refund?.status === "confirmed" ? refund : allotment)} />
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
