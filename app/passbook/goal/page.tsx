"use client";

// Owner, 9 Nov: the asset view on its own page. Version B: their goal, piece by piece. Version A: units by month.
import React from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { GoalPieces } from "@/components/keepsake/goal-pieces";
import { UnitsGrowth } from "@/components/ui/units-growth";
import { usePassbook } from "@/components/passbook/use-passbook";

export default function GoalPage() {
  const { version, sip, instalments, memories } = usePassbook();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title={version === "B" ? "Piece by piece" : "Units, month by month"} showBack backHref="/passbook" />
      <DemoBanner />
      <main className="flex-1 p-4 space-y-4">
        {version === "B" ? (
          <GoalPieces instalments={instalments} sip={sip} memories={memories} />
        ) : (
          <UnitsGrowth instalments={instalments} />
        )}
      </main>
      <FooterNotice />
      <BottomNav />
    </div>
  );
}
