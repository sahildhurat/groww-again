# SPEC-06: MVP, "The SIP locker"

**Version** v1.2, 5 Nov 2026, 12:10 IST (from the clock); v1.1 was 11:57, v1.0 10:34. **v1.2 moves the build into its own project folder, `D:\Top Fellow Winner Project`**, with its own `AGENTS.md`; paths below are relative to that folder. Content is unchanged from v1.1. Written by Claude; build by AG. **Status:** approved scope (project owner, 5 Nov, 10:30 and 11:45 IST). Build **today**; tests and the deck follow over three days.

**What changed in v1.1** (owner, 5 Nov):
- the interface closely resembles Groww's, with no logo or trademark (§3a);
- the MVP is built around **one central eval-gated AI feature, the break assistant**, with the features inside it (§1a, §8);
- an explicit "not investment advice" notice (§3);
- a "Try a task" panel for mentors, and a "How the AI works" page (§3a, §9).

The R1 mechanisms in `mvp_r1_breaks_v1.md` (same-day catch, keep a thread, change the fund, readiness check) are **not** in this build; the owner decides after seeing it.

**Read first (W1):** this spec in full, then `docs/mvp_final_list_v3.md` (the ideas and their compliance tables). Rules W1–W8 and every privacy rule in this project's `AGENTS.md` apply. **W8 applies to the MVP too:** no number in any page, prompt or report is typed by hand if it can be read from data; the demo data in §6 is the only exception and is labelled "illustrative" on screen.

---

## 1. What we are building, and why

First-year SIPs lapse because of payment problems, because new investors don't yet understand investing, because the day-1 decision stops fitting their life, and because the SIP turns into just another monthly expense. Indian investors attach feelings to what they own: gold sits in the house, property can be visited, an FD comes with a receipt for the family file. A SIP has none of that.

**The SIP locker** gives every SIP a place to keep things: receipts, memories and the investor's own reasons. It tells the truth about failed months, explains the investor's money through their own life, and keeps the door open when they stop.

The voice is formal. The feeling comes from the investor's own words, photos and dates, never from our copy.

| Feature (all in v1) | Problem it targets | Evidence (see `mvp_final_list_v3.md` §1 and the docs named) |
|---|---|---|
| F1. The locker: cover, dedication, a receipt slip per instalment, a memory per instalment, an empty slot with the reason and the fix for a failed month | Expense feeling; payment problems | Failure → stop share and P04's dismissed failure message (`problem-deep-dive.md`); 6 of 8 interviewees follow their SIP through bank SMS |
| F2. Your month, your money: two checked sentences per paid month | Not understanding investing | Own-vs-fund return confusion in interviews; confusion types in stop stories (`findings-part1.md`) |
| F3. The day-1 promise: a voice note (or text) on why, for whom, by when; shown at life-change moments and, only if the investor chose it, on the cancel screen | Day-1 decision stops fitting | Life-change exits in interviews; a one-month skip did not fit most interviewees (`problem-structure.md`) |
| F4. Certificate of holding: a printable keepsake | Ownership; family legitimacy | FD-certificate logic (owner); no returns shown |
| F5. Ask your locker: questions answered from the investor's locker and the rules; fund and market questions declined | Not understanding; unresolved support | Confusions in stop stories; support "not resolved" (`findings-part1.md`) |
| F6. The locker stays open, with a committed return date: when stopping, the investor names a date (or a milestone such as a birthday) to return; a pause until then where the fund house allows it, otherwise the plan is kept ready for that date | No way back | 5 of 5 leavers want to return, none has; P08 coded "a break with a set return point might have brought him back"; restart events are rare (`problem-deep-dive.md`) |
| F7. Hard months, not failures: a skip or pause is recorded with the investor's own note | Cash shocks; shame of stopping | Cash-shock exits; one-month skip misfit (`problem-structure.md`) |
| F8. Your first year, as a story: month by month from the investor's own entries, with the day-1 note and a note for year two | The month-12 cliff | The brief's 12-month metric |

### 1a. One central AI feature: the break assistant
The MVP is built around **one eval-gated AI feature, the break assistant**. It reads what happened (a failure reason or a bank message) or what the investor says (in any language), and answers with the fact that applies and the next step, from the investor's own locker and the rules. It never advises; it declines and points to an official source when it should. Every capability below is part of it, behind one quality gate (§8) and one golden set sliced by moment (§9):
- **explaining a month** (the slip route: paid, failed, skipped);
- **reading a reason to stop or change** (the reason route) and **a return date** (the return-date route), inside the break flow;
- **answering questions** (the ask route), with declines;
- **smaller touches:** the month story, the promise summary, the year story.

