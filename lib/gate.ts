import { z } from "zod";
import { GateResultCode, GateVerificationResult } from "./types";

// Banned phrases from §3 & §8
// Advice, predictions, urgency, guilt, safety claims, emotional hype
const BANNED_PATTERNS = [
  /\b(recommend|recommendation|recommending)\b/i,
  /\b(suggest|suggestion|suggesting)\b/i,
  /\bbest fund\b/i,
  /\bswitch to\b/i,
  /\bportfolio review\b/i,
  /\bbuy this\b/i,
  /\bsell this\b/i,
  /\b(predict|prediction|predicting|forecast|forecasting)\b/i,
  /\btarget return\b/i,
  /\bwill grow\b/i,
  /\bfuture value\b/i,
  /\bhurry\b/i,
  /\blast chance\b/i,
  /\bonly today\b/i,
  /\bbefore it'?s too late\b/i,
  /\blimited time\b/i,
  /\bgive up\b/i,
  /\bquit\b/i,
  /\bregret\b/i,
  /\bdisappoint\b/i,
  /\byou promised\b/i,
  /\bbroken promise\b/i,
  /\bbroke your promise\b/i,
  /\bguaranteed\b/i,
  /\bassured\b/i,
  /\brisk-?free\b/i,
  /\bamazing\b/i,
  /\bjourney\b/i,
  /\bdon'?t give up\b/i,
  /\bproud\b/i,
];

// PII patterns (§8)
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const IFSC_REGEX = /\b[A-Z]{4}0[A-Z0-9]{6}\b/i;
const PHONE_REGEX = /\b[6-9]\d{9}\b/;
const ACCOUNT_REGEX = /\b\d{9,18}\b/;

export function sanitizeInputText(input: string): string {
  if (!input) return "";
  return input
    .replace(PAN_REGEX, "[REDACTED_PAN]")
    .replace(AADHAAR_REGEX, "[REDACTED_AADHAAR]")
    .replace(IFSC_REGEX, "[REDACTED_IFSC]")
    .replace(PHONE_REGEX, "[REDACTED_PHONE]")
    .replace(ACCOUNT_REGEX, (match) => {
      // Don't redact year numbers or short counts
      if (match.length >= 9 && match.length <= 18) {
        return "[REDACTED_ACC]";
      }
      return match;
    });
}

export function checkPii(text: string, allowedNumbers: number[] = []): boolean {
  if (PAN_REGEX.test(text)) return true;
  if (AADHAAR_REGEX.test(text)) return true;
  if (IFSC_REGEX.test(text)) return true;
  if (PHONE_REGEX.test(text)) {
    // Check if matched phone is an allowed number
    const matches = text.match(PHONE_REGEX);
    if (matches && !allowedNumbers.includes(Number(matches[0]))) {
      return true;
    }
  }

  // Check 9-18 digit account numbers
  const accMatches = text.match(/\b\d{9,18}\b/g);
  if (accMatches) {
    for (const match of accMatches) {
      const numVal = Number(match);
      if (!allowedNumbers.includes(numVal)) {
        return true;
      }
    }
  }

  return false;
}

