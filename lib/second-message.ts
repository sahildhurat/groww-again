// Final feature (8 Nov 2026): "The second message". The bank's SMS is the only thing an investor sees on SIP day,
// and it only shows money leaving. Groww sends a matching message at each step: when the order is placed, when the
// units are in the investor's name (with what they now own), and plainly when something fails or is refunded.
// Built in code from the passbook events (no AI). Never contains reference IDs, folio, account numbers or advice, and
// never predicts a date: timing is stated as Groww's rule (T+2 for Groww AutoPay).
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import { instalmentState } from "@/lib/passbook";
import { formatDate, formatDateTime } from "@/lib/format";

export interface PhoneMessage {
  from: "bank" | "groww";
  at: string; // ISO time the message would arrive
  title: string;
  body: string;
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Units in the investor's name after this instalment (confirmed allotments up to and including it). */
export function unitsAfter(instalments: Instalment[], inst: Instalment): number {
  const sum = instalments
    .filter((i) => i.due_date <= inst.due_date && instalmentState(i) === "allotted")
    .reduce((s, i) => s + (i.units ?? 0), 0);
  return Math.round(sum * 1000) / 1000;
}

export function messagesFor(inst: Instalment, instalments: Instalment[], sip: PassbookSip): PhoneMessage[] {
  const ev = (t: string) => inst.events.find((e) => e.type === t);
  const debit = ev("debit");
  const order = ev("order");
  const allot = ev("allotment");
  const refund = ev("refund");
  const day = formatDate(inst.due_date);
  const amt = rupees(inst.amount);
  const out: PhoneMessage[] = [];
  const state = instalmentState(inst);

  if (state === "skipped") {
    out.push({
      from: "groww",
      at: `${inst.due_date}T08:00:00+05:30`,
      title: "Instalment skipped",
      body: `You skipped the ${day} instalment. Nothing will be debited this month. Your SIP continues next month.`,
    });
    return out;
  }

  if (debit?.status === "confirmed" && debit.effective_at) {
    out.push({
      from: "bank",
      at: debit.effective_at,
      title: "Your bank",
      body: `${amt} debited from your account on ${day} towards a SIP payment.`,
    });
  }

  if (debit?.status === "failed") {
    out.push({
      from: "groww",
      at: debit.effective_at ?? debit.as_of,
      title: "Instalment not debited",
      body: `Your ${day} instalment of ${amt} could not be debited because of insufficient balance. No money left your account. Pay Now stays open for 2 working days.`,
    });
    return out;
  }

  if (order?.status === "confirmed" && order.effective_at) {
    out.push({
      from: "groww",
      at: order.effective_at,
      title: "Order placed",
      body: `Your ${amt} reached the fund and your order is placed. With ${sip.payment_route ?? "Groww AutoPay"}, units are expected two working days after the SIP date (T+2). We'll message you when they are in your name.`,
    });
  }

  if (order?.status === "failed") {
    out.push({
      from: "groww",
      at: order.effective_at ?? order.as_of,
      title: "Order not accepted",
      body: `The fund did not accept your ${day} order. Your ${amt} will be refunded to your bank account.`,
    });
  }

  if (refund?.status === "confirmed" && refund.effective_at) {
    out.push({
      from: "groww",
      at: refund.effective_at,
      title: "Refund done",
      body: `${amt} from your ${day} instalment was refunded to your bank account on ${formatDate(refund.effective_at)}.`,
    });
  }

  if (allot?.status === "confirmed" && inst.units) {
    out.push({
      from: "groww",
      at: allot.effective_at ?? allot.as_of,
      title: "Units in your name",
      body: `${amt} from ${day} is now ${inst.units.toFixed(3)} units in your name. You now own ${unitsAfter(instalments, inst).toFixed(3)} units.`,
    });
  }

  if (allot?.status === "unknown") {
    out.push({
      from: "groww",
      at: allot.as_of,
      title: "Checking your units",
      body: `We can't confirm your ${day} units right now (last checked ${formatDateTime(allot.as_of)}). Your bank debit and order are confirmed. We'll message you as soon as we can confirm.`,
    });
  }

  return out.sort((a, b) => a.at.localeCompare(b.at));
}
