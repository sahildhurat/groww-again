import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { ReasonInputSchema, ReasonOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

const promptPath = path.join(process.cwd(), "prompts", "reason.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = ReasonInputSchema.parse(rawBody);

    const fallbackOutput = {
      category: "other" as const,
      distress: false,
    };

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedText = sanitizeInputText(input.text);

    const userPrompt = `Investor statement:
"${sanitizedText}"

Provide the reason category and distress JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "reason",
      systemPrompt,
      userPrompt,
      maxTokens: 100,
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
      ReasonOutputSchema,
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
        category: "other",
        distress: false,
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
