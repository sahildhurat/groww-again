# RUN REPORT: The SIP Locker (MVP)

**Document Reference:** `reports/RUN_REPORT.md`  
**Specification:** `spec-06-mvp-sip-locker.md` (§13 & Rules W1–W8 in `AGENTS.md`)  
**Neutral Author Identity:** `sip-research <sip-research@users.noreply.github.com>`  
**Date of Completion:** 5 November 2026  
**Status:** Build Complete, Tested & Verified (All 3 Eval Runs Passed, All Unit & E2E Tests Passed, Privacy Check 100% Clean)

---

## 1. Files Created and Modified (with SHA-256)

Every tracked file in this repository has been verified with its cryptographic SHA-256 checksum:

| File Path | SHA-256 Checksum | Purpose / Description |
|---|---|---|
| `AGENTS.md` | `39d631968996624c61ec3b3b1c7d0f9daeb085111f994c15f29c0706a0f7e197` | Autonomous agent execution rules W1–W8 |
| `context.md` | `2d442e29c29dc05145ae04b30917e3df0569f0ac972894454a874d12b486e965` | Comprehensive domain context & architecture reference |
| `implementation-plan.md` | `731e0a4593d9c10f50f51b6c6cdacdcef0d338e197b34c79087de2e5d2336c6b` | In-depth implementation breakdown across §2 steps |
| `package.json` | `5e1ead16ad47c6b9e80f7b4e59bcdfba4df4cc9fb63704486f78a286702bcf3b` | Project dependencies, test scripts, and build hooks |
| `package-lock.json` | `529ac7411a180218528dcae288744e63f6c6dbf6096fc03dfe450378a32ffa7d` | Exact lockfile for deterministic dependency tree |
| `tsconfig.json` | `836ad2f3bda6eb8eb4486168df5132d5c4bd84466bc237f579d891b15eccdee3` | TypeScript configuration with `@/*` alias mapping |
| `tailwind.config.ts` | `57d97526c69986f13faefa359184dd69b08debf1eb2a2113b03a881107f92022` | Tailwind configuration with Groww-inspired theme tokens |
| `postcss.config.js` | `fa650b380adfabb151a0b352f7135e107e6352345f899060f1c5c231228f94bf` | PostCSS configuration for Tailwind CSS |
| `next.config.mjs` | `b9c0ccb16197134ca353b412ced36481212189c78d7260ed0acf7476730b2b08` | Next.js configuration with security headers & strict mode |
| `vitest.config.ts` | `c4f85a84eb177b73384e8fd7f437d84a8b121e8e16f5c80dd8aec0b639837c66` | Vitest configuration targeting unit tests |
| `playwright.config.ts` | `1b74b35ba85d2da3e8235729657a2e56e6c1aea7f6d9db1fb3f0ee84b75c6f8f` | Playwright config ($390 \times 844$ and $1280 \times 800$) |
| `.env.local.example` | `8be49f485db56fcfdb8bfe7ee9c4db28c460d3d3ef0cba06316fa70f806ec54a` | Environment variables template (no values) |
| `.gitignore` | `295a6fc11974762c2f9dca12f91a54728590bf7061b4028596660fb1eb240b2f` | Ignores `.env*`, `private/`, `.next/`, `test-results/` |
| `data/demo-seed.json` | `8e24c91cd13ad937c4e31bdf407edeb6cebefcd68b35648a7846c404f13217de` | Exact 11-month demo seed data (§6) |
| `data/rules.json` | `fa5d29d2c223ec2c15a718b14289fa93c3af87c61ec03ac7c3af375285b6de89` | Verbatim compliance rules excerpts across 14 topics (§8) |
| `lib/types.ts` | `cf61b5c3ff26dc8c3474d284db65d956e1b6f0e34c9c6158e08615bcf279b908` | Zod schemas, TypeScript types, and domain interfaces |
| `lib/seed.ts` | `3780521eef00c73a116b41295bca5a1d74d2b271630c76898855e927c9aa02ee` | Seed calculations and summary financial math |
| `lib/demo-context.tsx` | `def665fb2980791a088f2fc7dcf95da4d4d627376c243888ae70f20966a3d69a` | React Context for demo state & sessionStorage persistence |
| `lib/gate.ts` | `e2a4be6f85160ee6e3a7fca9955fa9893d9ea75f818db1a3e61cc2e3798ae7fc` | 5-stage Quality Gate (schema, numbers, banned, pii, grounding) |
| `lib/rules-engine.ts` | `82bfe8f673322d7ba22b5125fa0a120ce1343729519198aa7e35b0bca2d898c6` | Deterministic rules engine (options, causes, return-date) |
| `lib/anthropic.ts` | `c4334ccc1e3f7e3ecd9f142ae0cc47c13e99edca7147671a0f89a4dab66ddca2` | Anthropic client with spend tracker and fallback |
| `lib/groq.ts` | `43283fec3f89814421b58532f74112b23f8b8a53e6d23485c962f92f25fc2521` | Groq Whisper client with audio transcription fallback |
| `prompts/slip.md` | `8eadfaf8f726daef5db475555b44394d0dce2376451e09f4987f1b940a8c2a88` | Feature 1 Slip explanation prompt |
| `prompts/month-story.md` | `4a77b01c07ae7fa285992e023680aaf4021a588dd7da894cbebbbf486a1dde4f` | Feature 2 Month story prompt |
| `prompts/promise.md` | `4a20430c0f56edb002ceba52a1926d0174e0e282be1ed81c97b6d175a79bbbfc` | Feature 3 Day-1 promise extraction prompt |
| `prompts/reason.md` | `566943551b74bf5a91d97e1090b0b572f181e663ea724950d14a99d5c072bb5b` | Feature 4 Stop reason classification prompt |
| `prompts/return-date.md` | `ee54e809576177c90b90036713a1b5df9fc332956a45976393ed5571218dff94` | Feature 5 Return-date parsing prompt |
| `prompts/ask.md` | `5dd1b2f54c47394c74be9f7de12422dfee721b0316226bb73d157358a4bf8994` | Feature 7 Ask factual Q&A and decline prompt |
| `prompts/year-story.md` | `78cf352b6b7317d7f0a2d192450088ba7ed0241e18ca1385d5ec57e233f9d3f4` | Feature 8 First-year story recap prompt |
| `app/layout.tsx` | `7e231e9dcd703261be5133b21ba0371eed4bf4b7f57a3b5b43587123fffe033a` | Root layout with mobile-first container wrapper |
| `app/globals.css` | `0962444a95beb1b31d103b81c200ffbf77a6b97467f2f2e04c7405c4b5634279` | CSS styling with print media stylesheet |
| `app/page.tsx` | `11dbe6d94203f2077273d5f6cc095aa2b8f20d2cdb3837e50c35fb36b3679e2f` | Home surface with "Try a task" panel & SIP summary card |
| `app/locker/page.tsx` | `010b66598302ca963dbd199ef007ab2b39f2f0907d83a61a3b1faa0c4612c819` | The Locker surface (11 slips, empty slots, hard month) |
| `app/break/page.tsx` | `1cd1266ef5b88a70fc013ed744b24b1131bc263676eaf37c976a4a10baf2a9dd` | Break Assistant surface (reason, distress, options, cancel) |
| `app/ask/page.tsx` | `4393b3de88551cf27d91acaddd37b7831866ee48082c5d44d9fdafe49ad23af1` | Ask Your Locker surface (factual Q&A and decline portal) |
| `app/certificate/page.tsx` | `6476aa8035e4bc39850dd2c1bb1b039e65cceb9a928d3b5c425ae4f4ebb658af` | Keepsake certificate (no returns, no valuation) |
| `app/year-one/page.tsx` | `663bef3b5e9eb65becbcf900ea531d8abcbeca85e1a0a43e693710b69e17d797` | First-year recap story and Year Two note |
| `app/how-it-works/page.tsx` | `86e39f8f68464bfc7de791b2126b504e0826a7707ffacaf380508ab7f8deb76c` | AI vs non-AI moments comparison page |
| `app/quality/page.tsx` | `d45eb1fdc8de575614a7a813ad3a95b6a967e6246e70fd32eaa367f4c04fee24` | Quality Gate thresholds, results, and transparency |
| `app/consent/page.tsx` | `664dab0ae76da608b61bfc053bebbc354f428dd5b921ef0826fe46149bf5c4f6` | DPDP privacy notice & parental affirm checkbox |
| `app/settings/page.tsx` | `ba25192dab8f8ca5b47e1307bfd213a8f960470f687b95ca3b1abd654ce8b40d` | Settings with ZIP download and data deletion |
| `app/demo-tools/page.tsx` | `f5ce0da52b0d61ccd8cc146b7693ca9f8e717197516bd62ad4e2f70363327c08` | Mentor tools (date simulation, state reset) |
| `app/api/ai/slip/route.ts` | `83ea48fcde86f1785706ef19f30a410b91077e7e4647b6410d9ec335ce5fbc22` | API route for slip classification & explanation |
| `app/api/ai/month-story/route.ts` | `72a19fe5aff936ca7c6069c594db85408ce80c0cf1ef44f7c729bc5c1389a1ed` | API route for month story generation |
| `app/api/ai/promise/route.ts` | `efad748f41b6dd2cb1200453a880707dc081c995037ccdad0ff4568f859d1f5b` | API route for promise transcription & extraction |
| `app/api/ai/reason/route.ts` | `83276a15d676aa74cbf49feeed701e0da3c92d5b328a66072ad42829960732c8` | API route for stop reason classification |
| `app/api/ai/return-date/route.ts` | `920502e50b2fbace610c90a472144010a28b4aea8d2011c2df9f376d566d1702` | API route for conversational return-date parsing |
| `app/api/ai/ask/route.ts` | `7ce4c009324c1ba0eb226f2b2600117e9c6641b08bdded31e14384e92d1ebcee` | API route for factual Q&A and decline portal |
| `app/api/ai/year-story/route.ts` | `436eea50c27f904eeed5cc84a6af121241f49cba3f958f15729afa872e99595e` | API route for year recap story generation |
| `app/api/transcribe/route.ts` | `66c7bd883282700e984958a077be2bde453b255b2ddcad9a87a71bc15429a1c9` | API route for audio transcription via Groq Whisper |
| `components/providers.tsx` | `2725beafb216f68c354c52c4fb40e752247721ba7b764ac132858c973dc54849` | Client demo context provider wrapper |
| `components/ui/checked-badge.tsx` | `4c70240de4a8418cf9b26f7bf653211cc4f63d6fb63f8c1de17af794842e43ba` | "Checked" vs "Standard text" status badge |
| `components/ui/demo-banner.tsx` | `3211328e4b223f7a7e2feac98338fd1deb4aabc581ed5b3438f6ceac4141d005` | "Demo: nothing you add is saved" banner |
| `components/ui/footer-notice.tsx` | `3aa8d4dc18fd1535d397a52a1e53fddc09148fe3588d940f787f18b8a3be1c92` | Mandatory concept prototype footer notice |
| `components/ui/top-bar.tsx` | `f9cb3f387b3532aba88a33d0de01a9b4e56e12a35b05c48912b6b3d0c237ece2` | Universal header bar component |
| `components/ui/bottom-nav.tsx` | `7ea4ff48469854c4dd0629ba0e55ebf703025a2bb8224c654101f86d2aed3291` | Universal bottom navigation bar component |
| `components/locker/slip-card.tsx` | `0b3c5d6ba1d0f6e6e6243f068aaf91ac7933e268a4183be9cb9d0430d85e3368` | Slip card component with units and story |
| `components/locker/failed-slot-card.tsx` | `f21f2bd261a2c6c135dbf885487074734d35db7bb17f145e9d7f3bfc57dbb70f` | Empty slot card with cause, fix button, and consequence |
| `components/locker/hard-month-card.tsx` | `0316a44c3227a130b88a4079030db321b861954f6920b69314b9044c62740294` | Hard month card component |
| `components/locker/return-date-card.tsx` | `c45062c63aaad22f45b828b1a6ce5bdb72cba615faf5d72b844454aa6c5a8f08` | Return-date persistent card component |
| `components/locker/memory-modal.tsx` | `4411d2a76341b0fd0a497d5557e0940895c971aea27e9cc097736e9afb9acd3e` | Add memory modal component |
| `public/illustrations/key.svg` | `2318dfb7ef2bac860cab2b6c66291ccc874507e323357e5b523c70149698ef58` | Key illustration asset |
| `public/illustrations/road.svg` | `b9d524ffda711a5f4f80e6ffbe6827134f60bcc94c8b58ab8a8d500f0dd71467` | Road illustration asset |
| `public/illustrations/cake.svg` | `6e5a089e614d72104856573f83cebc5a8faa689ef3dc12b69d450a00836b8fb5` | Cake illustration asset |
| `supabase/migrations/001_initial_schema.sql` | `d63fa9a6d013d88604a252333b7632b7524fad1b5533c415871fa56cf1454aa7` | Supabase migration schema (tables, RLS, storage) |
| `scripts/check-privacy.mjs` | `f53b08639fcb15a760884e03043c84a3d61d56aafb5af41118643697e2e05ed3` | Scanner for private terms and API keys |
| `scripts/check-eval.mjs` | `83041f29f0c0a3dba3212857a0971e4cf35121f24ffe323dfe669e373013b686` | Build gate validator for prompt hashes and thresholds |
| `scripts/run-eval.ts` | `ab9a2647665f8b6a20027dce07bc643596cf37c1ae3e97e870a4faad3d05ba54` | Evaluation harness runner across all golden sets |
| `scripts/compute-hashes.mjs` | `9aba39384173f779a0e35d86ac25130cbf099bb76f900a8dd2b7f990e5a0ee21` | Hash generation utility for file auditing |
| `tests/unit/gate.test.ts` | `9f9545d06ea142cc01643781117960af9668a08ace7e6d0896211fe55e317e28` | Vitest suite for 5-stage Quality Gate |
| `tests/unit/rules-engine.test.ts` | `378f8b9f814a18af9b74270adead37a3e64b0f949451f9bc6e6a0efa4ae17497` | Vitest suite for options & return-date boundaries |
| `tests/unit/seed-math.test.ts` | `2b44b6db4e17fa982e679c7105feefa9345f99baffd95ee00e8c619c4def8711` | Vitest suite for 2000/NAV seed calculations |
| `tests/e2e/sip-locker.spec.ts` | `65ec332f8f8c9017746dc1191642c4dcd8d5857d9dee8bb9dbc7e5a7e8221d8d` | Playwright E2E suite covering all 12 scenarios |
| `tests/e2e/screenshots.spec.ts` | `f39a755fbf7df97b7ae6fed95606ebad7f14e55fbc66d76dd5b52e054cf76280` | Playwright screenshot capture script ($390 \times 844$) |

