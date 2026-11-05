import { describe, it, expect } from "vitest";
import {
  checkBannedPhrases,
  checkPii,
  checkNumbersAllowed,
  checkGrounding,
  verifyGate,
  sanitizeInputText,
} from "../../lib/gate";
import { SlipOutputSchema } from "../../lib/types";

describe("Quality Gate Tests", () => {
  describe("Banned Phrases Gate", () => {
    it("should pass clean, formal financial copy", () => {
      const clean = "Your instalment of ₹2,000 completed. 20.986 units bought at NAV of ₹95.30.";
      expect(checkBannedPhrases(clean)).toBe(false);
    });

    it("should fail when advice or recommendation is present", () => {
      expect(checkBannedPhrases("We recommend switching to an index fund.")).toBe(true);
      expect(checkBannedPhrases("Our suggestion is to invest more.")).toBe(true);
      expect(checkBannedPhrases("This is the best fund in the market.")).toBe(true);
    });

    it("should fail when return predictions or forecasts are present", () => {
      expect(checkBannedPhrases("Your money will grow to 50,000 by 2028.")).toBe(true);
      expect(checkBannedPhrases("We forecast strong returns next year.")).toBe(true);
    });

    it("should fail when urgency tactics are used", () => {
      expect(checkBannedPhrases("Act now before it's too late.")).toBe(true);
      expect(checkBannedPhrases("Hurry! Last chance to invest.")).toBe(true);
    });

    it("should fail when guilt or shame copy is used", () => {
      expect(checkBannedPhrases("Don't give up on your dreams.")).toBe(true);
      expect(checkBannedPhrases("You will regret quitting this SIP.")).toBe(true);
      expect(checkBannedPhrases("You broke your promise.")).toBe(true);
    });

    it("should fail when safety guarantees or emotional hype are used", () => {
      expect(checkBannedPhrases("This is a guaranteed return fund.")).toBe(true);
      expect(checkBannedPhrases("Enjoy this amazing journey.")).toBe(true);
      expect(checkBannedPhrases("We are so proud of your progress.")).toBe(true);
    });
  });

  describe("PII & Sensitive Data Gate", () => {
    it("should sanitize PII from inputs", () => {
      const input = "Bank account 12345678901234, PAN ABCDE1234F, phone 9876543210";
      const sanitized = sanitizeInputText(input);
      expect(sanitized).not.toContain("ABCDE1234F");
      expect(sanitized).not.toContain("9876543210");
      expect(sanitized).toContain("[REDACTED_PAN]");
      expect(sanitized).toContain("[REDACTED_PHONE]");
    });

    it("should catch PAN in output text", () => {
      expect(checkPii("Refund linked to ABCDE1234F.")).toBe(true);
    });

    it("should catch Aadhaar in output text", () => {
      expect(checkPii("KYC for 1234 5678 9012 verified.")).toBe(true);
    });

    it("should catch unapproved account numbers", () => {
      expect(checkPii("Credit to account 987654321012.")).toBe(true);
    });

    it("should allow expected ledger numbers and dates", () => {
      const allowed = [16000, 2000, 108.20];
      expect(checkPii("₹2,000 paid at 108.20.", allowed)).toBe(false);
    });
  });

  describe("Number Matching Gate", () => {
    it("should pass when all output numbers match allowed numbers within ±0.001", () => {
      const allowed = [2000, 95.3, 20.986];
      const extracted = [2000, 95.3, 20.986];
      expect(checkNumbersAllowed(extracted, allowed)).toBe(true);
    });

    it("should pass with minor floating point precision difference <= 0.001", () => {
      const allowed = [20.986];
      const extracted = [20.9863]; // diff is 0.0003
      expect(checkNumbersAllowed(extracted, allowed)).toBe(true);
    });

    it("should fail when unallowed or hallucinated numbers appear", () => {
      const allowed = [2000, 100.0, 20.0];
      const extracted = [2000, 100.0, 20.0, 50000]; // 50000 not in allowed
      expect(checkNumbersAllowed(extracted, allowed)).toBe(false);
    });
  });

  describe("Grounding Gate", () => {
    it("should pass grounded capitalized words", () => {
      const input = "Moved into a flat with two friends in Pune.";
      const output = "In the month you moved to Pune, you bought units.";
      expect(checkGrounding(output, [input])).toBe(true);
    });

    it("should fail ungrounded capitalized entities", () => {
      const input = "First salary from my first job.";
      const output = "In the month you visited Singapore, your SIP completed.";
      // Singapore is not in input or standard allowlist
      expect(checkGrounding(output, [input])).toBe(false);
    });
  });

  describe("Master verifyGate function", () => {
    const fallback = {
      cause: "paid" as const,
      headline: "Instalment completed.",
      body: "₹2,000 invested.",
    };

    it("should pass valid output and return pass code", () => {
      const valid = {
        cause: "paid" as const,
        headline: "Instalment completed.",
        body: "₹2,000 invested. 20.000 units bought.",
      };
      const res = verifyGate(SlipOutputSchema, valid, [2000, 20.0], fallback);
      expect(res.isValid).toBe(true);
      expect(res.code).toBe("pass");
      expect(res.data.headline).toBe(valid.headline);
    });

    it("should reject schema errors and serve fallback", () => {
      const invalid = {
        cause: "unknown_random_cause",
        headline: 123,
      };
      const res = verifyGate(SlipOutputSchema, invalid, [2000], fallback);
      expect(res.isValid).toBe(false);
      expect(res.code).toBe("schema");
      expect(res.data).toEqual(fallback);
    });

    it("should reject banned words and serve fallback", () => {
      const bad = {
        cause: "paid" as const,
        headline: "Amazing milestone!",
        body: "We recommend you hurry and invest more.",
      };
      const res = verifyGate(SlipOutputSchema, bad, [2000], fallback);
      expect(res.isValid).toBe(false);
      expect(res.code).toBe("banned");
      expect(res.data).toEqual(fallback);
    });
  });
});
