// R39 (Claude, 7 Nov 2026): the gate must block invented clock times, durations and as_of values.
import { describe, it, expect } from "vitest";
import { z } from "zod";
import rules from "../../data/rules.json";
import { verifyGate, checkTimesAndDurations, checkAsOf, extractClockTimes } from "../../lib/gate";

const passages = (rules as any[]).map((r) => r.text).join(" ");
const facts = "5 Nov 2026, 09:12 IST 5 Nov 2026, 11:40 IST 6 Nov 2026, 10:00 IST";
const source = `${facts} ${passages}`;
const times = ["5 Nov 2026, 09:12 IST", "5 Nov 2026, 11:40 IST", "6 Nov 2026, 10:00 IST"];

describe("clock times", () => {
  it("reads clock times but not unit or NAV decimals", () => {
    expect(extractClockTimes("as of 6 Nov 2026, 10:00 IST")).toEqual(["10:00"]);
    expect(extractClockTimes("around 4:30 pm or 5 pm")).toEqual(["4:30", "5:00"]);
    expect(extractClockTimes("19.531 units at 102.40 and 158.513 units, NAV 98.00")).toEqual([]);
  });
  it("allows the facts' own times and rejects others", () => {
    expect(checkTimesAndDurations("Not confirmed yet, as of 6 Nov 2026, 10:00 IST.", source, times)).toBe(true);
    expect(checkTimesAndDurations("Debited at 09:12 IST.", source, times)).toBe(true);
    expect(checkTimesAndDurations("Usually allotted around 4:30 pm.", source, times)).toBe(false);
    expect(checkTimesAndDurations("As of 6 Nov 2026, 18:00 IST.", source, times)).toBe(false);
  });
});

describe("durations", () => {
  it("allows durations quoted from a passage", () => {
    expect(checkTimesAndDurations("A refund arrives within 7 working days.", source, times)).toBe(true);
    expect(checkTimesAndDurations("Allocation can take up to 5–6 business days.", source, times)).toBe(true);
    expect(checkTimesAndDurations("Allocation can take up to 5-6 business days.", source, times)).toBe(true);
    expect(checkTimesAndDurations("The Pay Now option is available for 2 working days.", source, times)).toBe(true);
    expect(checkTimesAndDurations("UPI AutoPay is approved within 24 hours.", source, times)).toBe(true);
  });
  it("rejects durations that no passage states", () => {
    expect(checkTimesAndDurations("Units are usually allotted within 3 working days.", source, times)).toBe(false);
    expect(checkTimesAndDurations("Units arrive on T+1.", source, times)).toBe(false);
    expect(checkTimesAndDurations("Wait 10 days.", source, times)).toBe(false);
    expect(checkTimesAndDurations("It takes two weeks.", source, times)).toBe(false);
  });
  it("allows a duration the investor wrote in the question", () => {
    expect(checkTimesAndDurations("If you skip for 2 months…", `${source} What if I skip for 2 months?`, times)).toBe(true);
  });
});

describe("as_of", () => {
  const allowed = ["2026-11-05T10:00:00+05:30", "2026-11-05T12:00:00+05:30", "2026-11-06T10:00:00+05:30"];
  const required = { iso: "2026-11-06T10:00:00+05:30", time: "6 Nov 2026, 10:00 IST" };
  it("accepts null or a fact's own timestamp", () => {
    expect(checkAsOf(null, allowed, "x")).toBe(true);
    expect(checkAsOf("2026-11-06T04:30:00Z", allowed, "x")).toBe(true); // same instant as 10:00 IST
  });
  it("rejects an invented timestamp", () => {
    expect(checkAsOf("2026-11-06T18:00:00+05:30", allowed, "x")).toBe(false);
    expect(checkAsOf("yesterday", allowed, "x")).toBe(false);
  });
  it("requires the pending step's as_of and its time in the answer", () => {
    expect(checkAsOf("2026-11-06T10:00:00+05:30", allowed, "Not confirmed yet, as of 6 Nov 2026, 10:00 IST.", required)).toBe(true);
    expect(checkAsOf(null, allowed, "Not confirmed yet, as of 6 Nov 2026, 10:00 IST.", required)).toBe(false);
    expect(checkAsOf("2026-11-06T10:00:00+05:30", allowed, "The units are not confirmed yet.", required)).toBe(false);
  });
});

describe("telling the investor what to do", () => {
  const schema = z.object({ answer: z.string() });
  const run = (a: string) => verifyGate(schema, { answer: a }, [7], { answer: "fallback" }, { textToCheck: a });
  it("blocks directive advice", () => {
    expect(run("You should skip next month.").code).toBe("banned");
    expect(run("It is better to stop the SIP now.").code).toBe("banned");
  });
  it("keeps plain statements of what happens", () => {
    expect(run("You should receive a refund within 7 working days.").isValid).toBe(true);
  });
});

describe("verifyGate with the R39 options", () => {
  const schema = z.object({ answer: z.string(), as_of: z.string().nullable() });
  const fallback = { answer: "fallback", as_of: null };
  const allowedNumbers = [5, 6, 2026, 10, 0, 9, 12, 11, 40, 7, 4, 30];
  const opts = (answer: string, as_of: string | null, req = false) => ({
    textToCheck: answer,
    allowedSourceText: source,
    allowedTimes: times,
    asOf: { value: as_of, allowed: ["2026-11-06T10:00:00+05:30"], required: req ? { iso: "2026-11-06T10:00:00+05:30", time: "6 Nov 2026, 10:00 IST" } : null },
  });

  it("blocks the R37 stand-in answer with an invented processing time", () => {
    const a = "Units are usually allotted within 3 working days, around 4:30 pm.";
    const r = verifyGate(schema, { answer: a, as_of: null }, allowedNumbers, fallback, opts(a, null));
    expect(r.isValid).toBe(false);
    expect(r.code).toBe("time");
  });
  it("blocks an invented as_of", () => {
    const a = "The units are not confirmed yet.";
    const r = verifyGate(schema, { answer: a, as_of: "2026-11-06T18:00:00+05:30" }, allowedNumbers, fallback, opts(a, "2026-11-06T18:00:00+05:30"));
    expect(r.code).toBe("as_of");
  });
  it("passes a correct pending answer", () => {
    const a = "The bank debit and the order are confirmed. The units are not confirmed yet, as of 6 Nov 2026, 10:00 IST.";
    const r = verifyGate(schema, { answer: a, as_of: "2026-11-06T10:00:00+05:30" }, allowedNumbers, fallback, opts(a, "2026-11-06T10:00:00+05:30", true));
    expect(r.isValid).toBe(true);
  });
  it("leaves callers without the new options unchanged", () => {
    const a = "Units are usually allotted within 3 working days.";
    const r = verifyGate(schema, { answer: a, as_of: null }, allowedNumbers, fallback, { textToCheck: a });
    expect(r.isValid).toBe(true);
  });
});
