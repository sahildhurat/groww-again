import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { AskInputSchema, AskOutputSchema } from "@/lib/types";
import { verifyGate, sanitizeInputText } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";
import rulesData from "@/data/rules.json";

const promptPath = path.join(process.cwd(), "prompts", "ask.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = AskInputSchema.parse(rawBody);

    // Check deterministic answers for fallback mode
    const qLower = input.question.toLowerCase();
    let fallbackAnswer =
      "I can't answer that from your locker. For questions about investing rules and education, please refer to the official AMFI Investor Education portal.";
    let fallbackSources = ["https://www.amfiindia.com/investor-corner"];
    let fallbackDeclined = false;

    if (
      qLower.includes("switch") ||
      qLower.includes("recommend") ||
      qLower.includes("good fund") ||
      qLower.includes("best fund") ||
      qLower.includes("market go up") ||
      qLower.includes("guarantee") ||
      qLower.includes("should i stop")
    ) {
      fallbackDeclined = true;
      fallbackAnswer =
        "I cannot provide investment advice, fund recommendations, or market predictions. I can explain your instalments, units, and the rules for skipping, pausing, and cancelling.";
      fallbackSources = ["https://investor.sebi.gov.in"];
    } else if (qLower.includes("which months did not go through") || qLower.includes("not go through")) {
      fallbackAnswer = "Your May and September instalments did not go through.";
    } else if (qLower.includes("how many units did i buy in march")) {
      fallbackAnswer = "In March 2026, you bought 20.986 units at a NAV of ₹95.30.";
    } else if (qLower.includes("how much have i invested")) {
      fallbackAnswer = "You have invested ₹16,000 across 8 completed instalments.";
    } else if (qLower.includes("how many units do i own")) {
      fallbackAnswer = "You currently own 158.513 units in this fund.";
    }

    const fallbackOutput = {
      answer: fallbackAnswer,
      sources: fallbackSources,
      declined: fallbackDeclined,
      decline_reason: fallbackDeclined ? "advice" : null,
    };

    // Build allowed numbers from locker summary and demo data
    const allowedNumbers: number[] = [
      8, 16000, 158.513, 17151.11, 108.20, 2000,
      20.0, 19.531, 20.387, 20.986, 20.04, 19.194, 19.666, 18.709,
      100.0, 102.4, 98.1, 95.3, 99.8, 104.2, 101.7, 106.9,
      2025, 2026, 2027, 2028, 5, 14, 7, 2, 3
    ];

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const sanitizedQuestion = sanitizeInputText(input.question);
    const availableRules = input.rules_excerpts || rulesData;

    const userPrompt = `Question: "${sanitizedQuestion}"

Locker Summary Context:
${JSON.stringify(input.locker_summary, null, 2)}

Available Rules Excerpts:
${JSON.stringify(availableRules, null, 2)}

Provide the Ask response JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "ask",
      systemPrompt,
      userPrompt,
      maxTokens: 400,
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
      AskOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: parsedJson.answer,
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
        answer: "Unable to process question.",
        sources: [],
        declined: true,
        decline_reason: "error",
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
