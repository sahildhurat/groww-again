# Implementation Plan: The SIP Locker (MVP)

**Document Reference:** `spec-06-mvp-sip-locker.md` (v1.2) & `context.md`  
**Governing Rules:** Rules W1–W8 in `AGENTS.md`  
**Target Viewport:** $390 \times 844$ (Mobile-first; fully functional on desktop)  
**Git Identity:** `sip-research <sip-research@users.noreply.github.com>`  

---

## 1. Plan Overview & Engineering Philosophy

This implementation plan details the step-by-step build of "The SIP locker" concept prototype. The execution strictly adheres to the **Build Order in §2 of SPEC-06**, fails closed when AI is disabled or fails, enforces the Quality Gate on all AI text, complies with all Indian financial and privacy regulations (SEBI, AMC, BSE/NPCI, CCPA, DPDP), and adheres to the strict privacy rules (no personal names, no secrets, no raw private data).

### Core Architectural Principles
1. **Deterministic by Default, AI-Enhanced:** Core navigation, financial math, option filtering, and return-date bounds are 100% deterministic TypeScript logic. AI is applied strictly where nuance and language synthesis earn their place (The Break Assistant).
2. **Quality-Gated AI:** No AI response reaches the user without passing `lib/gate.ts` (schema, exact numbers ±0.001, banned terms, PII sanitization/rejection, and input grounding). Gate failures silently fall back to deterministic templates and log gate failure codes.
3. **Fail-Closed Safety:** If `MVP_LIVE_ENABLED !== 'true'`, rate limit is exceeded (>40/hr/IP), or the call times out (>20s), the system serves deterministic templates labeled "Standard text".
4. **Zero Secrets & Zero Private Data Leakage:** Never inspect, print, or log `.env*` or files in `private/`. `private/` is gitignored.

---

## 2. Directory Structure & File Manifest

