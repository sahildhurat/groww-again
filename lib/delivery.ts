// Delivery tracker wording (8 Nov 2026): the money trail read like a parcel. Every phrase maps to one confirmed event
// from the passbook; arrival is only ever stated as Groww's rule (T+2 for Groww AutoPay, T+5 or T+6 for a BSE mandate),
// never as a date, and "Delivered" appears only after the registrar confirms the units.
import type { Instalment } from "@/lib/passbook-types";
import { formatDate, formatDateTime } from "@/lib/format";

export function deliveryLine(inst: Instalment, paymentRoute?: string): string | null {
  if (inst.skipped) return null;
  const ev = (t: string) => inst.events.find((e) => e.type === t);
  const debit = ev("debit");
  const order = ev("order");
  const allot = ev("allotment");
  const refund = ev("refund");
  const rule =
    paymentRoute && paymentRoute !== "Groww AutoPay"
      ? "units are expected T+5 or T+6 with a BSE mandate"
      : "units are expected two working days after the SIP date (T+2) with Groww AutoPay";

  if (debit?.status === "failed") return "Not picked up: no money left your account.";
  if (order?.status === "failed") {
    return refund?.status === "confirmed" && refund.effective_at
      ? `Returned to your bank on ${formatDate(refund.effective_at)}: no money lost.`
      : "Not accepted by the fund: the money is being returned to your bank.";
  }
  if (allot?.status === "confirmed") return `Delivered to your name: ${inst.units ? `${inst.units.toFixed(3)} units` : "units allotted"}.`;
  if (allot?.status === "unknown")
    return `Picked up and handed to the fund. Delivery can't be confirmed right now (last checked ${formatDateTime(allot.as_of)}).`;
  if (allot?.status === "pending" && order?.status === "confirmed")
    return `Picked up from your bank and handed to the fund. Not delivered to your name yet: ${rule}.`;
  if (debit?.status === "confirmed") return "Picked up from your bank. Not handed to the fund yet.";
  return null;
}
