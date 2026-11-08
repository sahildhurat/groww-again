import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { verifyGate, sanitizeInputText, extractNumbers, softenPromptWords } from "@/lib/gate";
import { callClaudeHaiku } from "@/lib/anthropic";
import { DECLINE_TEXT, DECLINE_SOURCES } from "@/lib/decline-text";
import rulesData from "@/data/rules.json";
import {
  instalmentState,
  confirmedTotals,
  valueAt,
  lastFullyConfirmed,
  latestInstalment,
} from "@/lib/passbook";
import {
  SensecheckOutputSchema,
  SensecheckOutput,
  buildSensecheckFallback,
  isAdviceQuery,
  extractFirstJsonBlock,
} from "@/lib/sensecheck-fallback";
import type { Instalment, PassbookEvent, PassbookSip } from "@/lib/passbook-types";
import { formatDateTime } from "@/lib/format";
import { getFailureCode } from "@/lib/failure-codes";
import { DEMO_NOW_DISPLAY } from "@/lib/demo-now";
import { answersAnotherEntry } from "@/lib/entry-focus";

// R39 (Claude): every event the model sees carries its times as display text ("6 Nov 2026, 10:00 IST"), so the answer
// can state the as-of time without converting time zones, and the gate can check that every clock time is a real one.
// R45: the demo clock now lives in lib/demo-now.ts, shared with the pages (Pay Now window).
// R41 (Claude): an event with no time is no longer labelled "not happened yet" when its status is unknown (the first live
// eval copied that label into answers about an unknown allotment). Failure events also carry the meaning of their reason
// code, and a failed debit carries its money status ("Nothing was taken from your bank account."), the same sentences the
// passbook entry page shows (lib/failure-codes.ts).
const withDisplay = (events: PassbookEvent[]) =>
  events.map((e) => {
    const fc = e.reason_code ? getFailureCode(e.reason_code) : null;
    return {
      ...e,
      effective_display: e.effective_at
        ? formatDateTime(e.effective_at)
        : e.status === "unknown"
          ? "can't confirm right now"
          : "not confirmed yet",
      as_of_display: formatDateTime(e.as_of),
      ...(fc ? { reason_meaning: fc.meaning } : {}),
      ...(fc && e.type === "debit" && e.status === "failed" ? { money_status: fc.money_status } : {}),
    };
  });

const SensecheckInputSchema = z.object({
  question: z.string().min(1).max(500),
  entry_id: z.string().optional(),
  scenario: z.enum(["running", "stopped", "stale"]),
});

