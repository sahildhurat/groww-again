"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { useDemo } from "@/lib/demo-context";
import { Calendar, RotateCcw, Check, Sparkles } from "lucide-react";

export default function DemoToolsPage() {
  const { simulatedDate, setSimulatedDate, resetDemoState } = useDemo();
  const [dateInput, setDateInput] = useState(simulatedDate);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatedDate(dateInput);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleReset = () => {
    resetDemoState();
    setDateInput("2026-11-05");
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const presetDates = [
    { label: "Default (5 Nov 2026)", date: "2026-11-05" },
    { label: "Month 12 Milestone (5 Dec 2026)", date: "2026-12-05" },
    { label: "Return Date Milestone (14 Mar 2027)", date: "2027-03-14" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Demo Tools" showBack backHref="/" />

      <main className="flex-1 p-4 space-y-5">
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Mentor Date Simulation Control
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Move the simulated &ldquo;today&rdquo; date to preview how the
            locker, return-date cards, and Year One recap behave at different
            milestones.
          </p>

          <form onSubmit={handleSaveDate} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Simulated &ldquo;Today&rdquo; Date (YYYY-MM-DD):
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
              >
                Apply Date
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="pt-2 space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Quick presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presetDates.map((p) => (
                <button
                  key={p.date}
                  type="button"
                  onClick={() => {
                    setDateInput(p.date);
                    setSimulatedDate(p.date);
                  }}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    simulatedDate === p.date
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {savedNotice && (
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center space-x-1.5 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Simulated date updated!</span>
            </div>
          )}
        </section>

        {/* Reset State Section */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-gray-800">
            <RotateCcw className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Reset Demo State
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Reverts all local memories, return dates, promises, and simulated
            status back to the pristine 11-month demo seed.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Reset all demo modifications
          </button>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
