"use client";

import React, { useState, Suspense } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary } from "@/lib/seed";
import { useSearchParams } from "next/navigation";
import { Send, HelpCircle, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: string[];
  declined?: boolean;
  gate_status?: "checked" | "standard";
}

function AskContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { sip, instalments, simulatedDate } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const [question, setQuestion] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "assistant",
      text: "I can answer questions about your instalments, units, and the rules for skipping, pausing, and cancelling. What would you like to know?",
      gate_status: "standard",
    },
  ]);

  const starterQuestions = [
    "Which months did not go through?",
    "How many units did I buy in March?",
    "Why did my September instalment fail?",
    "How much have I invested so far?",
    "Which fund should I switch to?",
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: queryText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText.trim(),
          locker_summary: {
            investor_name: "Demo investor",
            sip_name: sip.name,
            fund_label: sip.fund_label,
            total_invested: summary.totalInvested,
            total_units: summary.totalUnits,
            current_value: summary.currentValue,
            current_nav: summary.currentNav,
            paid_count: summary.paidCount,
            failed_count: summary.failedCount,
            skipped_count: summary.skippedCount,
            start_date: sip.start_date,
            today: simulatedDate,
            instalments: instalments.map((i) => ({
              due_date: i.due_date,
              status: i.status,
              amount: i.amount,
              nav: i.nav,
              units: i.units,
              failure_code: i.failure_code,
              failure_text: i.failure_text,
              note: i.note,
              memory: i.memory?.text,
            })),
          },
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I could not answer that from your locker.",
        sources: data.sources || [],
        declined: Boolean(data.declined),
        gate_status: data.gate_status || "standard",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: "I can't answer that right now. Please refer to official help articles.",
          gate_status: "standard",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Ask your locker" showBack backHref="/locker" />
      <DemoBanner />

      {/* Mandatory Investment Advice Notice (§3 & §4) */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 text-center text-xs text-emerald-800 font-medium">
        Information about your own SIP and the rules only. Not investment advice.
      </div>

      <main className="flex-1 p-4 flex flex-col space-y-4">
        {/* Starter Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
            Questions you can ask:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {starterQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] text-gray-700 bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-left transition-colors shadow-2xs hover:border-gray-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 shadow-2xs ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-xs"
                    : "bg-white text-gray-900 border border-gray-100 rounded-bl-xs"
                }`}
              >
                {msg.sender === "assistant" && (
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                      Locker Assistant
                    </span>
                    <CheckedBadge status={msg.gate_status} />
                  </div>
                )}

                <p className="text-xs leading-relaxed whitespace-pre-line">
                  {msg.text}
                </p>

                {/* Sources or Official Guidance Links */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                      Sources &amp; Official References:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.startsWith("http") ? src : "#"}
                          target={src.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:underline"
                        >
                          <span>{src.startsWith("http") ? "AMFI / SEBI Source" : src}</span>
                          {src.startsWith("http") && (
                            <ExternalLink className="w-2.5 h-2.5" />
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 p-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Checking your locker facts and rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(question);
          }}
          className="sticky bottom-0 pt-2 bg-gray-50 flex items-center space-x-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your units, failed months, rules..."
            disabled={loading}
            className="flex-1 text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            aria-label="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center text-xs text-gray-400">
          Loading Ask your locker...
        </div>
      }
    >
      <AskContent />
    </Suspense>
  );
}
