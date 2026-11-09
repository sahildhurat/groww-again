import { describe, expect, it } from "vitest";
import { checkDates, checkTimesAndDurations, extractDates } from "@/lib/gate";

// 9 Nov 2026 live check: Sensecheck answered "I paid on 5 November. Where are my units?" with "that would be around
// 7 Nov 2026", a date the model worked out itself. Dates must come from the facts, the help passages or the question.
const facts = '{"effective_display":"5 Nov 2026, 09:12 IST","as_of":"2026-11-06T10:00:00+05:30","nav_date":"2026-11-04"}';

describe("date check", () => {
  it("reads day-month, month-day and ISO dates", () => {
    expect(extractDates("5 Nov 2026, November 7 and 2026-11-04").map((d) => d.full ?? d.day)).toEqual(["5-10-2026", "7-10", "4-10-2026"]);
  });
  it("blocks a worked-out arrival date", () => {
    expect(checkDates("Units are expected around 7 Nov 2026.", facts)).toBe(false);
    expect(checkTimesAndDurations("Units are expected around 7 Nov 2026.", facts, [])).toBe(false);
  });
  it("allows dates the passbook shows, with or without the year", () => {
    expect(checkDates("The debit on 5 Nov 2026 is confirmed; as of 6 Nov it is pending; NAV of 4 November.", facts)).toBe(true);
  });
  it("allows a date the investor wrote in the question", () => {
    expect(checkDates("You asked about 12 December.", facts + " What happens on 12 December?")).toBe(true);
  });
  it("does not read unit or NAV decimals as dates", () => {
    expect(extractDates("158.513 units at 98.00")).toEqual([]);
  });
});