In the interface, the eight features sit in **four surfaces**:
- **the locker** (F1, F7, with F2 on each slip);
- **the break flow** (F3, F6, and the failed-month fix);
- **Ask your locker** (F5);
- **year one** (F8, F4).

**Not in scope:** real Groww integration, real payments or mandates, real fund data, any fund suggestion. This is a **concept prototype**: every action that would touch Groww, BSE, a fund house or a bank is simulated and says so.

---

## 2. Build order (if time runs short, ship in this order)

1. Scaffold in the Groww-like interface (§3a), demo seed (§6), locker home with slips, failed slots and hard months (F1, F7), demo mode (no login), the "Try a task" panel.
2. AI routes with the quality gate and template fallbacks (§8): slip, month story.
3. Memories: photo, voice note, text (F1), with storage (§5).
4. Day-1 promise with voice and transcription (F3).
5. Stop flow: reason → options → return date → locker stays open (F6), including the promise on the cancel screen if chosen.
6. Ask your locker (F5).
7. Certificate (F4) and first-year story (F8).
8. Sign-in mode with cross-device storage, export and delete (§5, §10).
9. Eval runner, eval gate on build, `/quality` and `/how-it-works` pages (§9); tests (§12); privacy check; deploy (§11).

---

## 3. Tone and copy rules (hard rules; the gate enforces some of them)

- **Formal, calm and exact.** Every message says what happened, what it means and what the investor can do. Address the investor as "you". Sentence case. No slang, no emoji, no exclamation marks, no jokes, no cultural costumes, no countdowns, scores, streaks or badges.
- **The feeling comes from the investor's own content.** Our copy never says "proud", "amazing", "journey", "don't give up" or anything like it.
- **Facts about rules are stated as facts:** "Three missed instalments in a row cancel a monthly SIP" (never "you'll lose your SIP").
- **Never:** fund or stock suggestions, comparisons or rankings; return predictions or projections; "safe", "guaranteed", "assured"; urgency ("now", "hurry", "last chance", "only", "before it's too late"); guilt ("give up", "quit", "regret", "disappoint", "you promised").
- **Footer on every page:** "Concept prototype for a Groww case study. Not affiliated with Groww. Demo figures are illustrative. This prototype does not give investment advice."
- **Not investment advice, visible where it matters:** a one-line notice at the top of Ask your locker and of the break flow: "Information about your own SIP and the rules only. Not investment advice." Every decline links to SEBI's investor website or AMFI's investor education page as the official source.

**Sample copy (use as the register):**
- Paid slip: "5 March 2026. ₹2,000 invested. 20.986 units at a NAV of ₹95.30."
- Failed slot: "5 September 2026. This instalment did not go through. The AutoPay for this SIP is linked to a bank account you no longer use. To fix it, set up AutoPay on your current account and link it to this SIP."
- Hard month: "5 July 2026. Skipped by you. Your note: 'Family emergency this month.' Skips count toward three missed instalments in a row."
- Return date: "Your locker stays open. You plan to return on 14 March 2027 (your birthday)."
- Promise on the cancel screen (opt-in only): "On day 1 you said: 'For my first bike, by my birthday in 2028.' Listen to your note." (Play button; never autoplay.)
- Decline in Ask: "I can't recommend funds or predict markets. I can explain your instalments, units and the rules for skipping, pausing and cancelling."

### 3a. Interface: close to Groww, without its marks
- Follow Groww's app patterns closely:
  - clean white screens and generous spacing;
  - card lists with rounded corners and light dividers;
  - a green primary accent close to Groww's, with dark-grey text;
  - a top bar with a back arrow and the page title;
  - a bottom navigation bar;
  - a "My SIPs" list leading to each SIP's page;
  - bottom sheets for choices;
  - a system sans-serif font, or Inter.
