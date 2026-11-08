"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge, HowAnswersAreChecked } from "@/components/ui/checked-badge";
import { useDemo } from "@/lib/demo-context";
import passbookSeed from "@/data/passbook-seed.json";
import rulesData from "@/data/rules.json";
import { instalmentState } from "@/lib/passbook";
import { getFailureCode } from "@/lib/failure-codes";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/format";
import { monthKey, resolveSources, splitOptionsLinks, suggestedQuestionsFor } from "@/lib/flow";
import type { Instalment, PassbookEvent, PassbookSip } from "@/lib/passbook-types";
import { MemoryCard } from "@/components/keepsake/memory-card";
import { AskFriend } from "@/components/keepsake/ask-friend";
import { MoneyTrail } from "@/components/ui/money-trail";
import { payNowWindowClosed } from "@/lib/demo-now";
import {
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info,
  MessageCircle,
  SlidersHorizontal,
  Clock,
} from "lucide-react";

// R42 (Claude, 7 Nov 2026): plain step labels; questions that fit the entry; help titles instead of rule ids;
// next-step links (Ask about this instalment, What can I do next?). Final MVP (8 Nov): in version B, this month's
// memory for your future self; while units are pending, the UPI line.
const STEP_NAME: Record<string, string> = {
  debit: "Bank debit",
  order: "Order placed",
  allotment: "Units allotted",
  refund: "Refund",
};

function stepStatus(ev: PassbookEvent): string {
  if (ev.status === "confirmed") return "Confirmed";
  if (ev.status === "pending") return "Not confirmed yet";
  if (ev.status === "failed") return "Failed";
  return "Can't confirm right now";
}

