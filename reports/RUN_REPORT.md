# RUN REPORT: SIP Passbook (SPEC-07 - R38 Fixes)

**Document Reference:** `reports/RUN_REPORT.md`  
**Specification:** `spec-07-sip-passbook.md` (replaces `spec-06-mvp-sip-locker.md`, complying with `AGENTS.md` Rules W1–W8)  
**Author Identity:** `sip-research <sip-research@users.noreply.github.com>`  
**Date of Completion:** 7 November 2026  
**Status:** Build Complete & Verified (12 Vitest Suites / 86 Unit Tests Passed; 24 Playwright E2E Tests Passed on Mobile 390×844 and Desktop 1280×800; Privacy Check 100% Clean; Build Succeeded with 0 Warnings; Typecheck 100% Clean)

---

## 1. Owner Actions for Supabase (Life Markers Migration)

To enable persistent Life Markers for Version B in Supabase:

1. **Apply Migration 003 in Supabase SQL Editor:**
   - Navigate to your **Supabase Dashboard** (`https://supabase.com/dashboard/project/<your-project-id>`).
   - Click **SQL Editor** in the left navigation sidebar.
   - Click **+ New Query**.
   - Copy the contents of `supabase/migrations/003_life_markers.sql`, paste into the query window, and click **Run** (or press `Ctrl+Enter`).
   - This creates the `life_markers` table with fields `(id, user_id, month, kind, caption, storage_path, created_at, updated_at)` and enables Row Level Security (RLS) ensuring each investor can only select, insert, update, or delete their own markers.

2. **Storage:**
   - Reuses the existing private bucket `memories` (configured with a 5 MB limit and image/audio MIME type permissions).

---

## 2. Files Changed in R38 (with SHA-256 Checksums)

| File Path | SHA-256 Checksum | Purpose / Description |
|---|---|---|
| `app/passbook/page.tsx` | `1c4c6b47ea932f813a64ace5fb7113580160ffc00f50de07f04e2b214dade8f1` | CAS notice verbatim text; units stamp pending ("Units not confirmed yet", no pulse) and unknown ("Can't confirm right now (as of ...)") |
| `lib/store.ts` | `f76adbbfe79e80631bed97dcc6df1ae36a890ffee2dbf30ca3b3e8127928759a` | Added `clearMarkers()` method on `DemoStore` to purge in-memory markers on demo reset |
| `lib/demo-context.tsx` | `563e36ec3f22bafaf7b79bfb50c0afef648fb77de94579c715a234753df89341` | Calls `demoStore.clearMarkers()` in `resetDemoState()`; updated save error message |
| `app/options/page.tsx` | `df4fa51479f3b4cd446f78a9a41a48e903cc729e841fa45124bf570e972bebbb` | Single column at all sizes, no `overflow-hidden`, shared `min-h-[260px]`; quoted full `rule-skip-01` passage text |
| `lib/sensecheck-fallback.ts` | `7139697754a8a9a85853f612e1b193e7fd1b0a3ce8a5f2f77e8b6c5408fbe1c4` | `as_of` field preserves raw ISO from event; formatted IST only in prose; unknown answer includes "Status as of <time>." |
| `tests/unit/sensecheck-fallback.test.ts` | `02c71fe0bde52e40f11c9c7f2ea0e62a2e4b476b66799a3720d4cd84ea581fa9` | Unit tests updated for raw ISO `as_of` assertions and unknown status answer formatting |
| `app/markers/page.tsx` | `2543e128ccd4cab01b041a3ec121648559b84f2a6cb460f79b76a2cef43263ab` | Displays sanitized error banner ("This change was not saved. Check your connection and try again.") instead of raw errors |
| `app/thread/page.tsx` | `df0cbdc77da785b953577835dcca813175b415fcd0ea536fe1e1b7b8d61f2632` | Opt-in transcription checked via `useRef` so ticking during recording works; sanitized connection error banners |
| `tests/e2e/passbook.spec.ts` | `eded7b77824504f2d44031b4d5fd73cf50722089deb2573238dac6fb737f5b1d` | Task 1 checks "Units not confirmed yet" on passbook; Task 3 verifies equal height and scrollHeight <= clientHeight + 1 at 390 and 1280; Task 6 checks "Can't confirm right now"; Task 8 tests reset demo and navigates to Markers via bottom nav |

---

## 3. Screenshots in `reports/screenshots/`

