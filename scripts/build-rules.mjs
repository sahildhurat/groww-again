// Builds data/rules.json from Groww's own help pages (private/groww_help.jsonl), copying text word for word,
// plus three public rules that Groww's help does not cover, marked source_type "public_rule_summary" with their source.
// Written by Claude (R34, 5 Nov 2026). Fails if any Groww excerpt is not found verbatim on its page.
// Usage: node scripts/build-rules.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CORPUS = path.join(ROOT, "private", "groww_help.jsonl");
const norm = (s) => s.replace(/\s+/g, " ").trim();
const pages = new Map();
for (const line of fs.readFileSync(CORPUS, "utf-8").split(/\r?\n/)) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  pages.set(r.url, { title: r.title, text: norm(r.text || "") });
}

const G = "groww_help";
const P = "public_rule_summary";
// [id, topic, source_type, url, excerpt]. For groww_help, the excerpt must appear verbatim (whitespace-normalised) on the page.
const SPEC = [
  ["rule-skip-01", "skip_rules", G, "https://groww.in/help/mutual-funds/mf-sip/what-is-the-maximum-period-for-which-i-can-skip-my-sip-installments--63",
    "Currently, you can skip only one SIP installment at a time. After skipping one, you can request to skip another installment for the same SIP once the first skipped installment date has passed. Important Points: If you skip three consecutive SIP installments, your SIP will be automatically canceled. If your next installment is due within two days, your skip request will not apply to that installment but will apply to the ones after."],
  ["rule-cancel-01", "cancel_rules", G, "https://groww.in/help/mutual-funds/mf-sip/how-to-cancel-my-sip",
    "Canceling the SIP will stop future installments, but your invested amount will remain as is until you redeem it. Once you place the request to cancel the SIP, it cannot be undone."],
  ["rule-cancel-02", "cancel_rules", G, "https://groww.in/help/mutual-funds/sip/will-i-be-charged-for-cancelling-my-sip--37",
    "No, you will not be charged for cancelling an SIP"],
  ["rule-cancel-timing-01", "cancel_timing", G, "https://groww.in/help/mutual-funds/mf-sip/how-to-cancel-my-sip",
    "Note: You cannot cancel your SIP if the next installment is due within the next 7 days. The installment must be paid before you can cancel it."],
  ["rule-cancel-timing-02", "cancel_timing", P, "https://cafemutual.com/news/press-news/33765-new-sip-rule-sebi-mandates-mf-companies-to-process-cancellations-in-2-days",
    "Summary of a public rule: SEBI requires SIP cancellation requests to be processed within 2 working days, from 1 December 2024."],
  ["rule-pause-01", "pause_terms", G, "https://groww.in/help/mutual-funds/order/can-i-pause-sip-for-next-month",
    "You can pause your upcoming SIPs on Groww. Follow these steps: 1. Click on the button below to go to the \"My SIPs\" section 2. Select the SIP you wish to pause 3. Click the \"Edit SIP\" button 4. Choose \"Skip Installment\""],
  ["rule-pause-02", "pause_terms", P, "https://www.valueresearchonline.com/stories/52346/want-to-pause-sip-investments-all-you-need-to-know/",
    "Summary of a public source: fund houses that offer a SIP pause usually need the request 15 to 21 days before the next instalment, allow a pause of up to six months (some only three), usually once or twice over the life of the SIP, and resume the SIP automatically when the pause ends. Terms vary by fund house."],
  ["rule-pay-now-01", "pay_now", G, "https://groww.in/help/mutual-funds/mf-sip/how-do-i-pay-for-a-missed-installment-3",
    "If your SIP failed due to insufficient balance, you'll see a 'Pay Now' option on the dashboard to pay the missed SIP. This option will be available for 2 working days."],
  ["rule-change-bank-01", "change_bank_autopay", G, "https://groww.in/help/mutual-funds/mf-sip/how-to-change-autopay---bank-for-sip-on-groww--38",
    "To change AutoPay or bank for your SIP: 1. Go to the SIPs section. 2. Select the SIP you want to update. 3. Click 'CHANGE AUTOPAY' and choose the new bank. Note: If you don’t have AutoPay set up for the new bank, set it up in the 'Bank and AutoPay' section first."],
  ["rule-autopay-reset-01", "autopay_approve_or_reset", G, "https://groww.in/help/mutual-funds/searchable/my-autopay-is-approved-even-then-my-sip-failed",
    "The approval time for AutoPay depends on the method you choose: Autopay via UPI: Approved within 24 hours. Autopay via OTP: Takes 2 working days for approval. Autopay via Form: Takes 21 working days for approval. Your SIP may have failed due to the following reasons: Insufficient Balance: Ensure that your bank account has sufficient balance at least 2 working days before the SIP installment date. Rejected AutoPay: Your SIP might still be linked to a previously rejected AutoPay. Click on 'MY SIPs' and switch to an approved AutoPay."],
  ["rule-kyc-01", "kyc_update", G, "https://groww.in/help/mutual-funds/order/why-did-my-sip-installment-fail--36",
    "KYC & Investor Details Issues: Your name, date of birth, email, mobile, or tax status might not match NSDL/KRA/RTA records. KYC verification could be incomplete, on hold, or expired. Your PAN might not be linked with Aadhaar or could be invalid."],
  ["rule-refund-01", "refund_timeline", G, "https://groww.in/help/mutual-funds/order/money-is-debited-from-my-account-but-my-order-failed-when-will-i-get-my-money-back-1",
    "If the amount has been debited from your bank account but your order has failed then you will receive a refund within 7 working days. If it has been more than 7 working days and you have still not received the amount, then please contact us using the button below and our team will assist you."],
  ["rule-withdraw-01", "withdrawal_timing", G, "https://groww.in/help/mutual-funds/order/how-to-withdraw-redeem-4",
    "The amount will reflect in your bank account within 3-4 working days. Note: ELSS funds have a 3-year lock-in period."],
  ["rule-exit-load-01", "exit_load", G, "https://groww.in/help/mutual-funds/order/what-is-exit-load--71",
    "Exit load is a fee payable to a mutual fund house for exiting a fund (fully or partially) before the completion of a specified period from the date of investment. An approximate value of your exit load amount (if applicable) is shown while placing the redeem order."],
  ["rule-elss-01", "elss_lockin", G, "https://groww.in/help/mutual-funds/order/can-i-withdraw-redeem-my-investments-any-time",
    "Yes, you can redeem your mutual fund investments any time you want. Groww does not charge for this. Note: 1. You may have to pay an exit load for redeeming. 2. Tax-saving ELSS funds have a lock-in period of 3 years."],
  ["rule-three-miss-01", "three_miss_rule", G, "https://groww.in/help/mutual-funds/order/why-was-my-order-cancelled--68",
    "Automatic Cancellation: The system automatically cancelled your SIP because the last three consecutive installments weren't paid. This could happen if payments were missed or if the orders were rejected by the payment gateway or AMC."],
  ["rule-three-miss-02", "three_miss_rule", P, "https://docs.fintechprimitives.com/compliance/changes/sip-auto-cancellation/",
    "Summary of a public rule: under SEBI's uniform rule, effective 1 April 2024, a monthly SIP is cancelled after three consecutive failed instalments, and a quarterly or longer SIP after two."],
  ["rule-restart-01", "restart_new_sip", G, "https://groww.in/help/mutual-funds/mf-sip/how-to-cancel-my-sip",
    "Once you place the request to cancel the SIP, it cannot be undone. You can create a new SIP in the same fund, and the amount will be added to the investment."],  // R39 (Claude, 7 Nov 2026): four more verbatim excerpts for SIP Passbook (units not visible yet, change amount or date,
  // AMC confirmation). Reassurance lines on the same pages ("Don't worry, your money is safe…") are deliberately left out.
  ["rule-allotment-01", "allotment_timing", G, "https://groww.in/help/mutual-funds/order/how-can-i-confirm-if-my-sip-instalment-was-deducted-successfully--18",
    "Keep in mind that while the amount is deducted on the SIP date (T-day), the complete order processing and unit allocation can take up to 5–6 business days, depending on the payment method and fund type. If your SIP still doesn’t show up after this period, please contact our support team for assistance."],
  ["rule-allotment-02", "allotment_timing", G, "https://groww.in/help/mutual-funds/order/it-s-beyond-the-expected-time--why-are-units-still-not-allotted--98",
    "Please note it generally takes up to 4 working days for the units to be allocated to your account after placing a purchase order. You can keep a track of the order on your dashboard. However, if it has been more than 6 working days since you placed the purchase order and you still cannot see the units allocated to your account then please contact us using the button below."],
  // R45 (Claude, 8 Nov 2026): allotment timing by payment route (Groww help 61). Stored as a summary because the page is
  // written as a list; the sixth element is the help page title shown on the source chip.
  ["rule-allotment-03", "allotment_timing", P, "https://groww.in/help/mutual-funds/order/how-many-days-does-it-take-for-the-units-to-be-allocated--61",
    "Summary of a public Groww help page: for SIPs paid through Groww AutoPay, the money reaches the fund and that day's NAV applies on the SIP date (T day), and units are expected on T+2, two working days after the SIP date. For BSE mandates (biller or one-time), the money reaches the fund on T+2 or T+3 and units are expected on T+5 or T+6. T day is the SIP instalment's due date.", "How many days does it take for the units to be allocated?"],
  // 9 Nov 2026 (Claude): checked on groww.in today; the page is not in the 5 Nov help corpus, so it is kept as a summary.
  ["rule-debit-advance-01", "allotment_timing", P, "https://groww.in/help/mutual-funds/mf-sip/sip-installment-was-deducted-but-the-order-is-not-reflected-on-the-dashboard",
    "Summary of a public Groww help page: Groww deducts a SIP instalment from the bank one bank working day before the SIP date, so the order is placed with the exchange on the SIP date and gets that day's NAV. The order shows under 'Orders in progress' in the dashboard on the SIP date. If it has been over 2 working days since the deduction and the issue persists, Groww asks investors to contact support.", "SIP installment was deducted but the order is not reflected on the dashboard."],
  ["rule-change-amount-01", "change_amount_date", G, "https://groww.in/help/mutual-funds/mf-sip/how-to-change-sip-date-or-amount",
    "Navigate to the 'Mutual Funds' section on your home screen. Select the SIPs tab at the top. Choose the SIP you wish to modify. Click 'Change Amount/Date'. Update the amount or date as needed, then click 'Save Changes'. Review your changes and click 'Confirm'. Alternatively, you can go to the 'SIPs' section under Mutual Funds and follow the same steps. Note: If your next instalment is within 2 working days, changes will apply only to future instalments."],
  ["rule-amc-confirmation-01", "order_confirmation", G, "https://groww.in/help/mutual-funds/order/will-i-also-get-an-order-confirmation-from-the-mutual-fund-company--53",
    "Once your order is confirmed, you will receive a confirmation email from both Groww and the mutual fund company, also known as the Asset Management Company (AMC). Groww will notify you about the successful placement of your order, and the AMC will send an official confirmation email with important details such as the number of units allotted, the NAV (Net Asset Value) at which the units were bought, and the transaction date."],
];

const out = [];
const errors = [];
for (const [id, topic, source_type, url, text, pageTitle] of SPEC) {
  let title = pageTitle ?? "Public rule";
  if (source_type === G) {
    const page = pages.get(url);
    if (!page) { errors.push(`${id}: url not in the help corpus`); continue; }
    if (!page.text.includes(norm(text))) { errors.push(`${id}: excerpt not found verbatim on ${url}`); continue; }
    title = page.title;
  }
  out.push({ id, topic, title, text, url, source_type });
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
fs.writeFileSync(path.join(ROOT, "data", "rules.json"), JSON.stringify(out, null, 2) + "\n", "utf-8");
console.log(`wrote data/rules.json: ${out.length} excerpts (${out.filter((r) => r.source_type === G).length} verbatim from Groww help, ${out.filter((r) => r.source_type === P).length} public-rule summaries)`);
