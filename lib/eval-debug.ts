// R48 (Claude, 9 Nov 2026): the 9 Nov eval could not be diagnosed because a replaced answer left no trace of what the
// model wrote. On the eval runner's own local server only (EVAL_MODE=1, set by scripts/run-eval.ts), a replaced answer
// carries the model's raw reply, and the runner stores it in the run file. Never on Vercel: EVAL_MODE is never set there,
// and VERCEL=1 blocks it as a second guard. The Quality page does not show it.
export function evalRawReply(raw: unknown): { eval_raw_reply?: string } {
  if (process.env.EVAL_MODE !== "1" || process.env.VERCEL === "1") return {};
  const text = typeof raw === "string" ? raw : JSON.stringify(raw ?? null);
  return { eval_raw_reply: String(text).slice(0, 2000) };
}
