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
  valueAt,
} from "@/lib/passbook";
import { MemoryCard } from "@/components/keepsake/memory-card";
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
  Plus,
} from "lucide-react";
import { monthKey } from "@/lib/flow";
import { ReasonCard } from "@/components/keepsake/reason-card";
import { MoneyTrail } from "@/components/ui/money-trail";
import { UnitsGrowth } from "@/components/ui/units-growth";
import { GoalPieces } from "@/components/keepsake/goal-pieces";
import { useKeepsakeTick } from "@/components/keepsake/use-keepsake";
import { listMemories, type MemoryRecord } from "@/lib/keepsake";

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

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
  // Owner, 8 Nov: show invested vs current value, and the gain or loss with its sign, even when negative.
  const currentValue = valueAt(totals, sip.latest_nav);
  const gain = currentValue - totals.amount_put_in;
  const gainPct = totals.amount_put_in > 0 ? (gain / totals.amount_put_in) * 100 : 0;
  const rupees = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
  const signed = (n: number, text: string) => (n < 0 ? `−${text}` : n > 0 ? `+${text}` : text);
  const [openMemory, setOpenMemory] = useState<string | null>(null);
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
      <p className="px-4 pt-3 -mb-1 text-[12px] text-gray-500">Information about your own SIP and the rules only. Not investment advice.</p>

      <main className="flex-1 p-4 space-y-4">
        {/* Cover (A2): the passbook itself */}
        <section
          className="relative overflow-hidden rounded-[28px] bg-ink text-white p-5 shadow-[0_18px_40px_-24px_rgba(20,33,61,0.9)]"
          data-testid="passbook-cover"
        >
          {/* passbook ruling */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 27px, #ffffff 27px 28px)" }}
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/90 bg-white/10 px-2.5 py-1 rounded-full">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    sip.status === "active" ? "bg-emerald-300" : sip.status === "stopped" ? "bg-gray-300" : "bg-amber-300"
                  }`}
                />
                <span className="capitalize">{sip.status}</span>
              </span>
              <span className="text-[12px] text-white/60">
                ₹{sip.amount.toLocaleString("en-IN")} a month, on the {ordinal(sip.day_of_month)}
              </span>
            </div>

            {/* Owner, 8 Nov: what you own first, in bold */}
            <h2 className="mt-4 text-[13px] text-white/70" data-testid="what-you-own">
              What you own
            </h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[40px] leading-none font-bold tracking-[-0.03em]">{totals.units.toFixed(3)}</span>
              <span className="text-[15px] font-semibold text-white/80">units</span>
            </div>
            <p className="mt-1.5 text-[12px] text-white/60">in your name, from {totals.count} confirmed instalments</p>

            <div className="mt-4 grid grid-cols-2 gap-3" data-testid="value-grid">
              <div className="rounded-2xl bg-white/[0.08] px-3 py-2.5">
                <span className="block text-[12px] text-white/65">Invested</span>
                <span className="block text-[20px] font-bold mt-0.5">₹{totals.amount_put_in.toLocaleString("en-IN")}</span>
                <span className="block text-[11px] text-white/50 mt-0.5">confirmed instalments</span>
              </div>
              <div className="rounded-2xl bg-white/[0.08] px-3 py-2.5">
                <span className="block text-[12px] text-white/65">Current value</span>
                <span className="block text-[20px] font-bold mt-0.5" data-testid="current-value">
                  ₹{currentValue.toLocaleString("en-IN")}
                </span>
                <span className="block text-[11px] text-white/50 mt-0.5">
                  at NAV ₹{sip.latest_nav.toFixed(2)}, {formatDate(sip.latest_nav_date)}
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between rounded-2xl bg-white/[0.05] px-3 py-2" data-testid="total-returns">
              <span className="text-[12px] text-white/65">Total returns</span>
              <span className="text-[15px] font-bold">
                {signed(gain, rupees(gain))} ({signed(gain, `${Math.abs(gainPct).toFixed(2)}%`)})
              </span>
            </div>
            <p className="mt-2 text-[12px] text-white/60 leading-relaxed">
              The value moves with the market. The number of units you own stays the same.
            </p>

            <div className="mt-4 pt-4 border-t border-white/15">
              <p className="text-[15px] font-semibold leading-snug">{sip.fund_label}</p>
              <p className="text-[13px] text-white/60 mt-0.5">Started {formatDate(sip.start_date)}</p>
              {sip.payment_route && (
                <p className="text-[13px] text-white/60" data-testid="payment-route">
                  Paid through {sip.payment_route}
                </p>
              )}
              <p className="mt-2 text-[12px] text-white/60">
                <span>Last fully confirmed instalment: </span>
                <strong className="font-semibold text-white">
                  {lastConfirmed ? formatDate(lastConfirmed.due_date) : "None"}
                </strong>
              </p>
            </div>
          </div>
        </section>

        {/* Calm one-liner about the latest instalment; R42: tappable, opens that entry */}
        {latest && latestState && latestState !== "allotted" && latestState !== "skipped" && (
          <Link
            href={`/passbook/${latest.id}`}
            data-testid="latest-line"
            className={`flex items-center justify-between text-[13px] leading-snug rounded-2xl px-4 py-3 border ${
              latestState === "failed"
                ? "text-amber-900 bg-amber-50 border-amber-200"
                : latestState === "unknown"
                ? "text-gray-800 bg-white border-gray-200"
                : "text-blue-900 bg-blue-50 border-blue-200"
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

        {/* Stopped Stamp (C3) - derived from sip.status_changed_at */}
        {sip.status === "stopped" && (
          <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-1.5">
            <p className="text-[14px] font-semibold text-gray-900">
              {sip.status_changed_at ? `Stopped on ${formatDate(sip.status_changed_at)}` : "Stopped"}
            </p>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              Stopping ends future instalments. It does not sell your units:
              your {totals.units.toFixed(3)} units stay in your folio. To
              invest again you start a new SIP.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
              <Link href="/options#restart-later" className="text-[13px] font-medium text-emerald-800 underline">
                How restarting works
              </Link>
              <Link
                href={`/ask?q=${encodeURIComponent("Can I restart after stopping?")}`}
                className="text-[13px] font-medium text-emerald-800 underline"
              >
                Ask Sensecheck about restarting
              </Link>
            </div>
          </div>
        )}

        {/* The asset view: version A sees units growing month by month; version B sees their own goal, piece by piece
            (the A/B question: plain numbers against their own goal) */}
        {version === "B" ? (
          <GoalPieces instalments={instalments} sip={sip} memories={memories} />
        ) : (
          <UnitsGrowth instalments={instalments} />
        )}

        {/* Version B: why I started (own words, text or voice) */}
        {version === "B" && (
          <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-2xl space-y-2.5 empty:hidden" data-testid="personal-layer">
            <ReasonCard folded={sip.status !== "active" || latestState === "failed"} editable={false} />
          </div>
        )}

        {/* Entries List (A1) */}
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
                sourceText = `Returned by your bank · ${formatDateTime(debit.effective_at)}`;
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
                  <span>Open MF Central to get your CAS</span>
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
