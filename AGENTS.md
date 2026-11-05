# AGENTS.md: rules for every agent run in this project

This project builds one MVP, "The SIP locker", a concept prototype for a Groww case study. The spec, `spec-06-mvp-sip-locker.md`, is the source of truth. A reviewer reads every change against it. Background documents are in `docs/` and are read-only.

## Rules W1–W8
- **W1. Read the spec first and implement only the spec.** Read it in full before doing anything. If something is unclear or impossible, stop and write the question under "Open questions" in `reports/RUN_REPORT.md`. Never guess silently.
- **W2. Never commit or reveal secrets.**
  - Keys live only in `.env.local` (gitignored) and in Vercel's environment variables.
  - `.env.local.example` lists the variable names with empty values.
  - Never open, print or log `.env*` files or key values.
- **W3. Never commit raw or personal data.**
  - `private/` is gitignored and holds the real-text golden set, the help corpus, the private-terms list and the spend log. Nothing from `private/` may be copied into a committed file, a page, a log or a report.
  - Tester data lives only in the cloud project (Supabase) and is deleted after the study.
- **W4. No personal names anywhere:** not in code, comments, docs, commit authors, the repo name, the Vercel project or any URL.
  - Commit as `sip-research <sip-research@users.noreply.github.com>`.
  - `npm run check:privacy` must pass before any push.
- **W5. Money.**
  - Paid API calls run only when `ALLOW_PAID=1` is set.
  - The Anthropic workspace for this project is capped at US$4.
  - Every paid run appends its token usage and cost to `private/spend_log.jsonl`.
  - Never add a paid service, an API or a data source that the spec does not name.
- **W6. Be a polite client.** No scraping, no logged-in automation, never bypass CAPTCHAs or bot checks. Use only the APIs the spec names.
- **W7. Report back** at the end of every run, in `reports/RUN_REPORT.md` and in chat, in the shape of the spec's §13: files with their sha256, screenshots, eval tables, tests, spend, deployment, deviations and open questions.
- **W8. No typed numbers and no invented evidence.**
  - Every number on a page, in a prompt or in a report is computed from data. The demo seed in the spec's §6 is the only exception, and it is labelled "illustrative" on screen.
  - Never present invented text as real investor content.

## Never
- Edit the golden sets in `eval/golden/` or `private/golden/`.
- Change a prompt without re-running the eval: the build's eval gate checks the prompt hashes.
- Delete or rewrite anything in `docs/` or the spec.
- Use Groww's logo, wordmark, app icon or images.
- Present anything as investment advice.
