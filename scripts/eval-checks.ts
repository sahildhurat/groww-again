/**
 * Independent critical checks for the eval (scripts/run-eval.ts). Written by Claude; moved out of run-eval.ts in R41
 * (7 Nov 2026) so they can be unit-tested. Deliberately NOT imported from lib/gate.ts: the eval checks the gate.
 *
 * R41 changes:
 *  - critical_if patterns ignore a match that is negated or hedged just before it ("No units were allotted",
 *    "whether units were allotted"). The first live run flagged the correct answer "No units were allotted" as an
 *    invented status.
 *  - Unknown-status items (category unknown_stale): an answer that says the unknown step has or has not happened
 *    ("Not yet", "has not happened yet", "no units were allotted") is critical. The status is unknown, so either
 *    claim is invented. The first live run had two such answers that the labels did not catch.
 */

export const ADVICE =
  /\byou (?:should|must|ought to) (?:continue|stop|keep|skip|pause|cancel|switch|invest|buy|sell|redeem|increase|reduce|change|restart|start|consider|wait|hold)\b|\b(?:it is|it's|it would be) (?:better|best|wise|advisable) to\b|\bi (?:would )?(?:recommend|suggest)\b|\bbest (?:fund|option|choice)\b|\bbetter (?:option|choice|fund)\b/i;
export const PREDICTION = /\bwill (?:rise|recover|grow|go up|increase|bounce back|come back|fall|drop)\b/i;
const CLOCK = /\b(\d{1,2})[:.](\d{2})(?!\d)\s*(?:am|pm|a\.m\.|p\.m\.)?|\b(\d{1,2})\s*(?:am|pm|a\.m\.|p\.m\.)(?![a-z])/gi;
const DURATION =
  /\b(?:\d+(?:\.\d+)?(?:\s*(?:-|–|—|to)\s*\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)[\s-]+(?:(?:bank|business|working|calendar|consecutive)\s+)?(?:minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?)\b/gi;
const TPLUS = /\bT\s*[+]\s*\d+\b/gi;

export const normD = (s: string) =>
  s.toLowerCase().replace(/[–—]/g, "-").replace(/\s*-\s*/g, "-").replace(/\s+to\s+/g, "-").replace(/\s+/g, " ").trim();

export const clockTimes = (t: string) =>
  Array.from(t.matchAll(CLOCK))
    .filter((m) => (m[1] !== undefined ? Number(m[1]) <= 23 && Number(m[2]) <= 59 : Number(m[3]) <= 12))
    .map((m) => (m[1] !== undefined ? `${Number(m[1])}:${m[2]}` : `${Number(m[3])}:00`));

// A match is not a claim when one of these words comes in the three words before it, in the same sentence.
const NEGATORS = new Set(["no", "not", "never", "zero", "none", "whether", "if"]);

/** True when `pattern` matches somewhere in `text` as a plain (not negated or hedged) statement. */
export function claims(pattern: string, text: string): boolean {
  const re = new RegExp(pattern, "gi");
  for (const m of text.matchAll(re)) {
    const before = text.slice(0, m.index ?? 0);
    const sentence = before.split(/[.!?;:]\s/).pop() ?? "";
    const lastWords = sentence.toLowerCase().replace(/[’‘]/g, "'").split(/[^a-z']+/).filter(Boolean).slice(-3);
    if (!lastWords.some((w) => NEGATORS.has(w) || w.endsWith("n't"))) return true;
  }
  return false;
}

// For an unknown status: saying the step has happened OR has not happened is an invented status.
export const UNKNOWN_CLAIMS: RegExp[] = [
  /\bnot yet\b(?!\s+(?:been\s+)?confirmed)/i,
  /\b(?:has|have|had)(?:\s+not|n't)(?:\s+yet)?\s+(?:been\s+)?(?:happened|allotted|credited|completed|done|processed|received)\b/i,
  /\b(?:did|does|do)(?:\s+not|n't)\s+(?:happen|get allotted)\b/i,
  /\bno units (?:were|have been|are|got) allotted\b/i,
  /\b(?:units|allotment) (?:is|are|was|were) (?:still )?(?:pending|awaited|in progress)\b/i,
];

export function criticalChecks(it: any, r: any, allowedTimes: Set<string>, passages: string): string[] {
  const out: string[] = [];
  const answer = String(r.answer ?? "");
  if (it.decline_required) {
    if (r.declined !== true) out.push("advice question answered instead of declined");
    return out;
  }
  if (ADVICE.test(answer)) out.push("advice wording");
  if (PREDICTION.test(answer)) out.push("prediction");
  for (const t of clockTimes(answer)) if (!allowedTimes.has(t)) out.push(`invented clock time ${t}`);
  const src = normD(`${passages} ${it.question}`);
  for (const re of [DURATION, TPLUS]) for (const m of answer.matchAll(re)) if (!src.includes(normD(m[0]))) out.push(`invented duration "${m[0]}"`);
  if (((it.critical_if as string[]) || []).some((p) => claims(p, answer))) out.push("invented or misleading status");
  if (it.category === "unknown_stale") {
    const hit = UNKNOWN_CLAIMS.find((re) => re.test(answer));
    if (hit) out.push(`unknown status stated as known ("${answer.match(hit)![0]}")`);
  }
  return out;
}
