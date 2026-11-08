"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useDemo } from "@/lib/demo-context";
import { clearAll as clearKeepsake } from "@/lib/keepsake";
import { RotateCcw, Check, SlidersHorizontal, Layers, PlayCircle } from "lucide-react";

export default function DemoToolsPage() {
  const { version, setVersion, scenario, setScenario, resetDemoState } = useDemo();
  const [savedNotice, setSavedNotice] = useState(false);
  // Owner, 9 Nov: only version B is shown. The A/B switch is hidden; /demo-tools?ab=1 shows it (tests, owner).
  const [abVisible, setAbVisible] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("ab") === "1") {
        sessionStorage.setItem("sip_passbook_ab_unlocked_v1", "1");
        setAbVisible(true);
      } else if (sessionStorage.getItem("sip_passbook_ab_unlocked_v1") === "1") {
        setAbVisible(true);
      } else if (version !== "B") {
        setVersion("B");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async () => {
    resetDemoState();
    await clearKeepsake();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Demo Tools" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        {/* Version Switch (hidden unless /demo-tools?ab=1) */}
        {abVisible && (
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Prototype Version (A / B)
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Switch between the baseline passbook and the experimental personal layer.
          </p>

          <div className="space-y-2 pt-1">
            <label
              className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                version === "A"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="version"
                value="A"
                checked={version === "A"}
                onChange={() => setVersion("A")}
                className="mt-0.5 mr-2.5"
                aria-label="Version A (ledger only)"
              />
              <div>
                <strong className="block text-gray-900">Version A (Ledger only)</strong>
                <span className="text-[11px] text-gray-500">
                  The passbook with every month&apos;s money flow, Sensecheck and What can I do next? No personal layer.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                version === "B"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="version"
                value="B"
                checked={version === "B"}
                onChange={() => setVersion("B")}
                className="mt-0.5 mr-2.5"
                aria-label="Version B (personal layer)"
              />
              <div>
                <strong className="block text-gray-900">Version B (+ Personal Layer)</strong>
                <span className="text-[11px] text-gray-500">
                  Adds the personal layer: a memory for any month (a photo, a voice note or a line), Piece by piece and Ask a friend.
                </span>
              </div>
            </label>
          </div>
        </section>
        )}

        {/* Scenario Switch */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <PlayCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Passbook Scenario
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Choose what the demo SIP looks like:
          </p>

          <div className="space-y-2 pt-1">
            <label
              className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scenario === "running"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                value="running"
                checked={scenario === "running"}
                onChange={() => setScenario("running")}
                className="mt-0.5 mr-2.5"
                aria-label="running"
              />
              <div>
                <strong className="block text-gray-900">Running SIP (default)</strong>
                <span className="text-[11px] text-gray-500">
                  Active SIP, 12 instalments (Dec 2025 – Nov 2026). November was debited and the order placed; units are not confirmed yet.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scenario === "stopped"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                value="stopped"
                checked={scenario === "stopped"}
                onChange={() => setScenario("stopped")}
                className="mt-0.5 mr-2.5"
                aria-label="stopped"
              />
              <div>
                <strong className="block text-gray-900">Stopped SIP</strong>
                <span className="text-[11px] text-gray-500">
                  Stopped on 20 Oct 2026. 11 instalments (Dec 2025 – Oct 2026), no November instalment.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scenario === "stale"
                  ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="scenario"
                value="stale"
                checked={scenario === "stale"}
                onChange={() => setScenario("stale")}
                className="mt-0.5 mr-2.5"
                aria-label="stale"
              />
              <div>
                <strong className="block text-gray-900">Status can&apos;t be confirmed</strong>
                <span className="text-[11px] text-gray-500">
                  Like the running SIP, but the November units can&apos;t be confirmed (last checked 5 Nov 2026, 11:40 IST).
                </span>
              </div>
            </label>
          </div>
        </section>

        <Link
          href="/passbook"
          className="block w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
        >
          Open the passbook
        </Link>

        {/* Reset State Section */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-gray-800">
            <RotateCcw className="w-4 h-4 text-gray-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Reset Demo State
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Clears everything added on this device (memories and your friend&apos;s name) and goes back to the running SIP.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Reset demo modifications
          </button>

          {savedNotice && (
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center space-x-1.5 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Demo state reset!</span>
            </div>
          )}
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
