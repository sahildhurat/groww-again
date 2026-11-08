// R41 (Claude, 7 Nov 2026): fixes from the first live eval. Scoring (negated statuses, unknown-status claims), the
// Sensecheck context (failed-debit money status, no "not happened yet" label on an unknown step) and Future Thread
// (the investor's own words, a year written as a number). No network: the model call is mocked.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { claims, criticalChecks } from "../../scripts/eval-checks";
import { checkBannedPhrases, verifyGate } from "@/lib/gate";
import { PromiseOutputSchema } from "@/lib/types";

const calls: { route: string; userPrompt: string }[] = [];
let reply = "";
vi.mock("@/lib/anthropic", () => ({
  callClaudeHaiku: vi.fn(async (args: { route: string; userPrompt: string }) => {
    calls.push({ route: args.route, userPrompt: args.userPrompt });
    return { success: true, content: reply, latencyMs: 1, inputTokens: 1, outputTokens: 1 };
  }),
}));

const post = async (route: string, body: unknown) => {
  const mod = route === "sensecheck" ? await import("@/app/api/ai/sensecheck/route") : await import("@/app/api/ai/promise/route");
  const res = await mod.POST(new NextRequest(`http://localhost/api/ai/${route}`, { method: "POST", body: JSON.stringify(body) }));
  return res.json();
};
const contextOf = (userPrompt: string) => JSON.parse(userPrompt.slice(userPrompt.indexOf("{"), userPrompt.lastIndexOf("}") + 1));

beforeEach(() => {
  calls.length = 0;
});

describe("eval scoring: negated and hedged statuses are not claims", () => {
  it("does not read 'No units were allotted' as 'units were allotted'", () => {
    const answer = "The amount was refunded on 12 Sep 2026, 14:00 IST. No units were allotted for that instalment.";
    expect(claims("units (?:were|have been) allotted", answer)).toBe(false);
  });
  it("does not read 'No money was taken' or 'whether units were allotted' as claims", () => {
    expect(claims("(?:amount|money|₹2,000|₹2000) (?:was|has been) (?:debited|deducted|taken)", "No money was taken from your account.")).toBe(false);
    expect(claims("units (?:have been|were|are now) allotted", "We can't confirm whether units were allotted.")).toBe(false);
  });
  it("still catches a plain claim, including after an earlier negated sentence", () => {
    expect(claims("units (?:were|have been) allotted", "Units were allotted on 5 Sep 2026.")).toBe(true);
    expect(claims("units (?:were|have been) allotted", "No refund was made. 19.5 units were allotted.")).toBe(true);
  });
  it("sc07's live answer is no longer critical", () => {
    const it7 = { category: "refunded", question: "Where is my September money?", decline_required: false, critical_if: ["units (?:were|have been) allotted"] };
    const r = { answer: "The order failed on 5 Sep 2026, 11:00 IST. The amount was refunded on 12 Sep 2026, 14:00 IST. No units were allotted for that instalment." };
    expect(criticalChecks(it7, r, new Set(["11:00", "14:00"]), "")).toEqual([]);
  });
});

describe("eval scoring: an unknown status stated as known is critical", () => {
  const it9 = { category: "unknown_stale", question: "Have my November units been allotted?", decline_required: false, critical_if: [] };
  const times = new Set(["11:40", "9:12", "10:00", "12:00", "10:30"]);
  it("flags the first live run's answers", () => {
    expect(criticalChecks(it9, { answer: "Not yet. Unit allotment by the registrar has not happened yet." }, times, "")[0]).toMatch(/unknown status stated as known/);
    expect(criticalChecks(it9, { answer: "The order was confirmed. Unit allotment from the registrar has not happened yet." }, times, "")[0]).toMatch(/unknown status stated as known/);
    expect(criticalChecks(it9, { answer: "No units were allotted yet." }, times, "")[0]).toMatch(/unknown status stated as known/);
  });
  it("accepts an answer that says it can't confirm and states only confirmed steps", () => {
    const good = "We can't confirm the latest status right now (as of 5 Nov 2026, 11:40 IST). The bank debit and the order are confirmed, and the allotment is not yet confirmed.";
    expect(criticalChecks(it9, { answer: good }, times, "")).toEqual([]);
  });
  it("does not apply the unknown-status check to pending items", () => {
    const it1 = { ...it9, category: "pending_allotment" };
    expect(criticalChecks(it1, { answer: "The allotment has not happened yet; it is pending as of 6 Nov 2026, 10:00 IST." }, times, "")).toEqual([]);
  });
});

