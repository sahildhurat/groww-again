"use client";

import React from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary } from "@/lib/seed";
import { Printer, Shield, Award, Calendar, FileText } from "lucide-react";

export default function CertificatePage() {
  const { sip, instalments } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Certificate of Holding" showBack backHref="/locker" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        {/* Certificate Frame Container */}
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-700/20 shadow-md space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
          {/* Decorative Corner Filigrees / Borders */}
          <div className="absolute top-2 left-2 right-2 bottom-2 border border-emerald-600/10 rounded-2xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="text-center space-y-2 relative">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 mx-auto border border-emerald-200">
              <Award className="w-6 h-6 stroke-[1.8]" />
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-800 uppercase">
                Certificate of Holding
              </p>
              <h2 className="text-xl font-serif font-bold text-gray-900 mt-1">
                The SIP Locker
              </h2>
            </div>

            <p className="text-[11px] text-gray-400 max-w-xs mx-auto italic">
              Keepsake for the family file &bull; Not a statement of account or unit certificate
            </p>
          </div>

          {/* Investor & SIP Details */}
          <div className="space-y-4 text-center border-y border-gray-100 py-4 relative">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                Presented to
              </span>
              <p className="text-lg font-bold text-gray-900 font-serif">
                Demo investor
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  SIP Name
                </span>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {sip.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  Fund
                </span>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">
                  {sip.fund_label}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  First Instalment
                </span>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">
                  5 December 2025
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  Months Invested
                </span>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">
                  {summary.paidCount} paid instalments
                </p>
              </div>
            </div>

            {/* Holdings (Units ONLY, strictly NO rupees or returns) */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                Units Held in Folio
              </span>
              <p className="text-2xl font-bold font-serif text-emerald-900">
                {summary.totalUnits.toFixed(3)}
              </p>
              <p className="text-[10px] text-emerald-700/70">
                Units are part-ownership in the underlying portfolio companies.
              </p>
            </div>

            {/* Day-1 Promise Excerpt */}
            {sip.promise_text && (
              <div className="space-y-1 text-left px-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  Day-1 Promise
                </span>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  &ldquo;{sip.promise_text}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Official Compliance Notice & Signature Line */}
          <div className="pt-2 text-[10px] text-gray-400 text-center space-y-3">
            <p className="leading-snug">
              Official records of unit holdings are maintained by the Mutual Fund
              Asset Management Company (AMC) and Registrar. This document serves
              as a personal keepsake and contains no financial valuation or
              performance metrics.
            </p>

            <div className="pt-4 flex justify-between items-end border-t border-gray-100 text-gray-500">
              <div className="text-left">
                <p className="text-[10px] font-medium text-gray-700">The SIP Locker</p>
                <p className="text-[9px]">Concept Prototype</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-medium text-gray-700">Keepsake Edition</p>
                <p className="text-[9px]">Issued Nov 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Action Button */}
        <div className="no-print pt-2">
          <button
            onClick={handlePrint}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