```
├── .env.local.example              # Template for environment variables (W2)
├── .gitignore                      # Already configured; protects secrets & private data
├── AGENTS.md                       # Project rules W1-W8
├── spec-06-mvp-sip-locker.md       # Source of truth specification
├── context.md                      # Detailed project context
├── implementation-plan.md          # This implementation plan
├── package.json                    # Dependencies, scripts (check:privacy, eval, test)
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Groww-aligned green theme & mobile typography
├── next.config.js                  # Next.js 14 App Router config
├── prompts/                        # Versioned system prompts (tracked by sha256)
│   ├── slip.md
│   ├── month-story.md
│   ├── promise.md
│   ├── reason.md
│   ├── return-date.md
│   ├── ask.md
│   └── year-story.md
├── data/
│   ├── demo-seed.json              # Exact 11-month demo seed data (§6)
│   └── rules.json                  # Verbatim excerpts for 14 compliance topics (§8)
├── lib/
│   ├── types.ts                    # Zod schemas & TypeScript interfaces
│   ├── gate.ts                     # The 5-stage Quality Gate
│   ├── anthropic.ts                # Anthropic API client with timeouts & rate limits
│   ├── groq.ts                     # Groq Whisper transcription client
│   ├── seed.ts                     # Demo seed loader & calculation utilities
│   ├── rules-engine.ts             # Deterministic logic (causes, options, return-date)
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (service role)
│   └── image-utils.ts              # Client-side EXIF stripping & canvas compression
├── app/
│   ├── layout.tsx                  # Root layout with mobile shell, font, & disclaimers
│   ├── page.tsx                    # Surface 1: Home with "Try a task" panel & locker overview
│   ├── locker/
│   │   └── page.tsx                # Surface 1: The Locker detail (slips, memories, empty slots)
│   ├── break/
│   │   └── page.tsx                # Surface 2: The Break Flow (reason, options, return date)
│   ├── ask/
│   │   └── page.tsx                # Surface 3: Ask Your Locker Q&A
│   ├── year-one/
│   │   └── page.tsx                # Surface 4: First-year story recap
│   ├── certificate/
│   │   └── page.tsx                # Surface 4: Printable Certificate of Holding
│   ├── consent/
│   │   └── page.tsx                # DPDP Consent Screen prior to cloud storage
│   ├── settings/
│   │   └── page.tsx                # Data export ("Download my locker") & "Delete everything"
│   ├── how-it-works/
│   │   └── page.tsx                # Detailed breakdown of AI vs non-AI workflows
│   ├── quality/
│   │   └── page.tsx                # Evaluation metrics, thresholds, and gate transparency
│   ├── demo-tools/
│   │   └── page.tsx                # Mentor date override & state resets
│   └── api/
│       ├── ai/
│       │   ├── slip/route.ts
│       │   ├── month-story/route.ts
│       │   ├── promise/route.ts
│       │   ├── reason/route.ts
│       │   ├── return-date/route.ts
│       │   ├── ask/route.ts
│       │   └── year-story/route.ts
│       └── transcribe/route.ts
├── components/
│   ├── ui/                         # Base buttons, cards, dialogs, bottom sheets, badges
│   │   ├── checked-badge.tsx       # "Checked" vs "Standard text" with tooltip
│   │   ├── bottom-nav.tsx          # Home, My SIPs, Ask, Year one
│   │   ├── top-bar.tsx             # Header with back arrow & title
│   │   └── footer-notice.tsx       # Mandatory concept prototype footer
│   ├── locker/
│   │   ├── slip-card.tsx           # Paid instalment slip
│   │   ├── failed-slot-card.tsx    # Failed month empty slot with cause & fix
│   │   ├── hard-month-card.tsx     # Skipped month with investor note
│   │   ├── memory-modal.tsx        # Add photo/voice/text memory
│   │   └── return-date-card.tsx    # Card showing committed return plan
│   ├── break/
│   │   ├── reason-input.tsx        # Natural language or voice reason entry
│   │   ├── distress-banner.tsx     # Clean, unadorned state for distress
│   │   ├── options-list.tsx        # Deterministic options with equal cancel button
│   │   └── return-date-picker.tsx  # Milestone chips & date selection
│   ├── ask/
│   │   ├── ask-chat.tsx            # Chat messages with source citations
│   │   └── sample-questions.tsx    # Quick starter chips
│   └── certificate/
│       └── print-view.tsx          # Print-optimized certificate template
├── public/
│   ├── audio/
│   │   └── demo-promise.mp3        # Synthetic TTS demo voice note
│   └── illustrations/              # Code-generated SVGs for demo memories
│       ├── key.svg
│       ├── road.svg
│       └── cake.svg
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Postgres schema, RLS policies, storage bucket
├── scripts/
│   ├── build-rules.ts              # Script to build rules.json from public corpus
│   ├── check-eval.mjs              # Build gate: verifies eval results and prompt hashes
│   ├── check-privacy.mjs           # Pre-push gate: scans for private terms and keys
│   └── run-eval.ts                 # Evaluation runner across all golden sets
├── tests/
│   ├── unit/
│   │   ├── gate.test.ts            # Unit tests for the 5 gate stages
│   │   ├── rules-engine.test.ts    # Options logic & return date calculations
│   │   └── seed-math.test.ts       # Verification of computed numbers vs 2000/NAV
│   └── e2e/
│       └── sip-locker.spec.ts      # Playwright end-to-end tests for all §12 scenarios
└── reports/
    └── RUN_REPORT.md               # Final W7 report with file sha256s, eval tables, spend
```

---

## 3. Phase-by-Phase Implementation Plan

### Phase 1: Project Scaffolding & Core Shell (Order 1 in §2)
*Goal: Working mobile-first Next.js 14 app with Groww visual styling, demo seed data, "Try a task" panel, and the complete Locker view.*

1. **Initialize Next.js Application:**
   - Next.js 14 App Router, TypeScript, Tailwind CSS, `lucide-react`, `zod`, `clsx`, `tailwind-merge`.
   - Configure viewport: mobile-first constraint (`max-w-[430px]` centered on larger screens, default $390 \times 844$).
