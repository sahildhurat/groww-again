// Checks the Anthropic connection the app uses, and prints why a call fails. Written by Claude (R34).
// Loads .env.local the same way Next.js does; never prints the key or any part of it.
// Usage: npm run ai:check   (makes two tiny calls, a fraction of a cent)
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const key = process.env.ANTHROPIC_API_KEY || "";
const MODEL = "claude-haiku-5-5";
const H = { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" };

console.log(`ANTHROPIC_API_KEY found in .env.local: ${key ? "yes" : "NO"}`);
if (key && (key.startsWith('"') || key.startsWith("'") || key !== key.trim())) console.log("Warning: the key has quotes or spaces around it. Remove them.");
if (!key) process.exit(1);

async function show(label, url, init) {
  try {
    const r = await fetch(url, init);
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
    if (r.ok) return { ok: true, status: r.status, body };
    console.log(`${label}: HTTP ${r.status} ${body?.error?.type || ""} ${body?.error?.message || (typeof body === "string" ? body : "")}`);
    return { ok: false, status: r.status, body };
  } catch (e) {
    console.log(`${label}: network error ${e?.cause?.code || ""} ${e?.message || e}`);
    return { ok: false };
  }
}

const models = await show("List models", "https://api.anthropic.com/v1/models?limit=100", { headers: H });
if (models.ok) {
  const ids = (models.body?.data || []).map((m) => m.id);
  console.log(`Models this key can use (${ids.length}): ${ids.filter((i) => /haiku|sonnet|opus/.test(i)).join(", ")}`);
  console.log(`${MODEL} available: ${ids.includes(MODEL) ? "yes" : "NO"}`);
}
const base = { model: MODEL, max_tokens: 16, messages: [{ role: "user", content: "Reply with the word ok." }] };
const a = await show("Call without temperature", "https://api.anthropic.com/v1/messages", { method: "POST", headers: H, body: JSON.stringify(base) });
if (a.ok) console.log("Call without temperature: OK");
// R36/R40: a call shaped like the app's, made the same way lib/anthropic.ts makes it (system prompt, thinking switched
// off). claude-haiku-5-5 thinks by default and its answer can start with a thinking block, so the app reads text blocks
// by type; this check prints the block types and the stop reason so a problem is visible before the eval.
const appLike = { model: MODEL, max_tokens: 300, thinking: { type: "disabled" }, system: "Reply with a JSON object only.", messages: [{ role: "user", content: 'Return {"ok": true}.' }] };
const c = await show("Call shaped like the app", "https://api.anthropic.com/v1/messages", { method: "POST", headers: H, body: JSON.stringify(appLike) });
if (c.ok) {
  const blocks = (c.body?.content || []).map((b) => b.type);
  const text = (c.body?.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  console.log(`Call shaped like the app: OK (blocks: ${blocks.join(", ") || "none"}; stop_reason: ${c.body?.stop_reason}; ${c.body?.usage?.input_tokens ?? "?"} input / ${c.body?.usage?.output_tokens ?? "?"} output tokens)`);
  console.log(text.includes("{") ? "Answer text: present (the app can read it)" : "Answer text: MISSING (tell Claude)");
}
// Environment settings that redirect the Anthropic SDK (the app no longer uses the SDK; shown for the record).
for (const v of ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_TEST_BASE_URL", "HTTPS_PROXY", "HTTP_PROXY"]) {
  if (process.env[v]) console.log(`Note: ${v} is set in this environment${v === "ANTHROPIC_TEST_BASE_URL" ? " (remove it: it sends the app's calls to a test server)" : ""}.`);
}
