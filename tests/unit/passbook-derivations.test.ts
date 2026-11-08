import { describe, it, expect } from "vitest";
import {
  instalmentState,
  lastFullyConfirmed,
  confirmedTotals,
  valueAt,
  latestInstalment,
} from "../../lib/passbook";
import type { Instalment } from "../../lib/passbook-types";
import seedData from "../../data/passbook-seed.json";

const running = (seedData as any).scenarios.running;
const stopped = (seedData as any).scenarios.stopped;
const stale = (seedData as any).scenarios.stale;

describe("passbook derivations — running scenario (§4.2, §4.4)", () => {
  it("confirmedTotals: units 158.513, put in ₹16,000, 8 allotted", () => {
    const t = confirmedTotals(running.instalments);
    expect(t.units).toBe(158.513);
    expect(t.amount_put_in).toBe(16000);
    expect(t.count).toBe(8);
  });

  it("lastFullyConfirmed: 5 Oct 2026", () => {
    const lfc = lastFullyConfirmed(running.instalments);
    expect(lfc?.due_date).toBe("2026-10-05");
  });

  it("valueAt 98.00: ₹15,534", () => {
    const t = confirmedTotals(running.instalments);
    expect(valueAt(t, 98.0)).toBe(15534);
  });

  it("December 2025 is allotted", () => {
    const dec = running.instalments.find(
      (i: Instalment) => i.due_date === "2025-12-05"
    );
    expect(instalmentState(dec!)).toBe("allotted");
  });

  it("May 2026 is failed (insufficient balance)", () => {
    const may = running.instalments.find(
      (i: Instalment) => i.due_date === "2026-05-05"
    );
    expect(instalmentState(may!)).toBe("failed");
  });

  it("July 2026 is skipped", () => {
    const jul = running.instalments.find(
      (i: Instalment) => i.due_date === "2026-07-05"
    );
    expect(instalmentState(jul!)).toBe("skipped");
  });

  it("September 2026 is refunded", () => {
    const sep = running.instalments.find(
      (i: Instalment) => i.due_date === "2026-09-05"
    );
    expect(instalmentState(sep!)).toBe("refunded");
  });

  it("November 2026 is in_progress", () => {
    const nov = running.instalments.find(
      (i: Instalment) => i.due_date === "2026-11-05"
    );
    expect(instalmentState(nov!)).toBe("in_progress");
  });

  it("latestInstalment finds the latest by due date", () => {
    const latest = latestInstalment(running.instalments);
    expect(latest?.due_date).toBe("2026-11-05");
  });
});

describe("passbook derivations — stopped scenario", () => {
  it("SIP status is stopped and status_changed_at is 2026-10-20", () => {
    expect(stopped.sip.status).toBe("stopped");
    expect(stopped.sip.status_changed_at).toContain("2026-10-20");
  });

  it("has 11 instalments through 2026-10-05 (no November instalment)", () => {
    expect(stopped.instalments.length).toBe(11);
    const nov = stopped.instalments.find(
      (i: Instalment) => i.due_date === "2026-11-05"
    );
    expect(nov).toBeUndefined();
  });

  it("confirmed totals match 8 allotted instalments", () => {
    const t = confirmedTotals(stopped.instalments);
    expect(t.units).toBe(158.513);
    expect(t.amount_put_in).toBe(16000);
    expect(t.count).toBe(8);
  });
});

describe("passbook derivations — stale scenario", () => {
  it("November instalment state is unknown", () => {
    const nov = stale.instalments.find(
      (i: Instalment) => i.due_date === "2026-11-05"
    );
    expect(instalmentState(nov!)).toBe("unknown");
  });

  it("November allotment has STATUS_UNAVAILABLE reason code", () => {
    const nov = stale.instalments.find(
      (i: Instalment) => i.due_date === "2026-11-05"
    );
    const allot = nov?.events.find((e: any) => e.type === "allotment");
    expect(allot?.reason_code).toBe("STATUS_UNAVAILABLE");
  });
});

