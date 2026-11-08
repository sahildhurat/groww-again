# SPEC-07: SIP Passbook (replaces SPEC-06 "The SIP locker")

Version 1.0, 7 Nov 2026, 01:10 IST. Written by Claude; approved scope from the owner (7 Nov, 00:45 IST). **AG builds; Claude reviews every file and runs the app.** Where this spec and SPEC-06 differ, this spec wins. `AGENTS.md` (W1–W8) still applies.

## 1. What it is
A read-only concept prototype for Groww's growth team. One screen per SIP that works like a bank passbook: every instalment is shown step by step (bank debit → order placed → units allotted), each step with its source and an "as of" time. One eval-gated AI, **Sensecheck**, explains any line from verified facts and approved Groww help passages. An optional personal layer (Future Thread, Life Markers) is an **experiment**, switchable for user tests. Nothing is bought, changed, paused or cancelled in this app.

## 2. Rules (non-negotiable)
1. **No investment advice:** no fund or stock suggestions, no predictions, no "you should continue / stop / switch". Advice questions get the fixed decline already in `app/api/ai/ask/route.ts` (`DECLINE_TEXT`).
2. **No fear, FOMO, urgency, guilt, streaks, countdowns, rewards.** Leaving is never made harder. Every option has equal visual weight.
3. **Formal tone**, plain English. Copy states facts; failures are calm.
4. **Data truth:** units appear only when the allotment event is confirmed. A step that has not happened is never shown as done. Missing data says "not confirmed yet" or "can't confirm right now", with the "as of" time. Never invent a processing time, reason or status.
5. **Not an official record:** the passbook is labelled a supplementary view; the CAS is the official record.
6. **Notices on every page** (footer): "Concept prototype, not affiliated with Groww. All data is synthetic demo data." On every page with AI text or options: "Not investment advice."
7. **Look:** close to Groww's clean style (white, green accent, rounded cards) **without any Groww logo, wordmark or trademark asset**. Status is shown with text and shape, never colour alone.
8. **Privacy:** no real account data; identifiers masked before any AI call (`sanitizeInputText`); photos and audio never go to any AI route; no test-only switches in production code (no hidden "force mode"); no personal names anywhere.
9. **Honesty:** never claim a test, eval or result you did not run. Paste real command output.

## 3. Files AG must NOT edit (Claude owns them)
`lib/anthropic.ts`, `lib/gate.ts`, `scripts/run-eval.ts`, `scripts/check-eval.mjs`, `scripts/build-rules.mjs`, `scripts/ai-check.mjs`, `scripts/cloud-check.ts`, `data/rules.json`, `config/pricing.json`, everything in `eval/` and `private/`, `tests/unit/rules-source.test.ts`, `tests/unit/r35-fixes.test.ts`, and the `package.json` scripts `build`, `build:nogate`, `eval`, `rules`, `ai:check`, `cloud:check`. AG may import from these files and may add dependencies. **Do not run `npm run eval`.** Build with `npm run build:nogate`. Claude writes the new golden sets and updates the eval runner after this build.

If a protected file blocks the work, stop and write the question under "Open questions" in `reports/RUN_REPORT.md`.

## 4. Data model

### 4.1 Types (`lib/passbook-types.ts`)
```ts
type SipStatus = "active" | "paused" | "stopped";
type EventType = "debit" | "order" | "allotment" | "refund";
type EventStatus = "confirmed" | "pending" | "failed" | "unknown";
type Source = "bank" | "order_route" | "registrar";
interface PassbookEvent {
  id: string;               // e.g. "ev-2026-11-05-debit"
  instalment_id: string;
  type: EventType;
  status: EventStatus;
  source: Source;
  source_label: string;     // "Your bank", "Order route (illustrative)", "Registrar (illustrative)"
  source_event_id: string;  // synthetic reference, e.g. "BNK-DEMO-0511"
  effective_at: string | null; // ISO with +05:30; null if it has not happened
  as_of: string;            // ISO with +05:30; when the app last heard from the source
  reason_code?: string;     // failure / refund codes, see §4.3
}
interface Instalment {
  id: string; due_date: string; amount: number; // ₹
  nav: number | null;      // only when allotment confirmed
  units: number | null;    // computed = round(amount / nav, 3); only when allotment confirmed
  skipped?: boolean;
  events: PassbookEvent[];
}
interface PassbookSip {
  id: string; name: string; fund_label: string; amount: number; day_of_month: number;
  start_date: string; status: SipStatus; status_changed_at: string | null;
  latest_nav: number; latest_nav_date: string;  // for the explainer's value calculation only
}
```

