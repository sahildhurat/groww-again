"use client";

// Owner, 9 Nov: every month's money on its own page, one tap from the passbook cover.
import React from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { MonthList } from "@/components/passbook/month-list";
import { usePassbook } from "@/components/passbook/use-passbook";

export default function MonthsPage() {
  const { version, sip, instalments, memories } = usePassbook();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Every month" showBack backHref="/passbook" />
      <DemoBanner />
      <main className="flex-1 p-4 space-y-4">
        <MonthList sip={sip} instalments={instalments} version={version} memories={memories} />
      </main>
      <FooterNotice />
      <BottomNav />
    </div>
  );
}
