"use client";

// Owner, 9 Nov 2026: a demo of Groww's "Start SIP" screen. Pick a sample fund, an amount and a date, and (version B)
// keep a reminder of why you're starting: a photo, a voice note or a line. The photo becomes the picture the passbook
// builds piece by piece. Nothing is created here; the passbook keeps showing the sample SIP.
// Compliance: sample funds only, in alphabetical order, no returns, ratings or "popular" labels, nothing preselected as
// a pick (no fund advice); no urgency; the reminder is optional and stays on this device.
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { StartReminder } from "@/components/keepsake/start-reminder";
import { useDemo } from "@/lib/demo-context";
import { SAMPLE_FUNDS } from "@/lib/sample-funds";
import passbookSeed from "@/data/passbook-seed.json";
import type { PassbookSip } from "@/lib/passbook-types";
import { Info } from "lucide-react";

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export default function StartSipPage() {
  const { version } = useDemo();
  const sip = useMemo(() => (passbookSeed as any).scenarios.running.sip as PassbookSip, []);
  const [fund, setFund] = useState("");
  const [amount, setAmount] = useState(String(sip.amount));
  const [day, setDay] = useState(String(sip.day_of_month));
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amt = Number(amount);
  const start = () => {
    if (!fund) return setError("Choose a fund first.");
    if (!Number.isFinite(amt) || amt < 100) return setError("Enter an amount of ₹100 or more.");
    setError(null);
    setStarted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Start SIP" showBack backHref="/passbook" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        <p className="text-[12px] text-gray-500" data-testid="start-mock-note">
          A demo of the screen where you set up a SIP. Nothing is created and no money moves.
        </p>

        <section className="bg-white rounded-3xl border border-gray-200/70 p-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="fund" className="text-[13px] font-semibold text-gray-900 block">
              Fund
            </label>
            <select
              id="fund"
              value={fund}
              onChange={(e) => { setFund(e.target.value); setStarted(false); setError(null); }}
              className="w-full text-[13px] p-2.5 rounded-xl border border-gray-200 bg-white"
            >
              <option value="">Choose a fund</option>
              {SAMPLE_FUNDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500" data-testid="fund-note">
              Sample funds for this demo, in alphabetical order. Not a recommendation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="amount" className="text-[13px] font-semibold text-gray-900 block">
                Monthly amount (₹)
              </label>
              <input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => { setAmount(e.target.value.replace(/[^\d]/g, "").slice(0, 7)); setStarted(false); setError(null); }}
                className="w-full text-[13px] p-2.5 rounded-xl border border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sip-day" className="text-[13px] font-semibold text-gray-900 block">
                SIP date (monthly)
              </label>
              <select
                id="sip-day"
                value={day}
                onChange={(e) => { setDay(e.target.value); setStarted(false); }}
                className="w-full text-[13px] p-2.5 rounded-xl border border-gray-200 bg-white"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {ordinal(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5 border-t border-gray-100 text-[13px]">
            <span className="text-gray-600">Pay with</span>
            <span className="font-semibold text-gray-900">Groww AutoPay</span>
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Your bank debits the amount on the SIP date. With Groww AutoPay, units are expected two working days after the
            SIP date (T+2). Your SIP Passbook shows every month, from the debit to the units in your name.
          </p>
        </section>

        {version === "B" && <StartReminder />}

        {error && <p className="text-[12px] text-amber-800" role="alert" data-testid="start-error">{error}</p>}

        {!started ? (
          <button
            type="button"
            onClick={start}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold"
          >
            Start SIP
          </button>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2" role="status" data-testid="start-done">
            <p className="flex items-start gap-2 text-[13px] text-blue-950 leading-relaxed">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden />
              <span>
                In the real app this starts a ₹{amt.toLocaleString("en-IN")} SIP in {fund} on the {ordinal(Number(day))} of
                every month. In this demo nothing is created, and the passbook keeps showing the sample SIP (₹
                {sip.amount.toLocaleString("en-IN")} in {sip.fund_label}).
                {version === "B" ? " Your reminder is saved on this phone: it shows on your passbook, and your photo is the picture you build piece by piece." : ""}
              </span>
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
              <Link href="/passbook" className="text-[13px] font-semibold text-emerald-800 underline">
                Open my passbook
              </Link>
              {version === "B" && (
                <Link href="/passbook/goal" className="text-[13px] font-semibold text-emerald-800 underline">
                  See Piece by piece
                </Link>
              )}
            </div>
          </div>
        )}
      </main>

      <FooterNotice />
    </div>
  );
}
