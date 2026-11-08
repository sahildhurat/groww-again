import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PromiseInputSchema, PromiseOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText, extractNumbers } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";
import { extractFirstJsonBlock } from "@/lib/sensecheck-fallback";

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

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedTranscript = sanitizeInputText(input.transcript);
    // R35 (Claude): allowed numbers come from the MASKED transcript. Taken from the raw transcript, a phone or
    // account number the investor spoke became an "allowed" number and passed the PII check if repeated.
    const allowedNumbers = extractNumbers(sanitizedTranscript);

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
      // R41 (Claude): take the first JSON object even with a preamble or a code fence, and accept a year written as a
      // number ("horizon": 2027). The first live eval fell back on "Car by 2027" because the schema wants text.
      parsedJson = extractFirstJsonBlock(aiResult.content);
      if (typeof parsedJson?.horizon === "number") parsedJson.horizon = String(parsedJson.horizon);
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
        investorWords: sanitizedTranscript,
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
