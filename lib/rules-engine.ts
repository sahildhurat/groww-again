import rulesData from "@/data/rules.json";
import { RuleItem, RuleTopic, SlipCause, StopCategory } from "./types";

const rules: RuleItem[] = rulesData as RuleItem[];

export function getRuleByTopic(topic: RuleTopic): RuleItem | undefined {
  return rules.find((r) => r.topic === topic);
}

export function getAllRules(): RuleItem[] {
  return rules;
}

// Map slip causes to fix topic
export function getFixTopicForCause(cause: SlipCause): {
  topic?: RuleTopic;
  title: string;
  steps: string[];
  contactSupport?: boolean;
} {
  switch (cause) {
    case "paid":
      return {
        title: "Instalment completed",
        steps: [],
      };
    case "balance_insufficient":
      return {
        topic: "pay_now",
        title: "Pay Now available",
        steps: [
          "Use Pay Now within 2 working days via NetBanking or UPI.",
          "Ensure sufficient balance before the next scheduled instalment.",
        ],
      };
    case "autopay_mandate_issue":
    case "first_instalment_or_setup":
      return {
        topic: "autopay_approve_or_reset",
        title: "Approve AutoPay mandate",
        steps: [
          "Open your bank app or net banking to approve the pending AutoPay mandate.",
          "If rejected, reset AutoPay from your SIP settings.",
        ],
      };
    case "bank_account_issue":
      return {
        topic: "change_bank_autopay",
        title: "Update linked bank account",
        steps: [
          "Set up AutoPay on your current active bank account.",
          "Link the new AutoPay mandate to this SIP.",
          "Authentication must be completed with your bank.",
        ],
      };
    case "kyc_issue":
      return {
        topic: "kyc_update",
        title: "Update KYC details",
        steps: [
          "Check your KYC status with CVL or NDML KRA.",
          "Submit updated address or identity proofs before the next instalment.",
        ],
      };
    case "auto_cancelled":
      return {
        topic: "restart_new_sip",
        title: "SIP auto-cancelled (3 missed instalments)",
        steps: [
          "Under SEBI rules, three missed instalments cancel a monthly SIP.",
          "Your existing units stay in your folio.",
          "To continue investing, set up a new SIP.",
        ],
      };
    case "debited_no_units":
    case "refund_pending":
      return {
        topic: "refund_timeline",
        title: "Refund processing",
        steps: [
          "If money was debited without unit allocation, refund is automated.",
          "Amount will be credited back to your bank account within 7 working days.",
        ],
      };
    case "app_or_platform_issue":
    case "fund_house_rejected":
    case "unwanted_debit":
    case "failed_reason_unknown":
    default:
      return {
        title: "Contact support",
        steps: [
          "This issue requires investigation by platform support.",
          "Raise a support ticket with your transaction reference number.",
        ],
        contactSupport: true,
      };
  }
}

export interface StopOption {
  id: string;
  title: string;
  consequence: string;
  action: "pause" | "lower_amount" | "skip" | "cancel" | "update_autopay" | "refit_promise";
  isCancel?: boolean;
}

// Generate options list based on stop reason category
export function getStopOptionsForCategory(
  category: StopCategory,
  distress: boolean,
  canPause: boolean = true
): StopOption[] {
  const options: StopOption[] = [];

  if (
    category === "cash_shortage" ||
    category === "income_stopped" ||
    category === "emergency" ||
    category === "other"
  ) {
    if (canPause) {
      options.push({
        id: "pause",
        title: "Pause until a date you choose",
        consequence:
          "Units stay with you; debits stop until that date. Subject to the fund house's terms.",
        action: "pause",
      });
    }
    options.push({
      id: "lower_amount",
      title: "Lower the monthly amount",
      consequence:
        "Units stay with you; next debit is for the new amount; SIP continues without interruption.",
      action: "lower_amount",
    });
    options.push({
      id: "skip_next",
      title: "Skip the next instalment",
      consequence:
        "Units stay with you; next debit skipped; counts as 1 towards three missed instalments.",
      action: "skip",
    });
    options.push({
      id: "cancel",
      title: "Cancel this SIP",
      consequence:
        "Units stay with you in your folio; future debits stop permanently; processed in 2 working days.",
      action: "cancel",
      isCancel: true,
    });
  } else if (category === "bank_changed") {
    options.push({
      id: "update_autopay",
      title: "Set up AutoPay on your new bank account",
      consequence:
        "Units stay with you; debits move to your new account once approved; SIP stays active.",
      action: "update_autopay",
    });
    options.push({
      id: "cancel",
      title: "Cancel this SIP",
      consequence:
        "Units stay with you in your folio; future debits stop permanently; processed in 2 working days.",
      action: "cancel",
      isCancel: true,
    });
  } else if (category === "goal_changed_or_reached") {
    options.push({
      id: "refit_promise",
      title: "Refit your Day-1 promise to a new goal",
      consequence:
        "Units stay with you; update why and by when you are investing; SIP continues.",
      action: "refit_promise",
    });
    options.push({
      id: "lower_amount",
      title: "Adjust the monthly amount",
      consequence:
        "Units stay with you; next debit adjusts to your new target; SIP continues.",
      action: "lower_amount",
    });
    options.push({
      id: "cancel",
      title: "Cancel this SIP",
      consequence:
        "Units stay with you in your folio; future debits stop permanently; processed in 2 working days.",
      action: "cancel",
      isCancel: true,
    });
  } else if (category === "fund_doubt") {
    options.push({
      id: "facts",
      title: "Understand fund mechanics",
      consequence:
        "Units stay in your folio even if you stop; switching funds requires starting a new SIP.",
      action: "lower_amount",
    });
    options.push({
      id: "cancel",
      title: "Cancel this SIP",
      consequence:
        "Units stay with you in your folio; future debits stop permanently; processed in 2 working days.",
      action: "cancel",
      isCancel: true,
    });
  }

  return options;
}

// Return-date logic engine (§8)
export function evaluateReturnDate(
  returnDateStr: string,
  nextInstalmentDateStr: string
): {
  canPause: boolean;
  offerText: string;
  daysDifference: number;
  monthsDifference: number;
} {
  const returnDate = new Date(returnDateStr);
  const nextDate = new Date(nextInstalmentDateStr);

  const diffTime = returnDate.getTime() - nextDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Check 3 months and 15 days rule:
  // "if the date is no more than 3 months after the next instalment and at least 15 days away from it,
  // offer 'Pause until {date}. It resumes automatically, subject to the fund house accepting the request.'
  // Otherwise offer 'Cancel now. Your plan will be ready for you on {date}.'"
  const maxPauseDate = new Date(nextDate);
  maxPauseDate.setMonth(maxPauseDate.getMonth() + 3);

  const isAtLeast15Days = diffDays >= 15;
  const isWithin3Months = returnDate <= maxPauseDate;
  const canPause = isAtLeast15Days && isWithin3Months;

  const formattedDate = returnDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const offerText = canPause
    ? `Pause until ${formattedDate}. It resumes automatically, subject to the fund house accepting the request.`
    : `Cancel now. Your plan will be ready for you on ${formattedDate}.`;

  return {
    canPause,
    offerText,
    daysDifference: diffDays,
    monthsDifference: diffDays / 30,
  };
}
