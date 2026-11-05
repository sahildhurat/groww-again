# Context: The SIP Locker (MVP)

**Source of Truth:** `spec-06-mvp-sip-locker.md` (v1.2, 5 Nov 2026)  
**Supporting Documents:** `AGENTS.md`, `docs/mvp_final_list_v3.md`, `docs/mvp_open_questions_v1.md`  
**Git Identity:** `sip-research <sip-research@users.noreply.github.com>`  

---

## 1. Executive Summary & Core Proposition

"The SIP locker" is a concept prototype designed as a feature within Groww for first-time mutual fund investors in their critical first year (months 1–12). Its target outcome is **Active@12**—keeping first-year Systematic Investment Plans (SIPs) active or recoverable through life changes and payment breaks.

### The Problem
First-year SIPs lapse because:
1. **Payment problems:** An instalment fails, followed by a permanent stop in 84% of 135 coded user stories.
2. **Not yet understanding investing:** New investors confuse their own returns with fund returns, misunderstand NAV and rupee-cost averaging, or panic during market downturns.
3. **The day-1 decision stops fitting life:** 4 of 5 interview exits followed life events (job loss, job switch, stipend end, family emergency).
4. **The SIP feels like an expense:** Investors track their SIP primarily via monthly bank debit SMS messages rather than seeing an asset they are accumulating.

### The Cultural Insight
Indian investors traditionally value tangible, emotional stores of wealth:
- Gold stays safely in the family home or bank locker.
- Real property can be visited and walked on.
- Fixed Deposits (FDs) come with formal paper receipts filed in the family dossier.

A mutual fund SIP has traditionally had none of this—only a monthly debit SMS and fluctuating figures on a screen.

### The Solution
The SIP locker transforms the SIP from a monthly debit into an accumulating digital locker of slips, memories, and personal intent:
- Keeps receipt slips for every instalment.
- Anchors memories (text, photo, voice) to instalments.
- Surfaces failed instalments immediately as actionable empty slots with clear causes and fixes.
- Preserves the investor's Day-1 Promise and surfaces it without guilt when life changes.
- Keeps the locker open upon stopping with a committed return date and pre-configured restart plan.
- Explains financial mechanics ("Your month, your money") in terms of the investor's real life events.

---

## 2. Product Architecture: Four Surfaces & Eight Features

The 8 features are organized into 4 primary user surfaces centered around one core AI workflow (The Break Assistant):

```
+-------------------------------------------------------------------------+
|                        THE SIP LOCKER (CONCEPT)                         |
+------------------------------------+------------------------------------+
| 1. The Locker (Home & SIP View)    | 2. The Break Flow                  |
|   - F1: Cover, dedication, slips   |   - F3: Day-1 promise refitted     |
|   - F7: Hard months, empty slots   |   - F6: Return date & pause        |
|   - F2: "Your month, your money"   |   - Failed-month proactive fix     |
+------------------------------------+------------------------------------+
| 3. Ask Your Locker                 | 4. Year One                        |
|   - F5: Grounded Q&A on locker     |   - F8: First-year story recap     |
|   - Factual rules from rules.json  |   - F4: Printable Certificate      |
|   - Declines advice/predictions    |     of Holding (keepsake)          |
+------------------------------------+------------------------------------+
|               CENTRAL AI FEATURE: THE BREAK ASSISTANT                   |
| (Slip Explanation, Stop Reason & Distress, Return Date, Ask Q&A)        |
+-------------------------------------------------------------------------+
```

### Feature Details
1. **F1. The Locker:** Digital cover, dedication ("For me, by my birthday in 2028"), a receipt slip per instalment (date, amount, units, NAV), optional memory per instalment (photo, voice note, text), and empty slots for failed months showing exact cause and fix.
2. **F2. Your Month, Your Money:** Two checked sentences per paid month explaining how the investor's money performed relative to the previous month, woven with their personal memory (e.g., "In March, the month you moved to Pune, the fund's price was lower, so your ₹2,000 bought 20.986 units...").
3. **F3. The Day-1 Promise:** Short voice note or typed note at set-up capturing *why*, *for whom*, and *by when*. Opt-in checkbox: "Show me this if I try to cancel". Re-anchors investors during life changes without shame or guilt.
4. **F4. Certificate of Holding:** A printable, formal keepsake certificate celebrating investment milestones. Displays start date, dedication, units owned, and promise words. **Strictly no monetary return, profit, or portfolio valuation figures.**
5. **F5. Ask Your Locker:** Factual query answering strictly from the investor's locker data and `rules.json`. Firmly declines market forecasts, fund recommendations, or investment advice, directing users to SEBI/AMFI investor education resources.
6. **F6. The Locker Stays Open (Committed Return Date):** When an investor stops, they name a future return date or milestone (e.g., birthday, anniversary, salary appraisal). If eligible, pauses up to 3 months; otherwise keeps the plan ready for one-tap restart on that date.
7. **F7. Hard Months, Not Failures:** Skipped or paused months are recorded with the investor's own note (e.g., "Family emergency this month") without shame, noting that skips count toward SEBI's 3-consecutive-miss cancellation threshold.
8. **F8. Your First Year, as a Story:** Month-by-month recap generated from the investor's own slips and memories at month 11/12, with a prompt to record a note for year two.