### 4.2 Derivations (`lib/passbook.ts`, pure functions, unit-tested)
- `instalmentState(i)`: `"allotted"` (allotment confirmed) · `"in_progress"` (debit confirmed, allotment pending) · `"failed"` (debit failed) · `"refunded"` (debit confirmed, order failed, refund confirmed or pending) · `"skipped"` · `"unknown"` (any needed event unknown).
- `lastFullyConfirmed(instalments)`: the latest instalment whose allotment is confirmed.
- `latestInstalment(instalments)`: the latest by due date (any state).
- `confirmedTotals(instalments)`: `{ units, amount_put_in, count }` over allotted instalments only (units summed to 3 decimals).
- `valueAt(totals, nav)`: units × nav, rounded to the rupee (used only inside the explainer, labelled with the NAV date and "can go up or down").
- `units = Math.round(amount / nav * 1000) / 1000` (same as `lib/seed.ts`).

### 4.3 Failure and refund codes (`lib/failure-codes.ts`)
A fixed map from code to approved text. **Every sentence must be supported by an entry in `data/rules.json`, and each code lists the `rule_ids` it relies on.** Use only these codes:

| Code | Meaning shown | What happened to the money | Official routes (rule ids) |
|---|---|---|---|
| `INSUFFICIENT_BALANCE` | Your bank returned the debit for insufficient balance | Nothing was taken | Pay Now for a missed instalment (`rule-pay-now-01`); 3 misses in a row cancel a SIP (`rule-three-miss-01`) |
| `MANDATE_NOT_APPROVED` | The AutoPay mandate was not approved or not active | Nothing was taken | Approve or reset AutoPay (`rule-autopay-reset-01`); change bank or AutoPay (`rule-change-bank-01`) |
| `ORDER_NOT_ACCEPTED` | The bank debit went through, but the order was not accepted | The amount is refunded to your bank account | Refund timeline (`rule-refund-01`) |
| `STATUS_UNAVAILABLE` | We can't confirm the latest status right now | Not known yet | Check the official statement (CAS) or contact support |

If a needed fact (for example, when units are usually allotted) is not in `rules.json`, do not write it: list it under "Open questions" and Claude will add a verbatim passage.

### 4.4 Demo seed (`data/passbook-seed.json`; do not change `data/demo-seed.json`)
Demo clock: **6 Nov 2026, 10:30 IST**. SIP: "My first bike", "Nifty 50 Index Fund (demo)", ₹2,000 on the 5th, started 2025-12-05, `latest_nav` 98.00 on 2026-11-04.

| Due date | NAV | Units | State | Events (effective / reason) |
|---|---|---|---|---|
| 2025-12-05 | 100.00 | 20.000 | allotted | debit 12-05 · order 12-05 · allotment 12-06 |
| 2026-01-05 | 102.40 | 19.531 | allotted | same pattern (next working day for allotment) |
| 2026-02-05 | 98.10 | 20.387 | allotted | |
| 2026-03-05 | 95.30 | 20.986 | allotted | |
| 2026-04-05 | 99.80 | 20.040 | allotted | |
| 2026-05-05 | – | – | failed | debit failed 05-05, `INSUFFICIENT_BALANCE`; no order, no allotment |
| 2026-06-05 | 104.20 | 19.194 | allotted | |
| 2026-07-05 | – | – | skipped | no events (skipped by the investor) |
| 2026-08-05 | 101.70 | 19.666 | allotted | |
| 2026-09-05 | – | – | refunded | debit confirmed 09-05 · order failed 09-05 `ORDER_NOT_ACCEPTED` · refund confirmed 09-12 |
| 2026-10-05 | 106.90 | 18.709 | allotted | |
| 2026-11-05 | – | – | in_progress | debit confirmed 11-05 09:12 · order confirmed 11-05 11:40 · allotment **pending**, as_of 2026-11-06T10:00 |

Totals the code must produce: units **158.513**, put in **₹16,000**, 8 allotted; last fully confirmed **5 Oct 2026**; value at NAV 98.00 = **₹15,534**.

**Scenarios** (selected in `/demo-tools`, default `running`):
- `running`: the table above; SIP status active.
- `stopped`: the same history through 2026-10-05, no November instalment, SIP status `stopped`, `status_changed_at` 2026-10-20.
- `stale`: as `running`, but the November allotment event is `unknown` with `as_of` 2026-11-05T11:40 and code `STATUS_UNAVAILABLE`.

## 5. Screens

