import { z } from "zod";
import { confirmedTotals, instalmentState, lastFullyConfirmed, latestInstalment, valueAt } from "@/lib/passbook";
import { getFailureCode } from "@/lib/failure-codes";
import { formatDate, formatDateTime } from "@/lib/format";
import { payNowWindowClosed } from "@/lib/demo-now";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";

export const SensecheckOutputSchema = z.object({
  intent: z.enum([
    "payment_status",
    "allotment",
    "valuation",
    "options",
    "affordability",
    "advice_request",
    "other",
  ]),
  answer: z.string(),
  facts_used: z.array(z.string()),
  sources: z.array(z.string()),
  as_of: z.string().nullable(),
  declined: z.boolean(),
});

export type SensecheckOutput = z.infer<typeof SensecheckOutputSchema>;

export const ADVICE_PREFILTER_PHRASES = [
  "which fund",
  "best fund",
  "good fund",
  "should i stop",
  "should i continue",
  "should i invest",
  "will the market",
];

export function isAdviceQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return ADVICE_PREFILTER_PHRASES.some((phrase) => lower.includes(phrase));
}

/**
 * Extracts and parses the first JSON object from a string,
 * ignoring any introductory/concluding prose or markdown code fences.
 */
export function extractFirstJsonBlock(text: string): any {
  let str = text;

  // If wrapped in markdown code fence, extract fence content first
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    str = fenceMatch[1];
  }

  const firstOpen = str.indexOf("{");
  if (firstOpen === -1) {
    throw new Error("No JSON object found in text");
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let lastClose = -1;

  for (let i = firstOpen; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth === 0) {
          lastClose = i;
          break;
        }
      }
    }
  }

  if (lastClose === -1) {
    throw new Error("Unclosed JSON object in text");
  }

  const jsonSubstring = str.substring(firstOpen, lastClose + 1);
  return JSON.parse(jsonSubstring);
}

// 9 Nov 2026 (Claude, live check): the fixed answers are what the investor sees whenever the AI is off or an answer
// fails a check, so they now carry the same facts and Groww rules as the passbook page: every step with its time, the
// rule that applies, and where to go next. A question asked without a month gets the Groww help passage on its topic
// (word for word from data/rules.json, or computed from the passbook), never a bare "here is your passbook".

export interface FallbackContext {
  question?: string;
  instalments?: Instalment[];
}

const inr = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
const OFFICIAL_RECORD =
  "Your official record is your Consolidated Account Statement (CAS), from MF Central, CAMS or KFintech.";
const NEXT_STEPS = "What can I do next? lists each change with Groww's rule.";

function arrivalRule(sip: PassbookSip): string {
  return sip.payment_route && sip.payment_route !== "Groww AutoPay"
    ? "Groww's help says units are expected T+5 or T+6 with a BSE mandate"
    : "Groww's help says units are expected two working days after the SIP date (T+2) with Groww AutoPay";
}

type Topic =
  | "mandate"
  | "change_bank"
  | "affordability"
  | "skip"
  | "restart"
  | "stop"
  | "safety"
  | "value"
  | "refund"
  | "status"
  | "general";

