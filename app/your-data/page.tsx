"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { useKeepsakeTick } from "@/components/keepsake/use-keepsake";
import { clearAll, deleteAllMemories, deleteReason, getFriend, getReason, listMemories, saveFriend } from "@/lib/keepsake";
import { Lock, Trash2 } from "lucide-react";

// Final MVP (8 Nov 2026): replaces Settings, Sign in and the consent form. There is no account: what the investor
// adds stays in this browser, questions to Sensecheck are not stored by this prototype, and everything can be deleted.
export default function YourDataPage() {
  const tick = useKeepsakeTick();
  const [hasReason, setHasReason] = useState(false);
  const [memoryCount, setMemoryCount] = useState(0);
  const [hasFriend, setHasFriend] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    getReason().then((r) => setHasReason(Boolean(r && (r.text || r.voice))));
    listMemories().then((l) => setMemoryCount(l.length));
    getFriend().then((f) => setHasFriend(Boolean(f.name)));
  }, [tick]);

  const run = async (fn: () => Promise<void>, msg: string) => {
    await fn();
    setDone(msg);
    setTimeout(() => setDone(null), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Your data" showBack backHref="/passbook" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-4">
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <h1 className="text-sm font-bold text-gray-900">What this prototype keeps</h1>
          </div>
          <ul className="space-y-2 text-xs text-gray-700 leading-relaxed list-disc pl-4">
            <li>
              <strong>No account.</strong> There is no sign-in, and the passbook shows sample data, not your real SIP.
            </li>
            <li>
              <strong>What you add stays on this device</strong>, in this browser: your reason for starting (text or
              voice), your memories for each month (photos, voice notes, lines) and the first name of the friend you
              ask. Nothing is uploaded.
            </li>
            <li>
              <strong>Questions to Sensecheck</strong> are sent to the AI model to write the answer. Account numbers,
              PAN and phone numbers are masked first. This prototype does not store your questions.
            </li>
            <li>
              <strong>The AI never sees</strong> your photos, voice notes, reason or lines.
            </li>
            <li>
              <strong>Ask a friend:</strong> you send the message from your own WhatsApp or messages app. Groww sends
              nothing and doesn&apos;t see the reply. No phone number is collected.
            </li>
            <li>
              <strong>Photos:</strong> location data is removed and the photo is made smaller before it is kept.
            </li>
          </ul>
          <p className="text-[11px] text-gray-500">
            In a real product, Groww would store these with your consent and let you export or delete them at any time.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3" data-testid="delete-section">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Delete what you added</h2>
          <p className="text-xs text-gray-700">
            On this device: {hasReason ? "your reason for starting" : "no reason for starting"} ·{" "}
            {memoryCount === 1 ? "1 memory" : `${memoryCount} memories`} ·{" "}
            {hasFriend ? "your friend's first name" : "no friend's name"}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run(deleteReason, "Your reason was deleted.")}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete my reason</span>
            </button>
            <button
              type="button"
              onClick={() => run(deleteAllMemories, "Your memories were deleted.")}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete all memories</span>
            </button>
            <button
              type="button"
              onClick={() => run(() => saveFriend({}), "Your friend's name was deleted.")}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget my friend&apos;s name</span>
            </button>
            <button
              type="button"
              onClick={() => run(clearAll, "Everything you added was deleted.")}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete everything I added</span>
            </button>
          </div>
          {done && (
            <p role="status" className="text-xs text-emerald-800">
              {done}
            </p>
          )}
        </section>

        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href="/quality" className="underline text-emerald-800">
            How answers are checked
          </Link>
          <Link href="/demo-tools" className="underline text-gray-700">
            Demo tools
          </Link>
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
