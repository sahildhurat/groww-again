import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { SlipInputSchema, SlipOutputSchema, SlipCause } from "@/lib/types";
import { verifyGate, sanitizeInputText } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";

// Load prompt
const promptPath = path.join(process.cwd(), "prompts", "slip.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = SlipInputSchema.parse(rawBody);

    // Build deterministic template fallback per §8
    let fallbackCause: SlipCause = "paid";
    let fallbackHeadline = "Instalment completed.";
    let fallbackBody = `${input.due_date}. ₹${input.amount} invested.`;

    if (input.status === "failed") {
      if (input.failure_code === "bank_account_issue") {
        fallbackCause = "bank_account_issue";
        fallbackHeadline = "Mandate rejected: account closed or inactive.";
        fallbackBody =
          "The AutoPay for this SIP is linked to a bank account you no longer use. To fix it, set up AutoPay on your current account and link it to this SIP.";
      } else if (input.failure_code === "balance_insufficient") {
        fallbackCause = "balance_insufficient";
        fallbackHeadline = "NACH debit returned: insufficient funds.";
        fallbackBody =
          "This instalment did not go through because the account balance was low. You can use Pay Now within 2 working days to complete this instalment.";
      } else {
        fallbackCause = "failed_reason_unknown";
        fallbackHeadline = "Instalment did not go through.";
        fallbackBody =
          input.failure_text || "The scheduled debit was not completed by the bank.";
      }
    } else if (input.status === "skipped") {
      fallbackHeadline = "Instalment skipped by you.";
      fallbackBody = "This month was skipped. Skips count toward three missed instalments in a row.";
    }

    const fallbackOutput = {
      cause: fallbackCause,
      headline: fallbackHeadline,
      body: fallbackBody,
    };

    // Prepare allowed numbers set from input
    const allowedNumbers: number[] = [input.amount];
    if (input.nav) allowedNumbers.push(input.nav);
    if (input.units) allowedNumbers.push(input.units);
    const dateMatch = input.due_date.match(/\b\d+\b/g);
    if (dateMatch) dateMatch.forEach((d) => allowedNumbers.push(Number(d)));

    // Client IP for rate limit
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Call Claude Haiku
    const sanitizedInput = {
      ...input,
      failure_text: input.failure_text ? sanitizeInputText(input.failure_text) : null,
      pasted_message: input.pasted_message ? sanitizeInputText(input.pasted_message) : null,
    };

    const userPrompt = `Instalment record:
${JSON.stringify(sanitizedInput, null, 2)}

Provide the slip explanation JSON.`;

    const aiResult = await callClaudeHaiku({
      route: "slip",
      systemPrompt,
      userPrompt,
      maxTokens: 300,
      clientIp,
    });

    if (!aiResult.success || !aiResult.content) {
      return NextResponse.json({
        ...fallbackOutput,
        gate_status: "standard",
        gate_code: aiResult.error || "disabled",
      });
    }

    // Try parsing JSON from Claude's response
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

    // Run Quality Gate
    const gateResult = verifyGate(
      SlipOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: `${parsedJson.headline} ${parsedJson.body}`,
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
        cause: "failed_reason_unknown",
        headline: "Unable to process instalment.",
        body: "Please verify your order history or contact support.",
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
