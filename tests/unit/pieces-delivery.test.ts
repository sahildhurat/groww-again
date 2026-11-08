// Piece by piece and the delivery wording (final feature, 8 Nov 2026).
import { describe, it, expect } from "vitest";
import seed from "../../data/passbook-seed.json";
import { piecesFor, PIECES } from "@/lib/pieces";
import { deliveryLine } from "@/lib/delivery";
import type { Instalment } from "@/lib/passbook-types";

const sc = (seed as any).scenarios as Record<string, { instalments: Instalment[] }>;
const run = sc.running.instalments;
const byId = (id: string) => run.find((i) => i.id === id)!;

describe("piece by piece", () => {
  it("adds one piece per confirmed instalment, in order, with no holes for failed, refunded or skipped months", () => {
    const { slots, filled } = piecesFor(run);
    expect(slots).toHaveLength(PIECES);
    expect(filled).toBe(8);
    expect(slots.slice(0, 8).every((s) => s.kind === "filled")).toBe(true);
    const months = slots.slice(0, 8).map((s) => (s.kind === "filled" ? s.inst.due_date.slice(0, 7) : ""));
    expect(months).not.toContain("2026-05"); // failed
    expect(months).not.toContain("2026-07"); // skipped
    expect(months).not.toContain("2026-09"); // refunded
  });

  it("the latest month still waiting for units is shown as waiting, never as a piece", () => {
    const { slots } = piecesFor(run);
    expect(slots[8].kind).toBe("waiting");
    expect(slots[8].kind === "waiting" && slots[8].inst.id).toBe("inst-2026-11-05");
    expect(slots.slice(9).every((s) => s.kind === "empty")).toBe(true);
  });

  it("a stopped SIP has no waiting piece; the picture stays as it is", () => {
    const { slots } = piecesFor(sc.stopped.instalments);
    expect(slots.some((s) => s.kind === "waiting")).toBe(false);
  });
});

describe("delivery wording", () => {
  it("says only what the events confirm, and states arrival as the rule, never a date", () => {
    expect(deliveryLine(byId("inst-2026-11-05"), "Groww AutoPay")).toBe(
      "Picked up from your bank and handed to the fund. Not delivered to your name yet: units are expected two working days after the SIP date (T+2) with Groww AutoPay."
    );
    expect(deliveryLine(byId("inst-2026-10-05"))).toBe("Delivered to your name: 18.709 units.");
    expect(deliveryLine(byId("inst-2026-05-05"))).toBe("Not picked up: no money left your account.");
    expect(deliveryLine(byId("inst-2026-09-05"))).toBe("Returned to your bank on 12 Sep 2026: no money lost.");
    expect(deliveryLine(byId("inst-2026-07-05"))).toBeNull();
  });

  it("the stale scenario says delivery can't be confirmed, with the last-checked time", () => {
    const nov = sc.stale.instalments.find((i) => i.id === "inst-2026-11-05")!;
    expect(deliveryLine(nov)).toMatch(/^Picked up and handed to the fund\. Delivery can't be confirmed right now \(last checked /);
  });

  it("never claims delivery before the registrar confirms, in any scenario", () => {
    for (const s of Object.values(sc)) {
      for (const inst of s.instalments) {
        const line = deliveryLine(inst) ?? "";
        const allotted = inst.events.some((e) => e.type === "allotment" && e.status === "confirmed");
        if (!allotted) expect(line).not.toMatch(/^Delivered/);
        expect(line).not.toMatch(/\b(?:by|on|around|expected) \d{1,2} (?:Nov|Dec) 2026\b/);
      }
    }
  });
});