---

## 3. The Central AI Feature: Break Assistant

The Break Assistant handles the critical moments where SIPs break or investors consider exiting. It operates across 7 server-side routes and 1 transcription endpoint behind a unified Quality Gate:

| Route | Purpose | Input Schema | Output Schema | Fallback Deterministic Text |
|---|---|---|---|---|
| `POST /api/ai/slip` | Classifies and explains a month (paid, failed, skipped) | `{ due_date, status, amount, nav?, units?, failure_code?, failure_text? }` | `{ cause, headline, body }` | Fixed template sentence per status and cause code |
| `POST /api/ai/month-story` | Crafts 2 checked educational sentences | `{ this: {due_date, amount, nav, units}, previous?: {due_date, nav, units}, memory?: string }` | `{ text }` | `"This month ₹{amount} bought {units} units at a NAV of ₹{nav}."` |
| `POST /api/ai/promise` | Extracts structured promise from transcript or text | `{ transcript: string }` | `{ goal, for_whom, horizon, one_line }` | First sentence of transcript; no invented numbers |
| `POST /api/ai/reason` | Analyzes stop reason for category and distress level | `{ text: string }` | `{ category, distress }` | Category: `other`, `distress: false` |
| `POST /api/ai/return-date` | Parses conversational return dates/milestones | `{ text: string, today: string, profile?: { birthday?, anniversary? } }` | `{ date: "YYYY-MM-DD" \| null, label: string, needs_confirmation: boolean }` | Standard date picker fallback |
| `POST /api/ai/ask` | Answers factual queries against locker & rules | `{ question: string, locker_summary: object, rules_excerpts: object[] }` | `{ answer: string, sources: string[], declined: boolean, decline_reason?: string }` | `"I can't answer that from your locker."` + relevant help link |
| `POST /api/ai/year-story` | Generates month-by-month recap of the year | `{ slips: object[], memories: object[] }` | `{ lines: string[], share_lines: string[] }` | Factual line per month from slips table |
| `POST /api/transcribe` | Transcribes audio notes (opt-in) | `FormData` (audio file) via Groq Whisper | `{ text: string, language: string }` | None (investor types manually) |

---

## 4. Quality Gate Architecture (`lib/gate.ts`)

Every AI response must pass 5 strict checks before appearing on screen. If any check fails, the deterministic template fallback is rendered, and a failure code is logged:

1. **Schema Validation:** Response parses strictly against the Zod schema for that route; enums must match allowed values.
2. **Number Matching:** Every number in the generated output text (₹ amounts, units, NAVs, counts, days, years) must exist in the route's allowed number set (computed directly from inputs). Units and NAV must match within ±0.001. Amounts and dates must match exactly.
3. **Banned Words & Phrases Check:** Case-insensitive check with simple stemming against:
   - Advice/recommendation terms: `recommend`, `suggest`, `best fund`, `switch to`, `portfolio review`, `buy`, `sell`.
   - Predictions/projections: `expect`, `will grow`, `target return`, `future value`, `forecast`.
   - Urgency markers: `now`, `hurry`, `last chance`, `only today`, `before it's too late`, `limited time`.
   - Guilt/shame language: `give up`, `quit`, `regret`, `disappoint`, `you promised`, `broken promise`.
   - Safety claims: `safe`, `guaranteed`, `assured`, `risk-free`.
