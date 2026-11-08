// The delivery tracker wording (8 Nov 2026; Piece by piece removed 9 Nov).
import { describe, it, expect } from "vitest";
import seed from "../../data/passbook-seed.json";
import { deliveryLine } from "@/lib/delivery";
import type { Instalment } from "@/lib/passbook-types";

const sc = (seed as any).scenarios as Record<string, { instalments: Instalment[] }>;
const run = sc.running.instalments;
const byId = (id: string) => run.find((i) => i.id === id)!;

describe("delivery wording", () => {
  it("says only what the events confirm, and states arrival as the rule, never a date", () => {
    expect(deliveryLine(byId("inst-2026-11-05"), "Groww AutoPay")).toBe(
      "Picked up from your bank and handed to the fund. Not delivered to your name yet: units are expected two working days after the SIP date (T+2) with Groww AutoPay."
    );
    expect(deliveryLine(byId("inst-2026-10-05"))).toBe("Delivered to your name: 18.709 units.");
    expect(deliveryLine(byId("inst-2026-05-05"))).toBe("Not picked up: no money left your account.");
    expect(deliveryLine(byId("inst-2026-09-05"))).toBe("Returned to your bank: the full ₹2,000 came back on 12 Sep 2026.");
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

describe("delivery tracker stops (9 Nov)", () => {
  it("names each stop in delivery words with the banking term kept, and never says Delivered before allotment", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const React = await import("react");
    const { MoneyTrail } = await import("@/components/ui/money-trail");
    const html = (id: string, s = "running") =>
      renderToStaticMarkup(React.createElement(MoneyTrail, { inst: sc[s].instalments.find((i) => i.id === id)!, paymentRoute: "Groww AutoPay" }));
    const nov = html("inst-2026-11-05");
    expect(nov).toContain("Bank debit");
    expect(nov).toContain("Picked up");
    expect(nov).toContain("Handed to the fund");
    expect(nov).toContain("On the way");
    expect(nov).toContain("5 Nov, 09:12");
    expect(nov).not.toContain("Delivered:");
    expect(html("inst-2026-10-05")).toContain("Delivered: 18.709 units");
    expect(html("inst-2026-05-05")).toContain("Not picked up");
    expect(html("inst-2026-09-05")).toContain("Returned to your bank");
    expect(html("inst-2026-11-05", "stale")).toContain("Can&#x27;t confirm right now");
  });
});
