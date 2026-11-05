import { z } from "zod";

// --- Enums & Literals ---

export const InstalmentStatusSchema = z.enum([
  "paid",
  "failed",
  "skipped",
  "paused",
  "processing",
]);
export type InstalmentStatus = z.infer<typeof InstalmentStatusSchema>;

export const SlipCauseSchema = z.enum([
  "paid",
  "balance_insufficient",
  "autopay_mandate_issue",
  "bank_account_issue",
  "kyc_issue",
  "first_instalment_or_setup",
  "app_or_platform_issue",
  "fund_house_rejected",
  "auto_cancelled",
  "debited_no_units",
  "refund_pending",
  "unwanted_debit",
  "failed_reason_unknown",
]);
export type SlipCause = z.infer<typeof SlipCauseSchema>;

export const StopCategorySchema = z.enum([
  "cash_shortage",
  "income_stopped",
  "bank_changed",
  "goal_changed_or_reached",
  "fund_doubt",
  "emergency",
  "other",
]);
export type StopCategory = z.infer<typeof StopCategorySchema>;

export const RuleTopicSchema = z.enum([
  "skip_rules",
  "cancel_rules",
  "cancel_timing",
  "pause_terms",
  "pay_now",
  "change_bank_autopay",
  "autopay_approve_or_reset",
  "kyc_update",
  "refund_timeline",
  "withdrawal_timing",
  "exit_load",
  "elss_lockin",
  "three_miss_rule",
  "restart_new_sip",
]);
export type RuleTopic = z.infer<typeof RuleTopicSchema>;

// --- Route Schemas ---

export const SlipInputSchema = z.object({
  due_date: z.string(),
  status: InstalmentStatusSchema,
  amount: z.number(),
  nav: z.number().nullable().optional(),
  units: z.number().nullable().optional(),
  failure_code: z.string().nullable().optional(),
  failure_text: z.string().nullable().optional(),
  pasted_message: z.string().nullable().optional(),
});
export type SlipInput = z.infer<typeof SlipInputSchema>;

export const SlipOutputSchema = z.object({
  cause: SlipCauseSchema,
  headline: z.string(),
  body: z.string(),
});
export type SlipOutput = z.infer<typeof SlipOutputSchema>;

export const MonthStoryInputSchema = z.object({
  this: z.object({
    due_date: z.string(),
    amount: z.number(),
    nav: z.number(),
    units: z.number(),
  }),
  previous: z
    .object({
      due_date: z.string(),
      amount: z.number().optional(),
      nav: z.number(),
      units: z.number(),
    })
    .nullable()
    .optional(),
  memory: z.string().nullable().optional(),
});
export type MonthStoryInput = z.infer<typeof MonthStoryInputSchema>;

export const MonthStoryOutputSchema = z.object({
  text: z.string(),
});
export type MonthStoryOutput = z.infer<typeof MonthStoryOutputSchema>;

export const PromiseInputSchema = z.object({
  transcript: z.string(),
});
export type PromiseInput = z.infer<typeof PromiseInputSchema>;

export const PromiseOutputSchema = z.object({
  goal: z.string(),
  for_whom: z.string(),
  horizon: z.string().nullable(),
  one_line: z.string(),
});
export type PromiseOutput = z.infer<typeof PromiseOutputSchema>;

export const ReasonInputSchema = z.object({
  text: z.string(),
});
export type ReasonInput = z.infer<typeof ReasonInputSchema>;

export const ReasonOutputSchema = z.object({
  category: StopCategorySchema,
  distress: z.boolean(),
});
export type ReasonOutput = z.infer<typeof ReasonOutputSchema>;

export const ReturnDateInputSchema = z.object({
  text: z.string(),
  today: z.string(),
  profile: z
    .object({
      birthday: z.string().nullable().optional(),
      anniversary: z.string().nullable().optional(),
    })
    .optional(),
});
export type ReturnDateInput = z.infer<typeof ReturnDateInputSchema>;

export const ReturnDateOutputSchema = z.object({
  date: z.string().nullable(),
  label: z.string(),
  needs_confirmation: z.boolean(),
});
export type ReturnDateOutput = z.infer<typeof ReturnDateOutputSchema>;

export const AskInputSchema = z.object({
  question: z.string(),
  locker_summary: z.any(),
  rules_excerpts: z.array(z.any()).optional(),
});
export type AskInput = z.infer<typeof AskInputSchema>;

export const AskOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()),
  declined: z.boolean(),
  decline_reason: z.string().nullable().optional(),
});
export type AskOutput = z.infer<typeof AskOutputSchema>;

export const YearStoryInputSchema = z.object({
  slips: z.array(z.any()),
  memories: z.array(z.any()),
});
export type YearStoryInput = z.infer<typeof YearStoryInputSchema>;

export const YearStoryOutputSchema = z.object({
  lines: z.array(z.string()),
  share_lines: z.array(z.string()),
});
export type YearStoryOutput = z.infer<typeof YearStoryOutputSchema>;

// --- Gate & Log Types ---

export type GateResultCode =
  | "pass"
  | "schema"
  | "numbers"
  | "banned"
  | "pii"
  | "ungrounded"
  | "rate_limit"
  | "timeout"
  | "disabled";

export interface GateVerificationResult<T> {
  isValid: boolean;
  code: GateResultCode;
  data: T;
  isFallback: boolean;
  reason?: string;
}

export interface RuleItem {
  id: string;
  topic: RuleTopic;
  title: string;
  text: string;
  url: string;
}