4. **Personal Data (PII) Sanitization & Gate:**
   - Account numbers (9–18 digits).
   - Permanent Account Numbers (PAN: `[A-Z]{5}[0-9]{4}[A-Z]`).
   - Aadhaar numbers (12 digits).
   - IFSC codes (`[A-Z]{4}0[A-Z0-9]{6}`).
   - 10-digit Indian mobile phone numbers (`^[6-9]\d{9}$`).
   Inputs are sanitized of PII before AI calls. Any PII detected in output fails the gate (`pii`).
5. **Grounding for Memory Content:** In `month-story` and `year-story`, capitalized words and named entities must either appear in the input memory/profile or exist in an allowlist (e.g., month names, "NAV", "SIP", "AutoPay", fund labels).

### UI Indicators
Every generated text displayed in the UI has an indicator:
- **"Checked"**: Passed all gate rules.
- **"Standard text"**: Gate failure, timeout (>20s), rate-limited, or fallback served.
- Tooltip on each explaining the verification mechanism.

---

## 5. Deterministic Logic Engines

### A. Cause to Fix Mapping
Matches `cause` to actionable next steps and references `rules.json` topic excerpts:
- `paid` -> No fix required.
- `balance_insufficient` -> `pay_now` (Pay within 2 working days via NetBanking/UPI).
- `autopay_mandate_issue` & `first_instalment_or_setup` -> `autopay_approve_or_reset`.
- `bank_account_issue` -> `change_bank_autopay` (Set up AutoPay on current active account).
- `kyc_issue` -> `kyc_update`.
- `auto_cancelled` -> `restart_new_sip` (SEBI 3-consecutive-miss rule triggered; start fresh).
- `debited_no_units` & `refund_pending` -> `refund_timeline` (Refund within 7 working days).
- `app_or_platform_issue`, `fund_house_rejected`, `unwanted_debit`, `failed_reason_unknown` -> Direct to support.

### B. Stop Reason Options Engine
- `cash_shortage`, `income_stopped`, `emergency`:
  1. Pause until a return date (if eligible).
  2. Lower monthly SIP amount.
  3. Skip next instalment.
  4. Cancel SIP.
- `bank_changed`:
  1. Move AutoPay steps to new bank account.
  2. Cancel SIP.
- `goal_changed_or_reached`:
  1. Record a new Day-1 promise.
  2. Lower monthly amount.
  3. Cancel SIP.
- `fund_doubt`:
  1. Factual review: units remain yours; switching requires cancelling and starting a new SIP.
  2. Cancel SIP.
  *(Strictly no alternative fund recommendations).*
- `distress: true`:
  - Strips all marketing, decorative UI, and persuasive elements. Displays remaining choices in clear, unadorned, neutral typography.

### C. Return-Date Decision Engine
Calculates pause eligibility relative to the next instalment due date:
- **Eligible for Pause:** The proposed return date is $\le 3$ months after the next instalment AND $\ge 15$ days away.
  *Action:* Offer "Pause until {date}. It resumes automatically, subject to the fund house accepting the request."
- **Ineligible for Pause:** Date is $> 3$ months or $< 15$ days away.
  *Action:* Offer "Cancel now. Your plan will be ready for you on {date}."
- **Milestone Chips:** "My birthday", "Our anniversary", "New financial year (1 April)", "My next salary revision month", "Pick a date".
  - For birthdays or anniversaries, capture and store only DD-MM.

---

## 6. Demo Seed Data Specification

The demo runs completely client-side in Demo Mode (using `sessionStorage` and local state) or can be copied into a signed-in tester's account.

- **Investor Name:** "Demo investor"
- **SIP Name:** "My first bike"
- **Dedication:** "For me, by my birthday in 2028"
- **Fund Label:** "Nifty 50 Index Fund (demo)"
- **Monthly Amount:** ₹2,000 on the 5th
- **Start Date:** 5 December 2025
- **Anchor "Today" Date:** 5 November 2026 (customizable via `/demo-tools`)
- **Current Illustrative NAV:** ₹108.20
- **Formula for Units:** $\text{Units} = \text{round}\left(\frac{2000}{\text{NAV}}, 3\right)$

