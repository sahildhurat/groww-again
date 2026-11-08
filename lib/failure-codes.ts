// Failure and refund codes per SPEC-07 §4.3.
// Every sentence is supported by an entry in data/rules.json.
// Codes that have no applicable rule_id list an empty routes array.

export interface FailureRoute {
  title: string;
  rule_id: string | null;
  url?: string;
}

export interface FailureCode {
  code: string;
  meaning: string;
  money_status: string;
  routes: FailureRoute[];
  rule_ids: string[];
}

export const FAILURE_CODES: Record<string, FailureCode> = {
  INSUFFICIENT_BALANCE: {
    code: "INSUFFICIENT_BALANCE",
    meaning: "Your bank returned the debit for insufficient balance.",
    money_status: "Nothing was taken from your bank account.",
    routes: [
      {
        title: "How do I pay a missed SIP installment?",
        rule_id: "rule-pay-now-01",
      },
      {
        title: "Why was my SIP cancelled?",
        rule_id: "rule-three-miss-01",
      },
    ],
    rule_ids: ["rule-pay-now-01", "rule-three-miss-01"],
  },
  MANDATE_NOT_APPROVED: {
    code: "MANDATE_NOT_APPROVED",
    meaning: "The AutoPay mandate was not approved or not active.",
    money_status: "Nothing was taken from your bank account.",
    routes: [
      {
        title: "My AutoPay is approved, but my SIP still failed. Why?",
        rule_id: "rule-autopay-reset-01",
      },
      {
        title: "How do I change the AutoPay or bank for my SIP on Groww?",
        rule_id: "rule-change-bank-01",
      },
    ],
    rule_ids: ["rule-autopay-reset-01", "rule-change-bank-01"],
  },
  ORDER_NOT_ACCEPTED: {
    code: "ORDER_NOT_ACCEPTED",
    meaning: "The bank debit went through, but the order was not accepted.",
    money_status: "The amount is refunded to your bank account.",
    routes: [
      {
        title:
          "Money is debited from my account but my order failed. When will I get my money back?",
        rule_id: "rule-refund-01",
      },
    ],
    rule_ids: ["rule-refund-01"],
  },
  STATUS_UNAVAILABLE: {
    code: "STATUS_UNAVAILABLE",
    meaning: "We can't confirm the latest status right now.",
    money_status: "Not known yet.",
    routes: [
      {
        title: "Check the official statement (CAS) or contact support",
        rule_id: null,
        url: "https://www.mfcentral.com",
      },
    ],
    rule_ids: [],
  },
};

export function getFailureCode(code: string): FailureCode | null {
  return FAILURE_CODES[code] ?? null;
}
