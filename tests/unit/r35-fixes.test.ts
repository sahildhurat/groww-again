// R35 (Claude): regression tests for the fixes made after the first live eval attempt.
import { describe, it, expect } from "vitest";
import { sanitizeInputText, checkPii, extractNumbers } from "@/lib/gate";

describe("sanitizeInputText masks every identifier, not only the first", () => {
  it("masks two account numbers", () => {
    const out = sanitizeInputText("Debit from 123456789012 failed, retry from 987654321098 also failed");
    expect(out).not.toMatch(/\d{9,}/);
    expect(out.match(/\[REDACTED_[A-Z]+\]/g)?.length).toBe(2); // 12-digit numbers are masked by the Aadhaar pattern first
  });
  it("masks two phone numbers", () => {
    const out = sanitizeInputText("Call 9876543210 or 9123456789");
    expect(out).not.toMatch(/[6-9]\d{9}/);
  });
  it("numbers left after masking never include an identifier", () => {
    const masked = sanitizeInputText("Rs 5,000 debit failed on 12345678901 and 10987654321");
    const nums = extractNumbers(masked);
    expect(nums).toContain(5000);
    expect(nums.some((n) => String(n).length >= 9)).toBe(false);
    // and the PII check still flags the raw identifier if a reply repeats it
    expect(checkPii("Your account 12345678901 failed", nums)).toBe(true);
  });
});
