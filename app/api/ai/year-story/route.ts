import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { YearStoryInputSchema, YearStoryOutputSchema } from "@/lib/types";
import { verifyGate } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

const promptPath = path.join(process.cwd(), "prompts", "year-story.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = YearStoryInputSchema.parse(rawBody);

    // Fallback: one factual line per slip
    const fallbackLines: string[] = [];
    const fallbackShareLines: string[] = [];

    for (const slip of input.slips) {
      const dateFormatted = new Date(slip.due_date).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      if (slip.status === "paid") {
        fallbackLines.push(
          `${dateFormatted}: ₹${slip.amount} invested, bought ${slip.units?.toFixed(
            3
          )} units at NAV ₹${slip.nav?.toFixed(2)}.`
        );
        fallbackShareLines.push(`${dateFormatted}: Instalment completed.`);
      } else if (slip.status === "failed") {
        fallbackLines.push(
          `${dateFormatted}: Instalment missed due to payment issue.`
        );
        fallbackShareLines.push(`${dateFormatted}: Month skipped or paused.`);
      } else if (slip.status === "skipped") {
        fallbackLines.push(`${dateFormatted}: Skipped by you.`);
        fallbackShareLines.push(`${dateFormatted}: Month skipped.`);
      }
    }

    const fallbackOutput = {
      lines: fallbackLines,
      share_lines: fallbackShareLines,
    };

    const allowedNumbers: number[] = [];
    for (const slip of input.slips) {
      if (slip.amount) allowedNumbers.push(slip.amount);
      if (slip.nav) allowedNumbers.push(slip.nav);
      if (slip.units) allowedNumbers.push(slip.units);
      const matches = slip.due_date.match(/\b\d+\b/g);
      if (matches) matches.forEach((m: string) => allowedNumbers.push(Number(m)));
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const userPrompt = `Input Slips & Memories:
${JSON.stringify(input, null, 2)}

Provide the first-year story JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "year-story",
      systemPrompt,
      userPrompt,
      maxTokens: 700,
      clientIp,
    });

    if (!aiResult.success || !aiResult.content) {
      return NextResponse.json({
        ...fallbackOutput,
        gate_status: "standard",
        gate_code: aiResult.error || "disabled",
      });
    }

    let parsedJson: any;
    try {
      const cleaned = aiResult.content.replace(/```json\n?|\n?```/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch (e) {
      return NextResponse.json({
        ...fallbackOutput,
        gate_status: "standard",
        gate_code: "schema",
      });
    }

    const gateResult = verifyGate(
      YearStoryOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: parsedJson.lines.join(" "),
      }
    );

    return NextResponse.json({
      ...gateResult.data,
      gate_status: gateResult.isValid ? "checked" : "standard",
      gate_code: gateResult.code,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        lines: [],
        share_lines: [],
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
