import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/format";

describe("lib/format date helper", () => {
  it("formats date strings into Indian short format", () => {
    expect(formatDate("2026-10-05")).toBe("5 Oct 2026");
    expect(formatDate("2025-12-05")).toBe("5 Dec 2025");
    expect(formatDate("2026-11-05")).toBe("5 Nov 2026");
  });

  it("formats ISO timestamps into 'D MMM YYYY, HH:MM IST'", () => {
    const formatted = formatDateTime("2026-11-06T10:00:00+05:30");
    expect(formatted).toBe("6 Nov 2026, 10:00 IST");
  });

  it("formats UTC ISO timestamps accurately into Asia/Kolkata IST", () => {
    // 04:30 UTC = 10:00 IST
    const formatted = formatDateTime("2026-11-06T04:30:00Z");
    expect(formatted).toBe("6 Nov 2026, 10:00 IST");
  });

  it("formats month strings 'YYYY-MM' into 'Dec 2026'", () => {
    expect(formatMonthYear("2026-12")).toBe("Dec 2026");
    expect(formatMonthYear("2026-08")).toBe("Aug 2026");
    expect(formatMonthYear("2026-03")).toBe("Mar 2026");
  });

  it("handles null and empty values gracefully", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDateTime(undefined)).toBe("");
    expect(formatMonthYear("")).toBe("");
  });
});