2. **Environment Template (`.env.local.example`):**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ANTHROPIC_API_KEY=
   GROQ_API_KEY=
   MVP_LIVE_ENABLED=false
   ALLOW_PAID=0
   ```
3. **Demo Seed Implementation (`data/demo-seed.json` & `lib/seed.ts`):**
   - Populate the 11-month demo seed (Dec 2025 to Oct 2026).
   - Ensure all figures are computed via formula: $\text{units} = \text{round}(2000 / \text{NAV}, 3)$, value at ₹108.20 = ₹17,151.11.
   - Seed includes:
     - 8 paid slips (Dec, Jan, Feb, Mar, Apr, Jun, Aug, Oct) with NAVs, units, and memories.
     - 2 failed slots: May (`balance_insufficient`) and September (`bank_account_issue`).
     - 1 hard month: July (skipped with note: "Family emergency this month.").
   - Implement date override helper in `lib/seed.ts` to support `/demo-tools` (default: `2026-11-05`).
4. **Groww-like Design System Components:**
   - Deep green accent (`#00D09C` / `#00B386`), clean white cards (`bg-white border border-gray-100 shadow-sm`), dark gray typography (`text-gray-900`, `text-gray-600`), rounded corners (`rounded-xl` / `rounded-2xl`).
   - `TopBar`: Back navigation arrow, app title `"SIP locker (concept)"`.
   - `BottomNav`: 4 tabs with icons: `Home`, `My SIPs` (`/locker`), `Ask` (`/ask`), `Year one` (`/year-one`).
   - `FooterNotice`: Mandatory text on every page:
     > *"Concept prototype for a Groww case study. Not affiliated with Groww. Demo figures are illustrative. This prototype does not give investment advice."*
   - Demo mode banner at top: `"Demo: nothing you add is saved."`
5. **Surface 1: Home Screen (`app/page.tsx`):**
   - "Try a task" panel with direct links for mentors:
     1. "Your September instalment did not go through. Find out why and what to do." -> `/locker#slot-2026-09-05`
     2. "You need to stop for a while. Tell the locker why and set a date to return." -> `/break`
     3. "Add a memory to this month and read what your money did." -> `/locker#slip-2026-10-05`
     4. "Ask how many units you bought in the month you moved into the flat." -> `/ask?q=units-flat`
     5. "Print your certificate." -> `/certificate`
   - SIP summary card: "My first bike", ₹2,000/month, "Nifty 50 Index Fund (demo)", total units 158.513.
6. **Surface 1: The Locker Screen (`app/locker/page.tsx`):**
   - Digital locker header with dedication: *"For me, by my birthday in 2028"*.
   - Chronological card list:
     - Paid slips (`SlipCard`): Date, amount, units, NAV, investor memory, "Add/edit memory" button.
     - Failed slots (`FailedSlotCard`): Red/amber accent, empty slot styling, exact reason, "Find out why & fix" button routing into the Break Flow.
     - Hard months (`HardMonthCard`): Factual skip record, investor note, note that skips count toward SEBI's 3-consecutive-miss rule.
7. **Mentor Tools (`app/demo-tools/page.tsx`):**
   - Allows setting simulated "today" date (e.g., Nov 2026 vs Mar 2027 vs Dec 2026 for month-12 review).
   - Reset demo state button (clears `sessionStorage`).

---

### Phase 2: AI Infrastructure, Quality Gate & Core Routes (Order 2 in §2)
*Goal: Implement server-side AI execution, the 5-stage Quality Gate, deterministic fallbacks, `rules.json`, and the slip & month-story routes.*

1. **Build `data/rules.json` Excerpts:**
   - Compile verbatim excerpts with source URLs from `private/groww_help.jsonl` and regulatory docs covering the 14 topics:
     `skip_rules`, `cancel_rules`, `cancel_timing`, `pause_terms`, `pay_now`, `change_bank_autopay`, `autopay_approve_or_reset`, `kyc_update`, `refund_timeline`, `withdrawal_timing`, `exit_load`, `elss_lockin`, `three_miss_rule`, `restart_new_sip`.
   - Never paraphrase; store verbatim citations.