- **No Groww logo, wordmark, app icon, illustrations or other trademarked assets**, and no copying of Groww's own images. The app name in the top bar is "SIP locker (concept)".
- **Bottom navigation (demo):** Home, My SIPs, Ask, Year one.
- **Home has a "Try a task" panel** for mentors and testers. Each task opens the right screen in demo mode:
  1. "Your September instalment did not go through. Find out why and what to do."
  2. "You need to stop for a while. Tell the locker why and set a date to return."
  3. "Add a memory to this month and read what your money did."
  4. "Ask how many units you bought in the month you moved into the flat."
  5. "Print your certificate."

---

## 4. Compliance rules (build constraints, from `mvp_final_list_v3.md`)

| Actor | Rule the build must keep |
|---|---|
| **SEBI** | No advice, recommendations, rankings or predictions anywhere, including AI answers (execution-only platform rules). The platform is responsible for AI output, so every AI output is checked (§8) and its gate result logged. Cancellation is never delayed; the screen states "processed within 2 working days". Keepsakes and shares carry no returns or performance figures. |
| **AMC / RTA** | A pause is offered only where the fund house offers one. The demo fund house allows a pause of up to 3 months, requested at least 15 days before the next instalment; the text says "subject to the fund house accepting the request". The official record is the fund house's statement: slips are labelled "Your locker, not an account statement". |
| **BSE, banks, NPCI, RBI** | Nothing touches payments or mandates. Fixes are shown as steps, each AutoPay change "authenticated by you with your bank". Memories are added only after an instalment, never as part of paying. |
| **CCPA dark-pattern rules** | No confirm shaming, subscription trap, nagging or interface interference: the promise appears on the cancel screen only if the investor ticked that when recording it; never autoplayed; "Confirm cancellation" has the same size and weight as every other option. The return date is optional ("Skip"). One reminder on the return date, no repeats. The memory prompt appears at most once per instalment and can be switched off. |
| **DPDP Act and Rules** | A consent screen before anything is stored (§10). Separate opt-in for voice transcription. Delete everything and export everything at any time. Photo upload asks the uploader to confirm they have consent from anyone pictured, or are the parent or guardian of a child pictured. EXIF data (including location) is stripped before upload. Memories are used for nothing else: no marketing, no training, no face recognition. Stored in India (§5). |
| **Project privacy rules** | No personal name anywhere (repo, commits, Vercel project, URLs, pages). Testers use the demo SIP's amounts, never their own. No PAN, account number or amount is stored from a tester: the gate strips such patterns from any text before storage or AI calls. Tester data is deleted after the study. |

---

## 5. Architecture

- **App:** Next.js 14 (App Router, TypeScript), Tailwind, `zod` for schemas, mobile-first (designed at 390×844; must work on desktop). Lives at the root of this project folder, which is **its own git repository** (neutral identity `sip-research <sip-research@users.noreply.github.com>`). The `.gitignore` is already in place: `private/` and `.env*` are never committed.
- **Storage and sign-in:** Supabase project in **Mumbai (ap-south-1)**.
  - Auth: email + password, with "confirm email" **off** (no emails are sent; the email is only a login name; testers may use any address).
  - Postgres tables (§7) with row-level security (`user_id = auth.uid()`).
  - A private Storage bucket `memories` for photos and voice notes, read through short-lived signed URLs.
  - Client-side compression: photos to at most 1600 px and about 500 KB, JPEG, EXIF stripped. Voice notes up to 60 seconds, webm or m4a.