### Instalment Ledger (11 Months)
| Due Date | Status | NAV (₹) | Units | Failure Code & Text / Skip Note | Memory |
|---|---|---|---|---|---|
| 2025-12-05 | paid | 100.00 | 20.000 | - | "First salary from my first job." |
| 2026-01-05 | paid | 102.40 | 19.531 | - | "Moved into a flat with two friends." |
| 2026-02-05 | paid | 98.10 | 20.387 | - | *(none)* |
| 2026-03-05 | paid | 95.30 | 20.986 | - | "Markets are down. A colleague asked what I had expected so soon." |
| 2026-04-05 | paid | 99.80 | 20.040 | - | "Mum's birthday dinner." |
| 2026-05-05 | failed | - | - | `balance_insufficient`: "NACH debit returned: insufficient funds" | *(none)* |
| 2026-06-05 | paid | 104.20 | 19.194 | - | "Started driving lessons." |
| 2026-07-05 | skipped | - | - | Note: "Family emergency this month." | *(none)* |
| 2026-08-05 | paid | 101.70 | 19.666 | - | "Promotion letter came." |
| 2026-09-05 | failed | - | - | `bank_account_issue`: "Mandate rejected: account closed/inactive" | *(none)* |
| 2026-10-05 | paid | 106.90 | 18.709 | - | "Joined a new company. Salary now goes to a different bank; set up AutoPay on it." |

### Seed Totals
- Paid instalments: 8
- Total invested: ₹16,000
- Total units: 158.513
- Current value at ₹108.20: ₹17,151.11

---

## 7. Data Architecture & Supabase Schema

- **Database:** Supabase Postgres in Mumbai region (`ap-south-1`).
- **Auth:** Email + Password, "Confirm email" set to OFF.
- **Storage:** Private bucket `memories` accessed solely via short-lived signed URLs.
- **Client Processing:**
  - Photos: Compressed client-side to $\le 1600$ px, $\approx 500$ KB JPEG, EXIF metadata stripped.
  - Audio: Max 60 seconds, webm/m4a format.

### Tables & Fields
1. `sips`:
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users)
   - `name` (text)
   - `dedication` (text)
   - `fund_label` (text)
   - `amount` (numeric)
   - `day_of_month` (integer)
   - `start_date` (date)
   - `status` (text: `active`, `paused`, `stopped`)
   - `pause_until` (date)
   - `return_date` (date)
   - `return_label` (text)
   - `promise_text` (text)
   - `promise_one_line` (text)
   - `promise_goal` (text)
   - `promise_for_whom` (text)
   - `promise_horizon` (text)
   - `promise_audio_path` (text)
   - `show_promise_at_cancel` (boolean)
   - `created_at` (timestamptz)
2. `instalments`:
   - `id` (uuid, PK)
   - `sip_id` (uuid, FK sips)
   - `user_id` (uuid, FK auth.users)
   - `due_date` (date)
   - `status` (text: `paid`, `failed`, `skipped`, `paused`, `processing`)
   - `amount` (numeric)
   - `nav` (numeric)
   - `units` (numeric)
   - `failure_code` (text)
   - `failure_text` (text)
   - `note` (text)
   - `slip_text` (text)
   - `slip_gate` (text)
   - `story_text` (text)
   - `story_gate` (text)
   - `created_at` (timestamptz)
3. `memories`:
   - `id` (uuid, PK)
   - `instalment_id` (uuid, FK instalments)
   - `user_id` (uuid, FK auth.users)
   - `kind` (text: `photo`, `voice`, `text`)
   - `storage_path` (text)
   - `text` (text)
   - `transcript` (text)
   - `created_at` (timestamptz)
4. `notes`:
   - `id` (uuid, PK)
   - `sip_id` (uuid, FK sips)
   - `user_id` (uuid, FK auth.users)
   - `kind` (text: `year_two`)
   - `text` (text)
   - `audio_path` (text)
   - `created_at` (timestamptz)
5. `gate_log`:
   - `id` (uuid, PK)
   - `route` (text)
   - `result` (text: `pass` or fail code `schema`, `numbers`, `banned`, `pii`, `ungrounded`)
   - `latency_ms` (integer)
   - `input_tokens` (integer)
   - `output_tokens` (integer)
   - `created_at` (timestamptz)
   - *(Explicitly NO text or memory content logged)*

---

## 8. Compliance & Dark-Pattern Guardrails

