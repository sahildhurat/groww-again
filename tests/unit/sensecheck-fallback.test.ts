import { describe, it, expect } from "vitest";
import {
  buildSensecheckFallback,
  isAdviceQuery,
  extractFirstJsonBlock,
} from "../../lib/sensecheck-fallback";
import type { Instalment, PassbookSip } from "../../lib/passbook-types";
import seedData from "../../data/passbook-seed.json";

const running = (seedData as any).scenarios.running as {
  sip: PassbookSip;
  instalments: Instalment[];
};

const stale = (seedData as any).scenarios.stale as {
  sip: PassbookSip;
  instalments: Instalment[];
};

describe("Sensecheck deterministic fallback & parsing (R37 §1)", () => {
  it("pre-filter declines unmistakable advice queries but allows operational queries", () => {
    // Advice queries must be declined
    expect(isAdviceQuery("Which fund should I buy?")).toBe(true);
    expect(isAdviceQuery("What is the best fund for 3 years?")).toBe(true);
    expect(isAdviceQuery("Is this a good fund?")).toBe(true);
    expect(isAdviceQuery("Should I stop my SIP now?")).toBe(true);
    expect(isAdviceQuery("Should I continue investing?")).toBe(true);
    expect(isAdviceQuery("Should I invest in gold?")).toBe(true);
    expect(isAdviceQuery("Will the market rise this week?")).toBe(true);

    // Operational questions must NOT be pre-filter declined (words like 'switch' or 'guarantee' removed)
    expect(isAdviceQuery("How do I switch my bank account?")).toBe(false);
    expect(isAdviceQuery("Can I switch the AutoPay?")).toBe(false);
    expect(isAdviceQuery("Is my refund guaranteed after a failed order?")).toBe(false);
    expect(isAdviceQuery("What do you recommend I do if debit fails?")).toBe(false);
  });

  it("extractFirstJsonBlock extracts JSON from text surrounded by prose and code fences", () => {
    const raw = `Here is your JSON response:
\`\`\`json
{
  "intent": "allotment",
  "answer": "Your units are confirmed.",
  "facts_used": ["ev-1"],
  "sources": [],
  "as_of": null,
  "declined": false
}
\`\`\`
Hope this answers your question!`;

    const parsed = extractFirstJsonBlock(raw);
    expect(parsed.intent).toBe("allotment");
    expect(parsed.answer).toBe("Your units are confirmed.");
    expect(parsed.declined).toBe(false);
  });

  it("builds fallback for allotted entry with debit, order, units, NAV and registrar", () => {
    const dec = running.instalments.find((i) => i.due_date === "2025-12-05")!;
    const res = buildSensecheckFallback(dec, running.sip);
    expect(res.intent).toBe("allotment");
    expect(res.answer).toContain("bank debited your account on 5 Dec 2025");
    expect(res.answer).toContain("order was placed on 5 Dec 2025");
    expect(res.answer).toContain("20.000 units were allotted at a NAV of ₹100.00");
    expect(res.answer).toContain("Registrar (illustrative)");
    expect(res.as_of).toBe("2025-12-06T16:00:00+05:30");
  });

  it("builds fallback for skipped entry", () => {
    const skippedInst: Instalment = {
      id: "inst-skip-demo",
      due_date: "2026-07-05",
      amount: 2000,
      nav: null,
      units: null,
      skipped: true,
      events: [],
    };
    const res = buildSensecheckFallback(skippedInst, running.sip);
    expect(res.answer).toBe("This instalment was skipped. No debit was attempted.");
    expect(res.declined).toBe(false);
  });

  it("builds fallback for in_progress entry with IST formatted answer and raw ISO as_of", () => {
    const nov = running.instalments.find((i) => i.due_date === "2026-11-05")!;
    const res = buildSensecheckFallback(nov, running.sip);
    expect(res.intent).toBe("allotment");
    expect(res.answer).toContain("bank debit was confirmed");
    expect(res.answer).toContain("units are not confirmed yet");
    expect(res.answer).toContain("Status as of 6 Nov 2026, 10:00 IST.");
    expect(res.as_of).toBe("2026-11-06T10:00:00+05:30");
  });

  it("builds fallback for failed entry (May - INSUFFICIENT_BALANCE)", () => {
    const may = running.instalments.find((i) => i.due_date === "2026-05-05")!;
    const res = buildSensecheckFallback(may, running.sip);
    expect(res.intent).toBe("payment_status");
    expect(res.answer).toContain("insufficient balance");
    expect(res.answer).toContain("Nothing was taken from your bank account");
    expect(res.sources).toContain("rule-pay-now-01");
    expect(res.sources).toContain("rule-three-miss-01");
    expect(res.as_of).toBe("2026-05-05T10:00:00+05:30");
  });

  it("builds fallback for refunded entry (September - ORDER_NOT_ACCEPTED)", () => {
    const sep = running.instalments.find((i) => i.due_date === "2026-09-05")!;
    const res = buildSensecheckFallback(sep, running.sip);
    expect(res.intent).toBe("payment_status");
    expect(res.answer).toContain("order was not accepted");
    expect(res.answer).toContain("amount is refunded to your bank account");
    expect(res.sources).toContain("rule-refund-01");
    expect(res.as_of).toBe("2026-09-12T16:00:00+05:30");
  });

  it("builds fallback for unknown entry (Stale November - STATUS_UNAVAILABLE)", () => {
    const nov = stale.instalments.find((i) => i.due_date === "2026-11-05")!;
    const res = buildSensecheckFallback(nov, stale.sip);
    expect(res.intent).toBe("payment_status");
    expect(res.answer).toContain("can't confirm the latest status right now");
    expect(res.answer).toContain("Status as of 5 Nov 2026, 11:40 IST.");
    expect(res.answer).toContain("MF Central, CAMS or KFintech");
    expect(res.as_of).toBe("2026-11-05T11:40:00+05:30");
  });
});