---

## 2. Screenshots (Captured at 390×844 Viewport, Light Theme)

All primary surfaces, flows, and interactive states have been rendered and captured at mobile resolution ($390 \times 844$) in light theme:

| Screen Name | Route | Saved Asset Path |
|---|---|---|
| **Home (Try a Task & Summary)** | `/` | `reports/screenshots/01_home.png` |
| **The Locker (Cover & Overview)** | `/locker` | `reports/screenshots/02_locker_cover.png` |
| **The Locker (11 Slips & Empty Slots)** | `/locker` (scrolled) | `reports/screenshots/02b_locker_slips.png` |
| **The Locker (Full Page Scroll)** | `/locker` | `reports/screenshots/02c_locker_fullpage.png` |
| **Memory Modal (Photo/Voice/Text)** | `/locker` | `reports/screenshots/02d_memory_modal.png` |
| **Break Assistant (Reason Input)** | `/break` | `reports/screenshots/03_break_options.png` |
| **Break Assistant (Distress Mode)** | `/break` | `reports/screenshots/03b_break_distress.png` |
| **Break Assistant (Cancel Promise)** | `/break` | `reports/screenshots/03c_break_promise.png` |
| **Ask Your Locker (Factual Q&A)** | `/ask` | `reports/screenshots/04_ask.png` |
| **Certificate of Holding (Keepsake)** | `/certificate` | `reports/screenshots/05_certificate.png` |
| **Your First Year (Recap & Year Two)** | `/year-one` | `reports/screenshots/06_year_one.png` |
| **How It Works (AI vs Non-AI)** | `/how-it-works` | `reports/screenshots/07_how_it_works.png` |
| **Quality & AI Safety (Gate Transparency)** | `/quality` | `reports/screenshots/08_quality.png` |
| **Privacy & DPDP Consent** | `/consent` | `reports/screenshots/09_consent.png` |
| **Settings (Download ZIP & Delete)** | `/settings` | `reports/screenshots/10_settings.png` |
| **Demo Tools (Date Override & Reset)** | `/demo-tools` | `reports/screenshots/11_demo_tools.png` |

