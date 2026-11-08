// R45 (Claude, 8 Nov 2026): server-side check that an answer given on an instalment page is about that instalment.
// The live audit found answers on one month's page that described another month. When an entry is selected, the
// answer cites only facts from other instalments, and the question does not point elsewhere (another month, or the
// latest / next / previous instalment, or the whole history), the route replaces the answer with the fallback
// (gate code "wrong_entry"). Rule passages and computed facts never decide it either way.
import type { Instalment } from "@/lib/passbook-types";
import { formatDate } from "@/lib/format";

const MONTHS: Array<[RegExp, number]> = [
  [/\bjan(?:uary)?\b/i, 1],
  [/\bfeb(?:ruary)?\b/i, 2],
  [/\bmar(?:ch)?\b/i, 3],
  [/\bapr(?:il)?\b/i, 4],
  [/\bMay\b/, 5], // capital M only: "may" is also a verb
  [/\bjune?\b/i, 6],
  [/\bjuly?\b/i, 7],
  [/\baug(?:ust)?\b/i, 8],
  [/\bsep(?:t|tember)?\b/i, 9],
  [/\boct(?:ober)?\b/i, 10],
  [/\bnov(?:ember)?\b/i, 11],
  [/\bdec(?:ember)?\b/i, 12],
];

const POINTS_ELSEWHERE =
  /\b(?:latest|current|next|previous|last|earlier|other|another|all|every|each|total|overall|so far|history|before|after|again|months)\b/i;

/** True when the question names a month other than the entry's own, or points at other instalments in general. */
export function questionPointsElsewhere(question: string, entryDueDate: string): boolean {
  if (POINTS_ELSEWHERE.test(question)) return true;
  const own = parseInt(entryDueDate.slice(5, 7), 10);
  return MONTHS.some(([re, m]) => m !== own && re.test(question));
}

export function answersAnotherEntry(opts: {
  entry: Instalment | null;
  instalments: Instalment[];
  factsUsed: unknown;
  question: string;
  declined?: boolean;
  /** Live check, 8 Nov: an answer that names the entry's own date or month is about the entry, whatever it cites. */
  answer?: string;
}): boolean {
  const { entry, instalments, factsUsed, question, declined, answer } = opts;
  if (!entry || declined) return false;
  // Live checks, 8 Nov: judge by the dates the answer names first. An answer that names another instalment's date and
  // not this one's is about another month, whatever it cites; one that names only this month's date is about it.
  if (answer && !questionPointsElsewhere(question, entry.due_date)) {
    const full = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const names = (i: Instalment) => {
      const mi = parseInt(i.due_date.slice(5, 7), 10) - 1;
      return answer.includes(formatDate(i.due_date)) || answer.includes(`${full[mi]} ${i.due_date.slice(0, 4)}`);
    };
    const namesOwn = names(entry);
    const namesOther = instalments.some((i) => i.id !== entry.id && names(i));
    if (namesOther && !namesOwn) return true;
    if (namesOwn && !namesOther) return false;
  }
  if (!Array.isArray(factsUsed)) return false;
  const facts = factsUsed.filter((f): f is string => typeof f === "string");

  const own = new Set<string>([entry.id, ...entry.events.map((e) => e.id)]);
  if (facts.some((f) => own.has(f))) return false;

  const others = new Set<string>();
  for (const i of instalments) {
    if (i.id === entry.id) continue;
    others.add(i.id);
    for (const e of i.events) others.add(e.id);
  }
  if (!facts.some((f) => others.has(f))) return false;

  return !questionPointsElsewhere(question, entry.due_date);
}
