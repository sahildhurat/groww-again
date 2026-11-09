// R48 (Claude, 9 Nov 2026): fixes from the failed 9 Nov eval (eval-20261109015459). Three Groww help passages could not
// be quoted without the gate replacing the answer; the stricter checks stay, and the eval now keeps the model's raw
// reply when an answer is replaced. No network: the model call is mocked.
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import rules from "@/data/rules.json";
import { checkBannedPhrases, checkInternalRefs, softenPromptWords } from "@/lib/gate";
import { buildSensecheckFallback } from "@/lib/sensecheck-fallback";
import seed from "@/data/passbook-seed.json";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";

let reply = "";
vi.mock("@/lib/anthropic", () => ({
  callClaudeHaiku: vi.fn(async () => ({ success: true, content: reply, latencyMs: 1, inputTokens: 1, outputTokens: 1 })),
}));
const ask = async (body: unknown) => {
  const mod = await import("@/app/api/ai/sensecheck/route");
  const res = await mod.POST(new NextRequest("http://localhost/api/ai/sensecheck", { method: "POST", body: JSON.stringify(body) }));
  return res.json();
};
const J = (intent: string, answer: string, sources: string[], as_of: string | null) =>
  JSON.stringify({ intent, answer, facts_used: [], sources, as_of, declined: false });
const SC02 = { question: "I paid on 5 November. Where are my units?", scenario: "running" };
const SC06 = { question: "My AutoPay mandate was not approved. What happens to my SIP?", scenario: "running" };
const SC08 = { question: "How long does a refund take?", scenario: "running", entry_id: "inst-2026-09-05" };
const NOV_ASOF = "2026-11-06T10:00:00+05:30";

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

describe("every Groww help passage can be quoted word for word", () => {
  it("no passage trips the banned-phrase or plain-words check after the fixed rewording", () => {
    for (const r of rules as Array<{ id: string; text: string }>) {
      const t = softenPromptWords(r.text);
      expect({ id: r.id, banned: checkBannedPhrases(t, "") }).toEqual({ id: r.id, banned: false });
      expect({ id: r.id, internal: checkInternalRefs(t) }).toEqual({ id: r.id, internal: false });
    }
  });
});

describe("'switch to' is allowed only for AutoPay, bank or mandate", () => {
  it("allows Groww's own instruction", () => {
    expect(checkBannedPhrases("Click on 'MY SIPs' and switch to an approved AutoPay.", "")).toBe(false);
    expect(checkBannedPhrases("You can switch to a different bank account for the SIP.", "")).toBe(false);
  });
  it("still blocks switching funds or plans", () => {
    for (const t of [
      "You could switch to a better fund.",
      "Switch to the direct plan.",
      "Switch to an index fund instead.",
      "It may help to switch to another fund.",
      "Switch to a new SIP in a different fund.",
    ]) expect({ t, banned: checkBannedPhrases(t, "") }).toEqual({ t, banned: true });
  });
});

describe("Groww's 'button below' sentence", () => {
  it("is reworded to 'contact Groww support'", () => {
    expect(softenPromptWords("then please contact us using the button below.")).toBe("then please contact Groww support.");
    expect(softenPromptWords("You can reach them using the button below.")).toBe("You can reach them through Groww support.");
  });
  it("other button wording still blocks", () => {
    expect(checkInternalRefs("Tap the button provided to get help.")).toBe(true);
    expect(checkInternalRefs("Use the button in the app.")).toBe(true);
  });
});

describe("the 9 Nov failures, through the real route", () => {
  it("sc06: an answer quoting Groww's AutoPay instruction is now checked", async () => {
    reply = J("payment_status", "Groww's help says an instalment can fail if the SIP is still linked to a rejected AutoPay: \"Click on 'MY SIPs' and switch to an approved AutoPay.\" Your passbook does not show a rejected mandate for this SIP.", ["rule-autopay-reset-01"], null);
    const out = await ask(SC06);
    expect(out.gate_code).toBe("pass");
  });
  it("sc02: quoting Groww's 6-working-days sentence is checked and reads 'contact Groww support'", async () => {
    reply = J("allotment", "Units are not confirmed yet (as of 6 Nov 2026, 10:00 IST). Groww's help says: \"if it has been more than 6 working days since you placed the purchase order and you still cannot see the units allocated to your account then please contact us using the button below.\"", ["rule-allotment-02"], NOV_ASOF);
    const out = await ask(SC02);
    expect(out.gate_code).toBe("pass");
    expect(out.answer).toContain("please contact Groww support");
    expect(out.answer).not.toMatch(/button/i);
  });
  it("still strict: a field name in the answer is replaced", async () => {
    reply = J("allotment", "Your payment_route is Groww AutoPay. Units are not confirmed yet (as of 6 Nov 2026, 10:00 IST).", ["rule-allotment-03"], NOV_ASOF);
    expect((await ask(SC02)).gate_code).toBe("internal");
  });
  it("still strict: a counted duration is replaced (sc08)", async () => {
    reply = J("payment_status", "Groww's help says within 7 working days. Yours took 8 days, from 4 Sep 2026 to 12 Sep 2026.", ["rule-refund-01"], null);
    const out = await ask(SC08);
    expect(out.gate_code).toBe("time");
    expect(out.answer).toContain("7 working days");
  });
});

describe("the eval keeps the model's raw reply only on its own local server", () => {
  const blocked = J("payment_status", "Yours took 8 days, from 4 Sep 2026 to 12 Sep 2026.", ["rule-refund-01"], null);
  it("not without EVAL_MODE", async () => {
    delete process.env.EVAL_MODE;
    reply = blocked;
    expect((await ask(SC08)).eval_raw_reply).toBeUndefined();
  });
  it("with EVAL_MODE=1, on a replaced answer", async () => {
    process.env.EVAL_MODE = "1";
    delete process.env.VERCEL;
    reply = blocked;
    expect((await ask(SC08)).eval_raw_reply).toBe(blocked);
  });
  it("never on Vercel, even if EVAL_MODE were set", async () => {
    process.env.EVAL_MODE = "1";
    process.env.VERCEL = "1";
    reply = blocked;
    expect((await ask(SC08)).eval_raw_reply).toBeUndefined();
  });
  it("never on a checked answer", async () => {
    process.env.EVAL_MODE = "1";
    delete process.env.VERCEL;
    reply = J("payment_status", "Groww's help says a refund for a failed order comes within 7 working days. The full ₹2,000 came back to your bank on 12 Sep 2026, 14:00 IST.", ["rule-refund-01"], null);
    const out = await ask(SC08);
    expect(out.gate_code).toBe("pass");
    expect(out.eval_raw_reply).toBeUndefined();
  });
});

describe("the fixed answer for a refunded month", () => {
  const running = (seed as any).scenarios.running as { sip: PassbookSip; instalments: Instalment[] };
  const sep = running.instalments.find((i) => i.id === "inst-2026-09-05")!;
  it("gives Groww's 7-working-day rule when the question asks how long", () => {
    const out = buildSensecheckFallback(sep, running.sip, { question: "How long does a refund take?", instalments: running.instalments });
    expect(out.answer).toContain("came back to your bank on 12 Sep 2026, 14:00 IST");
    expect(out.answer).toContain("within 7 working days");
  });
  it("does not add it to a question about where the money is", () => {
    const out = buildSensecheckFallback(sep, running.sip, { question: "Where is my September money?", instalments: running.instalments });
    expect(out.answer).not.toContain("7 working days");
  });
});