const promptPath = path.join(process.cwd(), "prompts", "sensecheck.md");
const systemPrompt = fs.readFileSync(promptPath, "utf-8");

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const input = SensecheckInputSchema.parse(rawBody);

    // Load passbook seed server-side strictly from disk
    const seedPath = path.join(process.cwd(), "data", "passbook-seed.json");
    const seedRaw = fs.readFileSync(seedPath, "utf-8");
    const seed = JSON.parse(seedRaw);
    const scenarioData = seed.scenarios[input.scenario] as {
      sip: PassbookSip;
      instalments: Instalment[];
    };

    const { sip, instalments } = scenarioData;

    // Selected entry if provided
    const entry = input.entry_id
      ? instalments.find((i) => i.id === input.entry_id) ?? null
      : null;

    const totals = confirmedTotals(instalments);
    const lastConfirmed = lastFullyConfirmed(instalments);
    const latest = latestInstalment(instalments);
    const value = valueAt(totals, sip.latest_nav);

    // Build context JSON for AI with every rule passage
    const contextJson = {
      // R39: the demo's "now" (SPEC-07 §4.4), so answers about time windows (e.g. Pay Now) can be placed correctly.
      demo_now_display: DEMO_NOW_DISPLAY,
      // R44: the SIP's name is not shown anywhere in the product (owner, 8 Nov), so the model does not get it either.
      sip: {
        fund_label: sip.fund_label,
        amount: sip.amount,
        status: sip.status,
        status_changed_at: sip.status_changed_at,
        latest_nav: sip.latest_nav,
        latest_nav_date: sip.latest_nav_date,
        // R45: how the instalments are paid, which sets the allotment timing that applies (Groww help 61).
        payment_route: sip.payment_route ?? null,
      },
      // R45: the investor's official record, as the passbook page states it.
      official_record:
        "Your official record is your Consolidated Account Statement (CAS), from MF Central, CAMS or KFintech. This passbook is a supplementary view.",
      confirmed_totals: totals,
      value_at_latest_nav: value,
      // Live check, 8 Nov: the difference and its share, so an answer about a lower value can state them (the number
      // check only allows numbers that are in the facts).
      value_minus_put_in: value - totals.amount_put_in,
      value_change_pct: totals.amount_put_in ? Math.round(((value - totals.amount_put_in) / totals.amount_put_in) * 10000) / 100 : 0,
      last_fully_confirmed_date: lastConfirmed?.due_date ?? null,
      latest_instalment: latest
        ? {
            id: latest.id,
            due_date: latest.due_date,
            state: instalmentState(latest),
            events: withDisplay(latest.events),
          }
        : null,
      entry: entry
        ? {
            id: entry.id,
            due_date: entry.due_date,
            amount: entry.amount,
            nav: entry.nav,
            units: entry.units,
            state: instalmentState(entry),
            events: withDisplay(entry.events),
          }
        : null,
      all_instalments: instalments.map((i) => ({
        id: i.id,
        due_date: i.due_date,
        state: instalmentState(i),
        amount: i.amount,
        nav: i.nav,
        units: i.units,
      })),
      rules_passages: (
        rulesData as Array<{
          id: string;
          topic: string;
          title: string;
          text: string;
          source_type?: string;
        }>
      ).map((r) => ({
        id: r.id,
        topic: r.topic,
        title: r.title,
        text: r.text,
        source_type: r.source_type,
      })),
    };

    const fallbackOutput = buildSensecheckFallback(entry, sip);
    const sanitizedQuestion = sanitizeInputText(input.question);

    // Keyword pre-filter (R37 §1.c): keep only unmistakable advice phrases.
    // Pre-filter decline returns gate_status "standard" and gate_code "decline_rule" (not gate-checked).
    if (isAdviceQuery(sanitizedQuestion)) {
      return NextResponse.json({
        intent: "advice_request",
        answer: DECLINE_TEXT,
        facts_used: [],
        sources: DECLINE_SOURCES,
        as_of: null,
        declined: true,
        gate_status: "standard",
        gate_code: "decline_rule",
      });
    }

    const allowedNumbers: number[] = Array.from(
      new Set([
        ...extractNumbers(JSON.stringify(contextJson)),
        ...extractNumbers(sanitizedQuestion),
      ])
    );

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const userPrompt = `Question: "${sanitizedQuestion}"

Passbook Context:
${JSON.stringify(contextJson, null, 2)}

Provide the Sensecheck JSON response.`;

    const aiResult = await callClaudeHaiku({
      route: "sensecheck",
      systemPrompt,
      userPrompt,
      maxTokens: 800,
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
      parsedJson = extractFirstJsonBlock(aiResult.content);
    } catch {
      return NextResponse.json({
        ...fallbackOutput,
        gate_status: "standard",
        gate_code: "schema",
      });
    }

    if (parsedJson && parsedJson.declined === true) {
      parsedJson.answer = DECLINE_TEXT;
      parsedJson.sources = DECLINE_SOURCES;
      parsedJson.as_of = null;
    }

    // R39 (Claude): times, durations and as_of. Allowed clock times and as_of values are the events' own; durations must
    // appear word for word in the facts, the passages or the question. An answer about a step that is pending or unknown
    // (the selected entry's, or the latest instalment's when the answer is about it) must carry that step's as_of and
    // state its time.
    const allEvents = instalments.flatMap((i) => i.events);
    const allowedTimes = [DEMO_NOW_DISPLAY, ...allEvents.flatMap((e) => [
      formatDateTime(e.as_of),
      ...(e.effective_at ? [formatDateTime(e.effective_at)] : []),
    ])];
    const allowedAsOf = allEvents.map((e) => e.as_of);
    const focus = entry ?? latest;
    const openStep = focus?.events.find((e) => e.status === "pending" || e.status === "unknown") ?? null;
    // Live check, 8 Nov: plain words for the prompt's own words ("rule passages", "the context") before the gate.
    if (parsedJson && typeof parsedJson.answer === "string" && parsedJson.declined !== true) {
      parsedJson.answer = softenPromptWords(parsedJson.answer);
    }
    const answerText = String(parsedJson?.answer ?? "");
    const aboutOpenStep =
      !!openStep &&
      parsedJson?.declined !== true &&
      ["allotment", "payment_status"].includes(parsedJson?.intent) &&
      (entry !== null ||
        (Array.isArray(parsedJson?.facts_used) && parsedJson.facts_used.includes(openStep.id)) ||
        /not (?:yet )?confirmed|can[’']?t confirm|cannot confirm|unable to confirm|pending/i.test(answerText));

    const gateResult = verifyGate(
      SensecheckOutputSchema,
      parsedJson,
      allowedNumbers,
      fallbackOutput,
      {
        textToCheck: parsedJson.answer,
        allowedSourceText: `${JSON.stringify(contextJson)} ${sanitizedQuestion}`,
        allowedTimes,
        asOf: {
          value: parsedJson?.as_of,
          allowed: allowedAsOf,
          required: aboutOpenStep && openStep
            ? { iso: openStep.as_of, time: formatDateTime(openStep.as_of) }
            : null,
        },
      }
    );

    // R45: on an instalment page, an answer built only from other instalments' facts is replaced by the fallback.
    if (
      gateResult.isValid &&
      answersAnotherEntry({
        entry,
        instalments,
        factsUsed: parsedJson?.facts_used,
        question: sanitizedQuestion,
        declined: parsedJson?.declined === true,
        answer: answerText,
      })
    ) {
      return NextResponse.json({
        ...fallbackOutput,
        gate_status: "standard",
        gate_code: "wrong_entry",
      });
    }

    return NextResponse.json({
      ...gateResult.data,
      gate_status: gateResult.isValid ? "checked" : "standard",
      gate_code: gateResult.code,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        intent: "other",
        answer: "Unable to process question.",
        facts_used: [],
        sources: [],
        as_of: null,
        declined: true,
        gate_status: "standard",
        gate_code: "schema",
      },
      { status: 400 }
    );
  }
}
