// R42 (Claude, 7 Nov 2026): links between pages — sources, suggested questions, month links, "/options" in answers.
import { describe, it, expect } from "vitest";
import passbookSeed from "@/data/passbook-seed.json";
import {
  answerPointsToOptions,
  entryIdForMonth,
  entryStateLabel,
  monthKey,
  monthName,
  resolveSources,
  splitOptionsLinks,
  starterQuestionsFor,
  suggestedQuestionsFor,
} from "@/lib/flow";
import type { Instalment } from "@/lib/passbook-types";

const running = (passbookSeed as any).scenarios.running.instalments as Instalment[];
const stopped = (passbookSeed as any).scenarios.stopped.instalments as Instalment[];
const byId = (id: string) => running.find((i) => i.id === id)!;

describe("month links", () => {
  it("maps months to entries and back", () => {
    expect(monthKey("2026-11-05")).toBe("2026-11");
    expect(monthName("2026-09-05")).toBe("September");
    expect(entryIdForMonth(running, "2026-11")).toBe("inst-2026-11-05");
    expect(entryIdForMonth(stopped, "2026-11")).toBeNull();
    expect(entryIdForMonth(running, "2027-01")).toBeNull();
  });
});

describe("resolveSources", () => {
  it("shows help titles, never rule ids, and each page once", () => {
    const out = resolveSources(["rule-restart-01", "rule-cancel-01", "rule-allotment-01"]);
    expect(out.map((s) => s.title)).toEqual([
      "How can I cancel an ongoing SIP?",
      "How can I confirm if my SIP instalment was deducted successfully?",
    ]);
    expect(out.every((s) => s.url.startsWith("https://"))).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/rule-/);
  });
  it("labels public rule summaries and keeps SEBI / AMFI links of the decline", () => {
    const out = resolveSources(["rule-pause-02", "https://investor.sebi.gov.in/", "https://www.amfiindia.com/investor"]);
    expect(out.map((s) => s.title)).toEqual(["Public rule summary", "SEBI investor website", "AMFI"]);
  });
  it("drops unknown ids and other sites", () => {
    expect(resolveSources(["rule-nope", "https://example.com/x", "", undefined as any])).toEqual([]);
    expect(resolveSources(undefined)).toEqual([]);
  });
});

describe("suggested questions fit the entry", () => {
  it("never asks about missing units on an allotted or skipped entry", () => {
    for (const id of ["inst-2026-10-05", "inst-2026-07-05"]) {
      expect(suggestedQuestionsFor(byId(id))).not.toContain("Why are my units not visible yet?");
    }
  });
  it("uses the entry's month for failed and refunded entries", () => {
    expect(suggestedQuestionsFor(byId("inst-2026-05-05"))).toContain("Why did my May instalment fail?");
    expect(suggestedQuestionsFor(byId("inst-2026-09-05"))).toContain("Where is my September money?");
    expect(suggestedQuestionsFor(byId("inst-2026-11-05"))).toContain("Why are my units not visible yet?");
  });
  it("labels entries in plain words", () => {
    expect(entryStateLabel(byId("inst-2026-11-05"))).toBe("Units not confirmed yet");
    expect(entryStateLabel(byId("inst-2026-05-05"))).toBe("Not debited");
    expect(entryStateLabel(byId("inst-2026-10-05"))).toBe("18.709 units allotted");
  });
  it("starter questions follow the scenario", () => {
    expect(starterQuestionsFor("stopped")).toContain("Can I restart after stopping?");
    expect(starterQuestionsFor("stopped")).not.toContain("Why are my units not visible yet?");
    expect(starterQuestionsFor("running")).toContain("Why are my units not visible yet?");
  });
});

describe('"/options" in an answer becomes a link', () => {
  it("splits the text around each /options", () => {
    const parts = splitOptionsLinks("Please see /options to compare these.");
    expect(parts).toEqual([
      { text: "Please see ", link: false },
      { text: "/options", link: true },
      { text: " to compare these.", link: false },
    ]);
    expect(splitOptionsLinks("No link here.")).toEqual([{ text: "No link here.", link: false }]);
  });
  it("offers the options button for options or affordability answers, or when the text points there", () => {
    expect(answerPointsToOptions("affordability", "x")).toBe(true);
    expect(answerPointsToOptions("options", "x")).toBe(true);
    expect(answerPointsToOptions("valuation", "see /options")).toBe(true);
    expect(answerPointsToOptions("valuation", "Value can go up or down.")).toBe(false);
  });
});
