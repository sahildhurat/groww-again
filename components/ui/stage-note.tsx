"use client";

// Owner, 13 Nov 2026: on the home page, the desktop note beside the phone says who the concept is for and what its two
// ideas are, the passbook and the delivery tracker. Every other page keeps the short note. The note sits outside the
// phone frame and is hidden below 1100px (globals.css), so it is never part of the phone screen.
// It stays home-only on purpose: the e2e suite finds text with .first() on the other pages, and this copy uses the
// same everyday words as the app.
import { usePathname } from "next/navigation";
import { BookOpen, PackageCheck } from "lucide-react";

export function StageNote() {
  const home = usePathname() === "/";
  return (
    <aside className="stage-note" aria-label="About this prototype" data-testid="stage-note">
      <p className="stage-title">SIP Passbook</p>
      {home ? (
        <>
          <p className="stage-line">
            A concept for first-time investors in the first year of their first SIP. They are used to digital payments
            that land in seconds and to online orders they can follow step by step. A SIP instalment takes a few working
            days to become units, and in that gap the bank&apos;s SMS is all they see.
          </p>
          <div className="stage-idea">
            <span className="stage-icon">
              <BookOpen aria-hidden="true" />
            </span>
            <div>
              <p className="stage-label">The passbook</p>
              <p className="stage-text">
                Every month of the SIP in one scroll, like a bank passbook: what happened to that month&apos;s money and
                the units it bought.
              </p>
            </div>
          </div>
          <div className="stage-idea">
            <span className="stage-icon">
              <PackageCheck aria-hidden="true" />
            </span>
            <div>
              <p className="stage-label">The delivery tracker</p>
              <p className="stage-text">
                Each instalment is tracked like an online order: picked up from your bank, handed to the fund, delivered
                to your name as units. Every step shows its source and time.
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="stage-line">
          Your bank&apos;s SMS shows the money leaving. The passbook shows what it became: every month, from your bank to
          the units in your name. A concept for first-year SIP investors, shown at phone size.
        </p>
      )}
      <p className="stage-small">Not affiliated with Groww. All data is synthetic demo data.</p>
    </aside>
  );
}