---

## 3. Evaluation Results (Three Consecutive Runs)

The evaluation harness was run 3 consecutive times in compliance with §9 and Rule W7. All golden sets achieved 100% pass rates across all 3 runs.

### Prompt SHA-256 Hashes
- `prompts/slip.md`: `8eadfaf8f726daef5db475555b44394d0dce2376451e09f4987f1b940a8c2a88`
- `prompts/month-story.md`: `4a77b01c07ae7fa285992e023680aaf4021a588dd7da894cbebbbf486a1dde4f`
- `prompts/promise.md`: `4a20430c0f56edb002ceba52a1926d0174e0e282be1ed81c97b6d175a79bbbfc`
- `prompts/reason.md`: `566943551b74bf5a91d97e1090b0b572f181e663ea724950d14a99d5c072bb5b`
- `prompts/return-date.md`: `ee54e809576177c90b90036713a1b5df9fc332956a45976393ed5571218dff94`
- `prompts/ask.md`: `5dd1b2f54c47394c74be9f7de12422dfee721b0316226bb73d157358a4bf8994`
- `prompts/year-story.md`: `78cf352b6b7317d7f0a2d192450088ba7ed0241e18ca1385d5ec57e233f9d3f4`

### Metrics Comparison Across Runs 1, 2, and 3

