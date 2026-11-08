"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import rulesData from "@/data/rules.json";
import { Info, ExternalLink, ChevronDown, ChevronUp, MessageCircle, CircleCheck, Landmark, CalendarCog, SkipForward, CircleStop, RotateCcw } from "lucide-react";

// Visual pass (8 Nov): one quiet icon per option, all in the same neutral tone (no option looks recommended).
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "keep-as-is": CircleCheck,
  "change-autopay-bank": Landmark,
  "change-amount-or-date": CalendarCog,
  "skip-one-instalment": SkipForward,
  stop: CircleStop,
  "restart-later": RotateCcw,
};

// R42 (Claude, 7 Nov 2026): compact cards of equal size and weight (no ranking, no "recommended"); each card has
// the same two actions: read Groww's rule (verbatim from data/rules.json, with its source) and ask Sensecheck about it.
// Cards have anchors (#restart-later etc.) so other pages can open one directly.
// Final MVP (8 Nov): "What can I do next?", six cards in two groups; the Pause card is gone (its source wasn't
// Groww); the Stop card shows SEBI's 2-working-day rule and notes that Groww's help pages give 3 or 7 days.

interface Rule {
  id: string;
  title: string;
  url: string;
  text: string;
  source_type?: string;
}

interface OptionItem {
  id: string;
  title: string;
  summary: string; // neutral, plain words, supported by the cited passages
  ruleIds: string[]; // passages shown word for word under "Read the rule"
  question: string; // opens /ask with this question filled in
  group: "change" | "stop";
}

const OPTIONS: OptionItem[] = [
  {
    id: "keep-as-is",
    group: "change",
    title: "Keep as is",
    summary: "Make no change to your SIP.",
    ruleIds: [],
    question: "What is the status of my latest instalment?",
  },
  {
    id: "change-autopay-bank",
    group: "change",
    title: "Change the AutoPay bank",
    summary: "Move the AutoPay for this SIP to another bank account.",
    ruleIds: ["rule-change-bank-01"],
    question: "How do I switch my AutoPay to another bank?",
  },
  {
    id: "change-amount-or-date",
    group: "change",
    title: "Change amount or date",
    summary: "Change how much is invested, or on which date.",
    ruleIds: ["rule-change-amount-01"],
    question: "How do I change my SIP amount or date?",
  },
  {
    id: "skip-one-instalment",
    group: "change",
    title: "Skip one instalment",
    summary: "Skip a single instalment. Three skips in a row cancel the SIP.",
    ruleIds: ["rule-skip-01"],
    question: "What happens if I skip next month?",
  },
  {
    id: "stop",
    group: "stop",
    title: "Stop",
    summary: "Stop future instalments. What you have invested stays until you redeem it.",
    ruleIds: ["rule-cancel-01", "rule-cancel-timing-02"],
    question: "If I stop my SIP, do I lose my units?",
  },
  {
    id: "restart-later",
    group: "stop",
    title: "Restart later",
    summary: "Start a new SIP in the same fund at a later date.",
    ruleIds: ["rule-restart-01"],
    question: "Can I restart after stopping?",
  },
];

const RULES = rulesData as Rule[];

const GROUPS: { id: OptionItem["group"]; title: string }[] = [
  { id: "change", title: "Change future instalments" },
  { id: "stop", title: "Stop, and come back later" },
];

// Shown on the Stop card only (not given to the AI): the help pages disagree on the notice period.
const CANCEL_NOTICE = [
  {
    text: "One help page says a SIP can't be cancelled if an instalment is due in the next 3 days.",
    title: "I cancelled my SIP instalment but still my amount got deducted.",
    url: "https://groww.in/help/mutual-funds/order/i-cancelled-my-sip-instalment-but-still-my-amount-got-deducted--79",
  },
  {
    text: "Another says there should be a 7 working-day gap before the next SIP date.",
    title: "I have cancelled my SIP. The amount was deducted anyway.",
    url: "https://groww.in/help/mutual-funds/order/i-have-cancelled-my-sip-the-amount-was-deducted-anyway-2",
  },
];

export default function OptionsPage() {
  const [showManageNote, setShowManageNote] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  // Opened from another page with #<card id>: expand that card and bring it into view.
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id && OPTIONS.some((o) => o.id === id)) {
      setOpen(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 50);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="What can I do next?" showBack backHref="/passbook" />
      <DemoBanner />

      <p className="px-4 pt-3 -mb-1 text-[12px] text-gray-500">Information about your own SIP and the rules only. Not investment advice.</p>

      <main className="flex-1 p-4 space-y-4">
        <div className="space-y-1">
          <h1 className="text-sm font-bold text-gray-900">What can I do next?</h1>
          <p className="text-xs text-gray-600">
            These are the changes you can make to this SIP. Open one to read the rule, or ask Sensecheck what it
            means for you. They are in no particular order.
          </p>
        </div>

        {GROUPS.map((g) => (
        <div key={g.id} className="space-y-2" data-testid="option-group">
          <h2 className="text-[13px] font-semibold text-gray-700 px-1">{g.title}</h2>
        <div className="grid grid-cols-1 gap-3">
          {OPTIONS.filter((o) => o.group === g.id).map((opt) => {
            const isOpen = open === opt.id;
            const rules = opt.ruleIds
              .map((id) => RULES.find((r) => r.id === id))
              .filter((r): r is Rule => Boolean(r));
            return (
              <div
                key={opt.id}
                id={opt.id}
                data-testid="option-card"
                className="bg-white rounded-3xl p-4 border border-gray-200/70 flex flex-col justify-between min-h-[176px] scroll-mt-24"
              >
                <div className="flex items-start gap-3">
                  {(() => {
                    const I = ICONS[opt.id];
                    return I ? (
                      <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0" aria-hidden>
                        <I className="w-[18px] h-[18px]" />
                      </span>
                    ) : null;
                  })()}
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900">{opt.title}</h3>
                    <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{opt.summary}</p>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2" data-testid="option-rule">
                    {rules.length === 0 ? (
                      <p className="text-xs text-gray-500">No rule needed: nothing changes.</p>
                    ) : (
                      rules.map((r) => (
                        <div key={r.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                          <p className="text-xs text-gray-700 leading-relaxed">{r.text}</p>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-700 hover:underline inline-flex items-center"
                          >
                            <span>
                              Source: {r.source_type === "public_rule_summary" ? "Public rule summary" : r.title}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 ml-1" />
                          </a>
                        </div>
                      ))
                    )}
                    {opt.id === "stop" && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5" data-testid="cancel-notice">
                        <p className="text-xs text-amber-950 leading-relaxed">
                          Our help pages give different notice periods. The date shown in Manage SIP is the one that applies.
                        </p>
                        {CANCEL_NOTICE.map((c) => (
                          <p key={c.url} className="text-xs text-gray-700 leading-relaxed">
                            {c.text}{" "}
                            <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-700 underline">
                              Source: {c.title}
                            </a>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : opt.id)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span>{isOpen ? "Hide the rule" : "Read the rule"}</span>
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <Link
                    href={`/ask?q=${encodeURIComponent(opt.question)}`}
                    className="inline-flex items-center justify-center space-x-1 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>Ask about this</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        </div>
        ))}

        <section className="bg-white rounded-3xl p-4 border border-gray-200/70 space-y-2.5">
          <button
            type="button"
            onClick={() => setShowManageNote(!showManageNote)}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Open Manage SIP</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {showManageNote && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Manage SIP is where you make any of these changes. Nothing is changed in this demo.</span>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-500 text-center">
          <Link href="/passbook" className="underline">
            Back to your passbook
          </Link>
        </p>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
