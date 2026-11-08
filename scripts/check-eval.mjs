// Eval gate (spec §9). Written by Claude for review R34, 5 Nov 2026; R39 (7 Nov) for SPEC-07 (Sensecheck + Future Thread). Runs before every `npm run build`, locally and on Vercel.
// The build fails unless eval/results.json records a LIVE eval run (real model calls) that met every threshold,
// with the same prompts and the same golden sets that are in the repository now.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const lf = (s) => s.replace(/\r\n/g, "\n");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const fail = (msg) => {
  console.error(`EVAL GATE FAILED: ${msg}`);
  process.exit(1);
};

const resultsPath = path.join(ROOT, "eval", "results.json");
if (!fs.existsSync(resultsPath)) fail("eval/results.json is missing. Run `npm run eval` with ALLOW_PAID=1.");
let r;
try {
  r = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
} catch {
  fail("eval/results.json cannot be parsed.");
}

if (r.live !== true) fail("eval/results.json does not come from a live eval run.");
if (r.model !== "claude-haiku-5-5") fail(`unexpected model ${r.model}.`);
if (!(r.token_totals?.calls > 0 && r.token_totals?.input > 0)) fail("no model calls are recorded in eval/results.json.");
if (!Array.isArray(r.items) || r.items.length === 0) fail("no per-item results in eval/results.json.");
if (r.thresholds_met !== true) fail(`thresholds not met: ${(r.failed_metrics || []).join(", ")}.`);

const check = (dir, ext, saved, label) => {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(ext))) {
    const h = sha(lf(fs.readFileSync(path.join(ROOT, dir, f), "utf-8")));
    if (!saved?.[f]) fail(`${label} ${f} has no recorded hash. Run \`npm run eval\`.`);
    if (saved[f] !== h) fail(`${label} ${f} changed since the last eval. Run \`npm run eval\`.`);
  }
};
// R39 (Claude): the Sensecheck labels must be owner-approved, and the run must record zero critical failures.
if (r.golden_approval?.approved !== true) fail("the Sensecheck golden set was not owner-approved for this run.");
if (r.metrics?.sensecheck_critical?.value !== 0) fail(`critical failures recorded: ${(r.critical_failures || []).map((c) => c.id).join(", ")}.`);
check("prompts", ".md", r.prompt_hashes, "prompt");
check(path.join("eval", "golden"), ".json", r.golden_hashes, "golden set");

console.log(`Eval gate passed: live run ${r.run_id} (${r.token_totals.calls} model calls), every threshold met, prompts and golden sets unchanged.`);
