import { describe, it, expect } from "vitest";
import { FAILURE_CODES } from "../../lib/failure-codes";
import rulesData from "../../data/rules.json";

const ruleIds = new Set((rulesData as Array<{ id: string }>).map((r) => r.id));

describe("failure-codes rule_ids (§4.3, §8)", () => {
  it("all defined failure codes exist", () => {
    expect(FAILURE_CODES.INSUFFICIENT_BALANCE).toBeDefined();
    expect(FAILURE_CODES.MANDATE_NOT_APPROVED).toBeDefined();
    expect(FAILURE_CODES.ORDER_NOT_ACCEPTED).toBeDefined();
    expect(FAILURE_CODES.STATUS_UNAVAILABLE).toBeDefined();
  });

  for (const [codeName, fc] of Object.entries(FAILURE_CODES)) {
    for (const ruleId of fc.rule_ids) {
      it(`${codeName}: rule_id "${ruleId}" exists in data/rules.json`, () => {
        expect(ruleIds.has(ruleId)).toBe(true);
      });
    }
  }

  it("STATUS_UNAVAILABLE has 0 rule_ids because no timeline rule exists in rules.json", () => {
    expect(FAILURE_CODES.STATUS_UNAVAILABLE.rule_ids).toHaveLength(0);
  });
});

