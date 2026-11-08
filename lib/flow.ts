// R42 (Claude, 7 Nov 2026): shared helpers for the links between pages (passbook ↔ entry ↔ Ask ↔ What can I do next?).
// Pure functions only, unit-tested in tests/unit/r42-flow.test.ts.
import rulesData from "@/data/rules.json";
import { instalmentState } from "@/lib/passbook";
import type { Instalment } from "@/lib/passbook-types";

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-11-05" → "2026-11" */
export function monthKey(dueDate: string): string {
  return dueDate.slice(0, 7);
}

/** "2026-11-05" or "2026-11" → "November" */
export function monthName(dateOrMonth: string): string {
  const m = parseInt(dateOrMonth.slice(5, 7), 10);
  return MONTH_FULL[m - 1] ?? "";
}

/** The instalment whose due date falls in the given "YYYY-MM" month, if any. */
export function entryIdForMonth(instalments: Instalment[], month: string): string | null {
  const hit = instalments.find((i) => monthKey(i.due_date) === month);
  return hit ? hit.id : null;
}

export interface SourceLink {
  title: string;
  url: string;
}

/**
 * Turns the source ids an answer cites (rule ids from data/rules.json, or the SEBI / AMFI links of the fixed decline)
 * into help-page titles with links. Never shows a raw rule id. Duplicate pages are shown once.
 */
export function resolveSources(ids: string[] | undefined | null): SourceLink[] {
  const out: SourceLink[] = [];
  const seen = new Set<string>();
  for (const src of ids ?? []) {
    if (!src) continue;
    let link: SourceLink | null = null;
    const rule = (rulesData as Array<{ id: string; title: string; url: string; source_type?: string }>).find(
      (r) => r.id === src
    );
    if (rule) {
      // R45: a summary of a Groww help page is labelled as Groww help (summary), not as a public rule.
      const growwPage = /^https:\/\/groww\.in\//i.test(rule.url);
      link = {
        title:
          rule.source_type === "public_rule_summary"
            ? growwPage
              ? "Groww help (summary)"
              : "Public rule summary"
            : rule.title,
        url: rule.url,
      };
    } else if (/^https?:\/\//i.test(src)) {
      let host = "";
      try {
        host = new URL(src).hostname.toLowerCase();
      } catch {
        host = "";
      }
      if (host === "groww.in" || host.endsWith(".groww.in")) link = { title: "Groww help", url: src };
      else if (host.endsWith("sebi.gov.in")) link = { title: "SEBI investor website", url: src };
      else if (host.endsWith("amfiindia.com")) link = { title: "AMFI", url: src };
      else if (host.endsWith("mutualfundssahihai.com")) link = { title: "AMFI investor education", url: src };
    }
    if (!link) continue;
    const key = `${link.title}|${link.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
}

/** Plain-words state of one instalment, as the passbook stamps say it. */
export function entryStateLabel(entry: Instalment): string {
  switch (instalmentState(entry)) {
    case "allotted":
      return entry.units ? `${entry.units.toFixed(3)} units allotted` : "Units allotted";
    case "in_progress":
      return "Units not confirmed yet";
    case "failed":
      return "Not debited";
    case "refunded":
      return "Refunded";
    case "skipped":
      return "Skipped";
    default:
      return "Can't confirm right now";
  }
}

/**
 * Three questions that fit this instalment: its state, whether it is the latest instalment, and whether the SIP is
 * still running (owner, 8 Nov: "skip next month?" makes no sense on a six-month-old allotted instalment).
 * Most are questions from the approved golden set.
 */
export function suggestedQuestionsFor(
  entry: Instalment,
  ctx: { isLatest?: boolean; sipActive?: boolean } = {}
): string[] {
  const month = monthName(entry.due_date);
  const { isLatest = false, sipActive = true } = ctx;
  const aboutNext = sipActive && isLatest;
  switch (instalmentState(entry)) {
    case "in_progress":
      return ["Why are my units not visible yet?", "What happens next?", "Where is my official record?"];
    case "failed":
      return [
        `Why did my ${month} instalment fail?`,
        `Can I still pay the missed ${month} instalment?`,
        aboutNext ? "What happens if I skip next month?" : "Where is my official record?",
      ];
    case "refunded":
      return [`Where is my ${month} money?`, "How long does a refund take?", "What happened to my order?"];
    case "skipped":
      return [
        `Why is there no debit for ${month}?`,
        sipActive ? "Will my SIP be cancelled if I skip again?" : "Can I restart after stopping?",
        "Where is my official record?",
      ];
    case "allotted":
      return [
        "How were my units for this instalment worked out?",
        aboutNext
          ? "What happens if I skip next month?"
          : sipActive
          ? `When were my ${month} units allotted?`
          : "I stopped my SIP. Did I lose my units?",
        "Where is my official record?",
      ];
    default:
      return [
        `Have my ${month} units been allotted?`,
        "What is the status of my latest instalment?",
        "Where is my official record?",
      ];
  }
}

/** Starter questions on /ask, by demo scenario. Final MVP: no "value lower" suggestion (returns cause doubt, not exits; it is still answered if asked). */
export function starterQuestionsFor(scenario: string): string[] {
  if (scenario === "stopped") {
    return [
      "Can I restart after stopping?",
      "I stopped my SIP. Did I lose my units?",
      "Where is my official record?",
    ];
  }
  if (scenario === "stale") {
    return [
      "What is the status of my latest instalment?",
      "Where is my official record?",
      "What happens if I skip next month?",
    ];
  }
  return [
    "Why are my units not visible yet?",
    "What happens if I skip next month?",
    "I lost my job and can't afford the SIP right now. What can I do?",
    "How do I switch my AutoPay to another bank?",
  ];
}

/**
 * Answers sometimes point to the options page as the text "/options". Split the text so the page can render that
 * part as a link. Returns the parts in order; `link` marks the "/options" parts.
 */
export function splitOptionsLinks(text: string): Array<{ text: string; link: boolean }> {
  const parts: Array<{ text: string; link: boolean }> = [];
  const re = /\/options\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), link: false });
    parts.push({ text: m[0], link: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), link: false });
  return parts;
}

/** Whether an answer should offer the "See what you can do next" button. */
export function answerPointsToOptions(intent: string | undefined, text: string): boolean {
  return intent === "options" || intent === "affordability" || /\/options\b/.test(text);
}
