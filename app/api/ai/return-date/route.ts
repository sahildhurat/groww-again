import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { ReturnDateInputSchema, ReturnDateOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

const promptPath = path.join(process.cwd(), "prompts", "return-date.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = ReturnDateInputSchema.parse(rawBody);

    const fallbackOutput = {
      date: null,
      label: "Pick a date",
      needs_confirmation: true,
    };

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedText = sanitizeInputText(input.text);

    const userPrompt = `Input context:
- today: "${input.today || "2026-11-05"}"
- profile: ${JSON.stringify(input.profile || {})}
- text: "${sanitizedText}"

Provide the return date JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "return-date",
      systemPrompt,
      userPrompt,
      maxTokens: 120,
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
      ReturnDateOutputSchema,
      parsedJson,
      [],
      fallbackOutput
    );

    return NextResponse.json({
      ...gateResult.data,
      gate_status: gateResult.isValid ? "checked" : "standard",
      gate_code: gateResult.code,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        date: null,
        label: "Pick a date",
        needs_confirmation: true,
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
