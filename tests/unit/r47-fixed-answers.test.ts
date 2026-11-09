import { describe, expect, it } from "vitest";
import seed from "@/data/passbook-seed.json";
import { buildSensecheckFallback, fallbackTopic } from "@/lib/sensecheck-fallback";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";

// 9 Nov 2026 (Claude): fixed answers for questions asked without a month, and demo times that fall on working days.
const running = (seed as any).scenarios.running as { sip: PassbookSip; instalments: Instalment[] };
const fb = (q: string) => buildSensecheckFallback(null, running.sip, { question: q, instalments: running.instalments });

describe("fixed answers by topic", () => {
  it("routes the eval's questions to the right topic", () => {
    expect(fallbackTopic("My AutoPay mandate was not approved. What happens to my SIP?")).toBe("mandate");
    expect(fallbackTopic("How do I switch my AutoPay to another bank?")).toBe("change_bank");
    expect(fallbackTopic("I lost my job and can't afford the SIP right now. What can I do?")).toBe("affordability");
    expect(fallbackTopic("Can I pause my SIP for 3 months?")).toBe("skip");
    expect(fallbackTopic("Can I restart after stopping?")).toBe("restart");
    expect(fallbackTopic("What are my returns so far?")).toBe("value");
    expect(fallbackTopic("Is my money safe?")).toBe("safety");
    expect(fallbackTopic("Why are my units not visible yet?")).toBe("status");
  });
  it("mandate answer quotes Groww and takes nothing", () => {
    const r = fb("My AutoPay mandate was not approved. What happens to my SIP?");
    expect(r.answer).toContain("switch to an approved AutoPay");
    expect(r.answer).toContain("nothing is taken from your bank account");
    expect(r.sources).toContain("rule-autopay-reset-01");
  });
  it("value answer is computed from the passbook", () => {
    const r = fb("What are my returns so far?");
    expect(r.answer).toContain("₹15,534");
    expect(r.answer).toContain("₹16,000");
    expect(r.answer).toContain("−₹466 (−2.91%)");
    expect(r.answer).toContain("4 Nov 2026");
  });
  it("status without a month answers about the latest instalment", () => {
    const r = fb("Why are my units not visible yet?");
    expect(r.answer).toContain("T+2");
    expect(r.as_of).toBe("2026-11-06T10:00:00+05:30");
  });
  it("no fixed answer gives advice, a prediction or urgency", () => {
    for (const q of ["Is my money safe?", "Can I pause my SIP for 3 months?", "I want to stop", "hello", "What are my returns?"]) {
      const a = fb(q).answer;
      expect(a).not.toMatch(/\b(you should|recommend|guarantee|hurry|don't miss|act now|best)\b/i);
      expect(a).not.toMatch(/Here is your passbook\.$/);
    }
  });
});

describe("demo times", () => {
  it("weekend steps are only bank debits on bank-working Saturdays (1st Saturday) and the September refund", () => {
    const weekend: string[] = [];
    for (const s of Object.values((seed as any).scenarios) as any[])
      for (const i of s.instalments)
        for (const e of i.events)
          if (e.effective_at && [0, 6].includes(new Date(Date.parse(e.effective_at) + 5.5 * 3600e3).getUTCDay()))
            weekend.push(e.id);
    expect([...new Set(weekend)].sort()).toEqual(["ev-2026-01-05-debit", "ev-2026-04-05-debit", "ev-2026-09-05-refund", "ev-2026-10-05-debit"]);
  });
  it("confirmed units arrive two working days after the processing day (T+2)", () => {
    const oct = running.instalments.find((i) => i.id === "inst-2026-10-05")!;
    expect(oct.events.find((e) => e.type === "allotment")!.effective_at).toBe("2026-10-07T14:00:00+05:30");
  });
});

describe("fixed answers find the month and the stop", () => {
  it("a month named in the question gets that month's answer", () => {
    const r = fb("Where is my September money?");
    expect(r.answer).toContain("12 Sep 2026");
  });
  it("May's answer says the Pay Now window has closed and names the one-time route", () => {
    const r = fb("Can I still pay the missed May instalment?");
    expect(r.answer).toContain("that window has closed");
    expect(r.answer).toContain("one-time investment in the same fund");
  });
  it("after a stop, losing units is answered with the stop rule", () => {
    const stopped = (seed as any).scenarios.stopped as { sip: PassbookSip; instalments: Instalment[] };
    const r = buildSensecheckFallback(null, stopped.sip, { question: "Did I lose my units?", instalments: stopped.instalments });
    expect(r.answer).toContain("your invested amount will remain as is until you redeem it");
    const r2 = buildSensecheckFallback(null, stopped.sip, { question: "I stopped my SIP. Did I lose my units?", instalments: stopped.instalments });
    expect(r2.sources).toContain("rule-cancel-01");
  });
});

describe("may the verb", () => {
  it("is not read as the month", async () => {
    const { monthNamedIn } = await import("@/lib/sensecheck-fallback");
    expect(monthNamedIn("May I skip next month?", running.instalments)).toBeNull();
    expect(monthNamedIn("Why did my May instalment fail?", running.instalments)?.id).toBe("inst-2026-05-05");
  });
});

describe("Groww takes the money one bank working day before the SIP date", () => {
  it("every debit comes before its order, and the order is on the SIP date or the next business day", () => {
    for (const i of running.instalments) {
      const d = i.events.find((e) => e.type === "debit");
      const o = i.events.find((e) => e.type === "order");
      if (!d?.effective_at || !o?.effective_at) continue;
      expect(Date.parse(d.effective_at)).toBeLessThan(Date.parse(o.effective_at));
      expect(o.effective_at.slice(0, 10) >= i.due_date).toBe(true);
    }
  });
});
