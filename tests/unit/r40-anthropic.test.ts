// R40 (Claude, 7 Nov 2026): claude-haiku-5-5 starts answers with a thinking block by default. The client must switch
// thinking off, read text blocks by type, and report an empty or cut-off answer instead of passing it on.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callClaudeHaiku } from "../../lib/anthropic";

const reply = (body: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });
let sent: any = null;

beforeEach(() => {
  process.env.MVP_LIVE_ENABLED = "true";
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.EVAL_MODE = "1";
  delete process.env.ALLOW_PAID;
  delete process.env.ANTHROPIC_TEST_BASE_URL;
  sent = null;
});
afterEach(() => vi.unstubAllGlobals());

const call = () => callClaudeHaiku({ route: "sensecheck", systemPrompt: "s", userPrompt: "u", maxTokens: 800 });
const stub = (body: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: any) => { sent = JSON.parse(init.body); return reply(body); }));

describe("callClaudeHaiku with claude-haiku-5-5", () => {
  it("switches thinking off and sends no temperature", async () => {
    stub({ content: [{ type: "text", text: "{}" }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } });
    await call();
    expect(sent.thinking).toEqual({ type: "disabled" });
    expect(sent.temperature).toBeUndefined();
    expect(sent.model).toBe("claude-haiku-5-5");
  });
  it("reads the text block after a thinking block", async () => {
    stub({ content: [{ type: "thinking", thinking: "", signature: "x" }, { type: "text", text: '{"ok":true}' }], stop_reason: "end_turn", usage: { input_tokens: 5, output_tokens: 9 } });
    const r = await call();
    expect(r.success).toBe(true);
    expect(r.content).toBe('{"ok":true}');
  });
  it("reports an answer with no text as empty, not as AI off", async () => {
    stub({ content: [{ type: "thinking", thinking: "", signature: "x" }], stop_reason: "max_tokens", usage: { input_tokens: 5, output_tokens: 800 } });
    const r = await call();
    expect(r.success).toBe(false);
    expect(r.error).toBe("empty");
  });
  it("reports an answer cut off at max_tokens", async () => {
    stub({ content: [{ type: "text", text: '{"intent":"allotment","answer":"The units' }], stop_reason: "max_tokens", usage: { input_tokens: 5, output_tokens: 800 } });
    const r = await call();
    expect(r.success).toBe(false);
    expect(r.error).toBe("truncated");
  });
});
