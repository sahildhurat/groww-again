import { describe, it, expect } from "vitest";
import seed from "@/data/passbook-seed.json";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import { DEMO_NOTE, friendMessage, whatsappLink } from "@/lib/ask-friend";

// Final MVP (8 Nov 2026): Ask a friend (version B). The message is built in code from the passbook facts.
const running = (seed as unknown as { scenarios: Record<string, { sip: PassbookSip; instalments: Instalment[] }> }).scenarios;
const entry = (scenario: string, id: string) => running[scenario].instalments.find((i) => i.id === id)!;
const allEntries = Object.values(running).flatMap((s) => s.instalments);

describe("friendMessage", () => {
  it("failed month: first person, plain reason, nothing was taken", () => {
    const m = friendMessage(entry("running", "inst-2026-05-05"), "Demo");
    expect(m.startsWith("Hi Demo, ")).toBe(true);
    expect(m).toContain("didn't go through");
    expect(m).toContain("insufficient balance");
    expect(m).toContain("nothing was taken from my account");
  });

  it("refunded month says it was refunded, with the refund date", () => {
    const m = friendMessage(entry("running", "inst-2026-09-05"));
    expect(m.startsWith("Hi, ")).toBe(true);
    expect(m).toContain("didn't become units");
    expect(m).toContain("was refunded to my account on 12 Sep 2026");
    expect(m).not.toContain("being refunded");
  });

  it("in-progress month: debited, order placed, units not confirmed, T+2 line", () => {
    const m = friendMessage(entry("running", "inst-2026-11-05"));
    expect(m).toContain("left my bank");
    expect(m).toContain("the order was placed");
    expect(m).toContain("units aren't confirmed yet");
    expect(m).toContain("two working days after the SIP date");
  });

  it("allotted month gives the units; stale month says the status can't be confirmed", () => {
    expect(friendMessage(entry("running", "inst-2026-10-05"))).toMatch(/went through: \d+\.\d{3} units on 6 Oct 2026\. Does yours show up like this too\?/);
    expect(friendMessage(entry("stale", "inst-2026-11-05"))).toContain("can't confirm the status");
  });

  it("never carries reference IDs, the fund name or bank details; always ends with the demo note", () => {
    for (const e of allEntries) {
      const m = friendMessage(e, "Demo");
      expect(m).not.toMatch(/BNK-|ORD-|REG-|folio|Nifty|\bfund\b|index|account number|UPI ID|OTP/i);
      expect(m.endsWith(DEMO_NOTE)).toBe(true);
      expect(m).not.toMatch(/advice|should invest|guaranteed|hurry|last chance/i);
    }
  });

  it("drops the demo note when asked and trims the friend's name", () => {
    const m = friendMessage(entry("running", "inst-2026-05-05"), "  Demo  ", false);
    expect(m.startsWith("Hi Demo, ")).toBe(true);
    expect(m).not.toContain(DEMO_NOTE);
  });
});

describe("whatsappLink", () => {
  it("uses WhatsApp's own share link with the text encoded and no phone number", () => {
    const link = whatsappLink("Hi, a & b?\nok");
    expect(link).toBe("https://wa.me/?text=Hi%2C%20a%20%26%20b%3F%0Aok");
  });
});
