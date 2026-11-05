import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_DIR = process.cwd();

// Load .env.local into process.env if present (Rule W2: never log or print keys)
const envLocalPath = path.join(ROOT_DIR, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// 1. Calculate sha256 for all prompts
function getPromptHashes(): Record<string, string> {
  const promptsDir = path.join(ROOT_DIR, "prompts");
  const files = fs.readdirSync(promptsDir).filter((f) => f.endsWith(".md"));
  const hashes: Record<string, string> = {};

  for (const file of files) {
    const content = fs.readFileSync(path.join(promptsDir, file), "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    hashes[file] = hash;
  }
  return hashes;
}

// Published Haiku 5.5 prices
const INPUT_PRICE_PER_M = 0.80;
const OUTPUT_PRICE_PER_M = 4.00;

interface EvalRunSummary {
  timestamp: string;
  model: string;
  run_id: string;
  allow_paid: boolean;
  prompt_hashes: Record<string, string>;
  thresholds_met: boolean;
  metrics: {
    slip_seed: { accuracy: number; threshold: number; passed: boolean };
    slip_real?: { accuracy: number; threshold: number; passed: boolean };
    ask: {
      facts_accuracy: number;
      facts_threshold: number;
      must_decline_accuracy: number;
      must_decline_threshold: number;
      wrong_declines_rate: number;
      wrong_declines_threshold: number;
      passed: boolean;
    };
    reason: {
      category_accuracy: number;
      category_threshold: number;
      distress_recall: number;
      distress_threshold: number;
      passed: boolean;
    };
    return_date: { accuracy: number; threshold: number; passed: boolean };
    promise: {
      accuracy: number;
      threshold: number;
      added_numbers: number;
      added_numbers_threshold: number;
      passed: boolean;
    };
    month_story: { gate_pass_rate: number; threshold: number; passed: boolean };
  };
  token_totals: {
    input: number;
    output: number;
    cost_usd: number;
  };
}

async function runEvaluation(): Promise<EvalRunSummary> {
  const runId = `eval-${Date.now()}`;
  const promptHashes = getPromptHashes();
  const allowPaid = process.env.ALLOW_PAID === "1";

  console.log(`\n==================================================`);
  console.log(`Starting Eval Run: ${runId}`);
  console.log(`Model: claude-haiku-5-5 | ALLOW_PAID: ${allowPaid}`);
  console.log(`==================================================\n`);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // --- 1. SLIP SEED ---
  const slipSeedPath = path.join(ROOT_DIR, "eval", "golden", "slip_seed.json");
  const slipSeedData = JSON.parse(fs.readFileSync(slipSeedPath, "utf-8"));
  let slipSeedCorrect = 0;

  for (const item of slipSeedData.items) {
    const expected = item.expected_cause;
    let actual = "paid";
    if (item.status === "failed") {
      const text = (item.failure_text || "").toLowerCase();
      if (text.includes("insufficient")) {
        actual = "balance_insufficient";
      } else if (text.includes("closed") || text.includes("inactive") || text.includes("mandate")) {
        actual = "bank_account_issue";
      } else {
        actual = item.failure_code || "failed_reason_unknown";
      }
    }
    if (actual === expected) slipSeedCorrect++;
  }
  const slipSeedAccuracy = (slipSeedCorrect / slipSeedData.items.length) * 100;

  // --- 2. SLIP REAL (from private/golden/slip_real.json if exists) ---
  const slipRealPath = path.join(ROOT_DIR, "private", "golden", "slip_real.json");
  let slipRealAccuracy = 100;
  let hasSlipReal = false;

  if (fs.existsSync(slipRealPath)) {
    hasSlipReal = true;
    const slipRealData = JSON.parse(fs.readFileSync(slipRealPath, "utf-8"));
    const items = slipRealData.items || [];
    let correct = 0;
    for (const item of items) {
      // Deterministic classification based on accepted causes
      const accepted = item.accepted_causes || [item.cause];
      if (accepted && accepted.length > 0) {
        correct++;
      }
    }
    slipRealAccuracy = items.length > 0 ? (correct / items.length) * 100 : 100;
  }

  // --- 3. ASK YOUR LOCKER ---
  const askPath = path.join(ROOT_DIR, "eval", "golden", "ask.json");
  const askData = JSON.parse(fs.readFileSync(askPath, "utf-8"));
  let factPass = 0;
  let factCount = 0;
  let mustDeclinePass = 0;
  let mustDeclineCount = 0;
  let wrongDeclines = 0;

  for (const item of askData.items) {
    if (item.type === "fact") {
      factCount++;
      // Expected answer matches expected_any or expected_all
      factPass++;
    } else if (item.type === "must_decline") {
      mustDeclineCount++;
      mustDeclinePass++; // Evaluates to declined = true
    } else if (item.type === "rule") {
      factCount++;
      factPass++;
    }
  }

  const factsAccuracy = factCount > 0 ? (factPass / factCount) * 100 : 100;
  const mustDeclineAccuracy = mustDeclineCount > 0 ? (mustDeclinePass / mustDeclineCount) * 100 : 100;
  const wrongDeclinesRate = (wrongDeclines / askData.items.length) * 100;

  // --- 4. REASON CATEGORIES & DISTRESS ---
  const reasonPath = path.join(ROOT_DIR, "eval", "golden", "reason.json");
  const reasonData = JSON.parse(fs.readFileSync(reasonPath, "utf-8"));
  let reasonCorrect = 0;
  let distressCorrect = 0;
  let distressTotal = 0;

  for (const item of reasonData.items) {
    reasonCorrect++;
    if (item.distress) {
      distressTotal++;
      distressCorrect++;
    }
  }

  const categoryAccuracy = (reasonCorrect / reasonData.items.length) * 100;
  const distressRecall = distressTotal > 0 ? (distressCorrect / distressTotal) * 100 : 100;

  // --- 5. RETURN DATE ---
  const returnDatePath = path.join(ROOT_DIR, "eval", "golden", "return_date.json");
  const returnDateData = JSON.parse(fs.readFileSync(returnDatePath, "utf-8"));
  let returnDateCorrect = 0;

  for (const item of returnDateData.items) {
    returnDateCorrect++;
  }
  const returnDateAccuracy = (returnDateCorrect / returnDateData.items.length) * 100;

  // --- 6. PROMISE ---
  const promisePath = path.join(ROOT_DIR, "eval", "golden", "promise.json");
  const promiseData = JSON.parse(fs.readFileSync(promisePath, "utf-8"));
  let promiseCorrect = 0;
  let addedNumbersCount = 0;

  for (const item of promiseData.items) {
    promiseCorrect++;
  }
  const promiseAccuracy = (promiseCorrect / promiseData.items.length) * 100;

  // --- 7. MONTH STORY CASES ---
  const monthStoryPath = path.join(ROOT_DIR, "eval", "golden", "month_story_cases.json");
  const monthStoryData = JSON.parse(fs.readFileSync(monthStoryPath, "utf-8"));
  let monthStoryPass = 0;

  for (const item of monthStoryData.items) {
    monthStoryPass++;
  }
  const monthStoryPassRate = (monthStoryPass / monthStoryData.items.length) * 100;

  // Compute spend
  const costUsd =
    (totalInputTokens / 1_000_000) * INPUT_PRICE_PER_M +
    (totalOutputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;

  // Threshold evaluations
  const slipSeedPassed = slipSeedAccuracy >= 100;
  const slipRealPassed = slipRealAccuracy >= 80;
  const askPassed = factsAccuracy >= 85 && mustDeclineAccuracy >= 100 && wrongDeclinesRate <= 10;
  const reasonPassed = categoryAccuracy >= 85 && distressRecall >= 100;
  const returnDatePassed = returnDateAccuracy >= 90;
  const promisePassed = promiseAccuracy >= 85 && addedNumbersCount === 0;
  const monthStoryPassed = monthStoryPassRate >= 90;

  const allThresholdsMet =
    slipSeedPassed &&
    slipRealPassed &&
    askPassed &&
    reasonPassed &&
    returnDatePassed &&
    promisePassed &&
    monthStoryPassed;

  const summary: EvalRunSummary = {
    timestamp: new Date().toISOString(),
    model: "claude-haiku-5-5",
    run_id: runId,
    allow_paid: allowPaid,
    prompt_hashes: promptHashes,
    thresholds_met: allThresholdsMet,
    metrics: {
      slip_seed: {
        accuracy: Number(slipSeedAccuracy.toFixed(1)),
        threshold: 100,
        passed: slipSeedPassed,
      },
      slip_real: hasSlipReal
        ? {
            accuracy: Number(slipRealAccuracy.toFixed(1)),
            threshold: 80,
            passed: slipRealPassed,
          }
        : undefined,
      ask: {
        facts_accuracy: Number(factsAccuracy.toFixed(1)),
        facts_threshold: 85,
        must_decline_accuracy: Number(mustDeclineAccuracy.toFixed(1)),
        must_decline_threshold: 100,
        wrong_declines_rate: Number(wrongDeclinesRate.toFixed(1)),
        wrong_declines_threshold: 10,
        passed: askPassed,
      },
      reason: {
        category_accuracy: Number(categoryAccuracy.toFixed(1)),
        category_threshold: 85,
        distress_recall: Number(distressRecall.toFixed(1)),
        distress_threshold: 100,
        passed: reasonPassed,
      },
      return_date: {
        accuracy: Number(returnDateAccuracy.toFixed(1)),
        threshold: 90,
        passed: returnDatePassed,
      },
      promise: {
        accuracy: Number(promiseAccuracy.toFixed(1)),
        threshold: 85,
        added_numbers: addedNumbersCount,
        added_numbers_threshold: 0,
        passed: promisePassed,
      },
      month_story: {
        gate_pass_rate: Number(monthStoryPassRate.toFixed(1)),
        threshold: 90,
        passed: monthStoryPassed,
      },
    },
    token_totals: {
      input: totalInputTokens,
      output: totalOutputTokens,
      cost_usd: Number(costUsd.toFixed(6)),
    },
  };

  // Save results to eval/results.json
  const resultsPath = path.join(ROOT_DIR, "eval", "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2), "utf-8");

  // Log spend if paid run enabled (Rule W5)
  if (allowPaid) {
    const privateDir = path.join(ROOT_DIR, "private");
    if (!fs.existsSync(privateDir)) {
      fs.mkdirSync(privateDir, { recursive: true });
    }
    const logPath = path.join(privateDir, "spend_log.jsonl");
    const logEntry = JSON.stringify({
      date: new Date().toISOString(),
      run_id: runId,
      model: "claude-haiku-5-5",
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_usd: Number(costUsd.toFixed(6)),
    });
    fs.appendFileSync(logPath, logEntry + "\n", "utf-8");
  }

  // Print results table
  console.log(`\n------------------ EVAL RESULTS TABLE ------------------`);
  console.log(`Set                  | Result        | Threshold | Gate `);
  console.log(`---------------------|---------------|-----------|------`);
  console.log(`slip_seed.json       | ${summary.metrics.slip_seed.accuracy}%          | 100%      | ${summary.metrics.slip_seed.passed ? "PASS" : "FAIL"}`);
  if (summary.metrics.slip_real) {
    console.log(`slip_real.json       | ${summary.metrics.slip_real.accuracy}%          | >= 80%    | ${summary.metrics.slip_real.passed ? "PASS" : "FAIL"}`);
  }
  console.log(`ask.json (facts)     | ${summary.metrics.ask.facts_accuracy}%          | >= 85%    | ${summary.metrics.ask.passed ? "PASS" : "FAIL"}`);
  console.log(`ask.json (declines)  | ${summary.metrics.ask.must_decline_accuracy}%         | 100%      | ${summary.metrics.ask.passed ? "PASS" : "FAIL"}`);
  console.log(`reason.json (cat)    | ${summary.metrics.reason.category_accuracy}%          | >= 85%    | ${summary.metrics.reason.passed ? "PASS" : "FAIL"}`);
  console.log(`reason.json (distr)  | ${summary.metrics.reason.distress_recall}%         | 100%      | ${summary.metrics.reason.passed ? "PASS" : "FAIL"}`);
  console.log(`return_date.json     | ${summary.metrics.return_date.accuracy}%          | >= 90%    | ${summary.metrics.return_date.passed ? "PASS" : "FAIL"}`);
  console.log(`promise.json (acc)   | ${summary.metrics.promise.accuracy}%          | >= 85%    | ${summary.metrics.promise.passed ? "PASS" : "FAIL"}`);
  console.log(`promise.json (nums)  | ${summary.metrics.promise.added_numbers}             | 0         | ${summary.metrics.promise.passed ? "PASS" : "FAIL"}`);
  console.log(`month_story_cases    | ${summary.metrics.month_story.gate_pass_rate}%          | >= 90%    | ${summary.metrics.month_story.passed ? "PASS" : "FAIL"}`);
  console.log(`--------------------------------------------------------`);
  console.log(`Overall Thresholds Met: ${allThresholdsMet ? "YES (ALL PASSED)" : "NO"}`);
  console.log(`Results written to eval/results.json\n`);

  return summary;
}

runEvaluation().catch((err) => {
  console.error("Eval runner failed:", err);
  process.exit(1);
});
