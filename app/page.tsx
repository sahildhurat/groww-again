"use client";

import React from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { ChevronRight, ArrowRight, Clock, AlertTriangle, SlidersHorizontal, Camera, MessageCircle } from "lucide-react";
import { useDemo } from "@/lib/demo-context";

export default function HomePage() {
  const { version } = useDemo();
  const tasks = [
    {
      num: 1,
      title: "The November instalment was debited but units are not visible yet. Find out why.",
      href: "/passbook/inst-2026-11-05",
      badge: "Task 1",
      icon: Clock,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      num: 2,
      title: "The May instalment failed and September was refunded. See what happened to the money.",
      href: "/passbook/inst-2026-05-05",
      badge: "Task 2",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      num: 3,
      title: "Your situation changed. See what you can do next.",
      href: "/options",
      badge: "Task 3",
      icon: SlidersHorizontal,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    ...(version === "B"
      ? [
          {
            num: 4,
            title: "Version B: keep a photo or voice note for October, then ask a friend about the failed May instalment.",
            href: "/passbook/inst-2026-10-05",
            badge: "Task 4",
            icon: Camera,
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP Passbook (concept)" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        {/* Intro per SPEC-07 §5 */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h1 className="text-base font-bold text-gray-900">
            Your bank&apos;s SMS shows the money leaving. This shows what it became.
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            UPI moves money in seconds; a SIP takes days and shows nothing in between. This passbook shows every
            month&apos;s money, from your bank debit to the units in your name, with sources and times.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sensecheck explains any line in plain words, using only your passbook and Groww&apos;s help pages. Not
            investment advice.
          </p>
          <div className="pt-2">
            <Link
              href="/passbook"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <span>Open my passbook</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
            <Link
              href="/ask"
              className="mt-2 inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Ask Sensecheck a question</span>
            </Link>
          </div>
        </section>

        {/* Try a Task Panel */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Try a task
              </h2>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              {tasks.length} tasks
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
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
