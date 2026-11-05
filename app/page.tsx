"use client";

import React from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary } from "@/lib/seed";
import {
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  HelpCircle,
  Award,
} from "lucide-react";

export default function HomePage() {
  const { sip, instalments } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const tasks = [
    {
      num: 1,
      title: "Your September instalment did not go through. Find out why and what to do.",
      href: "/locker#inst-2026-09-05",
      badge: "Failed slot",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      num: 2,
      title: "You need to stop for a while. Tell the locker why and set a date to return.",
      href: "/break",
      badge: "Break flow",
      icon: Calendar,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      num: 3,
      title: "Add a memory to this month and read what your money did.",
      href: "/locker#inst-2026-10-05",
      badge: "Memory",
      icon: Sparkles,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      num: 4,
      title: "Ask how many units you bought in the month you moved into the flat.",
      href: "/ask?q=How%20many%20units%20did%20I%20buy%20in%20the%20month%20I%20moved%20into%20the%20flat%3F",
      badge: "Ask",
      icon: HelpCircle,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      num: 5,
      title: "Print your certificate.",
      href: "/certificate",
      badge: "Certificate",
      icon: Award,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP locker (concept)" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        {/* Try a Task Panel */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Mentor &amp; Tester Guide
              </h2>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                Try a task
              </p>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              5 tasks
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link
                  key={task.num}
                  href={task.href}
                  className="flex items-start p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all group"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 border ${task.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-medium text-gray-800 leading-snug group-hover:text-emerald-700">
                      {task.title}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0 self-center" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* My SIPs Section */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-gray-900">My SIPs</h2>
            <span className="text-xs text-gray-500 font-medium">1 active</span>
          </div>

          <Link
            href="/locker"
            className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mb-1.5">
                  Monthly &bull; ₹{sip.amount.toLocaleString("en-IN")} on 5th
                </span>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700">
                  {sip.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sip.fund_label}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-gray-400">Total units</p>
                <p className="text-base font-bold text-gray-900">
                  {summary.totalUnits.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                <span className="text-gray-400">Invested: </span>
                <span className="font-semibold text-gray-800">
                  ₹{summary.totalInvested.toLocaleString("en-IN")}
                </span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span className="text-gray-400">Value (illustrative): </span>
                <span className="font-semibold text-gray-800">
                  ₹{summary.currentValue.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-emerald-600 font-medium inline-flex items-center group-hover:translate-x-0.5 transition-transform">
                Open locker
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>

            {/* Dedication Banner */}
            <div className="mt-2.5 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600 border border-gray-100 italic flex items-center space-x-1.5">
              <span>Dedication: &ldquo;{sip.dedication}&rdquo;</span>
            </div>
          </Link>
        </section>

        {/* Quick Highlights / Locker Overview */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Locker Status
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">
                {summary.paidCount}
              </p>
              <p className="text-[11px] text-emerald-800 font-medium">
                Paid slips
              </p>
            </div>
            <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-100">
              <p className="text-lg font-bold text-amber-700">
                {summary.failedCount}
              </p>
              <p className="text-[11px] text-amber-800 font-medium">
                Empty slots
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200">
              <p className="text-lg font-bold text-gray-700">
                {summary.skippedCount}
              </p>
              <p className="text-[11px] text-gray-600 font-medium">
                Hard months
              </p>
            </div>
          </div>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