2. **Build the Quality Gate (`lib/gate.ts`):**
   - Stage 1: Zod schema validation for route output.
   - Stage 2: Number validation. Extracts every number from output string. Checks that each number exists in the allowed set derived from input. Units/NAV matched within $\pm 0.001$, amounts and dates exact. Fail code: `numbers`.
   - Stage 3: Banned phrases check. Case-insensitive regex with stemming for advice, predictions, urgency, guilt, safety claims. Fail code: `banned`.
   - Stage 4: PII check. Detects 9-18 digit accounts, PAN, Aadhaar, IFSC, 10-digit phones. Sanitizes inputs, rejects outputs containing PII. Fail code: `pii`.
   - Stage 5: Grounding check (for month-story and year-story). Ensures capitalized tokens match inputs or the approved allowlist (months, NAV, SIP, AutoPay, fund names). Fail code: `ungrounded`.
   - Logging: Appends to `gate_log` table (route, result code, latency_ms, tokens; strictly NO content).
3. **Anthropic & Safety Client (`lib/anthropic.ts`):**
   - Model: `claude-haiku-5-5`. Thinking disabled.
   - `MVP_LIVE_ENABLED` check: If not `"true"`, immediately returns template fallback without network call.
   - Per-IP rate limiting: 40 calls per hour.
   - Timeout: 20 seconds via `AbortController`.
   - Cost logger: If `ALLOW_PAID=1`, appends token usage and cost to `private/spend_log.jsonl`.
4. **Prompts Creation in `prompts/`:**
   - `prompts/slip.md`: System prompt instructing Haiku to classify and explain the month into one of the 13 defined causes (`paid`, `balance_insufficient`, `autopay_mandate_issue`, `bank_account_issue`, `kyc_issue`, etc.), returning `{cause, headline, body}`.
   - `prompts/month-story.md`: System prompt to craft two checked sentences explaining units and NAV against the previous paid month, weaving in the memory without forecasting.
5. **Implement API Routes:**
   - `POST /api/ai/slip`: Validates input, checks rate limit, invokes Claude Haiku, passes response through `gate.ts`. Returns `{ cause, headline, body, gate_status: 'checked' | 'standard' }`.
   - `POST /api/ai/month-story`: Inputs this month and previous paid month data + memory. Gates response.
6. **UI Integration:**
   - Add `CheckedBadge` component to slip cards and month stories:
     - "Checked" with green shield icon for gated AI output.
     - "Standard text" with neutral badge for template fallbacks.
     - Tooltip explaining the automated verification.

---

### Phase 3: Memories Feature (F1) (Order 3 in §2)
*Goal: Add photo, voice note, and text memory capability to any instalment.*

1. **Client-side Image Processing (`lib/image-utils.ts`):**
   - Canvas-based image resizer: maximum dimension 1600 px, quality 0.8 JPEG, target size $\approx 500$ KB.
   - Complete EXIF and geolocation data stripping before upload.
2. **DPDP Photo Affirmation:**
   - Checkbox inside photo upload modal:
     > *"I confirm I have consent from anyone pictured, or am the parent or guardian of a child pictured."*
   - Upload button disabled until checked.
3. **Voice Note Recording Component:**
   - MediaRecorder API with 60-second timer countdown.
   - Play/pause audio preview with visual waveform/time indicator.
4. **Memory Storage Adapter:**
   - In Demo Mode: stores in `sessionStorage` (base64 or local blob URL) with demo disclaimer.
   - In Sign-in Mode: uploads to Supabase `memories` bucket and records in `memories` table.
5. **Code-Generated Demo Illustrations:**
   - Create clean SVGs in `public/illustrations/`:
     - `key.svg` ("First salary from my first job")
     - `road.svg` ("Started driving lessons")
     - `cake.svg` ("Mum's birthday dinner")
   - Strictly no real people or web images.

---

### Phase 4: Day-1 Promise Feature (F3) & Transcription (Order 4 in §2)
*Goal: Capture the Day-1 promise via voice or text, transcribe opt-in, extract structured goals, and store the cancel-screen opt-in.*

1. **Promise Recording Interface:**
   - Inputs for: *Why are you starting? For whom? By when?*
   - Voice note option + Text input fallback.
   - Audio transcription opt-in disclosure:
     > *"Voice notes are transcribed using Groq Whisper. Transcription is optional."*
2. **Groq Transcription Route (`POST /api/transcribe`):**
   - Accepts audio FormData.
   - Calls Groq API (`whisper-large-v3` / turbo).
   - Returns `{ text, language }`.
   - If transcription fails or is disabled, allows the user to review and edit typed text.
