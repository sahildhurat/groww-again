import { describe, it, expect } from "vitest";
import {
  getStopOptionsForCategory,
  evaluateReturnDate,
  getFixTopicForCause,
} from "../../lib/rules-engine";

describe("Rules Engine Tests", () => {
  describe("Stop Options Logic", () => {
    it("should provide pause, lower amount, skip, and cancel for cash shortages", () => {
      const options = getStopOptionsForCategory("cash_shortage", false, true);
      const actionIds = options.map((o) => o.id);
      expect(actionIds).toContain("pause");
      expect(actionIds).toContain("lower_amount");
      expect(actionIds).toContain("skip_next");
      expect(actionIds).toContain("cancel");
    });

    it("should provide bank update and cancel for bank_changed", () => {
      const options = getStopOptionsForCategory("bank_changed", false);
      const actionIds = options.map((o) => o.id);
      expect(actionIds).toContain("update_autopay");
      expect(actionIds).toContain("cancel");
      expect(actionIds).not.toContain("pause");
    });

    it("should provide factual clarification and cancel for fund_doubt without fund suggestions", () => {
      const options = getStopOptionsForCategory("fund_doubt", false);
      const actionIds = options.map((o) => o.id);
      expect(actionIds).toContain("facts");
      expect(actionIds).toContain("cancel");
      // Verify no suggestion
      options.forEach((opt) => {
        expect(opt.title.toLowerCase()).not.toContain("recommend");
        expect(opt.consequence.toLowerCase()).not.toContain("switch to");
      });
    });

    it("should ensure every option has a consequence line", () => {
      const options = getStopOptionsForCategory("cash_shortage", false);
      options.forEach((opt) => {
        expect(opt.consequence.length).toBeGreaterThan(10);
      });
    });
  });

  describe("Return-Date Pause Window Edge Calculations (§8)", () => {
    const nextInstalmentDate = "2026-11-05";

    it("should allow pause when date is at least 15 days and within 3 months", () => {
      // 20 days away
      const res = evaluateReturnDate("2026-11-25", nextInstalmentDate);
      expect(res.canPause).toBe(true);
      expect(res.offerText).toContain("Pause until");
      expect(res.offerText).toContain("subject to the fund house accepting the request");
    });

    it("should allow pause at exactly 15 days boundary", () => {
      const res = evaluateReturnDate("2026-11-20", nextInstalmentDate);
      expect(res.canPause).toBe(true);
    });

    it("should reject pause when date is fewer than 15 days away (e.g. 10 days)", () => {
      const res = evaluateReturnDate("2026-11-15", nextInstalmentDate);
      expect(res.canPause).toBe(false);
      expect(res.offerText).toContain("Cancel now. Your plan will be ready for you on");
    });

    it("should allow pause up to 3 months away (e.g. Feb 2027)", () => {
      const res = evaluateReturnDate("2027-02-05", nextInstalmentDate);
      expect(res.canPause).toBe(true);
    });

    it("should reject pause when date exceeds 3 months (e.g. 14 March 2027)", () => {
      const res = evaluateReturnDate("2027-03-14", nextInstalmentDate);
      expect(res.canPause).toBe(false);
      expect(res.offerText).toContain("Cancel now. Your plan will be ready for you on 14 March 2027");
    });
  });

  describe("Cause to Fix Mapping", () => {
    it("should map balance_insufficient to pay_now", () => {
      const fix = getFixTopicForCause("balance_insufficient");
      expect(fix.topic).toBe("pay_now");
      expect(fix.steps.some((s) => s.includes("Pay Now"))).toBe(true);
    });

    it("should map bank_account_issue to change_bank_autopay", () => {
      const fix = getFixTopicForCause("bank_account_issue");
      expect(fix.topic).toBe("change_bank_autopay");
      expect(fix.steps.some((s) => s.includes("AutoPay"))).toBe(true);
    });

    it("should map auto_cancelled to restart_new_sip", () => {
      const fix = getFixTopicForCause("auto_cancelled");
      expect(fix.topic).toBe("restart_new_sip");
      expect(fix.steps.some((s) => s.includes("new SIP"))).toBe(true);
    });
  });
});
