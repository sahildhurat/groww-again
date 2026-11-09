"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { usePassbook } from "@/components/passbook/use-passbook";
import { confirmedTotals, lastFullyConfirmed, valueAt } from "@/lib/passbook";
import { formatDate } from "@/lib/format";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { MonthList } from "@/components/passbook/month-list";

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export default function PassbookPage() {
  const { version, sip, instalments, memories } = usePassbook();

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP Passbook" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 px-4 pt-3 pb-4 space-y-3">
        {/* Cover (A2): the passbook itself */}
        <section
          className="relative overflow-hidden rounded-[28px] bg-ink text-white px-5 py-4 shadow-[0_18px_40px_-24px_rgba(20,33,61,0.9)]"
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
            <p className="mt-2.5 text-[13px] text-white/70" data-testid="what-you-own">Current value</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-3">
              <span className="text-[34px] leading-none font-bold tracking-[-0.03em]" data-testid="current-value">
                ₹{currentValue.toLocaleString("en-IN")}
              </span>
              <span className="text-[14px] font-semibold text-white/90 whitespace-nowrap" data-testid="total-returns">
                <span className="sr-only">Total returns </span>
                {signed(gain, rupees(gain))} ({signed(gain, `${Math.abs(gainPct).toFixed(2)}%`)})
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/55">
              At NAV ₹{sip.latest_nav.toFixed(2)}, {formatDate(sip.latest_nav_date)}. Value moves with the market; your
              units don&apos;t.
            </p>

            <dl className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/[0.08] px-3 py-1.5">
                <dt className="text-[11px] text-white/65">Invested</dt>
                <dd className="text-[17px] font-bold">₹{totals.amount_put_in.toLocaleString("en-IN")}</dd>
                {/* User tests, 9 Nov (P04): say what "Invested" counts, so a month still on the way isn't read into it */}
                <dd className="text-[11px] text-white/65" data-testid="invested-count">
                  {totals.count} confirmed instalments
                </dd>
              </div>
              <div className="rounded-2xl bg-white/[0.08] px-3 py-1.5">
                <dt className="text-[11px] text-white/65">Units in your name</dt>
                <dd className="text-[17px] font-bold">{totals.units.toFixed(3)}</dd>
              </div>
            </dl>

            <div className="mt-2.5 pt-2 border-t border-white/15 text-[12px] text-white/60 leading-relaxed">
              <p>
                <span className="text-white font-semibold">{sip.fund_label}</span> · started {formatDate(sip.start_date)}
              </p>
              <p>
                <span>Last fully confirmed instalment: </span>
                <strong className="font-semibold text-white">{lastConfirmed ? formatDate(lastConfirmed.due_date) : "None"}</strong>
              </p>
            </div>
          </div>
        </section>

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

        {/* Owner, 9 Nov (08:50): every month on the passbook itself, newest first, in one scroll. Each card is the
            delivery tracker for that month and opens its page; back returns to the same place in the list. */}
        <MonthList sip={sip} instalments={instalments} version={version} memories={memories} />

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
