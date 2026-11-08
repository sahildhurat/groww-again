import { describe, it, expect } from "vitest";
import { z } from "zod";
import { checkInternalRefs, verifyGate } from "@/lib/gate";

// R44 (8 Nov live check): answers quoted internal ids, codes, paths and the prompt's own words.
describe("checkInternalRefs", () => {
  it.each([
    "rule-pay-now-01 says the option is available for 2 working days.",
    "The order was not accepted (reason: ORDER_NOT_ACCEPTED).",
    "See /quality for how answers are checked.",
    "Rule passages say that AutoPay should have sufficient balance.",
    "The passbook does not include a rule passage describing this.",
    "Facts: ev-2026-05-05-debit.",
    "You can contact support using the button provided.",
    "The as_of time is shown.",
  ])("blocks: %s", (t) => expect(checkInternalRefs(t)).toBe(true));

  it.each([
    "Your bank returned the debit for insufficient balance on 5 May 2026, 09:12 IST. Nothing was taken from your bank account.",
    "Groww's help says the Pay Now option is open for 2 working days after a failed debit, so that window has passed.",
    "You can compare these on the What can I do next? page, or contact Groww support.",
    "Units are allotted at T+2 for AutoPay.",
    "For options, see /options.",
    "The NAV was ₹106.90 and 18.709 units were allotted.",
  ])("allows: %s", (t) => expect(checkInternalRefs(t)).toBe(false));
});

describe("verifyGate with an internal reference", () => {
  const schema = z.object({ answer: z.string() });
  it("falls back with code 'internal'", () => {
    const r = verifyGate(schema, { answer: "See /quality." }, [], { answer: "fallback" }, { textToCheck: "See /quality." });
    expect(r.isValid).toBe(false);
    expect(r.code).toBe("internal");
    expect(r.data.answer).toBe("fallback");
  });
});