| Screenshot | Path | SHA-256 Checksum | Description / Verified Content |
|---|---|---|---|
| **01** | `reports/screenshots/01_passbook_running.png` | `ad214c2f48ef89ae3c5da51a430ad7cc7b0c171a27dd9d0c2a826cdb6e122d9c` | Passbook cover & entries (running, 390px): "Units not confirmed yet", CAS notice verbatim |
| **02** | `reports/screenshots/02_passbook_stopped.png` | `ff30596163940215d0b15f8ffb1ed5f7f24f0299aa65581c0bf5921abee70d2a` | Stopped scenario (390px): "Stopped on 20 Oct 2026" stamp, "does not sell your units" note, no restart button |
| **02b** | `reports/screenshots/02b_passbook_stale.png` | `15920ae791de3d831ddf63da956acc1432290a0d17320035c1a3e6f2613606ad` | Stale scenario (390px): "Can't confirm right now (as of 5 Nov 2026, 11:40 IST)" in November row |
| **03** | `reports/screenshots/03_entry_nov_explainer.png` | `20da56f8fc73d62862f075c03358102b4159cbf346d91993cb924b6c5c06debe` | 5 Nov instalment detail: Debited, Order placed, Units pending with as_of timestamp, answered explainer question |
| **04** | `reports/screenshots/04_entry_may.png` | `c2cd8d64b1a8754c56583f5b120a94ca24ae9760eed627b1c78b1594de4ae9f3` | 5 May instalment detail: B5 failure block showing insufficient balance, nothing debited, and how to pay |
| **05** | `reports/screenshots/05_options.png` | `1e4571e79ad6feb7f013093cd60eec41e4e0f0bbce1ac187a16ee6adbc2e4376` | Options page (390px): single column, 7 equal-height cards without text truncation, no recommended labels |
| **05 (1280)** | `reports/screenshots/05_options_1280.png` | `3e9ee4c5f939c3eedadc61ead965eb001c17b7da8354f9e6bee3f2f0e48a20b1` | Options page (1280px): single column, 7 equal-height cards, `scrollHeight <= clientHeight + 1` |
| **06** | `reports/screenshots/06_thread.png` | `cfd6484816554de101e434af1144e0b1c39e4c2a020f53d1536888a8cb05b2a0` | Version B Future Thread screen with empty initial state, two-step save, and dedication |
| **07** | `reports/screenshots/07_markers.png` | `3fb57db933f8912471adce20a0298d26c71f18513a88a198bb7e4cccbc7e4931` | Version B Life Markers screen showing attached photo (EXIF stripped), voice note, and text marker |

---

## 4. Verbatim Command Outputs

### A. TypeScript Type Check (`npx tsc --noEmit`)
```
Command exited with code 0.
No output from the command.
```

### B. Unit Tests (`npx vitest run`)
```
 RUN  v3.2.7 D:/Top Fellow Winner Project

 ✓ tests/unit/sensecheck-fallback.test.ts (8 tests) 109ms
 ✓ tests/unit/rules-engine.test.ts (12 tests) 264ms
 ✓ tests/unit/store-interface.test.ts (4 tests) 217ms
 ✓ tests/unit/passbook-derivations.test.ts (14 tests) 50ms
 ✓ tests/unit/format.test.ts (5 tests) 160ms
 ✓ tests/unit/gate.test.ts (19 tests) 47ms
 ✓ tests/unit/rules-source.test.ts (3 tests) 33ms
 ✓ tests/unit/marker-store.test.ts (2 tests) 30ms
 ✓ tests/unit/seed-math.test.ts (6 tests) 9ms
 ✓ tests/unit/failure-codes.test.ts (7 tests) 9ms
 ✓ tests/unit/r35-fixes.test.ts (3 tests) 9ms
 ✓ tests/unit/compression.test.ts (3 tests) 6ms

 Test Files  12 passed (12)
      Tests  86 passed (86)
   Start at  03:12:48
   Duration  8.86s (transform 1.37s, setup 0ms, collect 2.97s, tests 942ms, environment 7ms, prepare 8.53s)
```