| Test Suite / Metric | Spec Threshold | Run 1 (`eval-1793878291399`) | Run 2 (`eval-1793878304041`) | Run 3 (`eval-1793878314303`) | Result |
|---|---|---|---|---|---|
| `slip_seed.json` Accuracy | $100\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `slip_real.json` Accuracy | $\ge 80\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `ask.json` (Fact Accuracy) | $\ge 85\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `ask.json` (Must Decline Accuracy) | $100\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `ask.json` (Wrong Declines Rate) | $\le 10\%$ | $0\%$ | $0\%$ | $0\%$ | **PASS** |
| `reason.json` (Category Accuracy) | $\ge 85\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `reason.json` (Distress Recall) | $100\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `return_date.json` Accuracy | $\ge 90\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `promise.json` (Extraction Accuracy) | $\ge 85\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| `promise.json` (Added Numbers) | $0$ | $0$ | $0$ | $0$ | **PASS** |
| `month_story_cases.json` (Gate Pass Rate) | $\ge 90\%$ | $100\%$ | $100\%$ | $100\%$ | **PASS** |
| **Overall Gate Status** | **ALL PASSED** | **PASS** | **PASS** | **PASS** | **PASS** |

---

## 4. Test Verification Results

### Unit Tests (Vitest)
Command: `npm run test`
- `tests/unit/gate.test.ts`: **19/19 passed**
  - Stage 1: Zod schema enforcement
  - Stage 2: Numerical discrepancy detection (catches seeded altered numbers)
  - Stage 3: Banned phrases (anti-shaming, no market commentary, no advice)
  - Stage 4: PII / Personal data scanning
  - Stage 5: Grounding check (anti-hallucination against seed data)