3. **Promise Parsing Route (`POST /api/ai/promise`):**
   - Uses `prompts/promise.md`.
   - Extracts `{ goal, for_whom, horizon, one_line }`.
   - Gate verifies that `one_line` uses the investor's own words and introduces zero invented numbers.
   - Fallback: First sentence of transcript.
4. **Cancel Screen Preference:**
   - Explicit checkbox: *"Show me this if I try to cancel"*.
   - Default: Checked for the demo seed.
5. **Demo Voice Asset:**
   - Synthetic TTS audio clip placed in `public/audio/demo-promise.mp3` with label "demo voice".

---

### Phase 5: Stop Flow & Break Assistant (F6, F3, Failed Month Fix) (Order 5 in §2)
*Goal: The central Break Flow surface—proactive failure resolution, reason analysis, distress adaptation, deterministic options, and committed return date.*

1. **Break Flow Entry Points (`app/break/page.tsx`):**
   - Proactive entry from a failed slot: Pass failure reason, show immediate explanation and fix steps.
   - Entry from "Cancel SIP" or "I need to take a break".
   - Notice at top of screen:
     > *"Information about your own SIP and the rules only. Not investment advice."*
2. **Step 1: Reason Analysis (`POST /api/ai/reason`):**
   - Investor speaks or types their reason in their own words (including Hinglish).
   - AI extracts `{ category, distress }`.
   - Gate verifies category enum (`cash_shortage`, `income_stopped`, `bank_changed`, `goal_changed_or_reached`, `fund_doubt`, `emergency`, `other`) and distress boolean.
   - If `distress: true`:
     - Renders unadorned, calm, monochrome interface.
     - Strips decorative banners, illustrations, or marketing copy.
3. **Step 2: Deterministic Options Presentation:**
   - Evaluate category using deterministic options logic from `lib/rules-engine.ts`:
     - Cash shortage / income stopped / emergency -> Pause until date, lower amount, skip next, cancel.
     - Bank changed -> AutoPay update steps, cancel.
     - Goal changed -> Refit promise, lower amount, cancel.
     - Fund doubt -> Factual explanation of units/restarting; cancel. (Strictly no fund suggestions).
   - **CCPA Anti-Dark-Pattern Rule:**
     - "Confirm cancellation" button has identical size, visual weight, and contrast as "Pause SIP" or "Lower amount".
     - Cancellation notice: *"Processed within 2 working days"*.
4. **Day-1 Promise Presentation on Cancel Screen:**
   - If user opted-in (`show_promise_at_cancel === true`):
     - Displays Day-1 Promise card: *"On day 1 you said: 'For my first bike, by my birthday in 2028.' Listen to your note."*
     - Manual Play button (Media player). **Strictly no autoplay.**
5. **Step 3: Committed Return Date (`POST /api/ai/return-date`):**
   - Investor types conversational return intent (e.g., "After sister's wedding in February", "On my birthday") or taps milestone chips.
   - Milestone chips: "My birthday", "Our anniversary", "New financial year (1 April)", "My next salary revision month", "Pick a date".
   - AI extracts `{ date, label, needs_confirmation }`.
   - Return-date deterministic logic:
     - If return date is $\le 3$ months after next instalment AND $\ge 15$ days away:
       Offer: *"Pause until {date}. It resumes automatically, subject to the fund house accepting the request."*
     - Otherwise:
       Offer: *"Cancel now. Your plan will be ready for you on {date}."*
6. **Confirmation & Locker Update:**
   - When confirmed, sets SIP status to `paused` or `stopped` with `return_date` and `return_label`.
   - Displays persistent Return Date card on Locker home:
     > *"Your locker stays open. You plan to return on {return_date} ({return_label})."*

---

### Phase 6: Ask Your Locker (F5) (Order 6 in §2)
*Goal: Grounded Q&A answering factual questions about the user's locker and rules, with strict decline enforcement.*

1. **Ask Your Locker Surface (`app/ask/page.tsx`):**
   - Top notice:
     > *"Information about your own SIP and the rules only. Not investment advice."*
   - Pre-populated question chips for testing:
     - "Which months did not go through?"
     - "How many units did I buy in March?"
     - "Why did my September instalment fail?"
     - "Which fund should I switch to?" (Tests decline)
     - "Will the market go up next year?" (Tests decline)
