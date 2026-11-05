# MVP ideas, set 3: creative within a trusted money app

**Version** v1, 5 Nov 2026. Built by `analysis/build_mvp_formal_ideas_v1.py`. Engine, interview and help-page numbers are read from the result files; public rules are cited inline. Sample copy is illustrative.

**Status:** ideas only; nothing chosen. Written after the project owner's note of 5 Nov: Groww holds people's money, so the product must sound formal and trustworthy, and creativity must stay inside what a money app is expected to do, the way an astrology fortune cookie stays inside what a food app is expected to do. Every idea is checked for its effect on every party involved, not only the investor.

## 1. The rules for this set

**Creativity lives in the mechanism, not the costume.** Each idea borrows a practice that people already trust in other parts of their financial life: insurance, lending, banking, regulation. That borrowed practice explains the design. It never appears in the product as a theme, a game or a joke.

**Tone for every word the investor sees:**
- formal, calm and exact: what happened, what it means, what the investor can do next;
- no slang, cultural references, emoji, humour, countdowns or scores;
- the same register as a bank statement or a fund house's official letter; Hindi or other languages translated in the same register;
- no fund advice, rankings, predictions, fear, FOMO or urgency; the SEBI 3-miss rule stated as a fact, never as a threat.

**What the evidence says these ideas must address** (from the files):
- **Full exits are mostly about being unable to continue, not unwilling.** Money, app and cash problems make up 69% of stated causes in 239 full exits (148 with a stated cause); returns and market views 13%. In posts about Groww, returns are 0% of 37 stated causes.
- **A failed instalment is the moment most often followed by a stop:** 84% of 135 labelled stories (Reddit alone 83% of 41), against 27% after seeing a loss. Full exits follow 41% of failures and 8% of losses.
- **The first debit is next:** 71% of 111 stories about the first debit or the gap before it end in a stop. A life event or cash need: 56% on Reddit (n=41).
- **Debited but no units is the worst single outcome:** 91% stopped (n=33).
- **Interviews:** 5 of 8 had stopped; 3 of those exits were cash shocks and 1 a failed-payment lapse after a salary-account change (P04). 4 want to return and 1 might; 0 have. A one-month skip did not fit what 6 of 8 needed. 6 of 8 rely on bank SMS rather than the app. 8 of 8 saw red numbers; returns are the main reason in 42% of stories about *considering* a stop (the secondary problem).

## 2. Who is involved in one SIP (short form; full map in `mvp-ideas.md` §1)

