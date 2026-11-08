"use client";

// Owner, 8 Nov 2026: a mock of Groww's "Start SIP" screen. In version B it carries the optional "Why are you starting
// this SIP?" (a line or a voice note), asked at the moment the motivation is fresh; the passbook shows it back later.
// Nothing is created here: it is a demo screen, and the reason stays on this device.
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { ReasonCard } from "@/components/keepsake/reason-card";
import { GoalPhoto } from "@/components/keepsake/goal-photo";
import { useDemo } from "@/lib/demo-context";
import passbookSeed from "@/data/passbook-seed.json";
import { formatDate } from "@/lib/format";
import type { PassbookSip } from "@/lib/passbook-types";
import { CalendarDays, Repeat, Wallet, Info } from "lucide-react";

function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

export default function StartSipPage() {
  const { version } = useDemo();
  const sip = useMemo(() => (passbookSeed as any).scenarios.running.sip as PassbookSip, []);
  const [started, setStarted] = useState(false);

  const rows = [
    { icon: Wallet, label: "Monthly amount", value: `₹${sip.amount.toLocaleString("en-IN")}` },
    { icon: CalendarDays, label: "SIP date", value: `${ordinal(sip.day_of_month)} of every month` },
    { icon: CalendarDays, label: "First instalment", value: formatDate(sip.start_date) },
    { icon: Repeat, label: "Pay with", value: sip.payment_route ?? "Groww AutoPay" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Start SIP" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        <p className="text-[12px] text-gray-500" data-testid="start-mock-note">
          This is how the screen looks on the day you set up the SIP. Nothing is created here.
        </p>

        <section className="bg-white rounded-3xl border border-gray-200/70 p-5 space-y-4">
          <div>
            <p className="text-[12px] text-gray-500">Monthly SIP</p>
            <h1 className="text-[17px] font-semibold text-gray-900 leading-snug mt-0.5">{sip.fund_label}</h1>
          </div>
          <dl className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-2.5">
                <dt className="flex items-center gap-2 text-[13px] text-gray-600">
                  <r.icon className="w-4 h-4 text-gray-400" aria-hidden />
                  {r.label}
                </dt>
                <dd className="text-[13px] font-semibold text-gray-900">{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Your bank debits ₹{sip.amount.toLocaleString("en-IN")} on the SIP date. With Groww AutoPay, units are
            expected two working days after the SIP date (T+2). You can follow every month in your SIP Passbook.
          </p>
        </section>

        {version === "B" && (
          <section className="bg-violet-50 border border-violet-100 rounded-3xl p-5 space-y-2" data-testid="start-reason">
            <h2 className="text-[15px] font-semibold text-gray-900">Why are you starting this SIP?</h2>
            <ReasonCard
              folded={false}
              prompt="Optional. Write a line or record a voice note in your own words. It will be in your passbook for the months when you need it."
            />
            <div className="pt-3 mt-1 border-t border-violet-100">
              <GoalPhoto />
            </div>
          </section>
        )}

        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold"
          >
            Start SIP
          </button>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2" role="status">
            <p className="flex items-start gap-2 text-[13px] text-blue-950">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" aria-hidden />
              <span>
                In the real app this starts the SIP. In this demo nothing is created
                {version === "B" ? "; your reason is saved on this device and shown in your passbook." : "."}
              </span>
            </p>
            <Link href="/passbook" className="inline-block text-[13px] font-semibold text-emerald-800 underline">
              Open my passbook
            </Link>
          </div>
        )}
      </main>

      <FooterNotice />
    </div>
  );
}