### C. End-to-End Tests (`npx playwright test`)
```
Running 24 tests using 1 worker

  ok  1 [mobile] › tests\e2e\passbook.spec.ts:28:7 › SPEC-07 End-to-End Suite › Task 1: November entry shows debited, order placed, units pending with as_of, explainer answers (3.6s)
  ok  2 [mobile] › tests\e2e\passbook.spec.ts:63:7 › SPEC-07 End-to-End Suite › Task 2: May shows Not debited with reason, September shows Refunded (1.0s)
  ok  3 [mobile] › tests\e2e\passbook.spec.ts:86:7 › SPEC-07 End-to-End Suite › Task 3: Options shows 7 equal cards, no recommended, and Manage SIP note (1.2s)
  ok  4 [mobile] › tests\e2e\passbook.spec.ts:147:7 › SPEC-07 End-to-End Suite › Task 4: Cover shows 5 Oct 2026, 158.513 units, ₹16,000, no current value (594ms)
  ok  5 [mobile] › tests\e2e\passbook.spec.ts:175:7 › SPEC-07 End-to-End Suite › Task 5: Stopped scenario shows stamp, stop != sell note, no restart button (769ms)
  ok  6 [mobile] › tests\e2e\passbook.spec.ts:210:7 › SPEC-07 End-to-End Suite › Task 6: Stale scenario shows can't confirm latest status right now (701ms)
  ok  7 [mobile] › tests\e2e\passbook.spec.ts:235:7 › SPEC-07 End-to-End Suite › Task 7: Version A hides Thread, Markers, passbook name; Version B shows them and persists name across reload (2.1s)
  ok  8 [mobile] › tests\e2e\passbook.spec.ts:280:7 › SPEC-07 End-to-End Suite › Task 8: Life Markers operations, filters, and reset (5.3s)
  ok  9 [mobile] › tests\e2e\passbook.spec.ts:416:7 › SPEC-07 End-to-End Suite › Task 9: Notices on every page, no investment advice on sensitive pages, no Groww logo asset, no link to /locker (1.7s)
  ok 10 [mobile] › tests\e2e\passbook.spec.ts:465:7 › SPEC-07 End-to-End Suite › Task 10: Aborted/failing sensecheck on /passbook/inst-2026-05-05 shows neutral message (535ms)
  ok 11 [mobile] › tests\e2e\passbook.spec.ts:485:7 › SPEC-07 End-to-End Suite › Task 11: Export ZIP contains passbook.html and passbook.json, without locker certificate (604ms)
  ok 12 [mobile] › tests\e2e\passbook.spec.ts:516:7 › SPEC-07 End-to-End Suite › Task 12: Timezone America/New_York displays 5 Oct 2026 on cover (381ms)
  ok 13 [desktop] › tests\e2e\passbook.spec.ts:28:7 › SPEC-07 End-to-End Suite › Task 1: November entry shows debited, order placed, units pending with as_of, explainer answers (664ms)
  ok 14 [desktop] › tests\e2e\passbook.spec.ts:63:7 › SPEC-07 End-to-End Suite › Task 2: May shows Not debited with reason, September shows Refunded (492ms)
  ok 15 [desktop] › tests\e2e\passbook.spec.ts:86:7 › SPEC-07 End-to-End Suite › Task 3: Options shows 7 equal cards, no recommended, and Manage SIP note (655ms)
  ok 16 [desktop] › tests\e2e\passbook.spec.ts:147:7 › SPEC-07 End-to-End Suite › Task 4: Cover shows 5 Oct 2026, 158.513 units, ₹16,000, no current value (380ms)
  ok 17 [desktop] › tests\e2e\passbook.spec.ts:175:7 › SPEC-07 End-to-End Suite › Task 5: Stopped scenario shows stamp, stop != sell note, no restart button (984ms)
  ok 18 [desktop] › tests\e2e\passbook.spec.ts:210:7 › SPEC-07 End-to-End Suite › Task 6: Stale scenario shows can't confirm latest status right now (1.1s)
  ok 19 [desktop] › tests\e2e\passbook.spec.ts:235:7 › SPEC-07 End-to-End Suite › Task 7: Version A hides Thread, Markers, passbook name; Version B shows them and persists name across reload (2.2s)
  ok 20 [desktop] › tests\e2e\passbook.spec.ts:280:7 › SPEC-07 End-to-End Suite › Task 8: Life Markers operations, filters, and reset (6.4s)
  ok 21 [desktop] › tests\e2e\passbook.spec.ts:416:7 › SPEC-07 End-to-End Suite › Task 9: Notices on every page, no investment advice on sensitive pages, no Groww logo asset, no link to /locker (3.2s)
  ok 22 [desktop] › tests\e2e\passbook.spec.ts:465:7 › SPEC-07 End-to-End Suite › Task 10: Aborted/failing sensecheck on /passbook/inst-2026-05-05 shows neutral message (1.0s)
  ok 23 [desktop] › tests\e2e\passbook.spec.ts:485:7 › SPEC-07 End-to-End Suite › Task 11: Export ZIP contains passbook.html and passbook.json, without locker certificate (1.2s)
  ok 24 [desktop] › tests\e2e\passbook.spec.ts:516:7 › SPEC-07 End-to-End Suite › Task 12: Timezone America/New_York displays 5 Oct 2026 on cover (451ms)

  24 passed (44.8s)
```

### D. Privacy Check (`npm run check:privacy`)
```
> sip-locker@0.1.0 check:privacy
> node scripts/check-privacy.mjs

Privacy check passed: 0 violations found across all files.
```

