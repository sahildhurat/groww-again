"use client";

// Owner, 9 Nov 2026: Home is the binding line and two doors: the passbook and Sensecheck. No task list, no Start SIP demo.
import React from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { ArrowRight, MessageCircle } from "lucide-react";
import { MoneyTrail } from "@/components/ui/money-trail";
import { usePassbook } from "@/components/passbook/use-passbook";
import { latestInstalment } from "@/lib/passbook";
import { formatDate } from "@/lib/format";

export default function HomePage() {
  const { sip, instalments } = usePassbook();
  const latest = latestInstalment(instalments);
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP Passbook" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        <section className="bg-white rounded-3xl p-5 border border-gray-200/70 space-y-3">
          <h1 className="text-[19px] font-bold leading-snug tracking-[-0.01em] text-gray-900">
            Your bank&apos;s SMS shows the money leaving. This shows what it became.
          </h1>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            UPI moves money in seconds; a SIP takes days. Track every instalment like an online order: picked up from your
            bank, handed to the fund, delivered to your name as units. Sensecheck explains any step in plain words. Not
            investment advice.
          </p>
          <div className="pt-1 space-y-2">
            <Link
              href="/passbook"
              className="flex items-center justify-center w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] transition-colors"
            >
              <span>Open my passbook</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <Link
              href="/ask"
              className="flex items-center justify-center w-full py-3 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-[13px] transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span>Ask Sensecheck a question</span>
            </Link>

          </div>
        </section>

        {/* 9 Nov (Claude): the method in one glance, below the two doors (display only; the doors stay the only links).
            The same tracker the passbook shows for the latest instalment, from the bank SMS to units in your name. */}
        {latest && !latest.skipped && latest.events.length > 0 && (
          <section className="bg-white rounded-3xl p-5 border border-gray-200/70 space-y-3" data-testid="home-tracker">
            <h2 className="text-[14px] font-semibold text-gray-900">
              Your {formatDate(latest.due_date)} instalment, tracked{" "}
              <span className="font-normal text-gray-500">· ₹{latest.amount.toLocaleString("en-IN")}</span>
            </h2>
            <MoneyTrail inst={latest} paymentRoute={sip.payment_route} />
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Every month in the passbook has this tracker, each step with its source and time.
            </p>
          </section>
        )}
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