| Regulatory / Legal Authority | Mandatory Build Guardrail |
|---|---|
| **SEBI** (Execution-Only Platforms) | No advice, fund suggestions, rankings, or return predictions anywhere. Platform bears legal responsibility for AI outputs. Cancellations processed in 2 working days. Slips marked "Your locker, not an account statement". Keepsakes show no returns. |
| **AMC / RTA** | Pause feature strictly bounded: allowed only where fund house supports it (max 3 months, requested $\ge 15$ days before due date). Explicitly noted: "subject to the fund house accepting the request". |
| **BSE / NPCI / RBI** | No real money or mandate interaction. All fixes shown as instructional steps requiring investor bank authentication. Memories added only post-instalment. |
| **CCPA** (Dark Patterns Prevention) | No confirm-shaming, subscription traps, or nagging. Promise on cancel is strictly opt-in and never autoplays. "Confirm cancellation" button has identical size, weight, and visual hierarchy as other choices. Return date is optional ("Skip"). |
| **DPDP Act & Rules** | Comprehensive consent screen prior to account storage. Separate opt-in for Groq voice transcription. Photo upload requires parental/consent affirmation. EXIF metadata stripped. Full export ("Download my locker") and full deletion ("Delete everything"). India hosting (`ap-south-1`). |
| **Project Privacy (W4)** | Neutral identity `sip-research <sip-research@users.noreply.github.com>`. Zero personal names across code, commits, URLs, and docs. `npm run check:privacy` scans against `private/private_terms.txt` and API key patterns. |

---

## 9. Evaluation Suite & Quality Thresholds

All prompts live in `prompts/*.md`. The build gate (`scripts/check-eval.mjs`) verifies that `eval/results.json` exists, meets all thresholds, and matches the sha256 hashes of the prompts.

| Golden Set | Dataset Source | Primary Evaluation Metric | Deployment Threshold |
|---|---|---|---|
| `slip_real.json` | `private/golden/slip_real.json` (135 real failure stories) | Cause classification accuracy | $\ge 80\%$ |
| `slip_seed.json` | `eval/golden/slip_seed.json` (Demo seed months) | Exact cause matching & gate pass | $100\%$ |
| `ask.json` | `eval/golden/ask.json` (Demo locker & rules questions) | Fact recall; must-decline recall; false decline rate | Facts $\ge 85\%$, Must-decline $100\%$, False declines $\le 10\%$ |
| `reason.json` | `eval/golden/reason.json` (Stop & change descriptions) | Category accuracy; distress identification | Category $\ge 85\%$, Distress $100\%$ |
| `return_date.json` | `eval/golden/return_date.json` (Date & milestone expressions) | Exact date or valid confirmation range | $\ge 90\%$ |
| `promise.json` | `eval/golden/promise.json` (Audio transcripts) | Goal and horizon accuracy; 0 added numbers | $\ge 85\%$, Added numbers $0$ |
| `month-story` & `year-story` | Demo seed cases | Gate pass rate; exact number matching | Gate pass $\ge 90\%$ |

- Eval runner: `npm run eval` executes against a live Next.js build. Run 3 consecutive times with results reported in `reports/RUN_REPORT.md`.
- Paid call tracking: Each paid run logs tokens and cost to `private/spend_log.jsonl` under the US$4 hard cap.

---

## 10. Design System & User Interface Rules

- **Design Framework:** Mobile-first layout designed at $390 \times 844$ viewport (iPhone 12/13/14 baseline); scales cleanly to desktop.
- **Visual Aesthetic:**
  - Clean white backgrounds (`#FFFFFF`) with subtle dividers (`#F3F4F6`).
  - Groww-aligned deep green primary accent (e.g., `#00D09C` / `#00B386`) with dark gray neutral text (`#1F2937`, `#4B5563`).
  - Rounded corners (`rounded-xl` / `rounded-2xl`).
  - Bottom navigation bar: `Home`, `My SIPs`, `Ask`, `Year one`.
  - Top app bar: Displays `"SIP locker (concept)"` with back navigation.
  - Zero trademarked Groww assets, logos, or wordmarks.
- **Mandatory Footer on Every Screen:**
  > *"Concept prototype for a Groww case study. Not affiliated with Groww. Demo figures are illustrative. This prototype does not give investment advice."*
- **Investment Advice Notice:**
  > *"Information about your own SIP and the rules only. Not investment advice."*
  Prominently visible at the top of the Break Flow and Ask Your Locker surfaces.
- **Mentor "Try a task" Panel (on Home):**
  1. *"Your September instalment did not go through. Find out why and what to do."*
  2. *"You need to stop for a while. Tell the locker why and set a date to return."*
  3. *"Add a memory to this month and read what your money did."*
  4. *"Ask how many units you bought in the month you moved into the flat."*
  5. *"Print your certificate."*