| Route | What it shows | Version |
|---|---|---|
| `/` | Two lines on what this is; "Open my passbook"; a **Try a task** panel with the three test tasks (§8) each linking to the right screen; notices | A, B |
| `/passbook` | **Cover (A2):** SIP name (and the investor's passbook name in B), SIP status, **"Last fully confirmed instalment: 5 Oct 2026"**, the latest instalment and its state, units allotted so far, amount put in (confirmed only). No current value on the cover. A calm line when the latest instalment failed, was refunded or is unknown. **Entries (A1):** one row per instalment, newest first, with three stamps (Debited / Order placed / Units allotted) whose text says the state ("✓ Debited", "○ Units not confirmed yet", "✗ Not debited", "↺ Refunded"); a source line ("Confirmed by your bank · 5 Nov, 09:12"). **CAS line (A3):** "Your official record is your Consolidated Account Statement (CAS), from MF Central, CAMS or KFintech. This passbook is a supplementary view." **Stopped (C3):** a "Stopped on 20 Oct 2026" stamp; all entries stay; a note: "Stopping ends future instalments. It does not sell your units: your 158.513 units stay in your folio. To invest again you start a new SIP." No restart button, no nudge. | A, B |
| `/passbook/[id]` | Entry detail: each event with source, reference, effective time and "as of"; inline source labels (E3: "Confirmed by your bank", "Confirmed by the registrar"); **"What does this mean?"** opens the explainer for this entry with 3 suggested questions; failed / refunded / unknown entries show the **B5 block** from `lib/failure-codes.ts` (why, what happened to the money, official routes with their help-page titles) | A, B |
| `/ask` | The Sensecheck question box with suggested questions ("Why are my units not visible yet?", "What happens if I skip next month?", "Can I restart after stopping?", "Why is my value lower than what I put in?") and an optional "about this entry" picker | A, B |
| `/options` | **Your options (C2):** cards of equal size and weight, in this order: Keep as is · Change the AutoPay bank · Change amount or date · Skip one instalment · Pause (where the fund house allows) · Stop · Restart later. Each card: what it does, what happens to the next payment and to the units, and the help passage it comes from (`rule-*` title). A button "Manage SIP in the Groww app" that opens a note: "In the real app this opens Manage SIP. Nothing is changed in this prototype." No AI on this page; no "recommended" label; no ordering by the investor's situation | A, B |
| `/thread` | **Future Thread (C1 + D2):** optional. "What made you start? (in your own words)", text plus optional voice (reuse the built recorder and opt-in transcription); the AI tidies it into one line (`/api/ai/promise`), the investor approves or edits; a field "This passbook is for: ___" shown on the cover. Editable, deletable. Never shown on failure screens, on `/options`, or in any answer about stopping | **B only** |
| `/markers` | **Life Markers:** a chronological list grouped by year and month, a year/month filter, and "Add a Life Marker": choose any month (with or without an instalment), then a photo, a short voice note (≤ 60 s) or text, with an optional caption. Open the original photo or play the recording. Edit and delete each marker. No AI, no prompts, no reminders, no counts or streaks. A marker on an entry's month shows a small "Life Marker" link on that entry (B only), visually distinct from the stamps | **B only** |
| `/quality` | Reads `eval/results.json`: date, model, golden-set scope, pass / fail **by category** (from `metrics_by_category` when present), critical failures (must be 0), 3 sample items, what happens on a fallback. If `live` is not true: "No live evaluation recorded yet." Never hard-code results | A, B |
| `/settings`, `/consent`, `/signin`, `/api/account/delete` | Keep the R36 versions; export also includes Life Markers and their files, Future Thread, and the printable page ("Personal record. Not an official statement. Your official record is your CAS."; entries with stamps, dates and units; no value, no returns) | A, B (Thread and Markers only in B) |
| `/demo-tools` | **Version A / B switch** (A = ledger only; B = + Future Thread, Life Markers, passbook name), **scenario switch** (running / stopped / stale), "Reset demo". Stored in sessionStorage; shown in a small banner on every page ("Version B · Scenario: running") | A, B |

**Remove:** `/locker`, `/break`, `/certificate`, `/year-one`, `/how-it-works`, `/promise` (moved to `/thread`) and their components; the routes `/api/ai/month-story`, `/api/ai/return-date`, `/api/ai/year-story`, `/api/ai/reason`, `/api/ai/slip`; the prompts `month-story.md`, `return-date.md`, `year-story.md`, `reason.md`, `slip.md`, `ask.md` (replaced by `sensecheck.md`). Bottom navigation: Passbook · Ask · Options · Markers (B only).

## 6. The AI

### 6.1 `POST /api/ai/sensecheck`
- **Request:** `{ question: string (1–500 chars), entry_id?: string, scenario: "running" | "stopped" | "stale" }`. The server loads `data/passbook-seed.json` for the scenario itself; it never trusts facts sent by the client.
- **Context the server builds:** the SIP, the selected entry's events (or all entries if none), the derived states and totals from `lib/passbook.ts`, the value calculation (units, NAV, NAV date, value) when the question is about value, and the relevant `rules.json` passages (by topic). Mask the question with `sanitizeInputText`.
- **Prompt:** `prompts/sensecheck.md` (AG writes it): classify the intent (`payment_status`, `allotment`, `valuation`, `options`, `affordability`, `advice_request`, `other`), then answer in ≤ 120 words using only the given facts and passages; state what is not known yet with the "as of" time; never give a processing time not in a passage; never recommend an option; for `affordability`, list the neutral options and link `/options`; return JSON `{ intent, answer, facts_used: string[] (event ids or "computed:units|put_in|value"), sources: string[] (rule ids), as_of: string | null, declined: boolean }`.
- **After the model:** if `declined` is true, replace the answer with `DECLINE_TEXT` (import it; do not copy the wording). Run `verifyGate` with `allowedNumbers` = numbers in the context JSON + the masked question; `textToCheck` = the answer. **Response:** the parsed object + `gate_status` ("checked" | "standard") + `gate_code`.
- **Fallback (gate fails, timeout, kill switch):** a deterministic answer built in code from the entry's state and `lib/failure-codes.ts` (or, with no entry, "I can explain your instalments, units and the rules for skipping, pausing and stopping. Here is your passbook." with links), `gate_status: "standard"`.

### 6.2 `POST /api/ai/promise` (Future Thread)
Keep the current route and prompt unchanged.

### 6.3 What the AI never sees
Photos, audio, Life Markers, Future Thread text (except in `/api/ai/promise`), the passbook name, sign-in data.

## 7. Storage
- Extend `lib/store.ts`: `listMarkers()`, `saveMarker({ month: "YYYY-MM", kind: "photo" | "voice" | "text", caption, storage_path })`, `updateMarker`, `deleteMarker`. Demo store: sessionStorage (media as data URLs ≤ 1.5 MB, as now). Cloud store: new table via `supabase/migrations/003_life_markers.sql` (id, user_id, sip_id, month, kind, caption, storage_path, created_at; row-level security `user_id = auth.uid()`); files in the existing private bucket under `<user_id>/markers/<uuid>.<ext>`; uploads only on Save; photos through `lib/image-compression.ts`; recordings keep their real type.
- Export and "Delete everything" include markers and their files. Keep consent-before-write.
- Future Thread keeps `savePromise`; the passbook name uses the SIP's `dedication` field.

## 8. Tests (all must pass; paste the last lines of each output)
- **Unit (Vitest):** every derivation in §4.2 against the seed totals (158.513 units, ₹16,000, 8 allotted, last fully confirmed 2026-10-05, value ₹15,534 at 98.00); each scenario's states; every `rule_ids` entry in `lib/failure-codes.ts` exists in `data/rules.json`; marker store functions (demo and a fake cloud client); the sensecheck route's fallback builder (no network).
- **End-to-end (Playwright, 390×844 and 1280×800), against real pages with no test-only code paths:**
  1. Task 1: the 5 Nov entry shows Debited and Order placed confirmed and units "not confirmed yet" with the "as of" time; "What does this mean?" returns text (fallback mode is fine without a key) that says units are not confirmed.
  2. Task 2: the May entry shows "Not debited" with the insufficient-balance reason, "Nothing was taken", and the Pay Now help title; the September entry shows "Refunded".
  3. Task 3: `/options` shows all seven cards with equal size, no "recommended" text, and the Manage SIP note.
  4. Cover: "Last fully confirmed instalment: 5 Oct 2026", 158.513 units, ₹16,000, no current value on the cover.
  5. Stopped scenario: "Stopped on 20 Oct 2026" stamp, all entries visible, the stop ≠ sell note, no restart button.
  6. Stale scenario: "can't confirm the latest status right now" with the as-of time.
  7. A/B: version A hides Thread, Markers and the passbook name; version B shows them.
  8. Life Markers: add a photo to a month without an instalment (reuse `tests/fixtures/photo-with-gps.jpg`; the stored image must be ≤ 1600 px and carry no EXIF, as in `photo-compression.spec.ts`), add a voice note (reuse the fake microphone in `voice-notes.spec.ts`), add a text marker, filter by year and month, play / open, edit, delete.
  9. Notices on every page; "Not investment advice" on `/ask`, entry detail and `/options`; no Groww logo or wordmark asset.
- `npm run check:privacy` passes; `npm run build:nogate` passes; `tsc` is clean.

## 9. Report
`reports/RUN_REPORT.md` in the W7 shape: files added, changed and deleted with sha-256; the real last lines of `npx vitest run`, `npx playwright test`, `npm run check:privacy`, `npm run build:nogate`; screenshots of `/passbook` (running, stopped), the 5 Nov entry with an explainer answer, the May entry, `/options`, `/thread`, `/markers` at 390×844 in `reports/screenshots/`; open questions (including any help facts you needed but could not find in `rules.json`). No eval claims, no spend claims beyond "no paid calls made".
