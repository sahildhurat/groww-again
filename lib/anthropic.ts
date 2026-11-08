import fs from "node:fs";
import path from "node:path";
import pricing from "@/config/pricing.json";

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

// Prices per million tokens, read from config/pricing.json (which records its source and the date checked).
const PRICE = (pricing as any).per_million_tokens["claude-haiku-5-5"] as { input: number; output: number };
const INPUT_PRICE_PER_M = PRICE.input;
const OUTPUT_PRICE_PER_M = PRICE.output;

export function logSpend(
  route: string,
  inputTokens: number,
  outputTokens: number,
  runId: string = process.env.EVAL_RUN_ID || "runtime",
  extra: { stop_reason?: string | null; blocks?: string[] } = {}
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
    ...(extra.stop_reason !== undefined ? { stop_reason: extra.stop_reason } : {}),
    ...(extra.blocks ? { blocks: extra.blocks } : {}),
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
  error?: "disabled" | "rate_limit" | "timeout" | "error" | "empty" | "truncated";
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
  runId = process.env.EVAL_RUN_ID || "runtime",
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
  // The eval runner (scripts/run-eval.ts) sets EVAL_MODE=1 on its own local server so that
  // its few hundred calls are not cut off by the per-visitor limit. Never set EVAL_MODE on Vercel.
  if (process.env.EVAL_MODE !== "1" && !checkRateLimit(clientIp)) {
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

  // 4. 20-second timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    // R36 (Claude): a plain HTTPS call, the same request `npm run ai:check` makes and that works on the owner's
    // machine. The SDK path failed every call in the eval (gate_code "error") after temperature was removed,
    // while the plain call succeeded. The SDK also reads ANTHROPIC_BASE_URL / ANTHROPIC_AUTH_TOKEN from the
    // environment, which can silently send calls elsewhere. Here the host is fixed; ANTHROPIC_TEST_BASE_URL is
    // only for local tests against a stand-in server and must never be set on Vercel.
    const base = process.env.ANTHROPIC_TEST_BASE_URL || "https://api.anthropic.com";
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: maxTokens,
        // No temperature: claude-haiku-5-5 rejects it ("temperature is deprecated for this model").
        // R40 (Claude, 7 Nov 2026): claude-haiku-5-5 thinks by default (adaptive thinking), its responses start with a
        // thinking block, and thinking tokens count toward max_tokens. In the 7 Nov eval the only call used all 800
        // output tokens and the app read an empty first block. These are short, fact-bound JSON answers, so thinking is
        // switched off (accepted at the default "medium" effort; docs: platform.claude.com/docs/en/build-with-claude/thinking).
        thinking: { type: "disabled" },
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    const raw = await res.text();
    let response: any = null;
    try {
      response = JSON.parse(raw);
    } catch {
      response = null;
    }
    if (!res.ok) {
      const e: any = new Error(response?.error?.message || raw.slice(0, 200) || `HTTP ${res.status}`);
      e.status = res.status;
      e.error = response;
      throw e;
    }

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // R40: select content blocks by type, never by position (a response can start with a thinking block).
    const blocks: any[] = Array.isArray(response?.content) ? response.content : [];
    const textContent = blocks
      .filter((b) => b?.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("");
    const stopReason: string | null = response?.stop_reason ?? null;
    const blockTypes = blocks.map((b) => String(b?.type));

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    logSpend(route, inputTokens, outputTokens, runId, { stop_reason: stopReason, blocks: blockTypes });

    // R40: say why an answer is unusable instead of passing an empty or cut-off text on as if the AI were off.
    if (!textContent.trim()) {
      console.error(`[anthropic] ${route}: no text in the response (blocks: ${blockTypes.join(",") || "none"}; stop_reason: ${stopReason})`);
      return { success: false, content: null, error: "empty", latencyMs, inputTokens, outputTokens };
    }
    if (stopReason === "max_tokens") {
      console.error(`[anthropic] ${route}: the answer was cut off at max_tokens (${maxTokens}); output tokens ${outputTokens}`);
      return { success: false, content: null, error: "truncated", latencyMs, inputTokens, outputTokens };
    }

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
    // Log why the call failed (HTTP status, Anthropic error type and message; never the key or the prompt).
    console.error(
      `[anthropic] ${route} call failed: ${err?.status ?? ""} ${err?.error?.error?.type ?? err?.name ?? ""} ${String(err?.error?.error?.message ?? err?.message ?? "").slice(0, 200)}`
    );

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