export function fallbackTopic(question: string | undefined): Topic {
  const q = (question ?? "").toLowerCase();
  if (!q.trim()) return "general";
  if (/mandate|auto ?-?pay/.test(q) && /approv|reject|fail|not active|declin|pending/.test(q)) return "mandate";
  if (/(change|switch|move|shift|new|another|different)\b.*\b(bank|account)|salary account|bank account (changed|closed)/.test(q))
    return "change_bank";
  if (/afford|lost (my )?job|job loss|no income|can'?t pay|cannot pay|short of (money|cash)|tight (month|on money)/.test(q))
    return "affordability";
  if (/\b(pause|skip|break|hold)\b/.test(q)) return "skip";
  if (/restart|start again|resume|re-?start|come back/.test(q)) return "restart";
  if (/\bstop|\bcancel|\bclose\b|\bend\b/.test(q)) return "stop";
  if (/\bsafe|safety|shut ?down|fraud|scam|trust/.test(q)) return "safety";
  if (/return|profit|loss|value|xirr|gain|worth|lower|down|red\b/.test(q)) return "value";
  if (/refund|money back|returned/.test(q)) return "refund";
  if (/unit|allot|debit|deduct|kat gaya|katt?a|order|pending|processing|where.*money|not (yet )?(come|came|show|visible)|instal?ment|status/.test(q))
    return "status";
  return "general";
}

function out(intent: SensecheckOutput["intent"], answer: string, sources: string[] = [], as_of: string | null = null, facts: string[] = []): SensecheckOutput {
  return { intent, answer, facts_used: facts, sources, as_of, declined: false };
}

function topicFallback(topic: Topic, sip: PassbookSip, instalments: Instalment[]): SensecheckOutput | null {
  const totals = confirmedTotals(instalments);
  const last = lastFullyConfirmed(instalments);
  switch (topic) {
    case "mandate":
      return out(
        "payment_status",
        "If the AutoPay mandate is not approved or not active, the instalment fails and nothing is taken from your bank account. Groww's help: \"Your SIP might still be linked to a previously rejected AutoPay. Click on 'MY SIPs' and switch to an approved AutoPay.\" It also says approval takes up to 24 hours through UPI, 2 working days through OTP and 21 working days through a form. Three missed instalments in a row cancel a SIP.",
        ["rule-autopay-reset-01", "rule-change-bank-01", "rule-three-miss-01"]
      );
    case "change_bank":
      return out(
        "options",
        "Groww's help: \"To change AutoPay or bank for your SIP: 1. Go to the SIPs section. 2. Select the SIP you want to update. 3. Click 'CHANGE AUTOPAY' and choose the new bank.\" If the new bank has no AutoPay yet, set it up in the 'Bank and AutoPay' section first.",
        ["rule-change-bank-01"]
      );
    case "affordability":
      return out(
        "affordability",
        `Groww's help describes these changes, in no particular order: skip one instalment (three in a row cancel the SIP), change the amount or date, change the AutoPay bank, or stop future instalments (what you have invested stays until you redeem it). None of them is a recommendation. ${NEXT_STEPS}`,
        ["rule-skip-01", "rule-change-amount-01", "rule-change-bank-01", "rule-cancel-01"]
      );
    case "skip":
      return out(
        "options",
        `Groww's help: "Currently, you can skip only one SIP installment at a time. After skipping one, you can request to skip another installment for the same SIP once the first skipped installment date has passed." If you skip three instalments in a row, the SIP is cancelled automatically, and a skip asked for within two days of the next instalment applies to the ones after it. ${NEXT_STEPS}`,
        ["rule-skip-01"]
      );
    case "restart":
      return out(
        "options",
        `Groww's help: once you place a request to cancel a SIP, it cannot be undone. "You can create a new SIP in the same fund, and the amount will be added to the investment." ${NEXT_STEPS}`,
        ["rule-restart-01"]
      );
    case "stop":
      return out(
        "options",
        `Groww's help: "Canceling the SIP will stop future installments, but your invested amount will remain as is until you redeem it." There is no charge for cancelling. A cancel request can't be undone, and you can't cancel while the next instalment is due within 7 days. ${NEXT_STEPS}`,
        ["rule-cancel-01", "rule-cancel-02", "rule-cancel-timing-01"]
      );
    case "safety":
      return out(
        "other",
        `Sensecheck can't judge safety or give guarantees. Your passbook shows ${totals.units.toFixed(3)} units confirmed in your name across ${totals.count} instalments${last ? `, the last fully confirmed on ${formatDate(last.due_date)}` : ""}. ${OFFICIAL_RECORD}`
      );
    case "value": {
      const value = valueAt(totals, sip.latest_nav);
      const diff = value - totals.amount_put_in;
      const pct = totals.amount_put_in ? Math.round((diff / totals.amount_put_in) * 10000) / 100 : 0;
      return out(
        "valuation",
        `At the latest NAV of ₹${sip.latest_nav.toFixed(2)} (${formatDate(sip.latest_nav_date)}), your ${totals.units.toFixed(3)} confirmed units are worth ${inr(value)}, against ${inr(totals.amount_put_in)} put in across ${totals.count} instalments: ${diff < 0 ? "−" : "+"}${inr(diff)} (${diff < 0 ? "−" : "+"}${Math.abs(pct).toFixed(2)}%). This is a simple difference, not an annualised return. Value can go up or down with the NAV; the number of units doesn't change.`
      );
    }
    case "refund":
      return out(
        "payment_status",
        "Groww's help: \"If the amount has been debited from your bank account but your order has failed then you will receive a refund within 7 working days. If it has been more than 7 working days and you have still not received the amount, then please contact us\". Open the month in your passbook to see its refund step.",
        ["rule-refund-01"]
      );
    default:
      return null;
  }
}


const MONTH_WORDS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** The instalment for a month the question names ("my September money"), latest first; null when none is named. */
export function monthNamedIn(question: string | undefined, instalments: Instalment[]): Instalment | null {
  const q = (question ?? "").toLowerCase();
  const m = q.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/);
  if (!m) return null;
  // "May I skip next month?" is not about May: the word counts as a month only next to a month-like word.
  if (m[1] === "may" && !/\b(in|for|the|my|of|missed|last|this)\s+may\b|\bmay\s+(instal|sip|money|payment|debit|20\d\d)/.test(q)) return null;
  const month = MONTH_WORDS.indexOf(m[1].slice(0, 3)) + 1;
  const hits = instalments
    .filter((i) => Number(i.due_date.slice(5, 7)) === month)
    .sort((a, b) => b.due_date.localeCompare(a.due_date));
  return hits[0] ?? null;
}

