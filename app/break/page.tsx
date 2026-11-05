"use client";

import React, { useState, useEffect, Suspense } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { useDemo } from "@/lib/demo-context";
import {
  getStopOptionsForCategory,
  evaluateReturnDate,
  getFixTopicForCause,
  StopOption,
} from "@/lib/rules-engine";
import { StopCategory } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  Info,
  Play,
  Pause,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

function BreakFlowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const instId = searchParams.get("inst_id");

  const { sip, instalments, simulatedDate, updateSipStatus } = useDemo();

  // If entering from a specific failed slot:
  const targetInstalment = instId
    ? instalments.find((i) => i.id === instId)
    : null;

  // Step state
  const [step, setStep] = useState<"reason" | "options" | "return_date" | "confirm_cancel" | "done">(
    targetInstalment ? "options" : "reason"
  );

  const [reasonText, setReasonText] = useState(
    targetInstalment ? targetInstalment.failure_text || "Instalment failed" : ""
  );
  const [category, setCategory] = useState<StopCategory>(
    targetInstalment?.failure_code === "bank_account_issue"
      ? "bank_changed"
      : targetInstalment?.failure_code === "balance_insufficient"
      ? "cash_shortage"
      : "cash_shortage"
  );
  const [distress, setDistress] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Return date state
  const [selectedReturnDate, setSelectedReturnDate] = useState<string>("2027-03-14");
  const [returnLabel, setReturnLabel] = useState<string>("your birthday");
  const [pauseEvaluation, setPauseEvaluation] = useState<any>(null);

  // Audio player state for cancel promise
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Evaluate pause rules whenever selected return date changes
  useEffect(() => {
    // Next instalment is assumed to be next month on 5th
    const nextDate = "2026-11-05";
    const evalResult = evaluateReturnDate(selectedReturnDate, nextDate);
    setPauseEvaluation(evalResult);
  }, [selectedReturnDate]);

  // Handle reason submission
  const handleAnalyzeReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reasonText }),
      });
      const data = await res.json();
      setCategory(data.category || "other");
      setDistress(Boolean(data.distress));
    } catch (err) {
      setCategory("other");
      setDistress(false);
    } finally {
      setIsAnalyzing(false);
      setStep("options");
    }
  };

  // Options list based on category & distress
  const options = getStopOptionsForCategory(category, distress);

  // Fix details if from failed instalment
  const fixInfo = targetInstalment
    ? getFixTopicForCause(
        (targetInstalment.failure_code as any) || "failed_reason_unknown"
      )
    : null;

  // Milestone preset buttons
  const milestoneChips = [
    { label: "My birthday (14 March)", date: "2027-03-14", name: "your birthday" },
    { label: "New financial year (1 April)", date: "2027-04-01", name: "new financial year" },
    { label: "Next salary revision (July)", date: "2027-07-01", name: "salary revision" },
    { label: "3 months pause (Feb 2027)", date: "2027-02-05", name: "3-month pause" },
  ];

  const handleSelectOption = (opt: StopOption) => {
    if (opt.action === "cancel") {
      setStep("confirm_cancel");
    } else if (opt.action === "pause") {
      setStep("return_date");
    } else if (opt.action === "skip") {
      // Apply skip
      updateSipStatus("active");
      router.push("/locker");
    } else {
      setStep("return_date");
    }
  };

  const handleConfirmReturnDate = () => {
    const isPaused = pauseEvaluation?.canPause;
    updateSipStatus(
      isPaused ? "paused" : "stopped",
      selectedReturnDate,
      returnLabel
    );
    setStep("done");
  };

  const handleFinalCancel = () => {
    updateSipStatus("stopped", selectedReturnDate, returnLabel);
    setStep("done");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Break Assistant" showBack backHref="/locker" />
      <DemoBanner />

      {/* Mandatory Investment Advice Notice (§3 & §4) */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 text-center text-xs text-emerald-800 font-medium">
        Information about your own SIP and the rules only. Not investment advice.
      </div>

      <main className="flex-1 p-4 space-y-4">
        {/* STEP 1: REASON INPUT */}
        {step === "reason" && (
          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Tell the locker what is happening
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Whether money is tight, you changed jobs, or you just need a
                break. Write or speak in your own words (including Hindi/Hinglish).
              </p>
            </div>

            <form onSubmit={handleAnalyzeReason} className="space-y-3">
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="e.g. My salary account changed, rent went up this month, lost my job, or I want to pause..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent leading-relaxed"
                required
              />

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <span>Reading your reason...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">
                Your reason is read to find the right path and is never used for marketing.
              </p>
            </div>
          </section>
        )}

        {/* STEP 2: OPTIONS PRESENTATION */}
        {step === "options" && (
          <div className="space-y-4">
            {/* If Distress Mode: Plain, calm, monochrome typography (§8) */}
            {distress && (
              <div className="bg-gray-100 rounded-2xl p-4 border border-gray-300 text-xs text-gray-800 space-y-1">
                <p className="font-semibold text-gray-900">
                  We understand things are difficult right now.
                </p>
                <p className="text-gray-600">
                  Here are your options in plain terms. There is no urgency and no penalty for stopping.
                </p>
              </div>
            )}

            {/* If Proactive Failed Slot Resolution */}
            {fixInfo && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {fixInfo.title}
                  </span>
                </div>
                <ul className="text-xs text-gray-700 space-y-1 pl-4 list-disc">
                  {fixInfo.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                Available options for your situation
              </h3>

              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between group ${
                    opt.isCancel
                      ? "bg-white hover:bg-gray-50 border-gray-200"
                      : "bg-white hover:bg-emerald-50/50 border-gray-100 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex-1 pr-3 space-y-1">
                    <p
                      className={`text-xs font-bold ${
                        opt.isCancel
                          ? "text-gray-900"
                          : "text-gray-900 group-hover:text-emerald-700"
                      }`}
                    >
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      {opt.consequence}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 self-center flex-shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("reason")}
              className="text-xs text-gray-400 hover:text-gray-600 underline font-medium block text-center w-full py-1"
            >
              Change my reason
            </button>
          </div>
        )}

        {/* STEP 3: RETURN DATE SELECTION (F6) */}
        {step === "return_date" && (
          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                When would you like to return?
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Choose a date or milestone. If eligible, your SIP will be paused;
                otherwise, your plan is kept ready for that day.
              </p>
            </div>

            {/* Milestone Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">
                Milestone shortcuts:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {milestoneChips.map((chip) => (
                  <button
                    key={chip.date}
                    type="button"
                    onClick={() => {
                      setSelectedReturnDate(chip.date);
                      setReturnLabel(chip.name);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      selectedReturnDate === chip.date
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{chip.label}</span>
                    {selectedReturnDate === chip.date && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Picker */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Or pick a specific date:
              </label>
              <input
                type="date"
                value={selectedReturnDate}
                onChange={(e) => {
                  setSelectedReturnDate(e.target.value);
                  setReturnLabel("selected date");
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Deterministic Pause Evaluation Outcome */}
            {pauseEvaluation && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  pauseEvaluation.canPause
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <p className="font-semibold">
                  {pauseEvaluation.canPause
                    ? "Eligible for Fund House Pause"
                    : "Locker Plan Kept Ready"}
                </p>
                <p className="mt-0.5">{pauseEvaluation.offerText}</p>
              </div>
            )}

            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep("options")}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnDate}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Confirm return date
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: CONFIRM CANCELLATION (With Opt-in Day-1 Promise) */}
        {step === "confirm_cancel" && (
          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Cancel this SIP
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Cancellation cannot be undone. Future debits will stop permanently.
                Your existing units stay in your folio.
              </p>
            </div>

            {/* Day-1 Promise Card (ONLY if investor opted-in, and NEVER autoplayed - CCPA compliance) */}
            {sip.show_promise_at_cancel && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Your Day-1 Reason (You chose to review this)
                </span>
                <p className="text-xs text-gray-800 italic">
                  On day 1 you said: &ldquo;{sip.promise_text}&rdquo;
                </p>

                {/* Audio player with Play button (Never autoplay) */}
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 shadow-2xs"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pause note</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Listen to your note</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Recorded 5 Dec 2025
                  </span>
                </div>
              </div>
            )}

            {/* Statutory cancellation timing notice (§4 SEBI) */}
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/60 text-xs text-blue-900">
              Processed within 2 working days by the mutual fund company.
            </div>

            {/* CCPA Dark Pattern compliance: Confirm cancellation has EQUAL SIZE AND WEIGHT */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleFinalCancel}
                className="w-full py-3 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors shadow-sm"
              >
                Confirm cancellation
              </button>

              <button
                type="button"
                onClick={() => setStep("return_date")}
                className="w-full py-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
              >
                Pause until a return date instead
              </button>

              <button
                type="button"
                onClick={() => router.push("/locker")}
                className="w-full py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 text-center"
              >
                Keep my SIP active
              </button>
            </div>
          </section>
        )}

        {/* STEP 5: DONE / CONFIRMATION */}
        {step === "done" && (
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-200">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Your locker stays open
              </h2>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                You plan to return on{" "}
                <span className="font-bold text-emerald-800">
                  {new Date(selectedReturnDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {returnLabel ? ` (${returnLabel})` : ""}.
              </p>
              <p className="text-[11px] text-gray-400 mt-2">
                Your units remain safe in your folio. When your return date arrives,
                your plan will be ready to restart with a single confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/locker")}
              className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
            >
              Return to my locker
            </button>
          </section>
        )}
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}

export default function BreakFlowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center text-xs text-gray-400">
          Loading break assistant...
        </div>
      }
    >
      <BreakFlowContent />
    </Suspense>
  );
}
