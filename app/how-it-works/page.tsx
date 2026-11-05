import React from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const comparisons = [
    {
      moment: "A failed month",
      withoutAi: "A cryptic error code and 'check with your bank'.",
      withAi: "Reads the bank/mandate message, identifies the exact operational cause, and presents the fitting fix steps.",
    },
    {
      moment: "A reason to stop",
      withoutAi: "A rigid multi-choice picker that misses nuance.",
      withAi: "Reads your own words (including Hindi/Hinglish), picks the fitting operational path, and adopts a calm, unadorned tone in distress.",
    },
    {
      moment: "A return date",
      withoutAi: "A standard calendar date picker.",
      withAi: "Translates conversational milestones ('after sister's wedding in February', 'on my birthday') into a calendar date and confirms when vague.",
    },
    {
      moment: "A question",
      withoutAi: "Generic search through hundreds of public help articles.",
      withAi: "Answers directly from your own units, NAVs, and instalments, while firmly declining market advice.",
    },
    {
      moment: "A memory",
      withoutAi: "A passive photo gallery.",
      withAi: "Generates two verified sentences ('Your month, your money') linking your life events to rupee-cost averaging.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="How the AI Works" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            System Design
          </span>
          <h2 className="text-lg font-bold text-gray-900">
            Where AI earns its place
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            The SIP Locker uses AI strictly for language synthesis and nuance at
            moments of disruption. It never replaces deterministic financial
            rules.
          </p>
        </section>

        {/* Side-by-Side Comparison Cards */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
            Moments compared
          </h3>

          <div className="space-y-3">
            {comparisons.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5"
              >
                <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-1.5">
                  {item.moment}
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/60 flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-500 block text-[10px] uppercase">
                        Without AI
                      </span>
                      <p className="text-gray-600 mt-0.5">{item.withoutAi}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-800 block text-[10px] uppercase">
                        With Break Assistant
                      </span>
                      <p className="text-gray-800 mt-0.5">{item.withAi}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What the Assistant Will Never Do */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-gray-800">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              What the assistant will never do
            </h3>
          </div>

          <ul className="text-xs text-gray-700 space-y-2 pl-4 list-disc leading-relaxed">
            <li>
              <strong>Never recommend or switch funds:</strong> All product and fund questions are firmly declined with links to SEBI and AMFI investor resources.
            </li>
            <li>
              <strong>Never predict returns:</strong> No projections, targets, or forecasts of market movement.
            </li>
            <li>
              <strong>Never act on your account directly:</strong> The assistant cannot debit money, modify mandates, or initiate transactions. Every fix requires your direct bank authentication.
            </li>
            <li>
              <strong>Never employ guilt or dark patterns:</strong> No countdown timers, streaks, or shame language (&ldquo;don't quit&rdquo;, &ldquo;you promised&rdquo;).
            </li>
          </ul>
        </section>

        {/* Quality Gate Transparency */}
        <section className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-2">
          <p className="font-bold">Automated Safety &amp; Fallbacks</p>
          <p className="leading-relaxed">
            Every AI generation passes a 5-stage Quality Gate before reaching your
            screen. If any number fails to match the ledger within &plusmn;0.001,
            or if banned words are detected, the system automatically displays a
            standard deterministic template.
          </p>
          <Link
            href="/quality"
            className="inline-flex items-center text-xs font-bold text-emerald-800 hover:underline pt-1"
          >
            <span>Inspect Quality Gate thresholds &amp; eval results</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
