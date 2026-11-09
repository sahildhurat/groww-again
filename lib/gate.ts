import { z } from "zod";
import { GateResultCode, GateVerificationResult } from "./types";

// Banned phrases from §3 & §8
// Advice, predictions, urgency, guilt, safety claims, emotional hype
const BANNED_PATTERNS = [
  /\b(recommend|recommendation|recommending)\b/i,
  /\b(suggest|suggestion|suggesting)\b/i,
  /\bbest fund\b/i,
  // R48 (Claude, 9 Nov): "switch to" stays banned for funds and plans, but not for Groww's own instruction to
  // "switch to an approved AutoPay" (Groww help, AutoPay page), which is not advice. The 9 Nov eval (sc06) and two
  // earlier runs sent every answer that quoted that sentence to the fallback.
  /\bswitch to\b(?!\s+(?:an?\s+|the\s+|another\s+|your\s+)?(?:approved\s+|new\s+|different\s+|active\s+)?(?:autopay|auto-pay|upi autopay|bank(?:\s+account)?|mandate)\b)/i,
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
  // R39 (Claude): telling the investor what to do. "You should receive a refund…" stays allowed.
  /\byou (?:should|must|ought to) (?:continue|stop|keep|skip|pause|cancel|switch|invest|buy|sell|redeem|increase|reduce|change|restart|start|consider|wait|hold)\b/i,
  /\b(?:it is|it's|it would be) (?:better|best|wise|advisable) to\b/i,
];

// PII patterns (§8)
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const IFSC_REGEX = /\b[A-Z]{4}0[A-Z0-9]{6}\b/i;
const PHONE_REGEX = /\b[6-9]\d{9}\b/;
const ACCOUNT_REGEX = /\b\d{9,18}\b/;

// Global copies for redaction (R35, Claude): String.replace with a non-global pattern only replaced the FIRST match,
// so a second account or phone number in the same text reached the model unmasked. The non-global patterns
// stay for .test() in checkPii, where a global pattern would carry lastIndex state between calls.
const g = (r: RegExp) => new RegExp(r.source, r.flags.includes("g") ? r.flags : r.flags + "g");

export function sanitizeInputText(input: string): string {
  if (!input) return "";
  return input
    .replace(g(PAN_REGEX), "[REDACTED_PAN]")
    .replace(g(AADHAAR_REGEX), "[REDACTED_AADHAAR]")
    .replace(g(IFSC_REGEX), "[REDACTED_IFSC]")
    .replace(g(PHONE_REGEX), "[REDACTED_PHONE]")
    .replace(g(ACCOUNT_REGEX), (match) => {
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

// R41 (Claude): `investorWords` is text the investor wrote or said themselves. A banned pattern that also matches it is not
// counted, so a Future Thread line can keep "I want to quit my job" (the list exists to stop the app's own voice from
// guilt-tripping or advising, not to censor the investor's words).
export function checkBannedPhrases(text: string, investorWords?: string): boolean {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text) && !(investorWords && pattern.test(investorWords))) {
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

// R39 (Claude, 7 Nov 2026): times and durations. The numbers check alone let "within 3 working days, around 4:30 pm"
// through, because 3 is a standard count and 4 and 30 occur in the context's timestamps. A clock time must be one of
// the times in the facts, and a duration ("2 working days", "5–6 business days", "24 hours", "T+1") must appear word for
// word in the allowed source text (the facts, the help passages and the investor's own question).
// (?!\d) keeps unit and NAV decimals such as "19.531" or "102.40" from reading as clock times.
const CLOCK_TIME = /\b(\d{1,2})[:.](\d{2})(?!\d)\s*(?:am|pm|a\.m\.|p\.m\.)?|\b(\d{1,2})\s*(?:am|pm|a\.m\.|p\.m\.)(?![a-z])/gi;
const DURATION =
  /\b(?:\d+(?:\.\d+)?(?:\s*(?:-|–|—|to)\s*\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)[\s-]+(?:(?:bank|business|working|calendar|consecutive)\s+)?(?:minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)\b/gi;
const T_PLUS = /\bT\s*[+]\s*\d+\b/gi;

// 9 Nov (Claude, live check): a date must come from the facts, the help passages or the question. The live answer to
// "I paid on 5 November. Where are my units?" said units were expected "around 7 Nov 2026": a date the model worked out
// itself (and a Saturday). Arrival is only ever stated as Groww's rule (T+2), never as a predicted date.
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_WORD = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DAY_MONTH = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_WORD}\\b(?:,?\\s+(\\d{4}))?`, "gi");
const MONTH_DAY = new RegExp(`\\b${MONTH_WORD}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`, "gi");
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})(?!\d)/g;

const monthIndex = (w: string) => MONTHS.indexOf(w.slice(0, 3).toLowerCase());

/** Dates in a text as "d-m" and "d-m-yyyy" keys (month 0-11). */
export function extractDates(text: string): { day: string; full: string | null }[] {
  const out: { day: string; full: string | null }[] = [];
  const push = (d: number, m: number, y?: string) => {
    if (m < 0 || d < 1 || d > 31) return;
    out.push({ day: `${d}-${m}`, full: y ? `${d}-${m}-${y}` : null });
  };
  for (const x of text.matchAll(DAY_MONTH)) push(Number(x[1]), monthIndex(x[2]), x[3]);
  for (const x of text.matchAll(MONTH_DAY)) push(Number(x[2]), monthIndex(x[1]), x[3]);
  for (const x of text.matchAll(ISO_DATE)) push(Number(x[3]), Number(x[2]) - 1, x[1]);
  return out;
}

/** True when every date in `text` also appears in `allowedSourceText` (with its year, when the answer gives one). */
export function checkDates(text: string, allowedSourceText: string): boolean {
  const allowed = extractDates(allowedSourceText);
  const days = new Set(allowed.map((a) => a.day));
  const fulls = new Set(allowed.filter((a) => a.full).map((a) => a.full as string));
  for (const d of extractDates(text)) {
    if (d.full ? !fulls.has(d.full) : !days.has(d.day)) return false;
  }
  return true;
}

const normDuration = (s: string) =>
  s.toLowerCase().replace(/[–—]/g, "-").replace(/\s*-\s*/g, "-").replace(/\s+to\s+/g, "-").replace(/\s+/g, " ").trim();

/** Returns the clock times (as "H:MM", hour without a leading zero) found in a text. */
export function extractClockTimes(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(CLOCK_TIME)) {
    if (m[1] !== undefined) {
      const h = Number(m[1]);
      const min = m[2];
      if (h <= 23 && Number(min) <= 59) out.push(`${h}:${min}`);
    } else if (m[3] !== undefined) {
      out.push(`${Number(m[3])}:00`);
    }
  }
  return out;
}

/** True when every clock time in `text` is one of `allowedTimes` and every duration appears in `allowedSourceText`. */
export function checkTimesAndDurations(text: string, allowedSourceText: string, allowedTimes: string[]): boolean {
  const times = new Set(allowedTimes.flatMap((t) => extractClockTimes(t)));
  for (const t of extractClockTimes(text)) {
    if (!times.has(t)) return false;
  }
  if (!checkDates(text, allowedSourceText)) return false;
  const source = normDuration(allowedSourceText);
  for (const re of [DURATION, T_PLUS]) {
    for (const m of text.matchAll(re)) {
      if (!source.includes(normDuration(m[0]))) return false;
    }
  }
  return true;
}

/**
 * `as_of` must be null or equal (same instant) to one of the allowed timestamps. When `required` is set (an answer about a
 * step that is pending or unknown), `as_of` must equal it and the answer text must state its clock time.
 */
export function checkAsOf(
  asOf: string | null | undefined,
  allowed: string[],
  text: string,
  required?: { iso: string; time: string } | null
): boolean {
  const same = (a: string, b: string) => {
    const x = Date.parse(a);
    const y = Date.parse(b);
    return Number.isFinite(x) && Number.isFinite(y) && x === y;
  };
  if (required) {
    if (!asOf || !same(asOf, required.iso)) return false;
    const want = extractClockTimes(required.time);
    const got = new Set(extractClockTimes(text));
    return want.length > 0 && want.every((t) => got.has(t));
  }
  if (asOf === null || asOf === undefined || asOf === "") return true;
  return allowed.some((a) => same(asOf, a));
}

// R44 (Claude, 8 Nov live check): internal labels must never reach the investor. The live answers quoted rule ids
// ("rule-pay-now-01 says"), reason codes ("ORDER_NOT_ACCEPTED"), app paths ("see /options"), the prompt's own words
// ("rule passages", "the context") and UI that does not exist ("the button provided").
const INTERNAL_REF_PATTERNS = [
  /\brule-[a-z0-9]+(?:-[a-z0-9]+)*\b/i,
  /\bev-\d{4}-\d{2}-\d{2}-[a-z]+\b/i,
  /\binst-\d{4}-\d{2}-\d{2}\b/i,
  /\bcomputed:\w+/i,
  /\b[A-Z]{2,}(?:_[A-Z0-9]{2,})+\b/,
  /(?:^|[\s("'])\/(?:ask|passbook|quality|your-data|demo-tools)\b/i, // "/options" is allowed: it is shown as a link
  /\brule passages?\b/i,
  /\b(?:context json|the context|provided material|passbook context)\b/i,
  /\b(?:as_of|as_of_display|effective_display|latest_instalment|facts_used|value_at_latest_nav|confirmed_totals|reason_meaning|money_status|demo_now_display|payment_route|official_record|all_instalments|value_minus_put_in|value_change_pct)\b/i,
  /\b(?:using the button|the button provided|button in the app)\b/i,
];

/**
 * Live check, 8 Nov 23:15: the evaluated prompt (7 Nov) calls Groww's help pages "rule passages" and the data "the
 * context", and the model sometimes repeats those words; blocking them sent about a third of live answers to the
 * fallback. These prompt words are reworded to plain ones before the gate runs; ids, codes, paths and field names
 * still block.
 */
export function softenPromptWords(text: string): string {
  if (!text) return text;
  return text
    // R48 (Claude, 9 Nov): two Groww help pages end "contact us using the button below"; Sensecheck has no button, so the
    // quoted sentence reads "contact Groww support". The internal-reference check still blocks any other button wording.
    .replace(/\bcontact us using the button below\b/gi, "contact Groww support")
    .replace(/\busing the button below\b/gi, "through Groww support")
    .replace(/\b(?:the |a |these |those )?rule passages? (say|says|state|states|show|shows|describe|describes|note|notes)\b/gi, (_m, v: string) => `Groww's help ${v.endsWith("s") ? v : v + "s"}`)
    .replace(/\b(?:the |a |these |those )?rule passages?\b/gi, "Groww's help")
    .replace(/\b(?:the provided material|the passbook context|the context json|the context)\b/gi, "your passbook")
    .replace(/\bunder the public summary\b/gi, "according to Groww's help")
    .replace(/\bthe public summary\b/gi, "Groww's help");
}

export function checkInternalRefs(text: string): boolean {
  return INTERNAL_REF_PATTERNS.some((p) => p.test(text));
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
    /** R39: facts + passages + question; durations in the answer must appear here word for word. */
    allowedSourceText?: string;
    /** R39: clock times allowed in the answer (e.g. "10:00", "09:12"). Used with allowedSourceText. */
    allowedTimes?: string[];
    /** R39: the answer's as_of field, the timestamps it may equal, and (for pending/unknown steps) the one it must equal. */
    asOf?: { value: string | null | undefined; allowed: string[]; required?: { iso: string; time: string } | null };
    /** R41: the investor's own words (Future Thread transcript). Banned words that appear there are allowed. */
    investorWords?: string;
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

  // 2b. R39: clock times and durations must come from the facts or a passage
  if (options?.allowedSourceText !== undefined) {
    if (!checkTimesAndDurations(textContent, options.allowedSourceText, options.allowedTimes ?? [])) {
      return {
        isValid: false,
        code: "time",
        data: fallbackData,
        isFallback: true,
        reason: "A clock time or duration that is not in the facts or the help passages",
      };
    }
  }

  // 2c. R39: as_of must be a timestamp from the facts (and the pending step's own one when required)
  if (options?.asOf) {
    if (!checkAsOf(options.asOf.value, options.asOf.allowed, textContent, options.asOf.required)) {
      return {
        isValid: false,
        code: "as_of",
        data: fallbackData,
        isFallback: true,
        reason: "as_of missing, invented, or not stated in the answer for a pending or unknown step",
      };
    }
  }

  // 3. Banned phrases check
  if (checkBannedPhrases(textContent, options?.investorWords)) {
    return {
      isValid: false,
      code: "banned",
      data: fallbackData,
      isFallback: true,
      reason: "Prohibited term, advice, prediction, or urgency phrase detected",
    };
  }

  // 3b. R44: no internal ids, codes, paths or prompt words in the answer
  if (checkInternalRefs(textContent)) {
    return {
      isValid: false,
      code: "internal",
      data: fallbackData,
      isFallback: true,
      reason: "Internal id, code, path or prompt wording in the answer",
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
