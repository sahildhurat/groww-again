import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PromiseInputSchema, PromiseOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText, extractNumbers } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

const promptPath = path.join(process.cwd(), "prompts", "promise.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = PromiseInputSchema.parse(rawBody);

    const firstSentence = input.transcript.split(/[.!?]/)[0]?.trim() || input.transcript;
    const fallbackOutput = {
      goal: "savings",
      for_whom: "myself",
      horizon: null,
      one_line: firstSentence,
    };

    // Extract numbers from transcript to define allowed numbers
    const allowedNumbers = extractNumbers(input.transcript);

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedTranscript = sanitizeInputText(input.transcript);

    const userPrompt = `Transcript:
"${sanitizedTranscript}"

Provide the structured promise JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "promise",
      systemPrompt,
      userPrompt,
      maxTokens: 200,
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
      PromiseOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: parsedJson.one_line,
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
        goal: "savings",
        for_whom: "myself",
        horizon: null,
        one_line: "Starting my SIP.",
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
