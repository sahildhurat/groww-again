"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { usePassbook } from "@/components/passbook/use-passbook";
import { confirmedTotals, lastFullyConfirmed, latestInstalment, instalmentState, valueAt } from "@/lib/passbook";
import { formatDate, formatDateTime } from "@/lib/format";
import { ChevronRight, ExternalLink, ShieldCheck } from "lucide-react";
import { ReasonCard } from "@/components/keepsake/reason-card";
import { ReminderInvite } from "@/components/keepsake/reminder-invite";

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export default function PassbookPage() {
  const { version, sip, instalments } = usePassbook();

  // Derived totals and stats (§4)
  const totals = useMemo(() => confirmedTotals(instalments), [instalments]);
  // Owner, 8 Nov: show invested vs current value, and the gain or loss with its sign, even when negative.
  const currentValue = valueAt(totals, sip.latest_nav);
  const gain = currentValue - totals.amount_put_in;
  const gainPct = totals.amount_put_in > 0 ? (gain / totals.amount_put_in) * 100 : 0;
  const rupees = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
  const signed = (n: number, text: string) => (n < 0 ? `−${text}` : n > 0 ? `+${text}` : text);
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

            {/* Owner, 9 Nov: current value is the headline figure */}
            <p className="mt-3 text-[13px] text-white/70" data-testid="what-you-own">Current value</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-3">
              <span className="text-[38px] leading-none font-bold tracking-[-0.03em]" data-testid="current-value">
                ₹{currentValue.toLocaleString("en-IN")}
              </span>
              <span className="text-[14px] font-semibold text-white/90 whitespace-nowrap" data-testid="total-returns">
                <span className="sr-only">Total returns </span>
                {signed(gain, rupees(gain))} ({signed(gain, `${Math.abs(gainPct).toFixed(2)}%`)})
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/55">
              at NAV ₹{sip.latest_nav.toFixed(2)}, {formatDate(sip.latest_nav_date)}. The value moves with the market; the
              number of units you own stays the same.
            </p>

            <dl className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/[0.08] px-3 py-2">
                <dt className="text-[11px] text-white/65">Invested</dt>
                <dd className="text-[17px] font-bold">₹{totals.amount_put_in.toLocaleString("en-IN")}</dd>
              </div>
              <div className="rounded-2xl bg-white/[0.08] px-3 py-2">
                <dt className="text-[11px] text-white/65">Units in your name</dt>
                <dd className="text-[17px] font-bold">{totals.units.toFixed(3)}</dd>
              </div>
            </dl>

            <div className="mt-3 pt-2.5 border-t border-white/15 text-[12px] text-white/60 leading-relaxed">
              <p>
                <span className="text-white font-semibold">{sip.fund_label}</span> · started {formatDate(sip.start_date)}
              </p>
              {sip.payment_route && <p data-testid="payment-route">Paid through {sip.payment_route}</p>}
              <p>
                <span>Last fully confirmed instalment: </span>
                <strong className="font-semibold text-white">{lastConfirmed ? formatDate(lastConfirmed.due_date) : "None"}</strong>
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

        {/* Owner, 9 Nov: the two views of the passbook, one tap away, never below a long scroll */}
        <nav className="grid grid-cols-2 gap-2.5" aria-label="Passbook views">
          <Link href="/passbook/months" className="rounded-2xl bg-white border border-gray-200/70 p-3.5 hover:border-gray-300" data-testid="tile-months">
            <span className="flex items-center justify-between text-[14px] font-semibold text-gray-900">
              Every month
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden />
            </span>
            <span className="block text-[12px] text-gray-500 mt-0.5">
              {instalments.length} months, from your bank to your units
            </span>
          </Link>
          <Link href="/passbook/goal" className="rounded-2xl bg-white border border-gray-200/70 p-3.5 hover:border-gray-300" data-testid="tile-goal">
            <span className="flex items-center justify-between text-[14px] font-semibold text-gray-900">
              {version === "B" ? "Piece by piece" : "Units by month"}
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden />
            </span>
            <span className="block text-[12px] text-gray-500 mt-0.5">
              {version === "B"
                ? `${Math.min(totals.count, 12)} of 12 pieces of your goal`
                : `${totals.units.toFixed(3)} units so far`}
            </span>
          </Link>
        </nav>

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
              <Link href="/start" className="text-[13px] font-medium text-emerald-800 underline" data-testid="stopped-start-link">
                The Start SIP screen (demo)
              </Link>
            </div>
          </div>
        )}

        {/* Version B: why I started (own words, text or voice) */}
        {version === "B" && (
          <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-2xl space-y-2.5 empty:hidden" data-testid="personal-layer">
            <ReasonCard folded={sip.status !== "active" || latestState === "failed"} editable={false} />
            <ReminderInvite hidden={sip.status !== "active" || latestState === "failed"} />
          </div>
        )}

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