export function checkBannedPhrases(text: string): boolean {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

// Extract numbers from text (e.g. "₹2,000 bought 19.531 units at 102.40 in 2026")
export function extractNumbers(text: string): number[] {
  // Remove commas inside numbers (e.g. 16,000 -> 16000)
  const cleaned = text.replace(/(\d),(\d)/g, "$1$2");
  const matches = cleaned.match(/\b\d+(?:\.\d+)?\b/g);
  if (!matches) return [];
  return matches.map(Number);
}

// Verify that all extracted numbers match allowed numbers
export function checkNumbersAllowed(
  extracted: number[],
  allowed: number[]
): boolean {
  for (const num of extracted) {
    // If num is 0 or 1 or 2 (common grammatical words/counts like "two sentences", "1 of 3", "2 working days"),
    // allow standard operational numbers if in reasonable range:
    if ([1, 2, 3, 7, 14, 15, 30].includes(num)) {
      continue;
    }

    const matchesAny = allowed.some((allowedNum) => {
      // Match float within 0.001
      return Math.abs(num - allowedNum) <= 0.001;
    });

    if (!matchesAny) {
      return false;
    }
  }
  return true;
}

const ALLOWED_GROUNDING_TOKENS = new Set([
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
  "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  "NAV", "SIP", "AutoPay", "Nifty", "Index", "Fund", "Groww", "Rupee", "INR",
  "SEBI", "AMFI", "NACH", "UPI", "KRA", "KYC", "Pay", "Now", "Locker"
]);

export function checkGrounding(
  outputText: string,
  inputTexts: string[],
  extraTokens: string[] = []
): boolean {
  // Collect all capitalized words in output (excluding first word of sentence)
  const sentences = outputText.split(/[.!?]\s+/);
  const capitalizedWords: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    // Skip the first word of sentence
    for (let i = 1; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, "");
      if (clean.length > 1 && clean[0] === clean[0].toUpperCase() && clean[0] !== clean[0].toLowerCase()) {
        capitalizedWords.push(clean);
      }
    }
  }

  // Build input allowlist
  const inputAllowSet = new Set<string>();
  ALLOWED_GROUNDING_TOKENS.forEach((t) => inputAllowSet.add(t.toLowerCase()));
  extraTokens.forEach((t) => inputAllowSet.add(t.toLowerCase()));

  for (const input of inputTexts) {
    const words = input.split(/[^a-zA-Z0-9]/).filter(Boolean);
    for (const w of words) {
      inputAllowSet.add(w.toLowerCase());
    }
  }

  for (const capWord of capitalizedWords) {
    if (!inputAllowSet.has(capWord.toLowerCase())) {
      return false;
    }
  }

  return true;
}

// Master gate verification function
export function verifyGate<T>(
  schema: z.ZodSchema<T>,
  rawOutput: any,
  allowedNumbers: number[],
  fallbackData: T,
  options?: {
    textToCheck?: string;
    groundingInputTexts?: string[];
  }
): GateVerificationResult<T> {
  // 1. Schema check
  const parseResult = schema.safeParse(rawOutput);
  if (!parseResult.success) {
    return {
      isValid: false,
      code: "schema",
      data: fallbackData,
      isFallback: true,
      reason: parseResult.error.message,
    };
  }

  const validData = parseResult.data;
  const textContent =
    options?.textToCheck ??
    (typeof rawOutput === "string"
      ? rawOutput
      : JSON.stringify(validData));

  // 2. Numbers check
  const extractedNumbers = extractNumbers(textContent);
  if (!checkNumbersAllowed(extractedNumbers, allowedNumbers)) {
    return {
      isValid: false,
      code: "numbers",
      data: fallbackData,
      isFallback: true,
      reason: "Number mismatch against allowed input values",
    };
  }

  // 3. Banned phrases check
  if (checkBannedPhrases(textContent)) {
    return {
      isValid: false,
      code: "banned",
      data: fallbackData,
      isFallback: true,
      reason: "Prohibited term, advice, prediction, or urgency phrase detected",
    };
  }

  // 4. PII check
  if (checkPii(textContent, allowedNumbers)) {
    return {
      isValid: false,
      code: "pii",
      data: fallbackData,
      isFallback: true,
      reason: "PII or sensitive identifier pattern detected in output",
    };
  }

  // 5. Grounding check (if inputs provided)
  if (options?.groundingInputTexts && options.groundingInputTexts.length > 0) {
    if (!checkGrounding(textContent, options.groundingInputTexts)) {
      return {
        isValid: false,
        code: "ungrounded",
        data: fallbackData,
        isFallback: true,
        reason: "Ungrounded capitalized term or entity in output",
      };
    }
  }

  return {
    isValid: true,
    code: "pass",
    data: validData,
    isFallback: false,
  };
}