// Owner, 9 Nov: tapping a question brings its answer into view (smooth unless reduced motion is set).
function bringIntoView(el: HTMLElement | null) {
  if (!el) return;
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

// R45 (Claude, 8 Nov 2026): the amount's label says what happened to it, and a reference appears only once it exists.
function amountLabel(state: string | null, inst: Instalment): string {
  const debit = inst.events.find((e) => e.type === "debit");
  const refund = inst.events.find((e) => e.type === "refund");
  switch (state) {
    case "allotted":
      return "Amount invested";
    case "in_progress":
      return "Amount debited";
    case "refunded":
      return refund?.status === "confirmed" ? "Amount refunded" : "Amount debited, refund not confirmed yet";
    case "failed":
      return "Instalment amount (not debited)";
    case "skipped":
      return "Instalment amount (skipped)";
    default:
      return debit?.status === "confirmed" ? "Amount debited" : "Instalment amount";
  }
}

function stepRef(ev: PassbookEvent): string {
  if (ev.status === "pending") return "Not issued yet";
  if (ev.status === "unknown") return "Not available right now";
  return ev.source_event_id;
}

function stepWhen(ev: PassbookEvent): string {
  if (ev.effective_at) return formatDateTime(ev.effective_at);
  return ev.status === "unknown" ? "Not known" : "Not confirmed yet";
}

export default function EntryDetailPage() {
  const params = useParams();
  const entryId = params.id as string;
  const { scenario, version } = useDemo();

  const scenarioData = useMemo(() => {
    const scenarios = (passbookSeed as any).scenarios;
    return (scenarios[scenario] || scenarios.running) as {
      sip: PassbookSip;
      instalments: Instalment[];
    };
  }, [scenario]);

  const { sip, instalments } = scenarioData;
  const entry = useMemo(
    () => instalments.find((i) => i.id === entryId) || null,
    [instalments, entryId]
  );

  const state = entry ? instalmentState(entry) : null;
  const suggestedQuestions = useMemo(() => {
    if (!entry) return [];
    const newest = [...instalments].sort((a, b) => b.due_date.localeCompare(a.due_date))[0];
    return suggestedQuestionsFor(entry, { isLatest: newest?.id === entry.id, sipActive: sip.status === "active" });
  }, [entry, instalments, sip.status]);
  const month = entry ? monthKey(entry.due_date) : "";

  // Explainer AI state
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [explainerAnswer, setExplainerAnswer] = useState<{
    answer: string;
    sources: string[];
    gate_status?: "checked" | "standard";
    declined?: boolean;
  } | null>(null);

  const CANT_ANSWER =
    "Sensecheck can't answer right now. The entry above shows the latest confirmed status.";

  const answerRef = useRef<HTMLDivElement>(null);
  const handleAskQuestion = async (q: string) => {
    setExplainerLoading(true);
    setExplainerAnswer(null);
    requestAnimationFrame(() => bringIntoView(answerRef.current));

    try {
      const res = await fetch("/api/ai/sensecheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, entry_id: entryId, scenario }),
      });

      if (!res.ok) {
        setExplainerAnswer({ answer: CANT_ANSWER, sources: [], gate_status: "standard" });
        return;
      }

      const data = await res.json();
      setExplainerAnswer({
        answer: data.answer || CANT_ANSWER,
        sources: data.sources || [],
        gate_status: data.gate_status || "standard",
        declined: Boolean(data.declined),
      });
    } catch {
      setExplainerAnswer({ answer: CANT_ANSWER, sources: [], gate_status: "standard" });
    } finally {
      setExplainerLoading(false);
    }
  };

  if (!entry) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopBar title="Entry Not Found" showBack backHref="/passbook" />
        <main className="flex-1 p-4">
          <p className="text-xs text-gray-500">
            This instalment entry does not exist in the current scenario.{" "}
            <Link href="/passbook" className="underline text-emerald-700">
              Back to your passbook
            </Link>
          </p>
        </main>
        <FooterNotice />
        <BottomNav />
      </div>
    );
  }

  const debitEvent = entry.events.find((e) => e.type === "debit");
  const orderEvent = entry.events.find((e) => e.type === "order");
  const allotmentEvent = entry.events.find((e) => e.type === "allotment");

  const failureCodeStr =
    debitEvent?.reason_code ||
    orderEvent?.reason_code ||
    allotmentEvent?.reason_code ||
    (state === "unknown" ? "STATUS_UNAVAILABLE" : null);

  const failureDetails = failureCodeStr ? getFailureCode(failureCodeStr) : null;
  const answerSources = explainerAnswer ? resolveSources(explainerAnswer.sources) : [];
  const monthLabel = formatMonthYear(month);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={`Instalment: ${formatDate(entry.due_date)}`} showBack backHref="/passbook" />
      <DemoBanner />

      <p className="px-4 pt-3 -mb-1 text-[12px] text-gray-500">Information about your own SIP and the rules only. Not investment advice.</p>

      <main className="flex-1 p-4 space-y-4">
        {/* Entry Summary: the amount, what it became, and the money's trail */}
        <section className="bg-white rounded-[28px] p-5 border border-gray-200/70 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-gray-500" data-testid="amount-label">{amountLabel(state, entry)}</p>
              <p className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-gray-900">
                ₹{entry.amount.toLocaleString("en-IN")}
              </p>
            </div>
            {entry.units ? (
              <div className="text-right">
                <p className="text-[13px] text-gray-500">Units allotted</p>
                <p className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-emerald-700">{entry.units.toFixed(3)}</p>
                {entry.nav && <p className="text-[12px] text-gray-500">Allotment NAV ₹{entry.nav.toFixed(2)}</p>}
              </div>
            ) : null}
          </div>
          {entry.events.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <MoneyTrail inst={entry} paymentRoute={sip.payment_route} />
            </div>
          )}
        </section>

        {/* Owner, 8 Nov 23:38: Sensecheck sits right under the month's summary, never below a long scroll */}
        <section id="sensecheck" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">What does this mean?</h2>
          </div>
          <p className="text-xs text-gray-600">Ask Sensecheck about this instalment:</p>

          <div className="space-y-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAskQuestion(q)}
                disabled={explainerLoading}
                className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500/40 bg-gray-50 hover:bg-emerald-50/30 text-xs text-gray-800 transition-colors flex items-center justify-between group"
              >
                <span>{q}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 transition-transform" />
              </button>
            ))}
          </div>

          <div ref={answerRef} className="scroll-mt-24" data-testid="answer-anchor" />
          {explainerLoading && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 p-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Checking verified passbook facts...</span>
            </div>
          )}

          {explainerAnswer && (
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900" data-testid="answer-month">
                  Sensecheck answer about the {formatDate(entry.due_date)} instalment
                </span>
                <CheckedBadge status={explainerAnswer.gate_status} declined={explainerAnswer.declined} />
              </div>
              <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-line">
                {splitOptionsLinks(explainerAnswer.answer).map((part, i) =>
                  part.link ? (
                    <Link key={i} href="/options" className="underline font-medium text-emerald-800">
                      What can I do next?
                    </Link>
                  ) : (
                    <React.Fragment key={i}>{part.text}</React.Fragment>
                  )
                )}
              </p>
              {answerSources.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {answerSources.map((s) => (
                    <a
                      key={`${s.title}|${s.url}`}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:underline"
                    >
                      <span>{s.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </a>
                  ))}
                </div>
              )}
              <div className="pt-1">
                <HowAnswersAreChecked />
              </div>
            </div>
          )}

          {/* Next steps (always shown, equal weight) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/ask?entry_id=${encodeURIComponent(entry.id)}`}
              className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask your own question</span>
            </Link>
            <Link
              href="/options"
              className="flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>What can I do next?</span>
            </Link>
          </div>

          {/* Version B: ask one person you trust (sent from the investor's own app) */}
          {version === "B" && <AskFriend entry={entry} />}
        </section>


        {/* The UPI gap, in the product: shown only while units are not confirmed yet */}
        {state === "in_progress" && (
          <section className="bg-blue-50 rounded-2xl p-4 border border-blue-200 space-y-1.5" data-testid="upi-line">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-950 leading-relaxed">
                {sip.payment_route === "Groww AutoPay" ? (
                  <>
                    This SIP is paid through Groww AutoPay. UPI moves money in seconds; mutual fund units take longer.
                    With Groww AutoPay, units are expected two working days after the SIP date (T+2). With a BSE
                    mandate it is T+5 or T+6. Your bank has confirmed the debit; the units step is shown below.
                  </>
                ) : (
                  <>
                    UPI moves money in seconds; mutual fund units take longer. Units are expected two working days
                    after the SIP date (T+2) with Groww AutoPay, and T+5 or T+6 with a BSE mandate. Your bank has
                    confirmed the debit; the units step is shown below.
                  </>
                )}
              </p>
            </div>
            <a
              href="https://groww.in/help/mutual-funds/order/how-many-days-does-it-take-for-the-units-to-be-allocated--61"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-[11px] text-blue-800 underline ml-6"
            >
              <span>Source: How many days does it take for the units to be allocated?</span>
              <ExternalLink className="w-2.5 h-2.5 ml-1" />
            </a>
          </section>
        )}

        {/* Event Timeline */}
        <section className="bg-white rounded-[28px] p-5 border border-gray-200/70">
          <h2 className="text-[15px] font-semibold text-gray-900">
            {entry.events.length === 0
              ? "What happened"
              : `What happened, step by step (${entry.events.length} ${entry.events.length === 1 ? "step" : "steps"})`}
          </h2>

          {entry.events.length === 0 ? (
            <p className="text-[13px] text-gray-500 mt-3">
              This instalment was skipped by the investor. No debit was attempted.
            </p>
          ) : (
            <ol className="mt-4 relative">
              {entry.events.map((ev, idx) => {
                const last = idx === entry.events.length - 1;
                const dot =
                  ev.status === "confirmed"
                    ? ev.type === "refund"
                      ? "bg-violet-600 border-violet-600"
                      : "bg-emerald-600 border-emerald-600"
                    : ev.status === "failed"
                    ? "bg-[#B4433A] border-[#B4433A]"
                    : ev.status === "pending"
                    ? "bg-white border-blue-500 border-dashed"
                    : "bg-gray-300 border-gray-300";
                const chip =
                  ev.status === "confirmed"
                    ? "text-emerald-800 bg-emerald-50"
                    : ev.status === "failed"
                    ? "text-[#8E3329] bg-[#FBECEA]"
                    : ev.status === "pending"
                    ? "text-blue-800 bg-blue-50"
                    : "text-gray-700 bg-gray-100";
                return (
                  <li key={ev.id} className="relative pl-8 pb-5 last:pb-0">
                    {!last && <span aria-hidden className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-gray-200" />}
                    <span aria-hidden className={`absolute left-0 top-0.5 w-5 h-5 rounded-full border-2 ${dot}`} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-gray-900">
                        {idx + 1}. {STEP_NAME[ev.type] ?? ev.type}
                      </span>
                      <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${chip}`}>{stepStatus(ev)}</span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                      <div>
                        <dt className="text-gray-400">Source:</dt>
                        <dd className="text-gray-800">{ev.source_label}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Reference ID:</dt>
                        <dd className="text-gray-700 break-all">{stepRef(ev)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">When it happened: </dt>
                        <dd className="text-gray-800">{stepWhen(ev)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Last checked: </dt>
                        <dd className="text-gray-800">{formatDateTime(ev.as_of)}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ol>
          )}
        </section>


        {/* B5 Failure / Refund / Unknown Block */}
        {failureDetails && (
          <section className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-amber-900">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">What happened to this instalment</h3>
            </div>

            <div className="space-y-2 text-xs text-amber-950">
              <p>
                <strong>Reason:</strong> {failureDetails.meaning}
              </p>
              <p>
                <strong>What happened to the money:</strong>{" "}
                {failureCodeStr === "STATUS_UNAVAILABLE" && debitEvent?.status === "confirmed"
                  ? `Your bank confirmed the debit${debitEvent.effective_at ? ` on ${formatDateTime(debitEvent.effective_at)}` : ""}${
                      orderEvent?.status === "confirmed" ? " and the order was placed" : ""
                    }. Only the units step can't be confirmed right now.`
                  : failureDetails.money_status}
              </p>
              {failureCodeStr === "INSUFFICIENT_BALANCE" && debitEvent?.status === "failed" && (
                <p data-testid="pay-now-note">
                  <strong>Pay Now:</strong> after a debit fails for insufficient balance, Pay Now stays open for 2
                  working days.{" "}
                  {payNowWindowClosed(debitEvent.effective_at ?? debitEvent.as_of) === true
                    ? "For this instalment, that window has closed."
                    : payNowWindowClosed(debitEvent.effective_at ?? debitEvent.as_of) === false
                    ? "For this instalment, that window is still open."
                    : ""}
                </p>
              )}
            </div>

            {failureDetails.routes.length > 0 && (
              <div className="pt-2 border-t border-amber-200 space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 block">
                  Official help:
                </span>
                <div className="space-y-1.5">
                  {failureDetails.routes.map((rt, idx) => {
                    const rule = (rulesData as any[]).find((r) => r.id === rt.rule_id);
                    const ruleUrl = rt.url || rule?.url || "#";

                    if (failureCodeStr === "INSUFFICIENT_BALANCE" && rt.rule_id === "rule-three-miss-01") {
                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-gray-800 space-y-1"
                        >
                          <p className="font-medium text-gray-900">Three missed instalments in a row cancel a SIP.</p>
                          <a
                            href={ruleUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-gray-500 hover:text-gray-800 underline block"
                          >
                            Source: {rt.title}
                          </a>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-gray-800">
                        <a
                          href={ruleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-emerald-800 hover:underline flex items-center justify-between"
                        >
                          <span>{rt.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Version B: this month's memory for your future self (photo, voice or a line) */}
        {version === "B" && (
          <MemoryCard
            month={month}
            monthLabel={monthLabel}
            invite={state === "allotted" && sip.status === "active"}
          />
        )}
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