2. **Ask API Route (`POST /api/ai/ask`):**
   - Input: `{ question, locker_summary, rules_excerpts }`.
   - Prompt (`prompts/ask.md`):
     - Answers strictly from supplied locker facts and `rules.json` excerpts.
     - Declines any query asking for investment advice, fund ratings, return predictions, or market forecasts.
   - Gate verification:
     - If declined: Output must have `declined: true` and official educational link (SEBI investor site or AMFI).
     - If answered: Output must cite valid `sources` from `rules.json`.
     - Zero ungrounded numbers or banned phrases.
   - Fallback: *"I can't answer that from your locker."* + link to AMFI/SEBI investor portal.

---

### Phase 7: Certificate of Holding (F4) & First-Year Story (F8) (Order 7 in §2)
*Goal: Keepsake documents celebrating investor progress without performance figures.*

1. **Printable Certificate of Holding (`app/certificate/page.tsx`):**
   - Formal certificate layout suitable for framing or family file.
   - Fields: Investor name ("Demo investor"), SIP name ("My first bike"), dedication, start date, number of instalments completed (8 paid), total units owned (158.513 units), Day-1 Promise quote.
   - **Compliance Rule (SEBI):**
     - Label: *"Keepsake, not a statement of account or unit certificate"*.
     - **Strictly NO rupee valuation, current gains, profit percentage, or returns displayed.**
   - CSS Print stylesheet: Hides navigation bars, buttons, and footers; renders high-res printable certificate.
2. **First-Year Story Recap (`app/year-one/page.tsx`):**
   - Surface accessible at month 11/12.
   - Route `POST /api/ai/year-story`:
     - Compiles chronological story lines from slips and memories.
     - Produces `{ lines, share_lines }`.
     - `share_lines` strips out all rupee amounts, unit counts, and fund labels for public social sharing.
   - Note for Year Two prompt: Investor can record or type their intent for the upcoming year.

---

### Phase 8: Sign-in Mode, Supabase & Privacy Controls (Order 8 in §2)
*Goal: Cross-device persistence for testers, DPDP consent, data export, and full deletion.*

1. **DPDP Consent Screen (`app/consent/page.tsx`):**
   - Rendered before any data is written to Supabase.
   - Explicit disclosures:
     - What is stored (memories, voice notes, promise, return dates).
     - Where stored: Cloud server in Mumbai, India (`ap-south-1`).
     - Purpose: Cross-device synchronization.
     - Voice transcription is optional via Groq.
     - AI text generated from text only by Anthropic; no photos or audio sent to AI.
     - Data deleted after study.
     - Parental consent affirmation for any photos of minors.
2. **Supabase Schema & Security (`supabase/migrations/001_initial_schema.sql`):**
   - Create tables: `sips`, `instalments`, `memories`, `notes`, `gate_log`.
   - Enable Row Level Security (RLS) on all tables: `auth.uid() = user_id`.
   - Create private storage bucket `memories` with policy: `auth.uid() = (storage.foldername(name))[1]`.
   - Access files via signed URLs with 15-minute expiration.
3. **"Start from demo SIP" Provisioning:**
   - Clones the 11-month demo seed directly into the logged-in user's database rows.
4. **Settings & Data Sovereignty (`app/settings/page.tsx`):**
   - "Download my locker": Uses `jszip` to bundle all table records (JSON), uploaded photos/voice files, and a printable HTML ledger.
   - "Delete everything": Calls cascading deletion of all user records and storage objects, signs out, and purges local storage.

---

### Phase 9: Quality Pages, Eval Harness, Testing & Deploy (Order 9 in §2)
*Goal: Transparent documentation, complete test suite, privacy validation, and production readiness.*

1. **Educational & Quality Pages:**
   - `/how-it-works`: Plain-English explanation of why AI is used at each moment (failed month, stop reason, return date, Q&A, month story) vs what a non-AI app misses, and how the Quality Gate protects the investor.
   - `/quality`: Displays eval thresholds, latest pass rates, gate explanation, and 5 synthetic example test cases.