| Actor | Role | Rules most of these ideas touch |
|---|---|---|
| **Investor** | Chooses the fund, amount and date; authorises mandates | Must authenticate every mandate change ([RBI e-mandate framework](https://www.businesstoday.in/amp/personal-finance/news/story/rbi-auto-pay-rules-changed-what-happens-to-your-sips-otts-and-other-payments-526829-2026-04-22)) |
| **Groww** | Execution-only platform: registers SIPs, routes orders, notifies, supports. Also runs its own fund house, Groww Mutual Fund | No advice or recommendations ([SEBI EOP framework](https://www.india-briefing.com/news/sebi-introduces-license-framework-for-execution-only-platforms-eops-for-india-mutual-fund-transactions-28564.html/)); solely responsible for AI output ([SEBI (Intermediaries) Amendment, 10 Feb 2025](https://foxmandal.in/news/regulated-entities-responsible-for-output-of-ai-usage-sebi/)); must stay neutral across fund houses |
| **SEBI** | Regulator | Monthly SIPs cancel after 3 consecutive failed instalments ([SEBI letter, 3 Jan 2024, effective 1 Apr 2024](https://docs.fintechprimitives.com/compliance/changes/sip-auto-cancellation/)); cancellations processed in 2 working days ([SEBI: cancellations in 2 working days from 1 Dec 2024](https://cafemutual.com/news/press-news/33765-new-sip-rule-sebi-mandates-mf-companies-to-process-cancellations-in-2-days)); complaints through SCORES, 21 days for the entity to resolve ([SEBI SCORES 2.0, from 1 Apr 2024](https://cafemutual.com/news/industry/31787-scores-to-resolve-grievances-within-21-days-sebi)) |
| **AMC (fund house)** and **RTA** (CAMS, KFintech) | Allot units, keep the folio, process pauses and cancellations | Pause: request 15–21 days before the next instalment, up to 3–6 months, once or twice per SIP, monthly SIPs only, automatic resume ([AMC pause rules (Value Research)](https://www.valueresearchonline.com/stories/52346/want-to-pause-sip-investments-all-you-need-to-know/)) |
| **BSE StAR MF** | Exchange rail: receives payment, places the order, carries mandates and pause requests | Pause facility for members ([BSE StAR MF pause for members](https://www.tribuneindia.com/news/business/sip-pause-facility-on-bses-mf-distribution-platform-93365)); orders placed only after payment is received (Groww help) |
| **Investor's bank** | Holds the mandate; debits; charges for bounces | Bounce fees ₹250–750 + GST ([bounce charges](https://www.businesstoday.in/mutual-funds/story/sip-failures-on-nach-mandate-can-cost-you-up-to-rs-2950-per-month-heres-how-524935-2026-04-09)); complaints go to the bank first, then the RBI Ombudsman after a month without reply ([RBI Integrated Ombudsman Scheme](https://payu.in/rbi-integrated-ombudsman-policy/)) |
| **NPCI** and **RBI** | Mandate rails (NACH, UPI AutoPay) and their rules | Pre-debit notice at least 24 hours before; the customer can modify or cancel any time ([RBI e-mandate framework](https://www.businesstoday.in/amp/personal-finance/news/story/rbi-auto-pay-rules-changed-what-happens-to-your-sips-otts-and-other-payments-526829-2026-04-22)); high mandate rejection rates ([NPCI mandate rejections](https://insights.dataful.in/articles/nach-e-mandates-scale-up-but-rejections-rise)) |
| **CCPA** (consumer protection) | Dark-pattern rules for every platform in India | Bans false urgency, confirm shaming, subscription traps, nagging and interface interference ([CCPA Dark Patterns Guidelines, 30 Nov 2023](https://www.jsalaw.com/newsletters-and-updates/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023/)) |
| **DPDP Act** | Personal data | Consent, purpose limitation, data minimisation |
| **Account Aggregator** (only where an idea uses it) | Consent-based sharing of bank data | SEBI lets AMCs and depositories share data ([SEBI circular on AMCs and depositories as FIPs, Aug 2022](https://www.sebi.gov.in/legal/circulars/aug-2022/participation-as-financial-information-providers-in-account-aggregator-framework_62157.html)); use cases for SEBI-regulated *users* of data were only proposed (advice, portfolio management, bank verification) ([SEBI consultation on FIU use cases, Aug 2023](https://www.sebi.gov.in/sebi_data/attachdocs/aug-2023/1690887848711.pdf)) |

## 3. Ten ideas

Each card: the problem with its evidence; the trusted practice it borrows; how it works; what the AI does and what plain code does; when it declines; sample copy; how we would test it; the effect on every actor; real testers; risks.

### 1. Lapse protection
*"Every money product a household holds has a rule against lapsing, except the SIP."*

- **Problem:** the failed instalment is the strongest exit moment (84% of 135 failure stories end in a stop). Under SEBI's rule, a temporary cash gap of three months becomes a permanent cancellation. Groww offers a one-instalment skip only (Groww's help has 1 page titled "pause", and it describes a skip), and skips count toward the three. Interviews: 3 cash-shock exits (P01, P07, P08); a one-month skip didn't fit 6 of 8.
- **Borrowed practice:** insurance has a grace period and, in many traditional policies, an automatic premium loan that keeps the cover alive; lenders offer moratoriums. A SIP has nothing between "paid" and "cancelled".
- **How it works:**
  - The investor sets a standing instruction for a SIP, at set-up or any time: *"If an instalment does not go through [once / twice] in a row, pause this SIP for [1 / 2 / 3] months instead of letting it be cancelled."*
  - When the condition is met, Groww files the fund house's pause through BSE, where that AMC offers one, and messages the investor with the reason, the resume date and an undo option.
  - The SIP resumes automatically. No money moves; no mandate changes.
  - It works only for SIPs whose AMC offers a pause. The SIP page says whether it is available.
- **AI:** reads why the instalment failed (rejection reason, the bank message the investor shares, what they say) and chooses the route. A pause helps only when money was short. If the AutoPay points to a closed account, or KYC blocks the order, pausing just delays the same failure, so it routes to that fix instead.
- **Plain code:** the instruction, the pause request, the AMC's notice window, the undo, the resume date.
- **When it declines:** an unclear cause → no automatic pause; the investor is asked, with both options and their consequences.
- **Sample copy:** "Your SIP in [fund name] did not go through on 5 October or 5 November because the account balance was insufficient. As you instructed on 12 June, we have requested a two-month pause from the fund house. Your next instalment will be on 5 February. You can undo this until 18 November."
- **Test:** route accuracy on real failure texts from the coded failure stories, with synthetic ones added; zero pauses where the cause is the mandate or KYC; every confirmation states cause, resume date and undo; zero urgency words.
- **Open questions for AMCs and BSE:** whether a pause is accepted on a SIP that has just missed instalments; whether misses before a pause count toward the three afterwards.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | The SIP survives a short cash gap; no bounce charges during the pause | Opts in; can switch it off or undo | Gains |
| Groww | Fewer passive lapses, so better 12-month continuity and steadier AUM | Builds pause orchestration across AMC terms; files within each notice window; logs every AI routing decision | Must act |
| SEBI | The 3-miss rule is untouched; the pause is an investor instruction, not advice | Disclose that the pause depends on the AMC and can fail if filed late | No change |
| AMC and RTA | A paused SIP instead of a cancelled one; inflows resume | Accept pause requests through BSE on their own terms (15–21 days' notice, 3–6 months, once or twice) | Gains; open question on post-failure pauses |
| BSE StAR MF | More pause requests on an existing facility | Existing member facility | No change |
| Investor's bank | No debit attempts during the pause, so fewer returns; less bounce-fee income | Nothing; the mandate stays registered | Mixed |
| NPCI and RBI | Fewer failed mandate debits | Nothing; the investor can still cancel the mandate any time | Gains |
| CCPA | Must not become a subscription trap | Opt-in only (no pre-ticked box); cancelling the SIP stays one step; undo offered | Must act |
| DPDP | Uses order and failure data Groww already holds, for the same purpose | No new data | No change |

- **Real testers:** P02, P03, P05 set it on their live SIPs; P01, P07, P08 judge it against their own break; P04 as the case where the AI must route to the account fix, not a pause.
- **Risks:** depends on AMC coverage across Groww's catalogue; the filing window is tight; a pause can postpone a cash problem rather than solve it.

### 2. A SIP date that matches when the money arrives
*"Lenders ask when you are paid before they set an EMI date. SIP set-up does not."*

- **Problem:** a low balance is the most often named cause when an instalment doesn't go through (14 tags, ahead of mandate or UPI issues at 12 and KYC at 8). The SIP date and first debit are the joint-top confusion in stop stories (20%, n=306, level with skip, pause and cancel). The engine is stronger than the interviews here: no interviewee named a date clash.
- **Borrowed practice:** lenders set the EMI date just after salary day, on the account where the salary arrives.
- **How it works:**
  - At set-up, and in an optional quarterly check, Groww asks when income arrives and into which account. The investor can type it or paste the salary-credit SMS.
  - The AI proposes the SIP date with the most room and checks that the AutoPay is on that same account. The investor confirms through the existing edit and AutoPay flows.
  - For irregular income (stipend, freelance, money from family), it places the date after the usual credit, and states the rule for quarterly SIPs if the investor asks about them: they cancel after 2 consecutive misses.
- **AI:** reads messy credit narrations across banks and languages (for example "NEFT CR-ACME TECH PVT LTD-SAL OCT") to find the date and account; weighs them against obligations the investor mentions (rent, EMIs, card due dates); explains the trade-off.
- **At scale:** an Account Aggregator consent could supply the statement directly. SEBI has not yet defined that use case for brokers or execution-only platforms ([SEBI consultation on FIU use cases, Aug 2023](https://www.sebi.gov.in/sebi_data/attachdocs/aug-2023/1690887848711.pdf)), so the MVP uses only what the investor types or pastes.
- **When it declines:** never suggests an amount or a fund; if the pattern is unclear, asks one question; pasted text is not stored.
- **Sample copy:** "Your salary usually arrives in your ICICI Bank account on the 7th. This SIP is debited from your HDFC Bank account on the 5th. Moving the date to the 9th and the AutoPay to ICICI Bank would mean the money is in place before each debit."
- **Test:** date and account extraction on a synthetic set of salary messages and statement lines (several banks, formats, Hindi and English); the proposed date meets every stated constraint; zero amount or fund suggestions.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Fewer failed instalments and bounce charges | Confirms any change; re-authorises AutoPay on a new account | Gains |
| Groww | Fewer failures and tickets | Uses existing edit-SIP and AutoPay flows; handles pasted text without storing it | Must act |
| SEBI | Choosing a date is operational, not investment advice | Keep amounts and funds out of every answer | No change |
| AMC and RTA | Steadier inflows; date changes are routine modifications | Some schemes allow only certain dates, so check per scheme | Gains |
| BSE StAR MF | SIP date modification (existing) | None | No change |
| Investor's bank | Fewer returns; less bounce-fee income | A new mandate where the account changes | Mixed |
| NPCI and RBI | Better mandate success | Authentication on any new mandate | Gains |
| CCPA | A recurring check could become nagging | Quarterly at most, dismissible, off with one tap | Must act |
| DPDP | Income details are personal data | Process transiently; keep only the chosen date | Must act |
| Account Aggregator (later) | Would replace pasting | Needs a SEBI-recognised use case ([SEBI consultation on FIU use cases, Aug 2023](https://www.sebi.gov.in/sebi_data/attachdocs/aug-2023/1690887848711.pdf)) | Open question |

- **Real testers:** P02, P03, P05 (live SIPs); P07 (stipend, looking back); P04 (the account half).
- **Risks:** interview evidence is thin; people may not bother at set-up.

### 3. Move all your SIPs to a new salary account in one request
*"Switching mobile operators takes one request. Switching the account your SIPs debit takes one request per SIP, and a missed one fails without a sound."*

- **Problem:** P04: two instalments failed after the salary moved to a new bank account. As coded from the interview: Sep and Oct instalments failed; saw a failure message and dismissed it; the listed SIP and next date looked like proof it was running; the moving portfolio value hid the missing contributions; found both failures only during the interview. Barriers: has not updated the funding account; unsure how to change it without creating a second SIP. Groww's path today: add the bank, make it primary, set up AutoPay, then change AutoPay on each SIP. In public stories, a life event is followed by a stop 56% of the time on Reddit, but bank-account causes are only 3 tagged failures, so the evidence here is mostly the interview.
- **Borrowed practice:** mobile number portability; account-switching services in other countries that move every direct debit for the customer.
- **How it works:**
  - Trigger: the investor adds a new bank, says "I changed jobs", or an instalment fails because the account is closed or not funded.
  - One request, "Move my SIPs to this account": the investor authenticates one new AutoPay.
  - Groww lists every SIP and its next date against the expected approval date, and marks any instalment that falls before approval (skip that one, or pay it once from the new account).
  - On approval, all SIPs move together, with the investor's confirmation. The old mandate stays until the first successful debit from the new account; then Groww offers to cancel it.
  - It reminds the investor that redemptions still go to the bank on the folio until that is changed separately.
- **AI:** turns a free-text situation ("joined a new company last month, salary now comes to Axis, my HDFC salary account won't be funded") into the sequence; reads the new mandate's approval or rejection message; ties each failure reason to the account.
- **When it declines:** never acts in the investor's bank; never cancels the old mandate without confirmation; bank-side problems → what to ask the bank.
- **Sample copy:** "Three SIPs are linked to your HDFC Bank account. Your new AutoPay with Axis Bank is expected to be approved by 14 November. The SIP due on 10 November falls before that date. You can skip it or pay it once from Axis Bank."
- **Test:** the correct sequence and at-risk instalments on scenarios; correct reading of approval and rejection messages; zero actions without confirmation.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | No silent lapse after a job change | One authentication; confirms the move | Gains |
| Groww | Fewer failures in the first year; P04-type lapses prevented | Automates the per-SIP AutoPay change it already offers | Must act |
| SEBI | Operational; the payment still comes from the investor's own account (SEBI circular of 4 Oct 2021, per Groww help) | The new account must be in the investor's name | No change |
| AMC and RTA | Uninterrupted instalments | The folio's bank for redemptions is a separate change; tell the investor | Gains |
| BSE StAR MF | Mandate registration and re-linking SIPs (existing) | None | No change |
| Old bank | Mandate cancelled at the investor's request; no more debits presented to an unfunded account | Process the cancellation | No change |
| New bank | A new mandate | Registers it after the investor authenticates | No change |
| NPCI and RBI | One create and one cancel per investor instead of failed debits | Authentication on the new mandate; the customer can cancel any time | Gains |
| CCPA | None if opt-in | No pre-selected moves | No change |
| DPDP | Bank details Groww already collects | No new data | No change |

- **Real testers:** P04 on his real SIP (the strongest live task in the study); anyone who has changed jobs.
- **Risks:** a narrow trigger; thin engine evidence.

### 4. Restart a SIP with the plan intact, when the investor chooses
*"A lapsed insurance policy can be revived. A cancelled SIP simply disappears."*

- **Problem:** 5 of 5 leavers want or might want to return; 0 have. Restarts are rare in public stories (19 stories with a restart against 394 with a stop). Groww has 0 help pages titled for restarting, and cancelling can't be undone. Barriers, as coded: P01 "unsure the paused SIP can be restarted"; P06 "research loop: every comparison gives another option"; P07 "unknown sustainable amount".
- **Borrowed practice:** policy revival: the insurer keeps the record and tells you what is needed to bring it back.
- **How it works:**
  - When a SIP ends (cancelled or auto-cancelled), one optional question: "Would you like us to check back with you? [choose a month] / No."
  - In that month, and only then, a card shows the investor's own previous plan (fund, amount, date), what has changed since (AutoPay status, bank, date against income), and a one-screen restart. Every field can be changed.
  - If the investor left because of the fund ("I want a different fund"), the card shows no fund at all, only the restart steps. Groww never re-presents a scheme.
- **AI:** reads the cancellation reason and failure history to build the checklist (for example, "your AutoPay was on the account you no longer use; set up AutoPay on the new account first"); answers "can I restart?", "are my units still there?", "do I need KYC again?".
- **When it declines:** no amount or fund suggestions; no "performance since you left"; one check-back only; "No" ends it.
- **Sample copy:** "On 12 August you cancelled your SIP in [fund name] because your stipend had ended. You asked us to check back in July. Your units remain invested in your name. If you would like to restart, your previous plan is below; you can change the amount and date before confirming."
- **Test:** checklist correctness against each history; facts correct (units stay; a new SIP registration is needed; timing of the first automatic debit); zero fund mentions when the reason was the fund; the frequency cap holds.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | A clear way back, on their own timing | Chooses the month or declines | Gains |
| Groww | Recovers lapsed investors: the recovery term r(m) in Part 2 | Stores the check-back with consent; no new rails | Gains |
| SEBI | Showing the investor's own past plan is not a recommendation; comparisons or "since you left" figures would be | Ban performance figures on the card | No change |
| AMC and RTA | Inflows return to an existing folio | A new SIP registration (existing) | Gains |
| BSE StAR MF | New SIP registration (existing) | None | No change |
| Investor's bank, NPCI, RBI | Reuses an active mandate, or a new one with authentication | None | No change |
| CCPA | Re-engagement could become nagging or confirm shaming | One check-back chosen by the investor; a neutral "No" | Must act |
| DPDP | Stores a month and a reason category | Consent; deletable | Must act |

- **Real testers:** P01, P06, P07, P08: restarting is a real task for each of them today.
- **Risks:** its effect on month 12 depends on timing; it must never press someone without income (the month is theirs).

### 5. Where the money is, and who must act
*"An instalment passes through four regulated hands. The investor sees one status word."*

- **Problem:** debited but no units: 91% stopped (n=33); money back not received: 87% (n=15). Among 105 money-led exits, 26 describe money not coming back and 21 an unclear status. Support was "not resolved" in 40% of stoppers' in-app attempts (n=256). P03, as coded: "June: debited but not visible for about 2 working days; in-app help gave a generic processing answer with no point to come back". Groww's help gives refund timelines but has 0 pages on escalation or grievances.
- **Borrowed practice:** banks publish an escalation matrix (branch, nodal officer, Ombudsman); regulators set timelines for each step.
- **How it works:**
  - For any debit without units, a trail: debited from the bank → received by the exchange → order placed → units allotted, or refund started. Each step shows the date expected from Groww's published timelines (for example, a refund within 7 working days when an order fails) and which party is responsible at that step.
  - When a step is overdue, the AI drafts the right formal request:
    - to Groww, with every reference filled in;
    - if Groww has not resolved it within SEBI's timeline, the route to SCORES (21 days for the entity, then review) ([SEBI SCORES 2.0, from 1 Apr 2024](https://cafemutual.com/news/industry/31787-scores-to-resolve-grievances-within-21-days-sebi));
    - for a bank-side fault (for example, a bounce charge when the money was available), a letter to the bank, then the RBI Ombudsman after a month without reply ([RBI Integrated Ombudsman Scheme](https://payu.in/rbi-integrated-ombudsman-policy/)).
- **AI:** reads the investor's bank message and Groww's order status, places the case on the trail, names the responsible party, and drafts the request with dates and masked references.
- **When it declines:** cannot place the case → a support ticket with the details attached; no promises of outcome; no legal advice.
- **Sample copy:** "₹2,000 was debited from your account on 4 June. The order was not placed because the exchange did not receive the payment in time. A refund is due in your account by 13 June. If it has not arrived by then, we will raise it with these details."
- **Test:** correct placement and responsible party on labelled cases; correct timelines; drafted letters contain the required fields and no invented facts.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Certainty about the money, and a path that ends | Shares the bank message if needed | Gains |
| Groww | Fewer repeat tickets; structured cases; earlier resolution keeps cases away from SCORES | Shows its own timelines and the escalation route openly | Must act |
| SEBI | Investors told of SCORES as the regulator intends; fewer escalations if Groww resolves first | SCORES timelines | Gains |
| Exchange (BSE and its clearing) | Its step and timing made visible | Reasons for non-receipt surfaced through Groww | No change |
| AMC and RTA | Allotment or rejection reasons (such as KYC) surfaced plainly | None | No change |
| Investor's bank | Receives well-formed requests; charge reversals where the fault is the bank's | Its grievance process; the Ombudsman after a month | Must act |
| RBI | Ombudsman route explained | Integrated Ombudsman Scheme | No change |
| CCPA | None | None | No change |
| DPDP | References and amounts in letters | Masked; drafts not stored | Must act |

- **Real testers:** P03 and P01 (both had a debit-to-units scare); others on recorded cases.
- **Risks:** mostly reassurance; few interviewees left over this, though the engine shows a high stop rate.

### 6. Ask the fund's own documents
*"Every fund publishes the answers in documents SEBI requires. Nobody opens a 60-page PDF."*

- **Problem:** 4 of 8 confused their own return with the fund's displayed return; 8 of 8 saw red; returns lead 42% of "considering" stories. At a hardship moment, P08 asked for "a simple explanation of what stopping vs withdrawing does (timing, costs)". Exit load and tax are the confusion in 5% of stop stories (n=306). This is mainly the secondary problem.
- **Borrowed practice:** the Scheme Information Document, the Key Information Memorandum, the monthly factsheet and the riskometer; and the "most important terms" summaries RBI requires for credit cards.
- **How it works:**
  - On any fund the investor holds or is about to start: "Ask this fund's documents". Questions in plain words; answers quoted from the documents with the page reference.
  - At set-up, a one-page brief built only from those documents: riskometer level, exit load, lock-in, how the fund describes its own risk, and the factsheet's historical figures with the required past-performance disclaimer.
- **AI:** finds the passage in long documents, renders it in plain words beside the quote, and recognises questions it must refuse.
- **When it declines:** no comparisons with other funds, no predictions, no "is this a good fund", no "should I stay": "The fund's documents do not answer this."
- **Sample copy:** "The Key Information Memorandum states that an exit load of 1% applies if units are redeemed within 12 months of allotment (page 3)."
- **Test:** answer accuracy against the documents; citation accuracy; refusal accuracy; zero predictions.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Understands the fund before and during the first year; fewer accidental costs | None | Gains |
| Groww | Fewer misinformed exits; liable for any misstatement | Quote first, paraphrase beside it; identical treatment for every fund house, including Groww Mutual Fund | Must act |
| SEBI | Mandated disclosures reach the investor | No altered meaning, no omitted risk, past performance only with the required disclaimer, no advice | Must act |
| AMC | Its own documents explained accurately | May object to paraphrase, hence verbatim quotes with page numbers | Gains |
| AMFI | Aligns with investor education | Its education material can be cited | Gains |
| RTA, BSE, banks, NPCI, RBI | Not involved | – | No change |
| CCPA | None | None | No change |
| DPDP | None (questions are not stored) | None | No change |

- **Real testers:** all 8 (P02 and P06 especially).
- **Risks:** targets the secondary problem; precision on every number is essential.

### 7. The SIP review
*"Banks and insurers review your details at set intervals. A self-directed investor never gets that moment."*

- **Problem:** 4 of 5 interview exits followed a life change (job loss, job switch with a new bank, stipend ending, family emergency), after 3 to 11 paid months. The SIP was set up for a life that then changed, and nothing asked.
- **Borrowed practice:** periodic reviews by relationship managers and insurers, and periodic KYC updates: a scheduled moment to update details before they cause a failure.
- **How it works:**
  - At months 3, 6 and 11 (or a schedule the investor sets), a two-minute review: "Has anything changed: income, job, bank account, a large expense ahead?"
  - The AI maps the answer to concrete steps that already exist or appear in this set: move SIPs to a new account (idea 3), change the date (idea 2), a planned pause for a known expense month (idea 1), a check-back (idea 4), or "nothing needs to change".
  - It also checks the mandate: approved, on the right account, a limit that covers the instalment, including a planned step-up.
- **AI:** turns life changes described in free text into a plan; spots conflicts (a step-up above the mandate limit; an expense month that clashes with a debit).
- **When it declines:** operational only: "This review does not cover which fund you hold." No amounts suggested.
- **Sample copy:** "You mentioned a family wedding in February. Would you like to pause this SIP for February and March? It would resume on 5 April."
- **Test:** scenario set: correct mapping to steps; zero comments on funds or performance; correct detection of mandate-limit conflicts.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Problems fixed before they become failures | Answers or dismisses | Gains |
| Groww | Earlier fixes, fewer lapses | Must not call it a "portfolio review", which implies advice | Must act |
| SEBI | An operational review is not advice | No fund or performance comments | No change |
| AMC and RTA | Planned pauses instead of failures | Their pause terms | Gains |
| BSE StAR MF | Existing modifications | None | No change |
| Investor's bank, NPCI, RBI | A higher mandate limit needs a new mandate with authentication | RBI limits for MF mandates | No change |
| CCPA | A recurring prompt could become nagging | At most three a year; dismissible; can be switched off | Must act |
| DPDP | Life events can be sensitive (health, family) | Keep only the resulting step, never the story | Must act |

- **Real testers:** P02, P03, P05 on their live SIPs; P01, P07, P08 asked what they would have answered at month 3.
- **Risks:** people may ignore it; the planned pause depends on AMC pauses.

### 8. The SIP schedule
*"A loan comes with a repayment schedule. A SIP comes with one 'next instalment' date."*

- **Problem:** the first debit and the gap before it: 71% of 111 stories end in a stop, 40% in a full exit. The SIP date and first debit are the joint-top confusion in stop stories (20%, n=306); where the money went (17%) and order status (16%) follow. Interviews, as coded: P02 knew that "a listed SIP only shows it was set up"; P01: "debit-to-units lag caused panic once".
- **Borrowed practice:** the loan repayment schedule: every date, every amount, and what happens if one is missed.
- **How it works:**
  - At set-up, a formal schedule: first instalment (paid today; units by …); AutoPay approval (pending; expected by …; where to approve it); first automatic debit (date, account); then monthly.
  - Each line updates with its status (done, pending, failed, and why).
  - The rules sit at the bottom, in one place: what a skip does, the 3-miss rule, what happens if an instalment fails.
- **AI:** answers questions against the investor's own schedule ("Why wasn't money deducted on the 5th?") and reads the bank or UPI message to explain a pending or failed line.
- **When it declines:** "This is not visible from Groww's side" → the help page or support; no guesses about the bank.
- **Sample copy:** "Your AutoPay request was sent to HDFC Bank on 2 November. Banks usually take a few working days. Until it is approved, your first automatic instalment on 5 December cannot be debited."
- **Test:** schedule correctness across set-up scenarios (mandate types, holidays, dates); answer accuracy; correct "not visible" responses.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Knows every date in the riskiest months | None | Gains |
| Groww | Fewer "where is my money" tickets; uses data it already has | Mandate status from BSE shown plainly | Gains |
| SEBI | Operational | None | No change |
| AMC and RTA | Allotment timing made visible | None | No change |
| BSE StAR MF | Payment and order timing made visible | None | No change |
| Investor's bank | Approval step made visible; the bank's pre-debit notice is recognised as expected | None | No change |
| NPCI and RBI | Fewer abandoned approvals | Pre-debit notice rules unchanged | Gains |
| CCPA | None | None | No change |
| DPDP | None | None | No change |

- **Real testers:** weak for live tasks (every interviewee's first debit went smoothly), so scenario-based; P03 for the June debit.
- **Risks:** status screens exist already; the schedule's value is completeness and the AI answers.

### 9. Check a claim before acting on it
*"SEBI and AMFI fund investor education. Nobody checks the specific message an investor is about to act on."*

- **Problem:** advice is followed by a stop in 28% of 72 stories. People who stopped turned to forums (23%), web searches (12%) or advisers (9%); 35% turned to no one (n=114). P06 cancelled after comparing early returns with fund histories and with peers. In other interviews a friend, colleague or brother steadied the person (P02, P03, P04, P05, P07), so outside voices can help as well as harm.
- **Borrowed practice:** public investor education and formal fact-checking. SEBI's 2024 rules restricting regulated entities' links with unregistered finfluencers show the regulator sees this risk ([SEBI rules on unregistered finfluencers, Aug 2024](https://www.businesstoday.in/personal-finance/investment/story/sebi-tweaks-regulations-for-finfluencers-removes-content-of-over-15000-unregulated-entities-443789-2024-08-31)).
- **How it works:** paste or share a message, a caption or a friend's claim. The AI splits it into claims and labels each one:
  - **Accurate;**
  - **Not accurate,** with the fact and its source;
  - **Cannot be known** (market predictions);
  - **An opinion on a specific fund:** declined.
  Sources are SEBI and AMFI investor education, the fund's documents and Groww's help.
- **AI:** extracts claims from informal, mixed-language text and matches each to a grounded fact.
- **When it declines:** never rates a fund, a person or a forecast; never says "stay invested".
- **Sample copy:** "'SIP money is locked for five years.' Not accurate. Only tax-saving ELSS funds have a lock-in, of three years. Units in other funds can be redeemed at any time, subject to any exit load."
- **Test:** claim-level label accuracy; zero fund or market opinions; citation accuracy.

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Acts on facts, not forwards | None | Gains |
| Groww | Trust; liable for every verdict | Grounded answers only; never names or judges a creator | Must act |
| SEBI | Serves investor-protection aims | No advice; no association with unregistered advisers | Gains |
| AMFI | Its education material reaches investors at the decision moment | Attribution | Gains |
| AMC | Neutral; no scheme verdicts | None | No change |
| RTA, BSE, banks, NPCI, RBI | Not involved | – | No change |
| CCPA | None | None | No change |
| DPDP | Pasted text may include third parties' words | Not stored | Must act |

- **Real testers:** all 8, each bringing a message they received.
- **Risks:** the link to exits is weaker (outside advice drives doubt more than stopping); scope must stay on SIP mechanics.

### 10. A closing statement before cancelling
*"Closing a small fixed deposit comes with a statement. Ending a SIP comes with a reason picker."*

- **Problem:** at the decision, the options people knew were thin: P06 "lowering; a pause vaguely; went straight to cancel"; P08 "cancel; heard of pause and reduce, had not checked the rules". P07 wanted "confidence that stopping keeps the units"; P08 "a simple explanation of what stopping vs withdrawing does (timing, costs)". Skip, pause and cancel are the joint-top confusion in stop stories (20%, n=306). On Groww, cancelling can't be undone.
- **Borrowed practice:** the closure advice a bank gives when an account or deposit is closed: what was held, what is paid out, what remains.
- **How it works:** tapping Cancel opens a one-page statement:
  - what has been invested, and the units held, which stay invested in the investor's name;
  - what cancelling does: no further debits; processed within 2 working days ([SEBI: cancellations in 2 working days from 1 Dec 2024](https://cafemutual.com/news/press-news/33765-new-sip-rule-sebi-mandates-mf-companies-to-process-cancellations-in-2-days)); Groww's 7-day lock before a due date;
  - what it does not do: it does not withdraw money. Withdrawal is separate (exit load, money in 3–4 working days per Groww's help, the ELSS lock-in);
  - the alternatives that fit the reason given in the investor's own words: a lower amount, another date, another account, or a pause where the fund house allows one;
  - "Confirm cancellation", as prominent as everything else.
  - Afterwards, the optional check-back from idea 4.
- **AI:** reads the reason and selects the relevant facts and alternatives; answers "will I lose my money?". For distress reasons (medical, job loss), it lists the options plainly, with no persuasion.
- **When it declines:** never argues, delays or offers incentives; cancel is always one step away.
- **Sample copy:** "Cancelling stops future instalments. It does not withdraw your money: your units in [fund name] remain invested in your name."
- **Test:** facts correct per fund; alternatives relevant to the reason; zero persuasion phrases (a confirm-shaming word list); cancel reachable in one step (an interface test).

**Effect on every actor:**

| Actor | How it is affected | What it must do, or the rule that applies | Verdict |
|---|---|---|---|
| Investor | Cancels knowing exactly what happens; fewer regretted cancels and accidental withdrawals | None | Gains |
| Groww | Fewer exits made for the wrong reason | Must not become a retention trap | Must act |
| SEBI | 2-day cancellation processing; no advice | None beyond existing rules | No change |
| AMC and RTA | Fewer cancellations; pauses where chosen | Their pause terms | Gains |
| BSE StAR MF | Cancellation and pause (existing) | None | No change |
| Investor's bank | The mandate stays unless the investor cancels it | Tell the investor it remains and can be reused | No change |
| NPCI and RBI | None | The customer can cancel the mandate any time; say how | No change |
| CCPA | The highest-risk screen for dark patterns | No confirm shaming, no subscription trap, no interface interference; equal prominence for cancel | Must act |
| DPDP | The reason text | Keep the category only | Must act |

- **Real testers:** P06, P07, P08 (walk the flow against their own cancellation); P05 (who reduced instead).
- **Risks:** the familiar "retention at cancel" idea; regulatory risk if done badly. The closing statement is the new part.

## 4. All actors, all ideas

"Gains" = better off; "Acts" = must do something new or follow a rule closely; "–" = not involved or unchanged; "Open" = a question to settle with that party.

| # | Idea | Investor | Groww | SEBI | AMC / RTA | BSE | Bank | NPCI / RBI | CCPA | DPDP | Other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lapse protection | Gains | Acts | – | Gains, Open | – | Mixed | Gains | Acts | – | – |
| 2 | Date that matches income | Gains | Acts | – | Gains | – | Mixed | Gains | Acts | Acts | AA: Open |
| 3 | Move all SIPs to a new account | Gains | Acts | – | Gains | – | – | Gains | – | – | – |
| 4 | Restart with the plan intact | Gains | Gains | – | Gains | – | – | – | Acts | Acts | – |
| 5 | Where the money is | Gains | Acts | Gains | – | – | Acts | – | – | Acts | – |
| 6 | Ask the fund's documents | Gains | Acts | Acts | Gains | – | – | – | – | – | AMFI: Gains |
| 7 | The SIP review | Gains | Acts | – | Gains | – | – | – | Acts | Acts | – |
| 8 | The SIP schedule | Gains | Gains | – | – | – | – | Gains | – | – | – |
| 9 | Check a claim | Gains | Acts | Gains | – | – | – | – | – | Acts | AMFI: Gains |
| 10 | Closing statement | Gains | Acts | – | Gains | – | – | – | Acts | Acts | – |

## 5. Side by side

| # | Idea | Problem | Strength of evidence | Borrowed practice | AI's job | Live testers |
|---|---|---|---|---|---|---|
| 1 | Lapse protection | Failed instalments → auto-cancel | Strong (84% stop after a failure) | Insurance lapse rules | Route by failure cause | P02, P03, P05 + 4 looking back |
| 2 | Date that matches income | Balance failures | Engine only (14 balance tags) | EMI set after salary day | Read income messages | P02, P03, P05 |
| 3 | Move all SIPs to a new account | Salary-account change | Interview (P04); engine thin (3 tags) | Number portability | Turn a situation into a sequence | P04 |
| 4 | Restart with the plan intact | No way back | Strong (0 of 5 restarted; 19 vs 394) | Policy revival | Build the restart checklist | P01, P06, P07, P08 |
| 5 | Where the money is | Debited, no units | Strong (91%, n=33) | Escalation matrix | Place the case; draft the request | P03, P01 |
| 6 | Ask the fund's documents | Expectations, red numbers | Secondary (42% of considering) | Mandated disclosures | Quote and explain long documents | All 8 |
| 7 | The SIP review | Life changes | Interviews (4 of 5 exits) | Periodic review | Life change → steps | P02, P03, P05 |
| 8 | The SIP schedule | First debit and gap | Strong (71%, n=111) | Repayment schedule | Answer against the schedule | Scenarios |
| 9 | Check a claim | Outside advice | Moderate (28% after advice) | Fact-checking | Extract and verify claims | All 8 |
| 10 | Closing statement | Deliberate cancel | Interviews (P06, P07, P08) | Closure advice | Reason → relevant facts | P06, P07, P08 |

## 6. Ideas that work as one product
- **1 + 3 + 4, a continuity kit:** keeps the SIP alive through a cash gap, through a bank change, and brings it back after an exit.
- **8 + 5:** one status system: the schedule before anything goes wrong, the trail when it does.
- **10 + 4:** the closing statement ends with the check-back.
- **7** can host 1, 2 and 3 as the steps it offers.

## 7. Where earlier ideas went
Several problems from sets 1 and 2 survive here with the costume replaced by a finance-native mechanism:

| This set | Keeps the problem from | What changed |
|---|---|---|
| 3. Move all SIPs | "Your salary moved" (`mvp-ideas.md` #3); SIP battery (#15) | One orchestrated request instead of a guide or an icon |
| 4. Restart | Fresh-start restart (#8); comeback card (`mvp-ideas.md` #7) | The investor chooses the check-back month; the plan is kept |
| 5. Where the money is | Detective (#1); biryani tracker (#9); "where is my money" (`mvp-ideas.md` #8) | Formal escalation to the responsible party |
| 8. The SIP schedule | PNR status (#11) | A repayment-schedule format instead of railway codes |
| 9. Check a claim | WhatsApp University (#14) | Formal labels and sources |
| 10. Closing statement | Breaking up (#13); gullak (#4) | A closure statement instead of a conversation in character |

**Considered and set aside:**
- **Payroll-linked SIPs:** a SEBI draft of May 2026 would let employers route salary deductions into funds ([SEBI draft on payroll-linked MF investing, May 2026](https://www.valueresearchonline.com/stories/228590/your-salary-may-soon-flow-straight-into-a-mutual-fund/)). Its final status is not confirmed here; it needs employers, the AI's role is thin, and a job switch still breaks it.
- **Alerting a trusted person about failures:** needs two people's consent and exposes investor data; family members cannot pay for an adult's SIP anyway, since the money must come from the investor's own account.
- **A liquid-fund buffer for failed instalments:** Groww would have to suggest a fund, which is a recommendation.
- **Answers in Indian languages:** a layer every idea can carry (in the same formal register), not an idea of its own.

## 8. What the project owner decides
A shortlist of 2–3 ideas (or one group from §6). Claude then writes the MVP spec for AG, with the golden set, the decline states and the tone rules, and frames the problem statement around the choice without changing any Part 1 number.
