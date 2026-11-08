"use client";

import React from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { ChevronRight, ArrowRight, Clock, AlertTriangle, SlidersHorizontal, Camera, MessageCircle, PenLine, Users } from "lucide-react";
import { useDemo } from "@/lib/demo-context";
import passbookSeed from "@/data/passbook-seed.json";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import { instalmentState } from "@/lib/passbook";
import { messagesFor, type PhoneMessage } from "@/lib/second-message";
import { MessageBubble } from "@/components/ui/phone-messages";

export default function HomePage() {
  const { version, scenario } = useDemo();
  // Final feature: the lock screen on SIP week. The bank's SMS, then Groww's matching messages (newest first).
  const lock = React.useMemo(() => {
    const sc = (passbookSeed as any).scenarios[scenario] ?? (passbookSeed as any).scenarios.running;
    const sip = sc.sip as PassbookSip;
    const all = sc.instalments as Instalment[];
    const desc = [...all].sort((a, b) => b.due_date.localeCompare(a.due_date));
    const latest = desc[0];
    const lastAllotted = desc.find((i) => i.id !== latest.id && instalmentState(i) === "allotted");
    const items: { m: PhoneMessage; href?: string }[] = [
      ...messagesFor(latest, all, sip).map((m) => ({ m, href: m.from === "groww" ? `/passbook/${latest.id}` : undefined })),
      ...(lastAllotted
        ? messagesFor(lastAllotted, all, sip)
            .filter((m) => m.title === "Units in your name")
            .map((m) => ({ m, href: `/passbook/${lastAllotted.id}` }))
        : []),
    ];
    return items.sort((a, b) => b.m.at.localeCompare(a.m.at)).slice(0, 3);
  }, [scenario]);
  // Owner, 8 Nov: each task is a short scenario: what happened, what to find out, and where it starts.
  const tasks = [
    {
      num: 1,
      title: "₹2,000 left your bank. Where are the units?",
      situation: "Your bank SMS says ₹2,000 was debited for this SIP on 5 Nov, but you can't see new units.",
      goal: "Find out where the money is now and when the units should arrive.",
      start: "Passbook",
      href: "/passbook",
      icon: Clock,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      num: 2,
      title: "Two months that went wrong",
      situation: "In May the SIP debit failed. In September money left your account and later came back.",
      goal: "Find out what happened to the money each time, and whether you lost any.",
      start: "Passbook",
      href: "/passbook",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      num: 3,
      title: "Money is tight next month",
      situation: "Your expenses went up and ₹2,000 next month feels hard.",
      goal: "See what you can do with this SIP, and what each choice means.",
      start: "What can I do next?",
      href: "/options",
      icon: SlidersHorizontal,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    ...(version === "B"
      ? [
          {
            num: 4,
            title: "Why are you starting this SIP?",
            situation: "Go back to the day you set up this SIP.",
            goal: "On the Start SIP screen, say why in a line or a voice note and add a photo of what it's for. Then find your goal, piece by piece, in your passbook.",
            start: "Start SIP",
            href: "/start",
            icon: PenLine,
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
          {
            num: 5,
            title: "Keep something from October",
            situation: "Your October units arrived.",
            goal: "Attach a photo or a voice note to October in your passbook.",
            start: "Passbook",
            href: "/passbook",
            icon: Camera,
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
          {
            num: 6,
            title: "Ask someone you trust about May",
            situation: "You want a second opinion on the failed May instalment.",
            goal: "Send one person you trust a message about May.",
            start: "Passbook",
            href: "/passbook",
            icon: Users,
            color: "text-purple-600 bg-purple-50 border-purple-200",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="SIP Passbook" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        {/* Final feature: "The second message" on the lock screen */}
        <section className="rounded-[28px] bg-ink text-white p-4 pb-5 shadow-[0_18px_40px_-24px_rgba(20,33,61,0.9)]" data-testid="lock-screen">
          <div className="text-center pt-1 pb-3">
            <p className="text-[12px] text-white/70">Friday, 6 November</p>
            <p className="text-[44px] leading-none font-semibold tracking-[-0.03em] mt-1">10:30</p>
          </div>
          <div className="space-y-2">
            {lock.map(({ m, href }, i) => (
              <MessageBubble key={i} m={m} href={href} dark />
            ))}
          </div>
          <p className="text-[11px] text-white/60 text-center mt-3">Tap a Groww message to open that month.</p>
        </section>

        <section className="bg-white rounded-3xl p-5 border border-gray-200/70 space-y-3">
          <h1 className="text-[19px] font-bold leading-snug tracking-[-0.01em] text-gray-900">
            Your bank&apos;s SMS shows the money leaving. This shows what it became.
          </h1>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            UPI moves money in seconds; a SIP takes days and used to show nothing in between. Now Groww sends a
            message at every step, and the passbook shows every month&apos;s money, from your bank debit to the units in
            your name.
          </p>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Sensecheck explains any line in plain words, using only your passbook and Groww&apos;s help pages. Not
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

          <p className="text-xs text-gray-600 leading-relaxed" data-testid="task-context">
            You started a ₹2,000 monthly SIP in December 2025, paid by Groww AutoPay on the 5th. Today is 6 Nov 2026.
            The tasks use the running SIP in Demo tools.
          </p>

          <ol className="space-y-2">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <li key={task.num}>
                  <Link
                    href={task.href}
                    className="flex items-start p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all group"
                    data-testid="task-card"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 border ${task.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0 pr-2 space-y-1">
                      <p className="text-[11px] text-gray-500">Task {task.num}</p>
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-emerald-800">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{task.situation}</p>
                      <p className="text-xs text-gray-900 leading-relaxed">
                        <span className="font-semibold">Your goal: </span>
                        {task.goal}
                      </p>
                      <p className="text-[11px] text-gray-500">Starts on: {task.start}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-transform flex-shrink-0 self-center" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