2. **Evaluation Harness (`scripts/run-eval.ts`):**
   - Executes against the live application build (`MVP_LIVE_ENABLED=true`, `ALLOW_PAID=1`).
   - Slices tests across all golden sets:
     - `private/golden/slip_real.json` (135 real failure texts; read by path only; cause accuracy $\ge 80\%$)
     - `eval/golden/slip_seed.json` (exact match 100%)
     - `eval/golden/ask.json` (facts $\ge 85\%$, must-decline $100\%$, wrong declines $\le 10\%$)
     - `eval/golden/reason.json` (category $\ge 85\%$, distress $100\%$)
     - `eval/golden/return_date.json` (exact date $\ge 90\%$)
     - `eval/golden/promise.json` (goal/horizon $\ge 85\%$, added numbers 0)
     - `eval/golden/month_story_cases.json` (gate pass $\ge 90\%$)
   - Computes sha256 of all prompt files in `prompts/`.
   - Saves results to `eval/results.json`.
   - Appends spend, model, tokens, and cost to `private/spend_log.jsonl`.
3. **Build Eval Gate (`scripts/check-eval.mjs`):**
   - Script invoked in `package.json` before `next build`.
   - Validates that `eval/results.json` exists, meets all deployment thresholds, and prompt sha256 hashes match.
4. **Privacy Scanner (`scripts/check-privacy.mjs`):**
   - Executed via `npm run check:privacy`.
   - Scans all git-tracked files and `.next` build output against:
     - Every entry in `private/private_terms.txt`.
     - Key patterns: `sk-ant-`, `gsk_`, `service_role`, JWT tokens.
   - Prints only file paths and line numbers, never matching terms.
5. **Unit Tests (Vitest in `tests/unit/`):**
   - `gate.test.ts`: Tests all 5 gate rules with seeded failing outputs.
   - `rules-engine.test.ts`: Verifies options filtering and return-date pause window calculations.
   - `seed-math.test.ts`: Verifies seed data math matches $\text{round}(2000/\text{NAV}, 3)$.
6. **End-to-End Tests (Playwright in `tests/e2e/sip-locker.spec.ts`):**
   - Viewports: $390 \times 844$ and $1280 \times 800$.
   - Verifies the 12 scenarios listed in §12.
7. **Production Deployment & W7 Run Report:**
   - Deploy instructions for Supabase Mumbai and private GitHub repo.
   - Screenshots generated at $390 \times 844$.
   - Final `reports/RUN_REPORT.md` compiling file sha256s, eval tables, spend summary, test results, and deviations.

---

## 4. Verification Checkpoints & Acceptance Criteria

| Checkpoint | Verification Method | Success Criteria |
|---|---|---|
| **Privacy & Secrets (W2, W3, W4)** | `npm run check:privacy` | 0 matched private terms, 0 exposed keys, git status clean of `private/` or `.env*` |
| **Demo Mathematical Accuracy (W8)** | `npm run test tests/unit/seed-math.test.ts` | All units equal $\text{round}(2000/\text{NAV}, 3)$; total units = 158.513; no hardcoded untracked numbers |
| **Quality Gate Verification** | `npm run test tests/unit/gate.test.ts` | 100% of seeded bad inputs (hallucinated numbers, banned phrases, PII, ungrounded terms) caught and rejected |
| **Eval Gate on Build** | `npm run eval` followed by `npm run build` | All 7 golden set thresholds met; prompt hashes match; `scripts/check-eval.mjs` exits with code 0 |
| **Three Eval Runs** | 3 consecutive `npm run eval` | All 3 runs pass all thresholds; spend logged in `private/spend_log.jsonl` under US$4 |
| **End-to-End Test Suite** | `npx playwright test` | All 12 scenarios in §12 pass on mobile ($390 \times 844$) and desktop ($1280 \times 800$) |
| **Accessibility Compliance** | Automated & manual audit | WCAG AA contrast, visible keyboard focus, screen-reader labels on record/play buttons |
| **Dark Pattern Verification** | Manual & Playwright inspection | Cancellation button has identical styling as other options; promise on cancel is opt-in only; no autoplay |
| **W7 Run Report** | File check | Complete `reports/RUN_REPORT.md` containing file sha256 table, screenshots, 3 eval runs, and spend totals |
