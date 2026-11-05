import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

// Rate limiting in-memory store: IP -> timestamps[]
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(ip: string = "127.0.0.1"): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => t > oneHourAgo);

  if (validTimestamps.length >= 40) {
    return false; // Limit exceeded (40 calls per hour)
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// Published Claude Haiku prices ($ per million tokens)
// Input: $0.80 / 1M, Output: $4.00 / 1M
const INPUT_PRICE_PER_M = 0.80;
const OUTPUT_PRICE_PER_M = 4.00;

export function logSpend(
  route: string,
  inputTokens: number,
  outputTokens: number,
  runId: string = "runtime"
) {
  const allowPaid = process.env.ALLOW_PAID === "1";
  if (!allowPaid) return;

  const inputCost = (inputTokens / 1_000_000) * INPUT_PRICE_PER_M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;
  const totalCost = inputCost + outputCost;

  const logEntry = {
    date: new Date().toISOString(),
    run_id: runId,
    route,
    model: "claude-haiku-5-5",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: Number(totalCost.toFixed(6)),
    prices: {
      input_per_m: INPUT_PRICE_PER_M,
      output_per_m: OUTPUT_PRICE_PER_M,
    },
  };

  try {
    const spendLogDir = path.join(process.cwd(), "private");
    if (!fs.existsSync(spendLogDir)) {
      fs.mkdirSync(spendLogDir, { recursive: true });
    }
    const logPath = path.join(spendLogDir, "spend_log.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n", "utf-8");
  } catch (err) {
    // Fail silently without disrupting core flow
  }
}

export interface CallAiOptions {
  route: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  clientIp?: string;
  runId?: string;
}

export interface CallAiResult {
  success: boolean;
  content: string | null;
  error?: "disabled" | "rate_limit" | "timeout" | "error";
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export async function callClaudeHaiku({
  route,
  systemPrompt,
  userPrompt,
  maxTokens,
  clientIp = "127.0.0.1",
  runId = "runtime",
}: CallAiOptions): Promise<CallAiResult> {
  const startTime = Date.now();

  // 1. Safety switch: MVP_LIVE_ENABLED check
  const isLive = process.env.MVP_LIVE_ENABLED === "true";
  if (!isLive) {
    return {
      success: false,
      content: null,
      error: "disabled",
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Safety switch: Rate limit check
  if (!checkRateLimit(clientIp)) {
    return {
      success: false,
      content: null,
      error: "rate_limit",
      latencyMs: Date.now() - startTime,
    };
  }

  // 3. API key presence check
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      content: null,
      error: "disabled",
      latencyMs: Date.now() - startTime,
    };
  }

  const anthropic = new Anthropic({ apiKey });

  // 4. 20-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-haiku-5-5",
        max_tokens: maxTokens,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    const textContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    logSpend(route, inputTokens, outputTokens, runId);

    return {
      success: true,
      content: textContent,
      latencyMs,
      inputTokens,
      outputTokens,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (err.name === "AbortError") {
      return {
        success: false,
        content: null,
        error: "timeout",
        latencyMs,
      };
    }

    return {
      success: false,
      content: null,
      error: "error",
      latencyMs,
    };
  }
}
