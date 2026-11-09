"use client";

// Every month's money, newest first: the three-step trail, the delivery line, the source, and (version B) a memory.
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Camera, Mic, Quote, Plus, MinusCircle } from "lucide-react";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import type { MemoryRecord } from "@/lib/keepsake";
import { instalmentState } from "@/lib/passbook";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/format";
import { monthKey } from "@/lib/flow";
import { MoneyTrail } from "@/components/ui/money-trail";
import { MemoryCard } from "@/components/keepsake/memory-card";

// Visual pass (8 Nov): one plain status per month, readable at a glance.
function StatePill({ state, units }: { state: string; units?: number | null }) {
  const map: Record<string, [string, string]> = {
    allotted: [units ? `+${units.toFixed(3)} units` : "Units added", "bg-emerald-50 text-emerald-800 border-emerald-200"],
    in_progress: ["Waiting for units", "bg-blue-50 text-blue-800 border-blue-200"],
    failed: ["Not debited", "bg-orange-50 text-orange-900 border-orange-200"],
    refunded: ["Refunded", "bg-gray-100 text-gray-700 border-gray-200"],
    skipped: ["Skipped", "bg-gray-100 text-gray-700 border-gray-200"],
    unknown: ["Can't confirm right now", "bg-amber-50 text-amber-900 border-amber-200"],
  };
  const [text, cls] = map[state] ?? ["", ""];
  if (!text) return null;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`} data-testid="state-pill">
      {text}
    </span>
  );
}

export function MonthList({
  sip,
  instalments,
  version,
  memories,
}: {
  sip: PassbookSip;
  instalments: Instalment[];
  version: "A" | "B";
  memories: Record<string, MemoryRecord>;
}) {
  const [openMemory, setOpenMemory] = useState<string | null>(null);
  const sortedInstalments = useMemo(
    () => [...instalments].sort((a, b) => b.due_date.localeCompare(a.due_date)),
    [instalments]
  );
  return (
        <section className="space-y-3 pt-1">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[15px] font-semibold text-gray-900">
              Every month ({sortedInstalments.length})
            </h2>
            <span className="text-[12px] text-gray-400">Newest first</span>
          </div>

          <div className="space-y-2.5">
            {sortedInstalments.map((inst) => {
              const state = instalmentState(inst);
              const debit = inst.events.find((e) => e.type === "debit");
              const allotment = inst.events.find((e) => e.type === "allotment");
              const refund = inst.events.find((e) => e.type === "refund");

              const monthStr = monthKey(inst.due_date);
              const memory = version === "B" ? memories[monthStr] : undefined;

              // Source text
              let sourceText = "";
              if (state === "allotted" && allotment) {
                sourceText = `Confirmed by ${allotment.source_label} · ${formatDateTime(allotment.effective_at || allotment.as_of)}`;
              } else if (state === "in_progress" && debit) {
                sourceText = `Confirmed by your bank · ${formatDateTime(debit.effective_at)}`;
              } else if (state === "failed" && debit) {
                sourceText = `Debit failed, per your bank · ${formatDateTime(debit.effective_at)}`;
              } else if (state === "refunded" && refund) {
                sourceText = `Refund confirmed by your bank · ${formatDateTime(refund.effective_at)}`;
              } else if (state === "unknown" && allotment) {
                sourceText = `Status as of ${formatDateTime(allotment.as_of)}`;
              }

              return (
                <div
                  key={inst.id}
                  className="bg-white rounded-3xl border border-gray-200/70 hover:border-gray-300 transition-colors"
                >
                  <Link href={`/passbook/${inst.id}`} className="block px-4 pt-3.5 pb-3 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[15px] font-semibold text-gray-900">{formatDate(inst.due_date)}</span>
                        <span className="text-[13px] text-gray-500">₹{inst.amount.toLocaleString("en-IN")}</span>
                        <StatePill state={state} units={inst.units} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {memory && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-800 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5"
                            data-testid="memory-indicator"
                            aria-label={`Your memory for ${formatMonthYear(monthStr)}`}
                          >
                            {memory.photo && <Camera className="w-3 h-3" />}
                            {memory.voice && <Mic className="w-3 h-3" />}
                            {memory.text && !memory.photo && !memory.voice && <Quote className="w-3 h-3" />}
                            <span>Memory</span>
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      </div>
                    </div>

                    <div className="pt-3">
                      {state === "skipped" ? (
                        <div className="flex items-center gap-2 text-[13px] text-gray-500 py-1">
                          <MinusCircle className="w-4 h-4 text-gray-400" />
                          <span>Skipped by investor. No debit was attempted.</span>
                        </div>
                      ) : (
                        <MoneyTrail inst={inst} paymentRoute={sip.payment_route} />
                      )}

                      {sourceText && (
                        <p className="text-[11px] text-gray-500 mt-3 pt-2 border-t border-gray-100">{sourceText}</p>
                      )}
                    </div>
                  </Link>
                  {/* Owner, 8 Nov: a memory can be attached to any month (version B only, so the A/B test still works) */}
                  {version === "B" && (
                    <div className="px-4 pb-3">
                      {openMemory === monthStr ? (
                        <MemoryCard
                          month={monthStr}
                          monthLabel={formatMonthYear(monthStr)}
                          invite={false}
                          autoEdit
                          embedded
                          onClose={() => setOpenMemory(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenMemory(monthStr)}
                          data-testid="add-memory"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-800 hover:underline"
                        >
                          {memory ? <Camera className="w-3.5 h-3.5" aria-hidden /> : <Plus className="w-3.5 h-3.5" aria-hidden />}
                          <span>{memory ? `View your ${formatMonthYear(monthStr)} memory` : `Add a memory to ${formatMonthYear(monthStr)}`}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
  );
}