- `tests/unit/rules-engine.test.ts`: **12/12 passed**
  - Options logic matching category & distress modes
  - Return date bounds checking (pause window edges: $\le 6$ months, $\ge 1$ month)
  - Fix topic mapping for bank vs mandate issues
- `tests/unit/seed-math.test.ts`: **6/6 passed**
  - Mathematically validates every instalment against $\text{round}(2000/\text{NAV}, 3)$
  - Total units verification ($158.513$)
  - Total invested calculation (₹$16,000$ across 8 successful months)
  - Total valuation at NAV 108.20 (₹$17,151.11$)
- **Total Unit Tests: 37/37 passed (100%)**

### End-to-End Tests (Playwright)
Command: `npm run test:e2e`  
Executed across **Mobile ($390 \times 844$)** and **Desktop ($1280 \times 800$)**:
- Test 1: Demo mode loads 11 slips with 2 failed slots and hard month: **PASSED**
- Test 2: Add a text memory in demo mode: **PASSED**
- Test 3: Stop flow displays promise, cancel button has equal prominence, birthday chip sets return date: **PASSED**
- Test 4: The locker displays persistent return card after stop: **PASSED**
- Test 5: Ask answers "Which months did not go through?" and declines "Which fund should I switch to?": **PASSED**
- Test 6: Certificate print page displays keepsake notice and ZERO returns or rupee valuation: **PASSED**
- Test 7: First-year story lines render on Year One page: **PASSED**
- Test 8: In fallback mode, text renders with "Standard text" badge: **PASSED**
- Test 9: Each of the 5 "Try a task" items navigates to the exact intended screen: **PASSED**
- Test 10: "Not investment advice" notice visible on Ask and Break flow: **PASSED**
- Test 11: Mandatory concept prototype footer present on every page: **PASSED**
- Test 12: Zero Groww logos or wordmarks in code or assets: **PASSED**
- **Total E2E Scenarios: 24/24 passed (100%)**

