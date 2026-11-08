/**
 * SIP Passbook: real eval against the golden sets. Written by Claude (R34, 5 Nov 2026); rewritten for SPEC-07 in R39, 7 Nov 2026;
 * R41: critical checks moved to scripts/eval-checks.ts.
 *
 * What it does:
 *  - refuses to run until the owner has approved the hand-labelled Sensecheck golden set (eval/golden/sensecheck.json);
 *  - starts the built app (next start) with live AI on, so every item goes through the real route and the real quality gate;
 *  - posts every golden item to its route and scores the JSON the route returns against the golden labels;
 *  - counts a fallback ("standard") answer as NOT acceptable, except a decline on an advice question;
 *  - flags critical failures (advice, predictions, invented times, durations or statuses) independently of the app's gate;
 *  - records per-item results, accuracy by category, critical failures, three samples, tokens and cost.
 *
 * Usage: npm run eval            (builds first; needs ALLOW_PAID=1)
 * Keys: Next.js loads .env.local itself. This script never opens .env files.
 * Output: eval/results.json (latest run) and eval/runs/<run_id>.json (every run). Exit code 1 if any threshold is unmet.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, ChildProcess } from "node:child_process";
import { formatDateTime } from "../lib/format";
import { criticalChecks, clockTimes } from "./eval-checks";

const ROOT = process.cwd();
const PORT = Number(process.env.EVAL_PORT || 3311);
const BASE = `http://127.0.0.1:${PORT}`;
const MODEL = "claude-haiku-5-5";
const CONCURRENCY = Number(process.env.EVAL_CONCURRENCY || 4);
const DEMO_NOW_DISPLAY = "6 Nov 2026, 10:30 IST";

const THRESHOLDS = {
  sensecheck_acceptable: 90, // 18 of 20
  sensecheck_critical_max: 0,
  promise: 85,
  promise_added_numbers_max: 0,
};

const readJson = (p: string) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf-8"));
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const lf = (s: string) => s.replace(/\r\n/g, "\n");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const low = (s: unknown) => String(s ?? "").toLowerCase().replace(/[’‘]/g, "'");
const pct = (k: number, n: number) => (n ? Math.round((k / n) * 1000) / 10 : 0);

function hashesOf(dir: string, ext: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(ext)).sort()) {
    out[f] = sha(lf(fs.readFileSync(path.join(ROOT, dir, f), "utf-8")));
  }
  return out;
}

type Item = {
  set: string;
  id: string;
  category?: string;
  pass: boolean;
  critical?: string[];
  gate: string;
  got?: Record<string, unknown>;
  why?: string;
};

async function post(route: string, body: unknown): Promise<any> {
  try {
    const r = await fetch(`${BASE}${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return await r.json();
  } catch (e: any) {
    return { gate_status: "error", gate_code: String(e?.message || e) };
  }
}

async function pool<T, R>(items: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return out;
}

async function startServer(runId: string): Promise<ChildProcess> {
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, MVP_LIVE_ENABLED: "true", ALLOW_PAID: "1", EVAL_MODE: "1", EVAL_RUN_ID: runId },
    stdio: ["ignore", "ignore", "inherit"],
  });
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return child;
    } catch { /* not up yet */ }
    await sleep(1000);
  }
  child.kill();
  throw new Error("The app did not start. Run `next build` first (npm run eval does this).");
}

// Independent critical checks live in scripts/eval-checks.ts (R41: moved there so they can be unit-tested).

const SPELLED: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30 };
function numbersIn(text: string): number[] {
  return (text.replace(/(\d),(\d)/g, "$1$2").match(/\d+(?:\.\d+)?/g) || []).map(Number);
}
function allowedPromiseNumbers(transcript: string, allowed: string[]): Set<number> {
  const s = new Set<number>(allowed.map(Number));
  numbersIn(transcript).forEach((n) => s.add(n));
  for (const w of low(transcript).split(/[^a-z]+/)) if (SPELLED[w] !== undefined) s.add(SPELLED[w]);
  return s;
}

