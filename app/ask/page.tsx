"use client";

import React, { useState, Suspense, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge, HowAnswersAreChecked } from "@/components/ui/checked-badge";
import { useDemo } from "@/lib/demo-context";
import { useSearchParams } from "next/navigation";
import { Send, Sparkles, ExternalLink, SlidersHorizontal, ChevronRight } from "lucide-react";
import passbookSeed from "@/data/passbook-seed.json";
import { formatDate } from "@/lib/format";
import {
  answerPointsToOptions,
  entryStateLabel,
  resolveSources,
  splitOptionsLinks,
  starterQuestionsFor,
  suggestedQuestionsFor,
} from "@/lib/flow";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";

// R42 (Claude, 7 Nov 2026): opened from an entry (?entry_id=) or an option card (?q=); readable entry picker;
// starter questions by scenario; "/options" in an answer becomes a link; answer states and "How answers are checked".

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: string[];
  declined?: boolean;
  intent?: string;
  gate_status?: "checked" | "standard";
  intro?: boolean;
}

// Owner, 9 Nov: tapping a question brings its answer into view (smooth unless reduced motion is set).
function bringIntoView(el: HTMLElement | null) {
  if (!el) return;
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function AnswerText({ text }: { text: string }) {
  return (
    <p className="text-xs leading-relaxed whitespace-pre-line">
      {splitOptionsLinks(text).map((part, i) =>
        part.link ? (
          <Link key={i} href="/options" className="underline font-medium text-emerald-800">
            What can I do next?
          </Link>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </p>
  );
}

function AskContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialEntry = searchParams.get("entry_id") || "";

  const { scenario } = useDemo();
  const inputRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  const scenarioData = useMemo(() => {
    const scenarios = (passbookSeed as any).scenarios;
    return (scenarios[scenario] || scenarios.running) as {
      sip: PassbookSip;
      instalments: Instalment[];
    };
  }, [scenario]);

  const entriesNewestFirst = useMemo(
    () => [...scenarioData.instalments].sort((a, b) => b.due_date.localeCompare(a.due_date)),
    [scenarioData]
  );
  const entryExists = entriesNewestFirst.some((i) => i.id === initialEntry);

  const [selectedEntryId, setSelectedEntryId] = useState<string>(entryExists ? initialEntry : "");
  const [question, setQuestion] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "assistant",
      text: "I can explain your instalments, units and the rules for skipping, pausing and stopping. What would you like to know?",
      intro: true,
    },
  ]);

  useEffect(() => {
    if (initialQuery && inputRef.current) inputRef.current.focus();
  }, [initialQuery]);

  const selectedEntry = entriesNewestFirst.find((i) => i.id === selectedEntryId) || null;
  // Owner, 8 Nov: the suggestions follow the month picked in "About" (its state, whether it is the latest, and
  // whether the SIP is running); with no month picked they fit the whole passbook.
  const starterQuestions = selectedEntry
    ? suggestedQuestionsFor(selectedEntry, {
        isLatest: entriesNewestFirst[0]?.id === selectedEntry.id,
        sipActive: scenario !== "stopped",
      })
    : starterQuestionsFor(scenario);

  // Owner, 9 Nov: after a question is sent, bring it (and the answer under it) into view.
  const lastUserId = [...messages].reverse().find((m) => m.sender === "user")?.id;
  useEffect(() => {
    if (lastUserId) requestAnimationFrame(() => bringIntoView(questionRef.current));
  }, [lastUserId, loading]);

  const handleSend = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    // Owner, 8 Nov: a new question replaces the previous one, so the page never grows into a long scroll.
    setMessages((prev) => [...prev.filter((m) => m.intro), { id: `u-${Date.now()}`, sender: "user", text: queryText.trim() }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/sensecheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText.trim(),
          entry_id: selectedEntryId || undefined,
          scenario,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: data.answer || "I can't answer that right now. Your passbook shows the latest confirmed status.",
          sources: data.sources || [],
          declined: Boolean(data.declined),
          intent: data.intent,
          gate_status: data.gate_status || "standard",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: "I can't answer that right now. Please refer to official help articles or your CAS statement.",
          gate_status: "standard",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        title="Ask Sensecheck"
        showBack
        backHref={selectedEntry ? `/passbook/${selectedEntry.id}` : "/passbook"}
      />
      <DemoBanner />

      <p className="px-4 pt-3 -mb-1 text-[12px] text-gray-500">Information about your own SIP and the rules only. Not investment advice.</p>

      <main className="flex-1 p-4 flex flex-col space-y-3.5">
        {/* Optional Entry Picker */}
        <div className="bg-white p-2.5 rounded-xl border border-gray-100 space-y-1.5 text-xs">
          <label htmlFor="entry-picker" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            About
          </label>
          <select
            id="entry-picker"
            value={selectedEntryId}
            onChange={(e) => setSelectedEntryId(e.target.value)}
            className="w-full p-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50 focus:outline-none"
          >
            <option value="">My whole passbook</option>
            {entriesNewestFirst.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {formatDate(inst.due_date)} · ₹{inst.amount.toLocaleString("en-IN")} · {entryStateLabel(inst)}
              </option>
            ))}
          </select>
          {selectedEntry && (
            <Link
              href={`/passbook/${selectedEntry.id}`}
              className="inline-flex items-center text-[11px] text-emerald-800 underline"
            >
              Open the {formatDate(selectedEntry.due_date)} entry
            </Link>
          )}
        </div>

        {/* Starter Chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">Suggested questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {starterQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] text-gray-700 bg-white hover:bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 text-left transition-colors hover:border-gray-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 space-y-3">
          {messages.map((msg) => {
            const sources = msg.sender === "assistant" ? resolveSources(msg.sources) : [];
            const showOptions =
              msg.sender === "assistant" && !msg.intro && !msg.declined && answerPointsToOptions(msg.intent, msg.text);
            return (
              <div
                key={msg.id}
                ref={msg.sender === "user" ? questionRef : undefined}
                className={`flex flex-col scroll-mt-24 ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-900 border border-gray-100"
                  }`}
                >
                  {msg.sender === "assistant" && (
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1 mb-1 gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                        Sensecheck
                      </span>
                      {!msg.intro && <CheckedBadge status={msg.gate_status} declined={msg.declined} />}
                    </div>
                  )}

                  {msg.sender === "assistant" ? <AnswerText text={msg.text} /> : (
                    <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
                  )}

                  {showOptions && (
                    <Link
                      href="/options"
                      className="flex items-center justify-between p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-900"
                    >
                      <span className="inline-flex items-center space-x-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>See what you can do next</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {sources.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Sources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sources.map((s) => (
                          <a
                            key={`${s.title}|${s.url}`}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:underline"
                          >
                            <span>{s.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.sender === "assistant" && !msg.intro && (
                    <div>
                      <HowAnswersAreChecked />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 p-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Sensecheck is reviewing verified passbook facts...</span>
            </div>
          )}
        </div>

        {/* AI disclosure (final MVP, 8 Nov) */}
        <p className="text-[11px] text-gray-500 text-center" data-testid="ai-disclosure">
          Answers are written by an AI model and checked before you see them. If a check fails, you get a standard
          answer instead.
        </p>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(question);
          }}
          className="sticky bottom-0 pt-2 bg-gray-50 flex items-center space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about instalments, units, skipping, rules..."
            disabled={loading}
            aria-label="Your question"
            className="flex-1 text-xs p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          Loading Sensecheck...
        </div>
      }
    >
      <AskContent />
    </Suspense>
  );
}