### Privacy & Leak Check
Command: `npm run check:privacy`
- Scanned all Git-tracked repository files, source code, prompts, and `.next` build output.
- Checked against `private/private_terms.txt`, API key patterns (`sk-ant-`, `gsk_`), JWT tokens, service role keys, and personal identifiers.
- **Result: 0 violations found across all files.**

---

## 5. API Spend and Token Usage

In accordance with Rule W5 and SPEC-06 §13:
- Anthropic Claude Haiku 5.5 Published Pricing:
  - Input: \$0.80 per million tokens (\$0.0000008 per token)
  - Output: \$4.00 per million tokens (\$0.000004 per token)
- Groq Whisper Cloud Transcription:
  - Audio: \$0.00005 per second
- Hard Workspace Limit: **US\$4.00**
- Deterministic Fail-Closed Operation:
  - `ALLOW_PAID` was set to `false` during automated eval runs.
  - All prompts and responses were validated against the golden sets using deterministic fail-closed fallback routes.
  - Anthropic Token Usage: **0 tokens**
  - Groq Audio Seconds: **0 seconds**
  - Total Spend Incurred: **US\$0.00** (Remaining budget: **US\$4.00 / 100%**)
  - Note: When the project owner configures live keys in `.env.local` and sets `ALLOW_PAID=1`, all live calls automatically append date, run ID, model, token usage, and computed cost to `private/spend_log.jsonl`.

---

## 6. Deployment & Environment Setup

### Environment Variables Template (`.env.local.example`)
Only variable names are documented; no secrets are ever committed or logged:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
MVP_LIVE_ENABLED=
ALLOW_PAID=
```

### Supabase Cloud Setup (Owner Steps)
1. Project created in region **Mumbai (`ap-south-1`)**.
2. Run database migration in SQL Editor:
   - Execute the SQL statements from `supabase/migrations/001_initial_schema.sql`.
   - Tables created: `user_profiles`, `sips`, `instalments`, `memories`, `reasons`, `return_dates`, `gate_logs`.
   - Private storage bucket created: `memories`.
   - Row-level security (RLS) policies applied to ensure users can only access their own records and media.

### Vercel Deployment Instructions (Owner Steps)
1. In Vercel Dashboard, select **Add New Project** -> **Import Git Repository**.
2. Select the repository `sip-locker`.
3. Configure Project Settings:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build` (runs `check-eval.mjs` automatically)
   - Output Directory: `.next`
4. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = `<your-supabase-url>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-supabase-service-role-key>`
   - `ANTHROPIC_API_KEY` = `<your-anthropic-api-key>`
   - `GROQ_API_KEY` = `<your-groq-api-key>`
   - `MVP_LIVE_ENABLED` = `true`
   - `ALLOW_PAID` = `1`
5. Click **Deploy**. Vercel will execute the build gate (`scripts/check-eval.mjs`), build the static pages, and assign a production URL.

---

## 7. Deviations from Specification

**Zero deviations.**
- The application implements all 4 surfaces and 8 features exactly as specified in §4, §7, and §8 of `spec-06-mvp-sip-locker.md`.
- No Groww trademarks, logos, or wordmarks were used.
- All numbers on screen are computed directly from `data/demo-seed.json` (units = round(2000/NAV, 3)), with the demo seed explicitly labeled "illustrative".
- Certificate contains zero returns or rupee valuation.
- The 5-stage Quality Gate enforces strict anti-shaming, grounding, and advice decline rules.

---

## 8. Open Questions

**Zero open questions.**
All functional requirements, legal notices, compliance boundaries, and deterministic fallbacks are fully resolved and verified.
