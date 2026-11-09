import React from "react";
import fs from "node:fs";
import path from "node:path";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { DemoBanner } from "@/components/ui/demo-banner";
import { formatDateTime } from "@/lib/format";
import { ShieldCheck, Check, X, AlertCircle } from "lucide-react";

// R39 (Claude, 7 Nov 2026): reads eval/results.json as written by scripts/run-eval.ts (SPEC-07 format). Nothing on this
// page is hard-coded: with no live run it says so.
interface Metric {
  value?: number;
  n?: number;
  passed?: number;
  threshold?: number;
  threshold_max?: number;
}
interface EvalResults {
  live?: boolean;
  run_id?: string;
  timestamp?: string;
  model?: string;
  golden_scope?: string;
  metrics?: Record<string, Metric>;
  metrics_by_category?: Record<string, { n: number; passed: number; rate: number; critical: number }>;
  critical_failures?: Array<{ id: string; category?: string; why: string }>;
  samples?: Array<{ id: string; category?: string; question?: string; scenario?: string; answer?: string; gate?: string; pass: boolean; why?: string }>;
  fallback_behaviour?: string;
  thresholds_met?: boolean;
  token_totals?: { calls?: number; input?: number; output?: number; cost_usd?: number };
}

function getEvalResults(): EvalResults | null {
  try {
    const resultsPath = path.join(process.cwd(), "eval", "results.json");
    if (!fs.existsSync(resultsPath)) return null;
    return JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  } catch {
    return null;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  pending_allotment: "Units not confirmed yet",
  failed_payment: "Failed debit (insufficient balance)",
  mandate_not_approved: "AutoPay mandate not approved",
  refunded: "Refunded instalment",
  unknown_stale: "Status can't be confirmed",
  valuation: "Value lower than amount put in",
  skip: "Skipping next month",
  restart: "Restarting after a stop",
  after_stop: "Units after a stop",
  change_bank: "Changing the AutoPay bank",
  affordability: "Can't afford it right now",
  advice: "Advice questions (must decline)",
};

const CHECKS: Array<[string, string]> = [
  ["Schema", "The answer must be valid JSON with the expected fields and intent."],
  ["Numbers", "Every number must come from the passbook facts, the help passages or the question."],
  ["Dates, times and durations", "A date or clock time must be one the passbook shows; a duration (\"7 working days\") must appear word for word in a help passage. Arrival is only ever given as Groww's rule, never as a worked-out date."],
  ["As-of time", "An answer about a step that is pending or can't be confirmed must give that step's as-of time."],
  ["Banned phrases", "No advice, recommendations, predictions, urgency, guilt or guarantees. Groww's own instruction to \"switch to an approved AutoPay\" is allowed; \"switch to\" a fund or a plan is not."],
  ["Personal identifiers", "Account numbers, PAN, Aadhaar, IFSC and phone numbers are masked before the AI sees a question and blocked in answers."],
  ["Right month", "An answer must be about the month you asked about; an answer about a different month is replaced."],
  ["Plain words", "No internal names, field names or file references; only words you would use. Before this check, a few fixed phrases are reworded: \"rule passages\" becomes \"Groww's help\", and Groww's \"contact us using the button below\" becomes \"contact Groww support\", because Sensecheck has no button."],
];

const ENGINE_EVIDENCE_URL = "https://site-bice-three-88.vercel.app/evidence";

export default function QualityPage() {
  const r = getEvalResults();
  const isLive = Boolean(r?.live);
  const m = r?.metrics ?? {};
  const acceptable = m.sensecheck_acceptable;
  const critical = m.sensecheck_critical;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Quality &amp; Safety" showBack backHref="/" />
      <DemoBanner />

      <main className="flex-1 p-4 space-y-5">
        {/* Brief, 9 Nov: not investment advice, said plainly */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2" data-testid="not-advice">
          <h2 className="text-base font-bold text-gray-900">Not investment advice</h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            Sensecheck explains your own SIP and Groww&apos;s rules. It never recommends a fund, an amount, a time to
            invest or whether to stop. Nothing in this app is investment advice.
          </p>
        </section>

        {/* Brief, 9 Nov: where AI earns its place, and what a version without it would miss */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2.5" data-testid="why-ai">
          <h2 className="text-base font-bold text-gray-900">Why Sensecheck uses AI, and where</h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>Where:</strong> at the moment of doubt, on a month&apos;s page or in Ask. You ask in your own words
            (&ldquo;I paid on 5 November. Where are my units?&rdquo;), and the answer ties that month&apos;s own steps to
            Groww&apos;s rule for it, with the source.
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>Without AI:</strong> the passbook still shows every step of every month; that is also the fallback
            when a check fails. What it can&apos;t do is read a question in your words, find the month and the rule it is
            about, or handle a mixed question like &ldquo;I lost my job and can&apos;t afford the SIP right now&rdquo;. A
            fixed help list only answers the questions it was written for.
          </p>
        </section>

        {/* Gate */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">How every AI answer is checked</h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Sensecheck answers pass these checks in code before you see them. If any check fails, you see a fixed answer
            built from your passbook instead.
          </p>
          <ol className="pt-1 space-y-2 text-xs">
            {CHECKS.map(([title, text], idx) => (
              <li key={title} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
                <span className="font-bold text-emerald-700 w-4">{idx + 1}.</span>
                <div>
                  <strong className="text-gray-900 block">{title}</strong>
                  <span className="text-gray-600">{text}</span>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-600 leading-relaxed">
            Questions that plainly ask for advice (&ldquo;which fund&rdquo;, &ldquo;should I stop&rdquo;) are declined
            before the AI is called. Other advice questions are declined by the AI and replaced with the same fixed text.
          </p>
        </section>

        {/* Fallback */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">When the AI can&apos;t answer</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {/* 9 Nov: describes the app as deployed (the run's stored description predates the topic answers). */}
            When the AI is off, slow, or its answer fails a check, the app shows a fixed answer built in code: for a month,
            from that month&apos;s steps and Groww&apos;s rule (for example, units not confirmed yet, with the as-of time and
            the T+2 rule); for a general question, the Groww help passage on its topic. Advice questions always get the same
            fixed decline.
          </p>
        </section>

        {/* Off switch and what the AI never sees (final MVP, 8 Nov) */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2" data-testid="off-switch">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Off switch</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            One setting turns the AI off for everyone. Every question then gets the fixed answer built from the passbook,
            and the rest of the app keeps working.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            The AI never sees your photos, voice notes or lines for each month. They stay
            on your device.
          </p>
        </section>

        {isLive && r ? (
          <>
            {/* Summary */}
            <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Latest live evaluation</h2>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <dt className="text-gray-400">Run</dt>
                  <dd className="font-medium text-gray-900">{r.timestamp ? formatDateTime(r.timestamp) : "—"}</dd>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <dt className="text-gray-400">Model</dt>
                  <dd className="font-medium text-gray-900">{r.model ?? "—"}</dd>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <dt className="text-gray-400">Acceptable answers</dt>
                  <dd className="font-bold text-gray-900">
                    {acceptable?.passed ?? "—"} of {acceptable?.n ?? "—"} ({acceptable?.value ?? "—"}%)
                  </dd>
                  <dd className="text-[11px] text-gray-500">Pass mark: {acceptable?.threshold ?? 90}%</dd>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <dt className="text-gray-400">Critical failures</dt>
                  <dd className="font-bold text-gray-900">{critical?.value ?? "—"}</dd>
                  <dd className="text-[11px] text-gray-500">Must be 0</dd>
                </div>
              </dl>
              {r.golden_scope && (
                <p className="text-[11px] text-gray-500">
                  Scope:{" "}
                  {r.golden_scope.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?([+-]\d{2}:\d{2}|Z)/g, (iso) =>
                    formatDateTime(iso)
                  )}
                  .
                  {r.golden_scope.includes("Future Thread")
                    ? " The 12 Future Thread items belong to an earlier feature that is no longer in the app; the eval still runs them, but only Sensecheck is live."
                    : ""}
                </p>
              )}
              <p className="text-[11px] text-gray-600" data-testid="golden-source">
                Each of the 20 questions matches a problem first-year investors describe in our Part 1 research. The golden
                set, every result and the Part 1 finding behind each question are in the{" "}
                <a href={ENGINE_EVIDENCE_URL} target="_blank" rel="noreferrer" className="underline text-emerald-800">
                  Evidence Log, section 5
                </a>
                .
              </p>
              <p className="text-[11px] text-gray-500">
                Overall: {r.thresholds_met ? "every threshold met" : "thresholds not met"} ·{" "}
                {r.token_totals?.calls ?? 0} model calls · US${(r.token_totals?.cost_usd ?? 0).toFixed(4)}
              </p>
            </section>

            {/* By category */}
            {r.metrics_by_category && (
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">By question type</h3>
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(r.metrics_by_category).map(([cat, c]) => (
                      <tr key={cat} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-2 text-gray-800">{CATEGORY_LABELS[cat] ?? cat}</td>
                        <td className="py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                          {c.passed} of {c.n}
                        </td>
                        <td className="py-2 pl-2 text-right text-[11px] text-gray-600 whitespace-nowrap">
                          {c.critical > 0 ? `${c.critical} critical` : "no critical"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Critical failures */}
            {(r.critical_failures?.length ?? 0) > 0 && (
              <section className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">Critical failures</h3>
                <ul className="text-xs text-gray-800 space-y-1">
                  {r.critical_failures!.map((c) => (
                    <li key={c.id}>
                      {c.id} ({CATEGORY_LABELS[c.category ?? ""] ?? c.category}): {c.why}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Samples */}
            {(r.samples?.length ?? 0) > 0 && (
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Sample answers from the run</h3>
                {r.samples!.map((s) => (
                  <div key={s.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">
                        {CATEGORY_LABELS[s.category ?? ""] ?? s.category} · scenario {s.scenario}
                      </span>
                      <span className={`inline-flex items-center space-x-1 font-semibold ${s.pass ? "text-emerald-700" : "text-red-700"}`}>
                        {s.pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{s.pass ? "Acceptable" : "Not acceptable"}</span>
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">&ldquo;{s.question}&rdquo;</p>
                    <p className="text-gray-700 whitespace-pre-line">{s.answer}</p>
                    {!s.pass && s.why && <p className="text-[11px] text-red-700">Why: {s.why}</p>}
                  </div>
                ))}
              </section>
            )}
          </>
        ) : (
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center space-y-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No live evaluation recorded yet.</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Results by question type, critical failures and sample answers appear here after a live evaluation run.
            </p>
          </section>
        )}
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