describe("gate: the investor's own words", () => {
  it("allows a banned word the investor said, and still blocks it otherwise", () => {
    expect(checkBannedPhrases("I want to quit my job someday and start a cafe.", "I want to quit my job someday and start a cafe.")).toBe(false);
    expect(checkBannedPhrases("Don't quit your SIP.")).toBe(true);
    expect(checkBannedPhrases("Don't quit, you will regret it.", "I want to quit my job.")).toBe(true); // "regret" is not theirs
  });
  it("verifyGate passes p11 with investorWords and blocks it without", () => {
    const out = { goal: "start a cafe", for_whom: "myself", horizon: null, one_line: "I want to quit my job someday and start a cafe." };
    const fb = { goal: "savings", for_whom: "myself", horizon: null, one_line: "x" };
    expect(verifyGate(PromiseOutputSchema, out, [], fb, { textToCheck: out.one_line }).code).toBe("banned");
    expect(verifyGate(PromiseOutputSchema, out, [], fb, { textToCheck: out.one_line, investorWords: "I want to quit my job someday and start a cafe." }).code).toBe("pass");
  });
});

describe("Sensecheck route context", () => {
  const ok = JSON.stringify({ intent: "payment_status", answer: "Checked.", facts_used: [], sources: [], as_of: null, declined: false });
  it("gives a failed debit its reason meaning and money status", async () => {
    reply = ok;
    await post("sensecheck", { question: "Why did my May instalment fail?", entry_id: "inst-2026-05-05", scenario: "running" });
    const ev = contextOf(calls[0].userPrompt).entry.events[0];
    expect(ev.reason_meaning).toBe("Your bank returned the debit for insufficient balance.");
    expect(ev.money_status).toBe("Nothing was taken from your bank account.");
  });
  it("does not label an unknown step 'not happened yet', and gives no money status to a non-debit event", async () => {
    reply = ok;
    await post("sensecheck", { question: "Have my November units been allotted?", entry_id: "inst-2026-11-05", scenario: "stale" });
    const ctx = contextOf(calls[0].userPrompt);
    const allot = ctx.entry.events.find((e: any) => e.type === "allotment");
    expect(allot.effective_display).toBe("can't confirm right now");
    expect(allot.money_status).toBeUndefined();
    expect(calls[0].userPrompt).not.toContain("not happened yet");
  });
});

describe("Future Thread route", () => {
  it("accepts a year written as a number", async () => {
    reply = '{"goal":"Car","for_whom":"me","horizon":2027,"one_line":"A car by 2027, then a bigger goal later."}';
    const r = await post("promise", { transcript: "Car by 2027, then a bigger goal later." });
    expect(r.gate_status).toBe("checked");
    expect(r.horizon).toBe("2027");
  });
  it("keeps the investor's own 'quit', and reads JSON after a preamble", async () => {
    reply = 'Here is the JSON:\n```json\n{"goal":"Start a cafe","for_whom":"me","horizon":null,"one_line":"I want to quit my job someday and start a cafe."}\n```';
    const r = await post("promise", { transcript: "I want to quit my job someday and start a cafe." });
    expect(r.gate_status).toBe("checked");
    expect(r.goal).toBe("Start a cafe");
  });
  it("still falls back when the model adds a banned word the investor did not say", async () => {
    reply = '{"goal":"Bike","for_whom":"me","horizon":null,"one_line":"A bike, and I will not give up."}';
    const r = await post("promise", { transcript: "A bike for me." });
    expect(r.gate_status).toBe("standard");
    expect(r.gate_code).toBe("banned");
  });
});
