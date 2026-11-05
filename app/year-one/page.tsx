"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary } from "@/lib/seed";
import Link from "next/link";
import {
  Award,
  Calendar,
  Share2,
  Lock,
  ArrowRight,
  Sparkles,
  BookmarkCheck,
  Check,
} from "lucide-react";

export default function YearOnePage() {
  const { sip, instalments, simulatedDate } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const [shareMode, setShareMode] = useState(false);
  const [yearStoryLines, setYearStoryLines] = useState<string[]>([]);
  const [shareLines, setShareLines] = useState<string[]>([]);
  const [yearTwoNote, setYearTwoNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gateStatus, setGateStatus] = useState<"checked" | "standard">("checked");

  useEffect(() => {
    async function fetchYearStory() {
      try {
        const res = await fetch("/api/ai/year-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slips: instalments,
            memories: instalments
              .filter((i) => i.memory?.text)
              .map((i) => ({ due_date: i.due_date, text: i.memory?.text })),
          }),
        });
        const data = await res.json();
        setYearStoryLines(data.lines || []);
        setShareLines(data.share_lines || []);
        setGateStatus(data.gate_status || "standard");
      } catch (err) {
        // Fallback
        const lines = instalments.map((inst) => {
          const d = new Date(inst.due_date).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
          return inst.status === "paid"
            ? `${d}: ₹${inst.amount} invested, bought ${inst.units?.toFixed(
                3
              )} units at NAV ₹${inst.nav?.toFixed(2)}.`
            : `${d}: Skipped or paused.`;
        });
        setYearStoryLines(lines);
        setShareLines(lines.map((l) => l.split(":")[0] + ": Instalment period."));
        setGateStatus("standard");
      } finally {
        setLoading(false);
      }
    }
    fetchYearStory();
  }, [instalments]);

  const handleSaveYearTwoNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearTwoNote.trim()) return;
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Year One Recap" showBack backHref="/locker" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        {/* Header Hero */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Month 11 Review
            </span>
            <CheckedBadge status={gateStatus} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Your first year, as a story
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Every month built from your own entries, slips, and memories.
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-700">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">
                Instalments Paid
              </span>
              <span className="font-bold text-gray-900">
                {summary.paidCount} of 11 months
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">
                Units Owned
              </span>
              <span className="font-bold text-gray-900">
                {summary.totalUnits.toFixed(3)}
              </span>
            </div>
            <div>
              <Link
                href="/certificate"
                className="text-emerald-700 font-semibold hover:underline inline-flex items-center text-xs"
              >
                <span>Certificate</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Day-1 Anchor Review */}
        {sip.promise_text && (
          <section className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Where you started (Day 1)
            </span>
            <p className="text-xs text-gray-800 italic leading-relaxed">
              &ldquo;{sip.promise_text}&rdquo;
            </p>
          </section>
        )}

        {/* Story Feed: Private vs Shareable View */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              {shareMode ? "Shareable Story (No amounts/units)" : "Your Full Story"}
            </h3>
            <button
              onClick={() => setShareMode(!shareMode)}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              <span>{shareMode ? "View full details" : "Share-safe view"}</span>
            </button>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">
              Composing your year story from your slips...
            </div>
          ) : (
            <div className="space-y-2.5">
              {(shareMode ? shareLines : yearStoryLines).map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 text-xs text-gray-800 leading-relaxed p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p className="flex-1">{line}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Note for Year Two Prompt (§1 & §8) */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Record a note for Year Two
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              As you approach month 12, what is your intention for the next year
              of this SIP?
            </p>
          </div>

          <form onSubmit={handleSaveYearTwoNote} className="space-y-2.5">
            <textarea
              value={yearTwoNote}
              onChange={(e) => setYearTwoNote(e.target.value)}
              placeholder="e.g. Continue saving towards my bike, adjust the amount after appraisal..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-colors"
            >
              Save Year Two Note
            </button>
          </form>

          {noteSaved && (
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center space-x-1.5 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Note for Year Two saved in your locker!</span>
            </div>
          )}
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