- **AI:** Anthropic Messages API, model `claude-haiku-5-5`, called only from server routes. Thinking disabled. `max_tokens` per route as in §8. Key `ANTHROPIC_API_KEY` in Vercel env only, from a **new Anthropic workspace "sip-locker" with a US$4 monthly limit** (inside the US$30 total).
- **Transcription:** Groq speech-to-text, `whisper-large-v3` (check Groq's current model list; use the turbo variant if that is what is offered), from a server route, opt-in only. Key `GROQ_API_KEY` in Vercel env. If transcription is off or fails, the investor types.
- **Safety switches:** `MVP_LIVE_ENABLED` ("true" turns AI on; anything else serves templates only, so it fails closed); per-IP rate limit of 40 AI calls per hour; a 20-second timeout per AI call (template on timeout); no request or memory content in logs (log only route, gate result codes, latency, token counts).
- **Two modes:**
  - **Demo mode (no login):** loads the seed (§6) from a JSON file in the app. Anything the visitor adds (memories, a promise, a return date) lives in memory and `sessionStorage` only, with a banner: "Demo: nothing you add is saved." This is the mentors' path.
  - **My locker (sign in):** "Start from the demo SIP" copies the seed's history into the investor's own account, so testers and mentors can personalise a real-looking locker and open it on another device.

---

## 6. Demo seed (illustrative; label it on screen)

- Investor display name: "Demo investor". SIP name: "My first bike". Dedication: "For me, by my birthday in 2028". Fund label: "Nifty 50 Index Fund (demo)". Amount ₹2,000, monthly on the 5th, started 5 December 2025. Today in the demo is 5 November 2026 (a "change date" control on `/demo-tools` lets mentors move the demo date to see the return-date card and month-12 states).
- Illustrative NAVs and statuses (units = 2000 / NAV, rounded to 3 decimals; current NAV for value: ₹108.20):

| Due date | Status | NAV (₹) | Failure reason code / note | Memory (text) |
|---|---|---|---|---|
| 2025-12-05 | paid | 100.00 | | "First salary from my first job." |
| 2026-01-05 | paid | 102.40 | | "Moved into a flat with two friends." |
| 2026-02-05 | paid | 98.10 | | |
| 2026-03-05 | paid | 95.30 | | "Markets are down. A colleague asked what I had expected so soon." |
| 2026-04-05 | paid | 99.80 | | "Mum's birthday dinner." |
| 2026-05-05 | failed | | `balance_insufficient`: "NACH debit returned: insufficient funds" | |
| 2026-06-05 | paid | 104.20 | | "Started driving lessons." |
| 2026-07-05 | skipped | | note: "Family emergency this month." | |
| 2026-08-05 | paid | 101.70 | | "Promotion letter came." |
| 2026-09-05 | failed | | `bank_account_issue`: "Mandate rejected: account closed/inactive" | |
| 2026-10-05 | paid | 106.90 | | "Joined a new company. Salary now goes to a different bank; set up AutoPay on it." |

- Day-1 promise transcript: "I'm starting this for my first bike. I want to buy it by my birthday in 2028, without taking a loan." Opted in to "show me this if I try to cancel": yes. (Demo voice note: use a short synthetic text-to-speech clip generated once and stored in `public/`, labelled "demo voice"; no real person's voice.)
- Photos: **no real people and no web images.** Use simple illustrations made in code (SVG or canvas), for example a key, a road, a cake.
- All computed figures (units, totals, value) come from these rows in code, never typed.

---

## 7. Data model (Supabase)

- `sips`: id, user_id, name, dedication, fund_label, amount, day_of_month, start_date, status (`active`, `paused`, `stopped`), pause_until, return_date, return_label, promise_text, promise_one_line, promise_goal, promise_for_whom, promise_horizon, promise_audio_path, show_promise_at_cancel (bool), created_at.
- `instalments`: id, sip_id, user_id, due_date, status (`paid`, `failed`, `skipped`, `paused`, `processing`), amount, nav, units, failure_code, failure_text, note, slip_text, slip_gate, story_text, story_gate, created_at.
- `memories`: id, instalment_id, user_id, kind (`photo`, `voice`, `text`), storage_path, text, transcript, created_at.
- `notes`: id, sip_id, user_id, kind (`year_two`), text, audio_path, created_at.
- `gate_log`: id, route, result (`pass` or a fail code), latency_ms, input_tokens, output_tokens, created_at. **No content.**

---

## 8. AI jobs, the quality gate and fallbacks

Prompts live in `prompts/*.md` (one per route, versioned; their sha256 goes into eval results). Every route returns JSON validated with `zod`. Every route has a deterministic **template fallback**. Every AI text on screen carries a small label: **"Checked"** (passed the gate) or **"Standard text"** (fallback), with a tooltip explaining the check. The model never sees photos or audio, only text.

### The gate (one TypeScript module, `lib/gate.ts`, unit-tested)
1. **Schema:** the output parses against the route's schema, and enums are valid.
2. **Numbers:** every number in the output text (₹ amounts, units, NAVs, counts, days, years) must be in the route's allowed set, computed from the input (units and NAV within ±0.001; amounts exact; dates from the input). Otherwise: fail `numbers`.
3. **Banned phrases:** the lists from §3 (advice, prediction, urgency, guilt, safety claims), case-insensitive with simple stemming. Otherwise: fail `banned`.
4. **Personal data:** patterns for account numbers (9–18 digits), PAN (`[A-Z]{5}[0-9]{4}[A-Z]`), Aadhaar (12 digits), IFSC, 10-digit phone numbers. They are stripped from inputs before the call; any found in an output means fail `pii`.
5. **Grounding for memory-based text** (month story, first-year story): capitalised words and named things in the output must appear in the inputs or in a small allowlist (month names, "NAV", "SIP", "AutoPay", the fund label). Otherwise: fail `ungrounded`.
6. On any fail: show the template, log the fail code.

### Routes
| Route | Input | Output | Template fallback | max_tokens |
|---|---|---|---|---|
| `POST /api/ai/slip` | instalment row (status, date, amount, NAV, units, failure_code, failure_text or a pasted bank/Groww message) | `{cause, headline, body}`. `cause` is one of: `paid`, `balance_insufficient`, `autopay_mandate_issue`, `bank_account_issue`, `kyc_issue`, `first_instalment_or_setup`, `app_or_platform_issue`, `fund_house_rejected`, `auto_cancelled`, `debited_no_units`, `refund_pending`, `unwanted_debit`, `failed_reason_unknown` | a fixed sentence per status and cause | 300 |
| `POST /api/ai/month-story` | this month's paid row, the previous paid row, this month's memory text (optional) | `{text}`: two sentences, units and NAV against the previous paid month, the memory woven in if present, no forecast | "This month ₹{amount} bought {units} units at a NAV of ₹{nav}." | 200 |
| `POST /api/ai/promise` | transcript or typed text | `{goal, for_whom, horizon, one_line}`; `one_line` mostly reuses the investor's own words and adds no number they didn't say | the first sentence of the transcript | 200 |
| `POST /api/ai/reason` | the investor's reason for stopping or for a change, free text | `{category, distress}`. `category` is one of: `cash_shortage`, `income_stopped`, `bank_changed`, `goal_changed_or_reached`, `fund_doubt`, `emergency`, `other`; `distress` is a boolean | show all options; `distress: false` | 100 |
| `POST /api/ai/return-date` | free text or a milestone choice + the demo "today" + any stored birthday or anniversary | `{date (YYYY-MM-DD), label, needs_confirmation}` | date picker | 120 |
| `POST /api/ai/ask` | question + a structured summary of the locker + `rules.json` excerpts | `{answer, sources[], declined (bool), decline_reason}` | "I can't answer that from your locker." + the relevant help link | 400 |
| `POST /api/ai/year-story` | all slips and memories | `{lines[]}`: one line per month that has a slip or memory; plus `share_lines[]` with no amounts, units or fund name | one factual line per month from the slips | 700 |
| `POST /api/transcribe` | audio (opt-in) | `{text, language}` | (none: the investor types) | |

**Fix steps (deterministic, not AI):** the code maps `cause` to a fix topic, and the topic to the matching `rules.json` excerpts shown under the slip:
- `paid` → none;
- `balance_insufficient` → `pay_now`;
- `autopay_mandate_issue` and `first_instalment_or_setup` → `autopay_approve_or_reset`;
- `bank_account_issue` → `change_bank_autopay`;
- `kyc_issue` → `kyc_update`;
- `auto_cancelled` → `restart_new_sip`;
- `debited_no_units` and `refund_pending` → `refund_timeline`;
- `app_or_platform_issue`, `fund_house_rejected`, `unwanted_debit` and `failed_reason_unknown` → contact support.

**Options logic after `reason` (deterministic, not AI):**
- `cash_shortage`, `income_stopped`, `emergency`: pause until a date (if allowed), lower the amount, skip the next instalment, cancel.
- `bank_changed`: move the AutoPay steps, cancel.
- `goal_changed_or_reached`: record a new promise, lower the amount, cancel.
- `fund_doubt`: the facts (units stay; cancelling and restarting means a new SIP), cancel. Never a fund suggestion.
- `distress: true`: the same options in plain text, with nothing else on the screen.

Each option shows its consequence in one line: units, next debit, and the three-miss count.

**Return-date logic (deterministic):** if the date is no more than 3 months after the next instalment and at least 15 days away from it, offer "Pause until {date}. It resumes automatically, subject to the fund house accepting the request." Otherwise offer "Cancel now. Your plan will be ready for you on {date}." Milestone chips: My birthday, Our anniversary, New financial year (1 April), My next salary revision month, Pick a date. For a birthday or anniversary, ask the day and month once and store only those.

### `rules.json` (AG builds it; Claude reviews)
Short verbatim excerpts with their source URL, from the Groww help corpus `private/groww_help.jsonl` (203 public help pages collected on 25 Oct 2026; each line has `title`, `text` and `url`) and the public rules cited in `docs/mvp_final_list_v3.md` and `docs/mvp_formal_ideas_v1.md`: skipping (one instalment at a time; skips count toward three in a row), cancelling (cannot be undone; the lock before the due date; 2 working days), Pay Now (balance failures, within 2 working days), changing bank and AutoPay (steps, approval time), failed-order refunds (7 working days), withdrawals (timing, exit load, ELSS lock-in), the SEBI three-miss rule, the fund-house pause terms. Each excerpt gets an id and one `topic` from: `skip_rules`, `cancel_rules`, `cancel_timing`, `pause_terms`, `pay_now`, `change_bank_autopay`, `autopay_approve_or_reset`, `kyc_update`, `refund_timeline`, `withdrawal_timing`, `exit_load`, `elss_lockin`, `three_miss_rule`, `restart_new_sip`. The slip's fix steps and Ask's `sources` refer to these ids. Copy text exactly; don't paraphrase it into a rule.

---

## 9. Golden sets, the eval and the eval gate

**Claude writes the golden sets; AG must not edit them.** The synthetic sets are in `eval/golden/` (committed). The real-text set, which holds real investor descriptions, is `private/golden/slip_real.json` (gitignored); the eval reads it by path and never copies its text anywhere.

| File | Items | What is scored | Threshold to deploy |
|---|---|---|---|
| `slip_real.json` | real descriptions of failed or problem instalments from the 135 coded stories, with the accepted causes | cause accuracy | ≥ 80% |
| `slip_seed.json` | the demo seed's months | cause exact; gate pass | 100% |
| `ask.json` | questions on the demo locker: facts with expected values, rules questions with an expected source topic and key fact, and questions that must be declined | factual correctness; declines on must-decline items; wrong declines on answerable items | facts ≥ 85%; must-decline 100%; wrong declines ≤ 10% |
| `reason.json` | stop or change reasons | category accuracy; distress recall | ≥ 85%; distress 100% |
| `return_date.json` | return-date phrases with today = 2026-11-05 | exact date (or `needs_confirmation` where expected) | ≥ 90% |
| `promise.json` | day-1 transcripts | goal and horizon correct; no added numbers | ≥ 85%; added numbers 0 |
| month story and year story | the demo seed | gate pass rate; numbers shown always match (guaranteed by the gate) | gate pass ≥ 90% |

- **Runner:** `npm run eval`. It starts the app locally (`next build && next start`) with `MVP_LIVE_ENABLED=true` and calls the real routes (so it tests the gate too). It needs `ALLOW_PAID=1`, writes `eval/results.json` (ids, pass or fail, metric values, prompt sha256s, model, date, token totals; no input text) and prints a table. Run it three times and report all three.
- **Money:** the eval runs cost a few cents. Each paid run appends one line to `private/spend_log.jsonl`: date, run id, model, input and output tokens, and cost computed from Anthropic's published Haiku 5.5 prices (state the prices used). Report the totals; Claude records them in the research project's ledger. The workspace limit (US$4) is the hard cap.
- **Eval gate on build:** `scripts/check-eval.mjs` runs before `next build`, locally and on Vercel. It fails the build if `results.json` is missing, if any threshold is unmet, or if any prompt's sha256 differs from the one in `results.json`. So changing a prompt forces a new eval before it can deploy.
- **`/how-it-works` page:** where the AI earns its place, and what a version without AI would miss. Content (formal, plain):
  - **A failed month:** without AI, a status code and "check with your bank"; with it, the cause and whose fix it is.
  - **A reason to stop:** without AI, a reason picker; with it, the investor's own words (including Hinglish) read for the fitting path, with a plain tone in distress.
  - **A return date:** without AI, a date picker; with it, "after my sister's wedding" or "my birthday" turned into a date, confirmed when vague.
  - **A question:** without AI, help articles; with it, answers from the investor's own months and units, declining advice.
  - **A memory:** without AI, a photo album; with it, what that month meant for their money.
  - Then: what the assistant will never do (advise, predict, act on the account), and how the check and the fallback work.
- **`/quality` page:** what is checked and why; the thresholds; the latest results per set (pass rates, run date, model); how the gate works; what "Checked" and "Standard text" mean. Show at most 5 example items, synthetic only (never the real-text set).

---

## 10. Privacy and consent

**Consent screen** (before sign-in mode stores anything). Plain, formal text:
- what is stored (memories, voice notes, your promise, return dates);
- where (a cloud server in Mumbai, India);
- why (to keep your locker across devices);
- that it is used for nothing else;
- that voice transcription is optional and sent to Groq for transcription only;
- that AI text is generated by Anthropic from text only, never from photos or audio;
- how to export or delete everything;
- that this is a study prototype and data is deleted after the study;
- a checkbox: "I will only add photos of people who agree, or of children in my care."

**Settings:**
- "Download my locker": a zip with a JSON of all rows, the photos and voice notes, and a printable HTML;
- "Delete everything": removes rows and files, then signs out.

**Logs:** no memory text, transcripts, questions or answers; the gate log only.

**Privacy check:** write `scripts/check-privacy.mjs` (`npm run check:privacy`). It scans every git-tracked file and the `.next` build output, case-insensitively, for each line of `private/private_terms.txt`, and also for key-like strings (`sk-ant-`, `gsk_`, JWT-shaped strings, `service_role`). It prints only file paths and line numbers, never the matched term. It must pass before any push.

---

## 11. Deployment (the project owner's steps are marked S)

1. **S:** create the Supabase project (region Mumbai), and put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (never in chat or git).
2. **S:** create the Anthropic workspace "sip-locker" with a US$4 monthly limit and a key; get a Groq API key. Both go into `.env.local` and later into Vercel.
3. **AG:** SQL migration in `supabase/migrations/` (tables, row-level security, a private bucket and its policies); apply it with the Supabase CLI or the SQL editor (give S the exact steps).
4. **S:** create a private GitHub repo with a neutral name (for example `sip-locker`) under the neutral account. **AG** pushes this project (neutral identity, no personal name in any file or commit) only after the eval gate, `npm run check:privacy` and the tests all pass.
5. **S:** import the repo into Vercel as a new project with a neutral name; add the env vars plus `MVP_LIVE_ENABLED=true`. The URL must contain no personal name.
6. **AG:** report the URL; Claude reviews it live.

---

## 12. Tests

- **Unit (vitest):**
  - the gate: numbers, banned phrases, personal data, grounding (with seeded bad outputs, each of which must fail);
  - options logic;
  - return-date logic (the pause window edges);
  - the seed's computed figures equal 2000/NAV rounded.
- **End to end (Playwright, 390×844 and 1280×800):**
  - demo mode loads 11 slips: 2 failed slots with a reason and fix, 1 hard month with its note;
  - add a text memory (demo);
  - record a promise by typing;
  - stop flow: the promise appears (opt-in seed), cancel is equal in prominence, return date via the birthday chip;
  - the locker shows the return card;
  - Ask answers "Which months did not go through?" and declines "Which fund should I switch to?";
  - the certificate print page has the keepsake line and no ₹ value or return;
  - first-year story lines render;
  - with `MVP_LIVE_ENABLED` unset, every AI text shows "Standard text";
  - each "Try a task" item opens the right screen;
  - the "Not investment advice" notice is visible on Ask and on the break flow;
  - no Groww logo or wordmark appears in any page or asset (check the asset list).
- **Accessibility:** contrast AA, keyboard reachable, visible focus, labels on the record and play buttons.

---

## 13. Report back (W7 shape)

- **Files:** created or changed, each with its sha256.
- **Screenshots:** every screen at 390×844, light theme.
- **Eval results:** a table for each of the three runs, per golden set, against the thresholds, with the prompt sha256s.
- **Tests:** unit and end-to-end results; the `npm run check:privacy` result.
- **Spend:** Anthropic (totals from `private/spend_log.jsonl`) and Groq usage.
- **Deployment:** the URL (once deployed); the Supabase region shown in its dashboard; the env vars set (names only).
- **Deviations:** every place where you departed from this spec, and why.

**Money:** paid calls only with `ALLOW_PAID=1`; the MVP workspace is capped at US$4. Never print or open `.env*`.
