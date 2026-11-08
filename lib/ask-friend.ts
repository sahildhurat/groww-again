/**
 * Ask a friend (version B), final MVP, 8 Nov 2026 (Claude).
 *
 * Builds a plain, first-person summary of one instalment that the investor can send to ONE person they trust,
 * from their own WhatsApp or messages app. Groww sends nothing and stores nothing but the friend's first name
 * (on this device). Built in code from the passbook facts; no AI. The message deliberately leaves out reference
 * IDs, folio, fund name, bank and account details; the investor can edit or delete anything before sending.
 */
import type { Instalment } from "./passbook-types";
import { instalmentState } from "./passbook";
import { formatDate, formatDateTime } from "./format";

const REASON: Record<string, string> = {
  INSUFFICIENT_BALANCE: "My bank returned it for insufficient balance, so nothing was taken from my account.",
  MANDATE_NOT_APPROVED: "The app says the AutoPay mandate wasn't approved or active, so nothing was taken from my account.",
  ORDER_NOT_ACCEPTED: "The money left my bank but the order wasn't accepted, so it's being refunded to my account.",
  // used when the refund itself is confirmed (see the refunded case below)
  ORDER_NOT_ACCEPTED_REFUNDED: "The money left my bank but the order wasn't accepted, so it was refunded to my account",
  STATUS_UNAVAILABLE: "The app can't confirm the latest status right now.",
};

export const DEMO_NOTE = "(Sample data from a concept prototype.)";

/**
 * withAmount = false leaves out the rupee amount and the unit count, so the friend sees what happened but not how
 * much is invested. In the MVP sessions (9 Nov), participants deleted the rupee amount by hand before sending.
 */
export function friendMessage(entry: Instalment, friendName?: string, demo = true, withAmount = true): string {
  const hi = friendName?.trim() ? `Hi ${friendName.trim()}, ` : "Hi, ";
  const due = formatDate(entry.due_date);
  const amount = withAmount ? `₹${entry.amount.toLocaleString("en-IN")} ` : "";
  const debit = entry.events.find((e) => e.type === "debit");
  const order = entry.events.find((e) => e.type === "order");
  const allot = entry.events.find((e) => e.type === "allotment");
  const code = debit?.reason_code || order?.reason_code || allot?.reason_code || "";
  const reason = REASON[code] ?? "";
  let body: string;

  switch (instalmentState(entry)) {
    case "in_progress":
      body =
        `can I ask you something about my SIP? My ${amount}instalment for ${due} left my bank` +
        (debit?.effective_at ? ` on ${formatDateTime(debit.effective_at)}` : "") +
        `${order?.status === "confirmed" ? " and the order was placed" : ""}, but the units aren't confirmed yet` +
        (allot?.as_of ? ` (last checked ${formatDateTime(allot.as_of)})` : "") +
        ". Groww's help says units usually come two working days after the SIP date. Have you seen this before?";
      break;
    case "failed":
      body = `can I ask you something about my SIP? My ${amount}instalment for ${due} didn't go through. ${reason} Have you dealt with this before?`;
      break;
    case "refunded": {
      const refund = entry.events.find((e) => e.type === "refund" && e.status === "confirmed");
      const why =
        refund && code === "ORDER_NOT_ACCEPTED"
          ? `${REASON.ORDER_NOT_ACCEPTED_REFUNDED}${refund.effective_at ? ` on ${formatDate(refund.effective_at)}` : ""}.`
          : reason;
      body = `can I ask you something about my SIP? My ${amount}instalment for ${due} didn't become units. ${why} Have you had a refund like this?`;
      break;
    }
    case "unknown":
      body =
        `can I ask you something about my SIP? The app can't confirm the status of my ${amount}instalment for ${due} right now` +
        (allot?.as_of ? ` (as of ${formatDateTime(allot.as_of)})` : "") +
        ". How would you check it?";
      break;
    case "skipped":
      body = `can I ask you something about my SIP? I skipped my instalment for ${due}. Have you ever skipped one?`;
      break;
    default:
      body =
        `can I ask you something about my SIP? My ${amount}instalment for ${due} went through` +
        (!withAmount && entry.units ? " and the units are confirmed" : "") +
        (withAmount && entry.units ? `: ${entry.units.toFixed(3)} units` : "") +
        (allot?.effective_at ? ` on ${formatDate(allot.effective_at)}` : "") +
        ". Does yours show up like this too?";
  }
  return `${hi}${body}${demo ? `\n\n${DEMO_NOTE}` : ""}`;
}

/** WhatsApp's own share link: opens WhatsApp with the text; the investor picks the person there. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
