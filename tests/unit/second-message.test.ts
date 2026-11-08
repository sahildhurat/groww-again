// Final feature (8 Nov 2026): "The second message", built in code from the passbook events.
import { describe, it, expect } from "vitest";
import seed from "../../data/passbook-seed.json";
import { messagesFor, unitsAfter } from "@/lib/second-message";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";

const scenarios = (seed as any).scenarios as Record<string, { sip: PassbookSip; instalments: Instalment[] }>;
const run = scenarios.running;
const byId = (id: string) => run.instalments.find((i) => i.id === id)!;
const text = (id: string) => messagesFor(byId(id), run.instalments, run.sip).map((m) => `${m.title}: ${m.body}`).join("\n");

describe("the second message", () => {
  it("November (debited, units pending): bank SMS, then order placed with the T+2 rule, no date promised", () => {
    const ms = messagesFor(byId("inst-2026-11-05"), run.instalments, run.sip);
    expect(ms.map((m) => m.from)).toEqual(["bank", "groww"]);
    expect(ms[1].body).toContain("units are expected two working days after the SIP date (T+2)");
    expect(ms[1].body).not.toMatch(/\b(?:7|9) Nov\b/);
  });

  it("October (allotted): units in your name and what you now own", () => {
    expect(text("inst-2026-10-05")).toContain("is now 18.709 units in your name. You now own 158.513 units.");
    expect(unitsAfter(run.instalments, byId("inst-2026-10-05"))).toBe(158.513);
  });

  it("May (failed): says no money left the account, and the Pay Now window", () => {
    const t = text("inst-2026-05-05");
    expect(t).toContain("No money left your account.");
    expect(t).toContain("Pay Now stays open for 2 working days.");
    expect(t).not.toContain("Your bank:");
  });

  it("September (refunded) and July (skipped) say what happened in plain words", () => {
    expect(text("inst-2026-09-05")).toMatch(/did not accept[\s\S]*refunded to your bank account on 12 Sep 2026/);
    expect(text("inst-2026-07-05")).toContain("You skipped the 5 Jul 2026 instalment. Nothing will be debited this month.");
  });

  it("the stale scenario says it can't confirm, with the last-checked time", () => {
    const st = scenarios.stale;
    const nov = st.instalments.find((i) => i.id === "inst-2026-11-05")!;
    const t = messagesFor(nov, st.instalments, st.sip).map((m) => m.body).join(" ");
    expect(t).toMatch(/can't confirm your 5 Nov 2026 units right now \(last checked/);
  });

  it("never contains reference IDs, account numbers, folio or advice words, in any scenario", () => {
    for (const sc of Object.values(scenarios)) {
      for (const inst of sc.instalments) {
        for (const m of messagesFor(inst, sc.instalments, sc.sip)) {
          expect(m.body).not.toMatch(/(?:BNK|ORD|REG|RTA)-DEMO|\bfolio\b|\b\d{9,18}\b/i);
          expect(m.body).not.toMatch(/\b(?:recommend|suggest|should (?:continue|invest|buy|sell)|guaranteed)\b/i);
          expect(m.body).not.toMatch(/units (?:have been|were|are now|are) allotted/i);
        }
      }
    }
  });
});
