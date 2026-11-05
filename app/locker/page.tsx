"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary, DemoInstalment } from "@/lib/seed";
import { SlipCard } from "@/components/locker/slip-card";
import { FailedSlotCard } from "@/components/locker/failed-slot-card";
import { HardMonthCard } from "@/components/locker/hard-month-card";
import { ReturnDateCard } from "@/components/locker/return-date-card";
import { MemoryModal } from "@/components/locker/memory-modal";
import Link from "next/link";
import { Shield, Sparkles, Layers, ArrowRight } from "lucide-react";

export default function LockerPage() {
  const { sip, instalments, updateMemory } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const [activeInstalmentForMemory, setActiveInstalmentForMemory] =
    useState<DemoInstalment | null>(null);

  // Sort instalments reverse-chronologically (newest on top) for viewing
  const sortedInstalments = [...instalments].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="The SIP Locker" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        {/* Locker Cover Header */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Locker Cover
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {sip.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {sip.fund_label}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                Total Units
              </span>
              <span className="text-lg font-bold text-gray-900">
                {summary.totalUnits.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Dedication Banner */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">
              Dedication
            </span>
            <p className="text-xs font-medium text-gray-800 italic">
              &ldquo;{sip.dedication}&rdquo;
            </p>
          </div>

          {/* Compliance tag (§4 AMC/RTA rule) */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100">
            <span>Your locker, not an account statement.</span>
            <Link
              href="/certificate"
              className="font-medium text-emerald-700 hover:underline inline-flex items-center"
            >
              Print certificate
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </section>

        {/* Committed Return Date Card (if set) */}
        {sip.return_date && (
          <ReturnDateCard
            returnDate={sip.return_date}
            returnLabel={sip.return_label}
            status={sip.status === "paused" ? "paused" : "stopped"}
          />
        )}

        {/* Slips & Slots Feed Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Monthly Slips &amp; Entries ({instalments.length})</span>
          </h3>
          <span className="text-[11px] text-gray-400">Newest first</span>
        </div>

        {/* Chronological List of Slips, Empty Slots, and Hard Months */}
        <div className="space-y-3">
          {sortedInstalments.map((inst, index) => {
            if (inst.status === "failed") {
              return <FailedSlotCard key={inst.id} instalment={inst} />;
            }

            if (inst.status === "skipped") {
              return <HardMonthCard key={inst.id} instalment={inst} />;
            }

            // For paid slips, find previous paid instalment for F2 comparisons
            const paidList = sortedInstalments.filter((i) => i.status === "paid");
            const paidIndex = paidList.findIndex((i) => i.id === inst.id);
            const previousPaid =
              paidIndex < paidList.length - 1 ? paidList[paidIndex + 1] : null;

            return (
              <SlipCard
                key={inst.id}
                instalment={inst}
                previousPaid={previousPaid}
                onOpenMemoryModal={(targetInst) =>
                  setActiveInstalmentForMemory(targetInst)
                }
              />
            );
          })}
        </div>

        {/* Break / Stop Flow Trigger */}
        <div className="pt-4 pb-2 text-center">
          <Link
            href="/break"
            className="inline-block text-xs text-gray-500 hover:text-gray-800 underline font-medium py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Need to take a break or stop this SIP?
          </Link>
        </div>
      </main>

      {/* Memory Add/Edit Modal */}
      {activeInstalmentForMemory && (
        <MemoryModal
          instalment={activeInstalmentForMemory}
          isOpen={!!activeInstalmentForMemory}
          onClose={() => setActiveInstalmentForMemory(null)}
          onSave={(updatedMemory) => {
            updateMemory(activeInstalmentForMemory.id, updatedMemory);
          }}
        />
      )}

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
