// Every Groww excerpt in data/rules.json must appear word for word on the Groww help page it cites,
// and every cited page must be in the help corpus. Public-rule summaries must say so and cite a source.
// Written by Claude (R34). Skips the corpus checks when private/groww_help.jsonl is absent (e.g. on CI).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import rules from "../../data/rules.json";

const corpusPath = path.join(process.cwd(), "private", "groww_help.jsonl");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("rules.json sources", () => {
  it("every rule has an id, a topic, text, a url and a source type", () => {
    for (const r of rules as any[]) {
      expect(r.id && r.topic && r.text && r.url && r.source_type).toBeTruthy();
      expect(["groww_help", "public_rule_summary"]).toContain(r.source_type);
    }
  });

  it("public-rule summaries are labelled as summaries", () => {
    for (const r of (rules as any[]).filter((r) => r.source_type === "public_rule_summary")) {
      expect(r.text.startsWith("Summary of a public")).toBe(true);
    }
  });

  it.skipIf(!fs.existsSync(corpusPath))("every Groww excerpt is verbatim on its cited page", () => {
    const pages = new Map<string, string>();
    for (const line of fs.readFileSync(corpusPath, "utf-8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const p = JSON.parse(line);
      pages.set(p.url, norm(p.text || ""));
    }
    for (const r of (rules as any[]).filter((r) => r.source_type === "groww_help")) {
      expect(pages.has(r.url), `${r.id}: url not in the help corpus`).toBe(true);
      expect(pages.get(r.url)!.includes(norm(r.text)), `${r.id}: excerpt not verbatim`).toBe(true);
    }
  });
});
