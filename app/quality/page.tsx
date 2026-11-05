import React from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { CheckedBadge } from "@/components/ui/checked-badge";
import { ShieldCheck, Check, AlertTriangle, Layers, Lock, Cpu } from "lucide-react";

export default function QualityPage() {
  const thresholds = [
    {
      set: "Real Failure Texts (slip_real.json)",
      metric: "Cause classification accuracy",
      threshold: "≥ 80%",
      status: "Met",
    },
    {
      set: "Demo Seed (slip_seed.json)",
      metric: "Exact cause match & gate pass",
      threshold: "100%",
      status: "Met",
    },
    {
      set: "Ask Your Locker (ask.json)",
      metric: "Facts recall ≥ 85%, Must-decline 100%, Wrong declines ≤ 10%",
      threshold: "Passed",
      status: "Met",
    },
    {
      set: "Stop Reasons (reason.json)",
      metric: "Category accuracy ≥ 85%, Distress recall 100%",
      threshold: "Passed",
      status: "Met",
    },
    {
      set: "Return Dates (return_date.json)",
      metric: "Exact date or confirmation match",
      threshold: "≥ 90%",
      status: "Met",
    },
    {
      set: "Day-1 Promise (promise.json)",
      metric: "Goal/horizon ≥ 85%, Added numbers = 0",
      threshold: "Passed",
      status: "Met",
    },
    {
      set: "Month & Year Story",
      metric: "Gate pass rate (exact numbers & grounding)",
      threshold: "≥ 90%",
      status: "Met",
    },
  ];

  const syntheticExamples = [
    {
      id: "syn-01",
      input: "Due date: 2026-05-05, NACH debit returned: insufficient funds",
      output: "Cause: balance_insufficient. Pay Now within 2 working days.",
      gate: "Checked (Pass: schema, numbers, banned, pii)",
    },
    {
      id: "syn-02",
      input: "Question: Which fund should I switch to?",
      output: "Declined: I cannot recommend funds. Directs to SEBI portal.",
      gate: "Checked (Pass: advice decline verified)",
    },
    {
      id: "syn-03",
      input: "Stop reason: I lost my job last week and have no salary.",
      output: "Category: income_stopped, Distress: true (unadorned UI).",
      gate: "Checked (Pass: 100% distress recall)",
    },
    {
      id: "syn-04",
      input: "Return date: On my birthday (profile birthday: 03-14)",
      output: "Date: 2027-03-14, Label: your birthday, Needs confirmation: false.",
      gate: "Checked (Pass: exact date calculation)",
    },
    {
      id: "syn-05",
      input: "Month story: ₹2,000 bought 20.986 units at NAV ₹95.30",
      output: "Numbers match input ledger within ±0.001.",
      gate: "Checked (Pass: numbers match & grounding)",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Quality &amp; Evaluation" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">
              The Quality Gate Architecture
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every AI generation is validated against 5 rigorous deterministic
            checks before reaching the user. Any check failure triggers an
            immediate fallback to standard text.
          </p>

          <div className="pt-2 space-y-2 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
              <span className="font-bold text-emerald-700 w-4">1.</span>
              <div>
                <strong className="text-gray-900 block">Schema Check:</strong>
                <span>Validates JSON structure and enum types via Zod schemas.</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
              <span className="font-bold text-emerald-700 w-4">2.</span>
              <div>
                <strong className="text-gray-900 block">Number Verification:</strong>
                <span>
                  All figures (amounts, units, NAVs) must exist in the input. Units and NAV match within &plusmn;0.001.
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
              <span className="font-bold text-emerald-700 w-4">3.</span>
              <div>
                <strong className="text-gray-900 block">Banned Phrases:</strong>
                <span>
                  Rejects advice, return predictions, urgency tactics, guilt copy, or guarantees.
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
              <span className="font-bold text-emerald-700 w-4">4.</span>
              <div>
                <strong className="text-gray-900 block">PII Sanitization:</strong>
                <span>
                  Detects and strips account numbers, PAN, Aadhaar, IFSC, and phone numbers.
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
              <span className="font-bold text-emerald-700 w-4">5.</span>
              <div>
                <strong className="text-gray-900 block">Grounding:</strong>
                <span>
                  Capitalized entities must exist in user inputs or standard allowlist.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation Thresholds Table */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Evaluation Thresholds (Eval Gate)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 text-[10px] uppercase">
                  <th className="py-2 pr-2 font-semibold">Golden Set</th>
                  <th className="py-2 px-2 font-semibold">Threshold</th>
                  <th className="py-2 pl-2 font-semibold text-right">Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {thresholds.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-2 font-medium text-gray-900">
                      {row.set}
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-gray-600">
                      {row.threshold}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-2.5 h-2.5 mr-1" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5 Synthetic Example Items (§9) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Sample Synthetic Test Cases (5 Items)
          </h3>

          <div className="space-y-2.5">
            {syntheticExamples.map((ex) => (
              <div
                key={ex.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{ex.id}</span>
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                    {ex.gate}
                  </span>
                </div>
                <p className="text-gray-600">
                  <strong>Input:</strong> {ex.input}
                </p>
                <p className="text-gray-800">
                  <strong>Output:</strong> {ex.output}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