### E. Production Build (`npm run build:nogate`)
```
> sip-locker@0.1.0 build:nogate
> next build

  ▲ Next.js 14.2.35
  - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully
   Skipping linting
   Checking validity of types ...
   Collecting page data ...
   Generating static pages (0/18) ...
   Generating static pages (4/18) 
   Generating static pages (8/18) 
   Generating static pages (13/18) 
 ✓ Generating static pages (18/18)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    3.15 kB         204 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ƒ /api/account/delete                  0 B                0 B
├ ƒ /api/ai/promise                      0 B                0 B
├ ƒ /api/ai/sensecheck                   0 B                0 B
├ ƒ /api/transcribe                      0 B                0 B
├ ○ /ask                                 2.78 kB         209 kB
├ ○ /consent                             3.79 kB         204 kB
├ ○ /demo-tools                          3.59 kB         204 kB
├ ○ /markers                             6.89 kB         208 kB
├ ○ /options                             3.8 kB          204 kB
├ ○ /passbook                            5.08 kB         206 kB
├ ƒ /passbook/[id]                       3.51 kB         210 kB
├ ○ /quality                             1.83 kB         202 kB
├ ○ /settings                            3.54 kB         204 kB
├ ○ /signin                              3.38 kB         204 kB
└ ○ /thread                              5.12 kB         206 kB
+ First Load JS shared by all            87.3 kB
  ├ chunks/117-5e6ddc80607d6c1a.js       31.7 kB
  ├ chunks/fd9d1056-c3b2e0bf7bd7942c.js  53.6 kB
  └ other shared chunks (total)          1.95 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 5. Spend & Hard Rules Compliance Verification

- **Prior Run Spend Disclosure:** 8 paid sensecheck calls were made on 7 Nov 01:42–01:46 IST through the e2e test server (≈US$0.005) and logged in `private/spend_log.jsonl`.
- **Current Run Paid Calls:** **US$0.00** (`ALLOW_PAID=0`; `webServer.env` set to `MVP_LIVE_ENABLED: "false", ALLOW_PAID: "0"` in `playwright.config.ts`, ensuring tests never reach live models; no paid calls made).
- **Eval Gate:** `npm run eval` was NOT run, as mandated by the instructions.
- **Protected Files Integrity:** All protected files listed in user instructions remained untouched during this run:
  - `lib/anthropic.ts` (untouched)
  - `lib/gate.ts` (untouched)
  - `scripts/run-eval.ts` (untouched)
  - `scripts/check-eval.mjs` (untouched)
  - `scripts/build-rules.mjs` (untouched)
  - `scripts/ai-check.mjs` (untouched)
  - `scripts/cloud-check.ts` (untouched)
  - `data/rules.json` (untouched)
  - `config/pricing.json` (untouched)
  - `eval/` and `private/` (untouched)
  - `tests/unit/rules-source.test.ts` (untouched)
  - `tests/unit/r35-fixes.test.ts` (untouched)
  - Protected `package.json` scripts (`build`, `build:nogate`, `eval`, `rules`, `ai:check`, `cloud:check`) (untouched).
- **SEBI / AMFI Disclaimers:** Present on every screen:
  - Top notice: *"Information about your own SIP and the rules only. Not investment advice."*
  - Footer notice: *"Concept prototype, not affiliated with Groww. All data is synthetic demo data."*
- **Equal Weight Options:** All 7 options rendered in uniform card layout with identical visual height (`min-h-[260px]`); single column at all screen sizes; no option labelled "recommended"; `scrollHeight <= clientHeight + 1` at both 390 and 1280.
- **Zero Groww Assets:** Verified: 0 Groww logos, wordmarks, or trademark image assets exist in the codebase or screens.

---

## 6. Deviations from Spec

- **D1. Shared DECLINE constants in `lib/decline-text.ts`:**  
  As instructed in user answer D1/OQ-3, `DECLINE_TEXT` and `DECLINE_SOURCES` were cleanly extracted into `lib/decline-text.ts` copied character-for-character from legacy ask route, and imported into `app/api/ai/sensecheck/route.ts`. The legacy ask route and prompt were deleted.
- **D2. Dedication stored in passbook SIP record:**  
  The passbook name / dedication is stored in the SIP's `dedication` field and is presented only in Version B.
- **D3. Quality page with non-live evaluation:**  
  As `eval/results.json` reflects a non-live evaluation (`live: false`), `/quality` renders *"No live evaluation recorded yet."*.

---

## 7. Open Questions

- **OQ-1. Verbatim Groww Help passage for unit allotment timeline:**  
  `data/rules.json` contains no verified rule stating the exact business-day turnaround for unit allotment (e.g. T+1 or T+2). Per rule W8 (no invented facts), pending units on 5 Nov 2026 are presented honestly as pending with the official "as of" timestamp (`2026-11-06T10:00:00Z`), with guidance directing investors to their official Consolidated Account Statement (CAS) or Groww customer support. A verbatim Groww help passage can be added once verified.
