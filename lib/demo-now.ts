// R45 (Claude, 8 Nov 2026): the demo's "now" (SPEC-07 §4.4) in one place, shared by the pages and the Sensecheck route,
// and the Pay Now window from Groww's help ("This option will be available for 2 working days", rule-pay-now-01).
// Working days here skip Saturdays and Sundays only; market holidays are not modelled, so the page never shows a
// computed closing date, only whether the window is plainly still open or has closed.

export const DEMO_NOW_ISO = "2026-11-06T10:30:00+05:30";
export const DEMO_NOW_DISPLAY = "6 Nov 2026, 10:30 IST";

/** The IST calendar date ("YYYY-MM-DD") of an ISO timestamp. */
function istDate(iso: string): string {
  const d = new Date(iso);
  const ist = new Date(d.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/** Adds n working days (Mon–Fri) to a "YYYY-MM-DD" date. */
export function addWorkingDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Whether the Pay Now window (2 working days after a debit failed for insufficient balance) has closed at the demo's now.
 * Returns null when the failure time is not known.
 */
export function payNowWindowClosed(failedAtIso: string | null | undefined, nowIso: string = DEMO_NOW_ISO): boolean | null {
  if (!failedAtIso) return null;
  const lastOpenDay = addWorkingDays(istDate(failedAtIso), 2);
  return istDate(nowIso) > lastOpenDay;
}
