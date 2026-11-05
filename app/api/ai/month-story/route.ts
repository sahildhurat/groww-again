import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { MonthStoryInputSchema, MonthStoryOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

const promptPath = path.join(process.cwd(), "prompts", "month-story.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = MonthStoryInputSchema.parse(rawBody);

    const fallbackOutput = {
      text: `This month ₹${input.this.amount.toLocaleString(
        "en-IN"
      )} bought ${input.this.units.toFixed(3)} units at a NAV of ₹${input.this.nav.toFixed(
        2
      )}.`,
    };

    // Prepare allowed numbers
    const allowedNumbers: number[] = [
      input.this.amount,
      input.this.nav,
      input.this.units,
    ];
    if (input.previous) {
      if (input.previous.amount) allowedNumbers.push(input.previous.amount);
      allowedNumbers.push(input.previous.nav);
      allowedNumbers.push(input.previous.units);
    }
    // Also add difference if computed
    if (input.previous) {
      const unitsDiff = Math.abs(input.this.units - input.previous.units);
      allowedNumbers.push(Math.round(unitsDiff * 1000) / 1000);
      const navDiff = Math.abs(input.this.nav - input.previous.nav);
      allowedNumbers.push(Math.round(navDiff * 100) / 100);
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedMemory = input.memory ? sanitizeInputText(input.memory) : null;

    const userPrompt = `Input Data:
${JSON.stringify({ ...input, memory: sanitizedMemory }, null, 2)}

Provide the two-sentence month story JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "month-story",
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

    const groundingInputs = [
      input.this.due_date,
      input.previous?.due_date || "",
      sanitizedMemory || "",
    ];

    const gateResult = verifyGate(
      MonthStoryOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: parsedJson.text,
        groundingInputTexts: groundingInputs,
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
        text: "This month's instalment completed successfully.",
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
