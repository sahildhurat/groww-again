import { describe, it, expect } from "vitest";
import demoSeedData from "../../data/demo-seed.json";
import { computeUnits, calculateLockerSummary, DemoInstalment } from "../../lib/seed";

describe("Demo Seed Mathematical Integrity Tests (§6 & §12)", () => {
  const instalments = demoSeedData.instalments as unknown as DemoInstalment[];
  const paidInstalments = instalments.filter((inst) => inst.status === "paid");

  it("should have exactly 8 paid, 2 failed, and 1 skipped instalment", () => {
    expect(paidInstalments.length).toBe(8);
    const failed = instalments.filter((i) => i.status === "failed");
    expect(failed.length).toBe(2);
    const skipped = instalments.filter((i) => i.status === "skipped");
    expect(skipped.length).toBe(1);
    expect(instalments.length).toBe(11);
  });

  it("should compute units exactly as round(2000 / NAV, 3) for every paid instalment", () => {
    paidInstalments.forEach((inst) => {
      expect(inst.nav).not.toBeNull();
      const expectedUnits = computeUnits(inst.amount, inst.nav!);
      expect(inst.units).toBe(expectedUnits);
    });
  });

  it("should verify individual seed units match SPEC-06 §6 table", () => {
    const unitsMap: Record<string, number> = {
      "2025-12-05": 20.0,
      "2026-01-05": 19.531,
      "2026-02-05": 20.387,
      "2026-03-05": 20.986,
      "2026-04-05": 20.04,
      "2026-06-05": 19.194,
      "2026-08-05": 19.666,
      "2026-10-05": 18.709,
    };

    paidInstalments.forEach((inst) => {
      expect(inst.units).toBe(unitsMap[inst.due_date]);
    });
  });

  it("should calculate total invested as exactly ₹16,000", () => {
    const summary = calculateLockerSummary(instalments, 108.2);
    expect(summary.totalInvested).toBe(16000);
  });

  it("should calculate total units as exactly 158.513", () => {
    const summary = calculateLockerSummary(instalments, 108.2);
    expect(summary.totalUnits).toBe(158.513);
  });

  it("should calculate value at NAV ₹108.20 as exactly ₹17,151.11", () => {
    const summary = calculateLockerSummary(instalments, 108.2);
    // 158.513 * 108.20 = 17151.1066 -> 17151.11
    expect(summary.currentValue).toBe(17151.11);
  });
});