async function main() {
  if (process.env.ALLOW_PAID !== "1") {
    console.error("ALLOW_PAID=1 is required: this eval calls the model through the app's routes.");
    process.exit(2);
  }
  const golden = readJson("eval/golden/sensecheck.json");
  if (golden.approval?.approved !== true) {
    console.error("The Sensecheck golden set is not approved yet (eval/golden/sensecheck.json → approval.approved). The owner checks every label first. No calls were made.");
    process.exit(2);
  }
  const pricing = readJson("config/pricing.json");
  const price = pricing.per_million_tokens[MODEL];
  const runId = `eval-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const promptHashes = hashesOf("prompts", ".md");
  const goldenHashes = hashesOf(path.join("eval", "golden"), ".json");

  const seed = readJson("data/passbook-seed.json");
  const rules = readJson("data/rules.json") as any[];
  const passages = rules.map((r) => r.text).join(" ");
  const timesFor = (scenario: string) => {
    const evs = (seed.scenarios[scenario].instalments as any[]).flatMap((i) => i.events);
    const all = [DEMO_NOW_DISPLAY, ...evs.flatMap((e: any) => [formatDateTime(e.as_of), ...(e.effective_at ? [formatDateTime(e.effective_at)] : [])])];
    return new Set(all.flatMap(clockTimes));
  };

  const spendLog = path.join(ROOT, "private", "spend_log.jsonl");
  console.log(`Eval ${runId}: starting the app on port ${PORT} with live AI…`);
  const server = await startServer(runId);
  const items: Item[] = [];
  try {
    // Probe: stop at once if the AI is not live (no key, switch off) or the first call fails, instead of scoring fallbacks.
    const probe = await post("/api/ai/sensecheck", { question: "What happens if I skip next month?", scenario: "running" });
    if (probe.gate_code === "disabled") throw new Error("The AI is not live: check ANTHROPIC_API_KEY and MVP_LIVE_ENABLED in .env.local.");
    if (probe.gate_code === "empty" || probe.gate_code === "truncated") {
      throw new Error(`The first AI call returned ${probe.gate_code === "empty" ? "no answer text" : "an answer cut off at the token limit"}. See the "[anthropic]" line above. No results were written.`);
    }
    if (probe.gate_code === "error" || probe.gate_code === "timeout" || probe.gate_code === "rate_limit") {
      throw new Error(`The first AI call failed (${probe.gate_code}). See the "[anthropic]" line above, and run \`npm run ai:check\`. No results were written.`);
    }

    // 1. Sensecheck (hand-labelled)
    items.push(...(await pool(golden.items as any[], async (it) => {
      const r = await post("/api/ai/sensecheck", { question: it.question, entry_id: it.entry_id ?? undefined, scenario: it.scenario });
      const ans = low(r.answer);
      const reasons: string[] = [];
      const critical = criticalChecks(it, r, timesFor(it.scenario), passages);
      let pass: boolean;
      if (it.decline_required) {
        const declined = r.declined === true && (r.gate_status === "checked" || r.gate_code === "decline_rule");
        if (!declined) reasons.push("not declined");
        pass = declined;
      } else {
        if (r.gate_status !== "checked") reasons.push(`fallback (${r.gate_code})`);
        if (r.declined === true) reasons.push("declined a factual question");
        if (!(it.expected_intent as string[]).includes(r.intent)) reasons.push(`intent ${r.intent}`);
        (it.must_include as string[][]).forEach((g, k) => {
          if (!g.some((x) => ans.includes(low(x)))) reasons.push(`missing [${g.join(" | ")}]`);
        });
        if ((it.sources_any as string[]).length && !(r.sources || []).some((s: string) => (it.sources_any as string[]).includes(s))) {
          reasons.push(`no source from [${(it.sources_any as string[]).join(", ")}]`);
        }
        for (const p of it.must_not as string[]) if (new RegExp(p, "i").test(String(r.answer ?? ""))) reasons.push(`must_not /${p}/`);
        pass = reasons.length === 0;
      }
      if (critical.length) pass = false;
      return {
        set: "sensecheck", id: it.id, category: it.category, pass, critical, gate: r.gate_status,
        got: { intent: r.intent, declined: r.declined, sources: r.sources, as_of: r.as_of, gate_code: r.gate_code, answer: r.answer },
        why: [...reasons, ...critical].join("; "),
      };
    })));

    // 2. Future Thread one-line tidy (promise route, unchanged golden set)
    const prSet = readJson("eval/golden/promise.json").items as any[];
    items.push(...(await pool(prSet, async (it) => {
      const r = await post("/api/ai/promise", { transcript: it.transcript });
      const checked = r.gate_status === "checked";
      const goalOk = (it.goal_any as string[]).some((g) => low(r.goal).includes(low(g)) || low(r.one_line).includes(low(g)));
      const whoOk = (it.for_whom_any as string[]).some((w) => low(r.for_whom).includes(low(w)));
      const noHorizon = (it.horizon_any as (string | null)[]).length === 1 && it.horizon_any[0] === null;
      const horizonOk = noHorizon ? !r.horizon || !String(r.horizon).trim() : (it.horizon_any as string[]).some((h) => low(r.horizon).includes(low(h)));
      const allowed = allowedPromiseNumbers(it.transcript, it.allowed_numbers);
      const added = numbersIn(String(r.one_line ?? "")).filter((n) => !allowed.has(n));
      return {
        set: "promise", id: it.id, gate: r.gate_status,
        pass: checked && goalOk && whoOk && horizonOk,
        got: { goal: r.goal, for_whom: r.for_whom, horizon: r.horizon, one_line: r.one_line, added_numbers: added, gate_code: r.gate_code },
        why: `${checked ? "" : `fallback (${r.gate_code}); `}${goalOk ? "" : "goal; "}${whoOk ? "" : "for_whom; "}${horizonOk ? "" : "horizon"}`,
      };
    })));
  } finally {
    server.kill();
  }

  // Tokens and cost: the app logs every model call with this run's id (lib/anthropic.ts).
  let calls = 0, input = 0, output = 0;
  if (fs.existsSync(spendLog)) {
    for (const line of fs.readFileSync(spendLog, "utf-8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.run_id === runId) { calls++; input += e.input_tokens || 0; output += e.output_tokens || 0; }
      } catch { /* skip */ }
    }
  }
  const cost = Math.round(((input / 1e6) * price.input + (output / 1e6) * price.output) * 1e6) / 1e6;

  const of = (set: string) => items.filter((i) => i.set === set);
  const sc = of("sensecheck");
  const criticalItems = sc.filter((i) => (i.critical || []).length > 0);
  const promiseAdded = of("promise").reduce((s, i) => s + ((i.got?.added_numbers as number[]) || []).length, 0);
  const metrics = {
    sensecheck_acceptable: { value: pct(sc.filter((i) => i.pass).length, sc.length), n: sc.length, passed: sc.filter((i) => i.pass).length, threshold: THRESHOLDS.sensecheck_acceptable },
    sensecheck_critical: { value: criticalItems.length, n: sc.length, threshold_max: THRESHOLDS.sensecheck_critical_max },
    sensecheck_fallbacks: { value: sc.filter((i) => i.gate !== "checked" && i.got?.gate_code !== "decline_rule").length, n: sc.length },
    promise: { value: pct(of("promise").filter((i) => i.pass).length, of("promise").length), n: of("promise").length, threshold: THRESHOLDS.promise },
    promise_added_numbers: { value: promiseAdded, n: of("promise").length, threshold_max: THRESHOLDS.promise_added_numbers_max },
  };
  const metricsByCategory: Record<string, { n: number; passed: number; rate: number; critical: number }> = {};
  for (const i of sc) {
    const c = (metricsByCategory[i.category!] ||= { n: 0, passed: 0, rate: 0, critical: 0 });
    c.n++;
    if (i.pass) c.passed++;
    if ((i.critical || []).length) c.critical++;
  }
  for (const c of Object.values(metricsByCategory)) c.rate = pct(c.passed, c.n);

  const met = (m: any) => (m.threshold !== undefined ? m.value >= m.threshold : m.threshold_max !== undefined ? m.value <= m.threshold_max : true);
  const failed = Object.entries(metrics).filter(([, m]) => !met(m)).map(([k]) => k);

  // Three samples for the quality page: an acceptable answer, a decline, and the first failure (or another pass).
  const answered = sc.filter((i) => i.pass && i.got?.declined !== true);
  const samples = [answered[0], sc.find((i) => i.pass && i.got?.declined === true), sc.find((i) => !i.pass) ?? answered[1]]
    .filter(Boolean)
    .map((i) => {
      const g = (golden.items as any[]).find((x) => x.id === i!.id);
      return { id: i!.id, category: i!.category, question: g?.question, scenario: g?.scenario, answer: i!.got?.answer, gate: i!.gate, pass: i!.pass, why: i!.why || "" };
    });

  const result = {
    live: calls > 0 && input > 0,
    run_id: runId,
    timestamp: new Date().toISOString(),
    model: MODEL,
    golden_scope: `${sc.length} hand-labelled Sensecheck questions (approved by ${golden.approval.approved_by ?? "the owner"} on ${golden.approval.approved_at ?? "?"}) and ${of("promise").length} Future Thread tidy items`,
    golden_approval: golden.approval,
    prompt_hashes: promptHashes,
    golden_hashes: goldenHashes,
    metrics,
    metrics_by_category: metricsByCategory,
    critical_failures: criticalItems.map((i) => ({ id: i.id, category: i.category, why: (i.critical || []).join("; ") })),
    samples,
    fallback_behaviour:
      "When the model is off, slow, or its answer fails a gate check, the app shows a fixed answer built in code from the entry's events (for example: units not confirmed yet, with the as-of time). Advice questions always get the same fixed decline.",
    thresholds_met: failed.length === 0 && calls > 0 && input > 0,
    failed_metrics: failed,
    token_totals: { calls, input, output, cost_usd: cost, pricing_source: pricing.source_url, pricing_date: pricing.date_checked },
    items,
  };
  fs.mkdirSync(path.join(ROOT, "eval", "runs"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "eval", "runs", `${runId}.json`), JSON.stringify(result, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "eval", "results.json"), JSON.stringify(result, null, 2) + "\n");

  console.log(`\nEval ${runId}: ${calls} model calls, ${input} input and ${output} output tokens, US$${cost}`);
  console.log("metric                      value   n    threshold  result");
  for (const [k, m] of Object.entries(metrics) as [string, any][]) {
    const th = m.threshold !== undefined ? `>= ${m.threshold}` : m.threshold_max !== undefined ? `<= ${m.threshold_max}` : "(info)";
    console.log(`${k.padEnd(27)} ${String(m.value).padStart(6)} ${String(m.n).padStart(4)}  ${th.padEnd(9)}  ${met(m) ? "PASS" : "FAIL"}`);
  }
  console.log("\nBy category:");
  for (const [k, c] of Object.entries(metricsByCategory)) console.log(`  ${k.padEnd(22)} ${c.passed}/${c.n}${c.critical ? `  CRITICAL ${c.critical}` : ""}`);
  const fails = sc.filter((i) => !i.pass);
  if (fails.length) {
    console.log("\nNot acceptable:");
    for (const i of fails) console.log(`  ${i.id} (${i.category}): ${i.why}`);
  }
  console.log(result.thresholds_met ? "\nAll thresholds met." : `\nNOT MET: ${failed.join(", ") || "no live model calls recorded"}`);
  process.exit(result.thresholds_met ? 0 : 1);
}

main().catch((e) => {
  console.error("Eval failed:", e?.message || e);
  process.exit(1);
});
