import { z } from "zod";
import { instalmentState } from "@/lib/passbook";
import { getFailureCode } from "@/lib/failure-codes";
import { formatDate, formatDateTime } from "@/lib/format";
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

export function buildSensecheckFallback(
  instalment: Instalment | null,
  sip: PassbookSip
): SensecheckOutput {
  if (!instalment) {
    return {
      intent: "other",
      answer:
        "I can explain your instalments, units and the rules for skipping, pausing and stopping. Here is your passbook.",
      facts_used: [],
      sources: [],
      as_of: null,
      declined: false,
    };
  }

  if (instalment.skipped) {
    return {
      intent: "other",
      answer: "This instalment was skipped. No debit was attempted.",
      facts_used: [],
      sources: ["rule-skip-01"],
      as_of: null,
      declined: false,
    };
  }

  const state = instalmentState(instalment);
  const debitEvent = instalment.events.find((e) => e.type === "debit");
  const orderEvent = instalment.events.find((e) => e.type === "order");
  const allotmentEvent = instalment.events.find((e) => e.type === "allotment");
  const refundEvent = instalment.events.find((e) => e.type === "refund");

  switch (state) {
    case "allotted": {
      const debitDateStr = debitEvent?.effective_at
        ? formatDate(debitEvent.effective_at)
        : formatDate(instalment.due_date);
      const orderDateStr = orderEvent?.effective_at
        ? formatDate(orderEvent.effective_at)
        : debitDateStr;
      const unitsStr = (instalment.units ?? 0).toFixed(3);
      const navStr = (instalment.nav ?? 0).toFixed(2);
      const registrarLabel = allotmentEvent?.source_label ?? "registrar";

      return {
        intent: "allotment",
        answer: `The bank debited your account on ${debitDateStr}. The order was placed on ${orderDateStr}. ${unitsStr} units were allotted at a NAV of ₹${navStr}, confirmed by ${registrarLabel}.`,
        facts_used: [
          debitEvent?.id ?? "",
          orderEvent?.id ?? "",
          allotmentEvent?.id ?? "",
        ].filter(Boolean),
        sources: [],
        as_of: allotmentEvent?.as_of ?? null,
        declined: false,
      };
    }

    case "in_progress": {
      const timeFormatted = allotmentEvent?.as_of
        ? formatDateTime(allotmentEvent.as_of)
        : null;
      return {
        intent: "allotment",
        answer: `The bank debit was confirmed. The units are not confirmed yet.${
          timeFormatted ? ` Status as of ${timeFormatted}.` : ""
        } Check your Consolidated Account Statement (CAS) or contact support for the official record.`,
        facts_used: [debitEvent?.id ?? "", allotmentEvent?.id ?? ""].filter(
          Boolean
        ),
        sources: [],
        as_of: allotmentEvent?.as_of ?? null,
        declined: false,
      };
    }

    case "failed": {
      const code = debitEvent?.reason_code ?? "INSUFFICIENT_BALANCE";
      const fc = getFailureCode(code);
      return {
        intent: "payment_status",
        answer: fc
          ? `${fc.meaning} ${fc.money_status}`
          : "The debit was not successful. Nothing was taken from your bank account.",
        facts_used: [debitEvent?.id ?? ""].filter(Boolean),
        sources: fc?.rule_ids ?? [],
        as_of: debitEvent?.as_of ?? null,
        declined: false,
      };
    }

    case "refunded": {
      const fc = getFailureCode("ORDER_NOT_ACCEPTED");
      return {
        intent: "payment_status",
        answer: fc
          ? `${fc.meaning} ${fc.money_status}`
          : "The order was not accepted. The amount is refunded to your bank account.",
        facts_used: [refundEvent?.id ?? "", orderEvent?.id ?? ""].filter(
          Boolean
        ),
        sources: fc?.rule_ids ?? [],
        as_of: refundEvent?.as_of ?? null,
        declined: false,
      };
    }

    case "unknown": {
      const timeFormatted = allotmentEvent?.as_of
        ? formatDateTime(allotmentEvent.as_of)
        : null;
      return {
        intent: "payment_status",
        answer: `We can't confirm the latest status right now.${
          timeFormatted ? ` Status as of ${timeFormatted}.` : ""
        } Check the official statement (CAS) from MF Central, CAMS or KFintech, or contact support.`,
        facts_used: [],
        sources: [],
        as_of: allotmentEvent?.as_of ?? null,
        declined: false,
      };
    }

    default: {
      return {
        intent: "other",
        answer:
          "I can explain your instalments, units and the rules for skipping, pausing and stopping. Here is your passbook.",
        facts_used: [],
        sources: [],
        as_of: null,
        declined: false,
      };
    }
  }
}
