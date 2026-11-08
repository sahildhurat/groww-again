// R45 (Claude, 8 Nov 2026): fixes from the live audit — wrong-entry check, Pay Now window, AutoPay timing passage,
// source labels and the decline link.
import { describe, it, expect } from "vitest";
import seed from "../../data/passbook-seed.json";
import rules from "../../data/rules.json";
import { answersAnotherEntry, questionPointsElsewhere } from "@/lib/entry-focus";
import { addWorkingDays, payNowWindowClosed, DEMO_NOW_ISO } from "@/lib/demo-now";
import { resolveSources, suggestedQuestionsFor } from "@/lib/flow";
import { DECLINE_SOURCES } from "@/lib/decline-text";
import { checkInternalRefs } from "@/lib/gate";
import type { Instalment } from "@/lib/passbook-types";

const running = (seed as any).scenarios.running.instalments as Instalment[];
const byId = (id: string) => running.find((i) => i.id === id)!;

describe("wrong-entry check", () => {
  const may = byId("inst-2026-05-05");

  it("flags an answer on the May page built only from November facts", () => {
    expect(
      answersAnotherEntry({
        entry: may,
        instalments: running,
        factsUsed: ["ev-2026-11-05-debit", "ev-2026-11-05-allotment"],
        question: "Why did my May instalment fail?",
      })
    ).toBe(true);
  });

  it("keeps an answer that cites the entry's own facts", () => {
    expect(
      answersAnotherEntry({
        entry: may,
        instalments: running,
        factsUsed: ["ev-2026-05-05-debit", "ev-2026-11-05-debit"],
        question: "Why did my May instalment fail?",
      })
    ).toBe(false);
  });

  it("keeps answers that cite only rules or computed facts", () => {
    expect(
      answersAnotherEntry({ entry: may, instalments: running, factsUsed: ["rule-pay-now-01"], question: "Can I still pay?" })
    ).toBe(false);
    expect(
      answersAnotherEntry({ entry: may, instalments: running, factsUsed: ["computed:units"], question: "How many units?" })
    ).toBe(false);
  });

  it("keeps answers when the question points at another month or the latest instalment", () => {
    for (const q of [
      "What happens if I skip next month?",
      "What is the status of my latest instalment?",
      "Did my November units come?",
      "Will my SIP be cancelled if I skip again?",
    ]) {
      expect(
        answersAnotherEntry({ entry: may, instalments: running, factsUsed: ["ev-2026-11-05-debit"], question: q })
      ).toBe(false);
    }
  });

  it("does nothing without an entry, or for a decline", () => {
    expect(
      answersAnotherEntry({ entry: null, instalments: running, factsUsed: ["ev-2026-11-05-debit"], question: "x" })
    ).toBe(false);
    expect(
      answersAnotherEntry({ entry: may, instalments: running, factsUsed: ["ev-2026-11-05-debit"], question: "x", declined: true })
    ).toBe(false);
  });

  it("reads 'may' as a month only when capitalised", () => {
    expect(questionPointsElsewhere("How may I see my units?", "2026-11-05")).toBe(false);
    expect(questionPointsElsewhere("What happened in May?", "2026-11-05")).toBe(true);
    expect(questionPointsElsewhere("What happened in May?", "2026-05-05")).toBe(false);
  });
});

describe("Pay Now window (2 working days)", () => {
  it("skips weekends", () => {
    expect(addWorkingDays("2026-11-05", 2)).toBe("2026-11-09"); // Thu → Mon
    expect(addWorkingDays("2026-05-05", 2)).toBe("2026-05-07"); // Tue → Thu
  });

  it("has closed for the May failure at the demo's now", () => {
    expect(payNowWindowClosed("2026-05-05T09:12:00+05:30", DEMO_NOW_ISO)).toBe(true);
  });

  it("is still open the next working day", () => {
    expect(payNowWindowClosed("2026-11-05T09:12:00+05:30", "2026-11-06T10:30:00+05:30")).toBe(false);
    expect(payNowWindowClosed("2026-11-05T09:12:00+05:30", "2026-11-09T18:00:00+05:30")).toBe(false);
    expect(payNowWindowClosed("2026-11-05T09:12:00+05:30", "2026-11-10T09:00:00+05:30")).toBe(true);
  });

  it("returns null without a time", () => {
    expect(payNowWindowClosed(null)).toBe(null);
  });
});

describe("AutoPay timing passage and sources", () => {
  const r = (rules as any[]).find((x) => x.id === "rule-allotment-03");

  it("is a labelled summary of Groww help 61 with the T+2 and T+5/6 timings", () => {
    expect(r).toBeTruthy();
    expect(r.source_type).toBe("public_rule_summary");
    expect(r.text.startsWith("Summary of a public")).toBe(true);
    expect(r.url).toContain("groww.in/help/mutual-funds/order/how-many-days-does-it-take-for-the-units-to-be-allocated--61");
    expect(r.text).toContain("units are expected on T+2, two working days after the SIP date");
    expect(r.text).not.toMatch(/units (?:have been|were|are now|are) allotted/);
    expect(r.text).toContain("T+5 or T+6");
  });

  it("shows as Groww help (summary), while other public summaries keep their label", () => {
    expect(resolveSources(["rule-allotment-03"])).toEqual([{ title: "Groww help (summary)", url: r.url }]);
    expect(resolveSources(["rule-pause-02"])[0].title).toBe("Public rule summary");
  });

  it("every seed scenario is paid through Groww AutoPay", () => {
    for (const sc of Object.values((seed as any).scenarios) as any[]) expect(sc.sip.payment_route).toBe("Groww AutoPay");
  });

  it("the decline points to SEBI and AMFI's investor education site, both labelled", () => {
    expect(DECLINE_SOURCES.some((u) => u.includes("amfiindia.com/investor-corner"))).toBe(false);
    expect(resolveSources(DECLINE_SOURCES).map((s) => s.title)).toEqual(["SEBI investor website", "AMFI investor education"]);
  });

  it("the new context field names never reach an answer", () => {
    expect(checkInternalRefs("Your official_record is your CAS.")).toBe(true);
    expect(checkInternalRefs("The payment_route is AutoPay.")).toBe(true);
    expect(checkInternalRefs("This SIP is paid through Groww AutoPay.")).toBe(false);
  });
});

describe("suggested questions fit the month (owner, 8 Nov)", () => {
  const SKIP = "What happens if I skip next month?";

  it("an old allotted month never suggests skipping next month", () => {
    const qs = suggestedQuestionsFor(byId("inst-2026-03-05"), { isLatest: false, sipActive: true });
    expect(qs).not.toContain(SKIP);
    expect(qs).toContain("How were my units for this instalment worked out?");
  });

  it("an old failed or skipped month asks about that month", () => {
    expect(suggestedQuestionsFor(byId("inst-2026-05-05"), { isLatest: false, sipActive: true })).not.toContain(SKIP);
    const july = suggestedQuestionsFor(byId("inst-2026-07-05"), { isLatest: false, sipActive: true });
    expect(july).not.toContain(SKIP);
    expect(july).toContain("Why is there no debit for July?");
  });

  it("only the latest month of a running SIP can suggest skipping next month", () => {
    expect(suggestedQuestionsFor(byId("inst-2026-10-05"), { isLatest: true, sipActive: true })).toContain(SKIP);
    expect(suggestedQuestionsFor(byId("inst-2026-10-05"), { isLatest: true, sipActive: false })).not.toContain(SKIP);
  });
});