export function buildSensecheckFallback(
  instalment: Instalment | null,
  sip: PassbookSip,
  ctx: FallbackContext = {}
): SensecheckOutput {
  const all = ctx.instalments ?? [];
  if (!instalment) {
    const named = monthNamedIn(ctx.question, all);
    if (named) return buildSensecheckFallback(named, sip, {});
    let topic = fallbackTopic(ctx.question);
    // "Did I lose my units?" after a stop is a question about stopping, not about the latest instalment.
    if (topic === "status" && sip.status === "stopped" && /\b(lose|lost|gone)\b/i.test(ctx.question ?? "")) topic = "stop";
    if (topic === "status" && all.length) {
      const latest = latestInstalment(all);
      if (latest) return buildSensecheckFallback(latest, sip, {});
    }
    const routed = topicFallback(topic, sip, all);
    if (routed) return routed;
    return out(
      "other",
      "Sensecheck couldn't give a checked answer to this question. Your passbook shows every instalment's steps with their source and time, and What can I do next? links to Groww's rules. Sensecheck doesn't give investment advice."
    );
  }

  if (instalment.skipped) {
    return out("other", "This instalment was skipped by you. No debit was attempted, and no units were bought for it. Three missed or skipped instalments in a row cancel a SIP.", ["rule-skip-01"]);
  }

  const state = instalmentState(instalment);
  const debitEvent = instalment.events.find((e) => e.type === "debit");
  const orderEvent = instalment.events.find((e) => e.type === "order");
  const allotmentEvent = instalment.events.find((e) => e.type === "allotment");
  const refundEvent = instalment.events.find((e) => e.type === "refund");
  const at = (iso: string | null | undefined) => (iso ? formatDateTime(iso) : null);

  switch (state) {
    case "allotted": {
      const debitDateStr = debitEvent?.effective_at ? formatDate(debitEvent.effective_at) : formatDate(instalment.due_date);
      const orderDateStr = orderEvent?.effective_at ? formatDate(orderEvent.effective_at) : debitDateStr;
      const unitsStr = (instalment.units ?? 0).toFixed(3);
      const navStr = (instalment.nav ?? 0).toFixed(2);
      const registrarLabel = allotmentEvent?.source_label ?? "registrar";
      const allotStr = allotmentEvent?.effective_at ? ` on ${formatDate(allotmentEvent.effective_at)}` : "";
      return out(
        "allotment",
        `The bank debited your account on ${debitDateStr}. The order was placed on ${orderDateStr}. ${unitsStr} units were allotted at a NAV of ₹${navStr}, confirmed by ${registrarLabel}${allotStr}.`,
        [],
        allotmentEvent?.as_of ?? null,
        [debitEvent?.id ?? "", orderEvent?.id ?? "", allotmentEvent?.id ?? ""].filter(Boolean)
      );
    }

    case "in_progress": {
      const debitAt = at(debitEvent?.effective_at);
      const orderAt = orderEvent?.status === "confirmed" ? at(orderEvent.effective_at) : null;
      const checked = at(allotmentEvent?.as_of);
      return out(
        "allotment",
        `Your bank confirmed the debit${debitAt ? ` on ${debitAt}` : ""}${orderAt ? `, and the order was placed on ${orderAt}` : ""}. The units are not confirmed yet${checked ? ` (status as of ${checked})` : ""}. ${arrivalRule(sip)}, and to contact support if units are not allotted after 6 working days.`,
        ["rule-allotment-03", "rule-allotment-02"],
        allotmentEvent?.as_of ?? null,
        [debitEvent?.id ?? "", orderEvent?.id ?? "", allotmentEvent?.id ?? ""].filter(Boolean)
      );
    }

    case "failed": {
      const code = debitEvent?.reason_code ?? "INSUFFICIENT_BALANCE";
      const fc = getFailureCode(code);
      const extra =
        code === "INSUFFICIENT_BALANCE"
          ? ` Groww's help says a Pay Now option is available for 2 working days after a debit fails for insufficient balance${
              payNowWindowClosed(debitEvent?.effective_at ?? debitEvent?.as_of) === true
                ? "; for this instalment that window has closed. It also describes paying a missed month as a one-time investment in the same fund, which some funds don't allow"
                : ""
            }. Three missed instalments in a row cancel a SIP.`
          : " Three missed instalments in a row cancel a SIP.";
      return out(
        "payment_status",
        fc ? `${fc.meaning} ${fc.money_status}${extra}` : `The debit was not successful. Nothing was taken from your bank account.${extra}`,
        fc?.rule_ids ?? [],
        debitEvent?.as_of ?? null,
        [debitEvent?.id ?? ""].filter(Boolean)
      );
    }

    case "refunded": {
      const debitAt = at(debitEvent?.effective_at);
      const orderAt = at(orderEvent?.effective_at);
      const refundDone = refundEvent?.status === "confirmed" && refundEvent.effective_at;
      return out(
        "payment_status",
        `Your bank confirmed the debit${debitAt ? ` on ${debitAt}` : ""}, but the order was not accepted${orderAt ? ` (${orderAt})` : ""}, so no units were bought. ${
          refundDone
            ? `The full ${inr(instalment.amount)} came back to your bank on ${formatDateTime(refundEvent!.effective_at!)}.${
                // R48 (Claude, 9 Nov): a question about how long a refund takes gets Groww's rule as well (eval sc08).
                /\bhow long\b|\bwhen\b|\bdays?\b|\btakes?\b|\btime\b/i.test(ctx.question ?? "")
                  ? " Groww's help says a refund for a failed order comes within 7 working days."
                  : ""
              }`
            : "The amount is refunded to your bank account; Groww's help says within 7 working days."
        }`,
        ["rule-refund-01"],
        refundEvent?.as_of ?? null,
        [refundEvent?.id ?? "", orderEvent?.id ?? ""].filter(Boolean)
      );
    }

    case "unknown": {
      const debitAt = debitEvent?.status === "confirmed" ? at(debitEvent.effective_at) : null;
      const orderAt = orderEvent?.status === "confirmed" ? at(orderEvent.effective_at) : null;
      const checked = at(allotmentEvent?.as_of);
      return out(
        "payment_status",
        `${debitAt ? `Your bank confirmed the debit on ${debitAt}${orderAt ? `, and the order was placed on ${orderAt}` : ""}. ` : ""}We can't confirm the units step right now${checked ? ` (last checked ${checked})` : ""}. ${OFFICIAL_RECORD}`,
        [],
        allotmentEvent?.as_of ?? null
      );
    }

    default:
      return out(
        "other",
        "Sensecheck couldn't give a checked answer to this question. Your passbook shows every instalment's steps with their source and time. Sensecheck doesn't give investment advice."
      );
  }
}
