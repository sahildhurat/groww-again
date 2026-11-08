"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useDemo } from "@/lib/demo-context";
import passbookSeed from "@/data/passbook-seed.json";
import {
  confirmedTotals,
  lastFullyConfirmed,
  latestInstalment,
  instalmentState,
} from "@/lib/passbook";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/format";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  XCircle,
  RotateCcw,
  MinusCircle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Camera,
  Mic,
  Quote,
} from "lucide-react";
import { monthKey } from "@/lib/flow";
import { ReasonCard } from "@/components/keepsake/reason-card";
import { useKeepsakeTick } from "@/components/keepsake/use-keepsake";
import { listMemories, type MemoryRecord } from "@/lib/keepsake";

export default function PassbookPage() {
  const { version, scenario } = useDemo();

  // Load passbook data for active scenario
  const scenarioData = useMemo(() => {
    const scenarios = (passbookSeed as any).scenarios;
    return (scenarios[scenario] || scenarios.running) as {
      sip: PassbookSip;
      instalments: Instalment[];
    };
  }, [scenario]);

  const { sip, instalments } = scenarioData;

  // Version B: memories kept on this device, shown as small marks on their months
  const keepsakeTick = useKeepsakeTick();
  const [memories, setMemories] = useState<Record<string, MemoryRecord>>({});
  useEffect(() => {
    if (version !== "B") {
      setMemories({});
      return;
    }
    listMemories()
      .then((list) => setMemories(Object.fromEntries(list.map((m) => [m.month, m]))))
      .catch(() => setMemories({}));
  }, [version, keepsakeTick]);

  // Derived totals and stats (§4)
  const totals = useMemo(() => confirmedTotals(instalments), [instalments]);
  const lastConfirmed = useMemo(
    () => lastFullyConfirmed(instalments),
    [instalments]
  );
  const latest = useMemo(
    () => latestInstalment(instalments),
    [instalments]
  );
  const latestState = latest ? instalmentState(latest) : null;
  const latestAsOf =
    latest && latestState === "unknown"
      ? latest.events.find((e) => e.status === "unknown")?.as_of ?? null
      : null;

  // Newest first
  const sortedInstalments = useMemo(() => {
    return [...instalments].sort((a, b) =>
      b.due_date.localeCompare(a.due_date)
    );
  }, [instalments]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP Passbook" showBack backHref="/" />
      <DemoBanner />

      {/* Mandatory Investment Advice Notice (§2.6) */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 text-center text-xs text-emerald-800 font-medium">
        Information about your own SIP and the rules only. Not investment advice.
      </div>

      <main className="flex-1 p-4 space-y-4">
        {/* Cover (A2) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3.5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sip.status === "active"
                        ? "bg-emerald-600"
                        : sip.status === "stopped"
                        ? "bg-gray-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="capitalize">{sip.status}</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  ₹{sip.amount.toLocaleString("en-IN")}/mo on {sip.day_of_month}th
                </span>
              </div>
              <h1 className="text-base font-bold text-gray-900 mt-1">{sip.fund_label}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Started {formatDate(sip.start_date)}
              </p>
            </div>
          </div>

          {/* Stopped Stamp (C3) - derived from sip.status_changed_at */}
          {sip.status === "stopped" && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-800 uppercase tracking-wide">
                <span>
                  {sip.status_changed_at
                    ? `Stopped on ${formatDate(sip.status_changed_at)}`
                    : "Stopped"}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Stopping ends future instalments. It does not sell your units:
                your {totals.units.toFixed(3)} units stay in your folio. To
                invest again you start a new SIP.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                <Link href="/options#restart-later" className="text-xs font-medium text-emerald-800 underline">
                  How restarting works
                </Link>
                <Link
                  href={`/ask?q=${encodeURIComponent("Can I restart after stopping?")}`}
                  className="text-xs font-medium text-emerald-800 underline"
                >
                  Ask Sensecheck about restarting
                </Link>
              </div>
            </div>
          )}

          {/* Version B: why I started (own words, text or voice) */}
          {version === "B" && (
            <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2.5 empty:hidden" data-testid="personal-layer">
              <ReasonCard folded={sip.status !== "active" || latestState === "failed"} />
            </div>
          )}

          {/* Last fully confirmed & Summary stats */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-600">
              <span className="text-gray-400">Last fully confirmed instalment: </span>
              <strong className="text-gray-900">
                {lastConfirmed ? formatDate(lastConfirmed.due_date) : "None"}
              </strong>
            </p>

            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 pt-1" data-testid="what-you-own">
              What you own
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                  Units in your name
                </span>
                <span className="text-base font-bold text-gray-900">
                  {totals.units.toFixed(3)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  ({totals.count} instalments confirmed)
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                  Amount put in
                </span>
                <span className="text-base font-bold text-gray-900">
                  ₹{totals.amount_put_in.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  (confirmed instalments only)
                </span>
              </div>
            </div>

            {/* Calm one-liner about the latest instalment; R42: tappable, opens that entry */}
            {latest && latestState && latestState !== "allotted" && latestState !== "skipped" && (
              <Link
                href={`/passbook/${latest.id}`}
                data-testid="latest-line"
                className={`flex items-start justify-between text-xs rounded-lg p-2.5 border ${
                  latestState === "failed"
                    ? "text-amber-800 bg-amber-50 border-amber-200"
                    : latestState === "unknown"
                    ? "text-gray-800 bg-gray-100 border-gray-200"
                    : "text-blue-800 bg-blue-50 border-blue-200"
                }`}
              >
                <span>
                  {latestState === "failed" &&
                    `The latest instalment on ${formatDate(latest.due_date)} was not debited. Nothing was taken from your account.`}
                  {latestState === "refunded" &&
                    `The latest instalment on ${formatDate(latest.due_date)} was refunded to your bank account.`}
                  {latestState === "in_progress" &&
                    `The latest instalment on ${formatDate(latest.due_date)} was debited. Units are not confirmed yet.`}
                  {latestState === "unknown" &&
                    `We can't confirm the latest status right now${
                      latestAsOf ? ` (as of ${formatDateTime(latestAsOf)})` : ""
                    }. Check your CAS or contact support.`}
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" />
              </Link>
            )}
          </div>
        </section>

        {/* Entries List (A1) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Every month ({sortedInstalments.length})
            </h2>
            <span className="text-[11px] text-gray-400">Newest first</span>
          </div>

          <div className="space-y-2.5">
            {sortedInstalments.map((inst) => {
              const state = instalmentState(inst);
              const debit = inst.events.find((e) => e.type === "debit");
              const order = inst.events.find((e) => e.type === "order");
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
                sourceText = `Returned by your bank · ${formatDateTime(debit.effective_at)}`;
              } else if (state === "refunded" && refund) {
                sourceText = `Refund confirmed by your bank · ${formatDateTime(refund.effective_at)}`;
              } else if (state === "unknown" && allotment) {
                sourceText = `Status as of ${formatDateTime(allotment.as_of)}`;
              }

              return (
                <div
                  key={inst.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all"
                >
                <Link
                  href={`/passbook/${inst.id}`}
                  className="block p-4 group"
                >
                  <div className="flex items-start justify-between border-b border-gray-100 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        {formatDate(inst.due_date)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ₹{inst.amount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {memory && (
                        <span
                          className="inline-flex items-center space-x-1 text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5"
                          data-testid="memory-indicator"
                          aria-label={`Your memory for ${formatMonthYear(monthStr)}`}
                        >
                          {memory.photo && <Camera className="w-3 h-3" />}
                          {memory.voice && <Mic className="w-3 h-3" />}
                          {memory.text && !memory.photo && !memory.voice && <Quote className="w-3 h-3" />}
                          <span>Memory</span>
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Stamps Row - No doubled tick/cross symbols */}
                  <div className="pt-2.5 space-y-1.5">
                    {state === "skipped" ? (
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                        <MinusCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span>— Skipped by investor</span>
                      </div>
                    ) : (
                      <>
                        {/* 1. Debit Stamp */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Bank debit:</span>
                          {debit?.status === "confirmed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Debited</span>
                            </span>
                          )}
                          {debit?.status === "failed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-amber-800">
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Not debited</span>
                            </span>
                          )}
                          {!debit && (
                            <span className="text-gray-400">— Not attempted</span>
                          )}
                        </div>

                        {/* 2. Order Stamp */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Order placed:</span>
                          {order?.status === "confirmed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Order placed</span>
                            </span>
                          )}
                          {order?.status === "failed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-amber-800">
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Order failed</span>
                            </span>
                          )}
                          {!order && (
                            <span className="text-gray-400">— Not attempted</span>
                          )}
                        </div>

                        {/* 3. Units Stamp */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Units allotted:</span>
                          {allotment?.status === "confirmed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {inst.units ? `${inst.units.toFixed(3)} units` : "Allotted"}
                              </span>
                            </span>
                          )}
                          {allotment?.status === "pending" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-blue-800">
                              <Circle className="w-3.5 h-3.5 text-blue-600" />
                              <span>Units not confirmed yet</span>
                            </span>
                          )}
                          {allotment?.status === "unknown" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-gray-700">
                              <HelpCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              <span>
                                Can&apos;t confirm right now
                                {allotment.as_of
                                  ? ` (as of ${formatDateTime(allotment.as_of)})`
                                  : ""}
                              </span>
                            </span>
                          )}
                          {refund?.status === "confirmed" && (
                            <span className="inline-flex items-center space-x-1 font-medium text-purple-800">
                              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                              <span>Refunded</span>
                            </span>
                          )}
                          {!allotment && !refund && (
                            <span className="text-gray-400">— Not attempted</span>
                          )}
                        </div>
                      </>
                    )}

                    {sourceText && (
                      <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                        {sourceText}
                      </p>
                    )}
                  </div>
                </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* CAS Notice (A3) */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-900">
                Official Record Notice
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your official record is your Consolidated Account Statement (CAS), from MF Central, CAMS or KFintech. This passbook is a supplementary view.
              </p>
              <div className="pt-1">
                <a
                  href="https://www.mfcentral.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  <span>Request CAS on MF Central</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
