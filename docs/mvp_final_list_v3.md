# The final MVP list, v3: Claude's ideas on the owner's logic

**Version** v3, 5 Nov 2026. Built by `analysis/build_mvp_final_list_v3.py`; numbers come from the result files. v1 restated the owner's rough ideas; v2 gave new ideas on the same logic; v3 adds five more after the owner found v2 light (ideas 8–12) and a build plan. Nothing is chosen until the owner picks.

## 1. The logic
- **Four reasons first-year SIPs lapse** (owner's framing, each supported by our evidence):
  - payment problems: a failed instalment is followed by a stop in 84% of 135 stories;
  - not yet understanding investing: 4 of 8 interviewees confused their own return with the fund's;
  - the day-1 decision stops fitting: 4 of 5 interview exits followed a life change;
  - the SIP becomes an expense: 6 of 8 follow it through bank SMS, so the monthly touchpoint is a debit message.
- **What Indians feel about what they own:** gold stays in the house or the bank locker; property can be visited; a fixed deposit comes with a receipt for the family file. Each is something you can keep, see and show. A SIP is a debit and a moving number.
- **How this generation keeps things:** voice notes, photo memories that resurface "on this day", year-in-review recaps.
- **Tone:** Groww's voice stays formal. The feeling comes from the investor's own words, photos and milestones, never from Groww's copy. No streaks, badges, guilt, fear or urgency.

## 2. The storage question: can Groww keep photos and voice notes for 10–25 years?
**Yes.** Device-only storage would be a dead end, for the reason the owner gave: people change phones many times in ten years. So memories are stored on Groww's servers, tied to the investor's account, and survive any device change. What it takes:
- **DPDP Act and Rules:** a plain consent notice for this purpose ("keep your memories until you delete them"); encryption and access logs; breach notice; deletion on request; for photos of children, the uploader confirms they are the parent or guardian. The Rules were notified in November 2025 and the core duties apply 18 months later, so a launch must meet them ([DPDP Rules 2025, notified Nov 2025; core duties apply 18 months later](https://www.storyboard18.com/amp/digital/breaking-govt-notifies-final-dpdp-rules-sets-staggered-rollout-with-key-obligations-for-data-fiduciaries-84201.htm)).
- **Kept apart from financial records:** memories are not transaction records, so deleting them never touches what SEBI requires Groww to keep, and record-keeping rules never force Groww to keep memories.
- **Where:** hosted in India by choice. SEBI's data-localisation requirement for regulated entities is on hold, and it covers regulatory data, not memories ([SEBI put CSCRF data localisation on hold, 31 Dec 2024](https://www.medianama.com/2025/01/223-sebi-holds-off-on-data-localisation-cscrf-framework/)).
- **No other use:** no face recognition, no use for marketing or model training, no sharing.
- **Survives leaving Groww too:** "Download my locker" exports everything (photos, voice notes, receipts) as a file the investor keeps, so the 10-year look-back survives even a change of platform.
- **For the MVP:** stored in an India-region cloud project, behind a simple login, with testers' consent, deleted after the study. Testers use the demo SIP's amounts, never their own (our standing rule: no amounts from respondents).

## 3. The ideas

### 1. The SIP locker
- **Logic:** families keep what matters in a locker: gold, property papers, FD receipts. A SIP has nowhere to keep anything.
- **Refines:** the owner's photo-with-each-instalment and FD-receipt ideas, joined into one object.
- **What it is:** every SIP has a locker. Each instalment drops in a receipt slip (date, amount, units bought, NAV). Beside it the investor can place a memory: a photo, a voice note or a line about the month. Past slips resurface on the same day after 1, 5 and 10 years. A month that failed leaves an empty slot with the reason and the fix, so a payment problem is seen the day it happens.
- **Targets:** the expense feeling (a growing collection, not a debit) and payment problems (the empty slot).
- **AI:** writes each slip in plain words from the order status, including why a month failed and what to do (tested on the 135 coded real failure stories); turns a voice note or line into a dated memory; removes anything resembling an account number or PAN; never invents.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| Investor | Optional; memories stay theirs whether or not the SIP continues; export and delete at any time | OK |
| Groww | Stores personal media, so DPDP duties apply (section 2); storage cost grows with users | Must act |
| SEBI | Slips come from order data and are labelled "not an account statement"; AI output logged ([SEBI: platforms are responsible for AI output](https://foxmandal.in/news/regulated-entities-responsible-for-output-of-ai-usage-sebi/)) | OK |
| AMC and RTA | Their statement stays the official record | OK |
| BSE, bank, NPCI, RBI | Payment and mandate untouched; a memory is added only after an instalment | OK |
| CCPA | Prompts at most once per instalment, skippable, off with one tap (no nagging) | OK with this rule |
| DPDP | Consent, security, deletion, parental confirmation for children's photos | OK with section 2 |

### 2. Your month, your money
- **Logic:** people learn money from their own life, not from definitions. "Rupee-cost averaging" means nothing; "the month you moved, your money bought more" does.
- **Refines:** new; it gives the memories a second job, teaching.
- **What it is:** each month's slip comes with two sentences that explain what happened to the investor's money, set in their own month: "In March, the month you moved to Pune, the fund's price was lower, so your ₹2,000 bought 9.1 units, 1.4 more than in February." Over a year this teaches units, NAV and averaging through their own timeline.
- **Targets:** not understanding investing; red numbers (secondary). In stop stories, the commonest confusions include where the money went (17%) and order status (16%).
- **AI:** weaves the instalment facts (units, NAV, change from last month) with the investor's memory into two plain sentences; every number is checked against the slip before it is shown; no predictions, no advice.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| SEBI | Facts about the investor's own units and NAV only; no forecasts, no fund views | OK |
| AMC | NAV is public daily data | OK |
| DPDP | Uses the memory the investor wrote, for the purpose they gave it | OK |
| Everyone else | Not involved | OK |

### 3. The day-1 promise, refitted when life changes
- **Logic:** the day-1 decision is emotional and practical, and both stop fitting when life moves. The answer is not to remind people of day 1, but to help day 1's intention survive in a new shape.
- **Refines:** the owner's voice note for the future self. Played at cancel, it risks guilt; here it is used to re-plan.
- **What it is:** at set-up, a short voice note: why, for whom, by when. When life changes (the investor says so, an instalment fails, or they open Cancel), the investor's own line comes back with a plan that keeps it alive: "On day 1 you said: 'for my first bike, by 2028.' Your income has stopped for now. Options: pause until a date you choose, lower the amount, move the date after your salary." Each option shows its consequence. If the goal itself has changed, the investor records a new promise. Cancel is always one step away and never delayed.
- **Targets:** the day-1 decision stops fitting (a one-month skip did not fit what 6 of 8 needed).
- **AI:** transcribes the note and pulls out the goal, the person and the horizon; reads the life change in the investor's words; picks the options that fit, without suggesting amounts or funds; never uses guilt.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| SEBI | Options are operational, not advice; cancellation processed in [cancellations in 2 working days](https://cafemutual.com/news/press-news/33765-new-sip-rule-sebi-mandates-mf-companies-to-process-cancellations-in-2-days) | OK |
| AMC and RTA | A pause only where the fund house offers one ([AMC pause terms](https://www.valueresearchonline.com/stories/52346/want-to-pause-sip-investments-all-you-need-to-know/)) | OK |
| CCPA | Confirm-shaming risk: the note is shown at cancel only if the investor chose that when recording; never autoplayed; cancel equally prominent ([CCPA dark-pattern rules, 2023](https://www.jsalaw.com/newsletters-and-updates/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023/)) | OK with these rules |
| DPDP | Voice is personal data: stored as in section 2; no voice identification | OK |
| Bank, NPCI, RBI | A new date or account needs the investor's own authentication | OK |

### 4. What your money owns
- **Logic:** property feels real because you can visit it. An equity SIP owns real businesses, but nobody shows the investor which.
- **Refines:** the owner's point about physical assets.
- **What it is:** "Your ₹18,000 makes you a part-owner of 50 Indian companies": the fund's latest published portfolio, translated into the investor's own rupees per company and sector. In a red month: "The companies you own did not change this month; their prices did."
- **Targets:** not understanding investing; red numbers; the SIP as an asset, not an expense.
- **AI:** answers "what do I own?" and "why is it down?" from the disclosure and the investor's units; declines "is this company good?".
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| SEBI | Funds must publish their portfolio every month, so this is disclosure; never framed as a stock recommendation; dated "as of" the disclosure | OK with these rules |
| AMC | Its own public disclosure, shown accurately; Groww treats every fund house alike, including its own | OK |
| Everyone else | Not involved | OK |

### 5. A certificate of holding, for the family file
- **Logic:** the FD certificate in the family file is shown to parents, kept and trusted. A SIP gives nothing to show.
- **Refines:** the owner's FD-receipt idea, as an annual document.
- **What it is:** at month 12, and every year after, a formal certificate-style page to print: when the SIP started, its name and dedication, months invested, units owned, the companies it owns (idea 4), and the investor's promise in their own words. Available to anyone, including people who paused or stopped ("your investing so far").
- **Targets:** ownership and pride at the 12-month mark the brief measures; legitimacy with parents who trust FDs and gold.
- **AI:** checks every figure against the locker before the page is created; writes the dedication from the promise.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| SEBI | Labelled "keepsake, not a statement of account or unit certificate"; no returns or performance figures | OK with these rules |
| Groww | A file to print, not a mailed gift, which could read as an inducement to stay invested | Design rule |
| AMC and RTA | Their statement stays the record | OK |
| Everyone else | Not involved | OK |

### 6. Dedicated to someone
- **Logic:** Indian investing is often for someone: a parent, a child, a partner, a future self.
- **Refines:** the owner's naming idea, plus a sealed letter.
- **What it is:** dedicate the SIP to a person, with their photo on the locker's cover. Write a letter that stays sealed in the locker until a date the investor sets (a child's 18th birthday), when the investor can open it and share it. Groww never contacts the other person.
- **Targets:** the expense feeling; the day-1 reason fading.
- **AI:** none essential; drafts nothing on the investor's behalf.
- **Compliance:** the other person's photo needs the uploader's confirmation of consent (or of being the parent); no fund or amount suggested for the goal (that is advice). OK.

### 7. The first-year renewal
- **Logic:** insurance has a renewal moment every year; a SIP never asks "still the right plan?". The brief measures month 12, so the moment belongs at month 11.
- **Refines:** the owner's 10-to-25-year look-back, brought forward to the year that matters most.
- **What it is:** at month 11, "Your first year": the investor's day-1 note, the year's slips and memories, their money story (idea 2), then the chance to record a note for year two and adjust the plan (date, amount, account). Nothing to pay or sign.
- **Targets:** the day-1 decision stops fitting; the twelve-month cliff.
- **AI:** composes "your first year" from the investor's own slips and memories only, every number checked.
- **Compliance:** no performance claims beyond units and amounts; one prompt, dismissible (CCPA); otherwise as ideas 1–3. OK.

### 8. Life chapters that keep the SIP working
- **Logic:** the memories investors leave are also the earliest signal that their life, and so their SIP, is changing. A note that says "new job in Pune" comes weeks before an instalment fails on the old salary account.
- **What it is:** with the investor's permission, the locker reads each new memory for a life change (a new job, a move, a wedding, a baby, a lost income) and, when it sees one, opens a new chapter and asks the practical question that change raises: "You mentioned a new job. Will your salary go to a different account? This SIP's AutoPay is on your HDFC Bank account." Then it offers the matching step: move the AutoPay, change the date, refit the promise (idea 3).
- **Targets:** payment problems and the day-1 decision stopping fitting, before they happen. P04's two failed instalments came after a job switch and a new salary account; 4 of 5 interview exits followed a life change.
- **AI:** detects life changes in free-text and voice memories (any Indian language) and maps each to the right check; asks, never assumes; does nothing without the investor's confirmation.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| DPDP | Using memories for this purpose must be in the consent notice, as a separate opt-in ("let Groww use my notes to help keep my SIP working"); off by default | OK with this rule |
| SEBI | Operational checks, not advice | OK |
| Bank, NPCI, RBI | Any AutoPay change is authenticated by the investor | OK |
| CCPA | One question per chapter; dismissible | OK |

### 9. A safety net inside the promise
- **Logic:** the day-1 promise is emotional; it should also be practical. Insurance policies carry rules that stop them lapsing; a SIP does not.
- **What it is:** when recording the promise, one more choice: "If money gets tight, I would rather pause than stop." If instalments then fail, Groww requests the fund house's pause before SEBI's three-miss cancellation, tells the investor with the resume date, and offers an undo.
- **Targets:** payment problems turning into exits: a failed instalment is followed by a stop in 84% of 135 stories.
- **AI:** reads why the instalment failed. A pause helps only when money was short; if the AutoPay is on a closed account or KYC blocks the order, it routes to that fix instead.
- **Compliance:**
| Actor | What it means for them | Verdict |
|---|---|---|
| SEBI | The three-miss rule is untouched; the pause is the investor's own instruction | OK |
| AMC and RTA | Only where the fund house offers a pause; requests need 15–21 days' notice ([AMC pause terms](https://www.valueresearchonline.com/stories/52346/want-to-pause-sip-investments-all-you-need-to-know/)); whether a pause is accepted right after missed instalments is an open question for AMCs | Open question |
| Bank, NPCI, RBI | No debits during the pause; the mandate is unchanged | OK |
| CCPA | Opt-in; cancel stays one step away; undo offered | OK |

### 10. A shared locker
- **Logic:** in the interviews, the person who steadied a wobbling investor was a friend, a colleague or a brother, not the app.
- **What it is:** the investor can add one person they trust (a partner, a sibling, a parent) to see the locker: slips and memories, with amounts hidden unless the investor chooses to show them. That person can leave a note in the locker. They cannot see the account or act on it.
- **Targets:** doubt and the SIP feeling solitary; 6 of 8 interviewees considered a change after red numbers, and 4 of those 6 were steadied by a friend, colleague or brother (P02, P03, P04, P05).
- **AI:** none essential.
- **Compliance:** the investor chooses what to share (DPDP consent from both people); no account access, so no SEBI or bank issue; either side can leave at any time. OK.

### 11. A letter home
- **Logic:** many first-time investors' parents trust FDs and gold, not "the market". Explaining a SIP at home is hard, and an unexplained SIP is easier to stop.
- **What it is:** one tap creates a formal letter, in the language the investor picks (Hindi, Marathi, Tamil and others), that explains their own SIP to their family: what a mutual fund is, that it is regulated by SEBI, what they have invested and own, how it differs from an FD, and that money can be withdrawn. The investor reads it before sharing it.
- **Targets:** not understanding investing (explaining it helps the investor understand it too) and outside pressure to stop.
- **AI:** writes the letter from the investor's own facts in a formal register, in the chosen language; no returns, predictions or comparisons beyond the factual differences from an FD.
- **Compliance:** factual and the investor's own information; no performance claims, so no advertising-code issue; shared only by the investor. OK.

### 12. Your first year, as a story
- **Logic:** this generation keeps its years as recaps. A first year of investing deserves one, built from the investor's own months.
- **What it is:** part of the month-11 renewal (idea 7): a short story of the year, month by month, made from the investor's memories and slips ("June: the first instalment from your new account"). A shareable version leaves out amounts and fund names.
- **Targets:** the twelve-month mark itself.
- **AI:** composes the story only from the investor's entries; every fact is traceable to a slip or a memory.
- **Compliance:** the shared version carries no fund names or returns (no scheme promotion); no performance claims. OK.

**Across all of these:** every feature works by voice, in the investor's language.

**Set aside:** streaks or badges (pressure, and gamified finance draws regulators' attention); share cards showing funds or returns (could read as scheme promotion); a mailed physical gift (inducement); Groww delivering letters to other people (consent and delivery it cannot guarantee).

## 4. Side by side

| # | Idea | Reason it targets | Borrowed feeling | AI's job | Build |
|---|---|---|---|---|---|
| 1 | The SIP locker | Expense feeling; payment problems | The family locker, the FD receipt | Slip writer, failure explainer, memory notes | v1 today |
| 2 | Your month, your money | Not understanding | Learning from your own life | Two checked sentences per month | v1 today |
| 3 | The promise, refitted | Day-1 decision stops fitting | Your own voice | Read the life change, pick fitting options | v1 today |
| 9 | Safety net inside the promise | Payment problems → auto-cancel | Insurance lapse rules | Route by failure cause | v1 today |
| 8 | Life chapters | Payment problems; day-1 fit, before they happen | Memories as signals | Detect life changes, ask the right question | v1 today |
| 5 | Certificate of holding | Ownership at month 12 | The FD certificate | Check figures, write the dedication | v1 today |
| 6 | Dedicated to someone | Expense feeling | Investing for family | None | v1 today (cover) |
| 10 | Shared locker | Doubt; investing alone | The person who steadies you | None | v1.1 |
| 11 | A letter home | Understanding; family pressure | The family conversation | Formal letter in the chosen language | v1.1 |
| 7 + 12 | First-year renewal and story | The month-12 cliff | Policy renewal; year recaps | Compose the year from own entries | v1.1 |
| 4 | What your money owns | Understanding; red numbers | Visiting your property | Answer from the portfolio disclosure | Phase 2 |

## 5. One product: the SIP locker
**v1, built today:** the locker (1) with its cover and dedication (6); slips, memories and empty slots for failed months; the month story (2); the day-1 promise (3) with its safety net (9); life chapters (8); the certificate (5).

**v1.1, before the test rounds:** the shared locker (10), the letter home (11), the first-year renewal and story (7, 12).

**Phase 2:** what your money owns (4).

**AI jobs with golden sets:**
- **Slip writer:** normal and failed months → a plain slip with the fix (real failure texts from the 135 coded stories);
- **Month story:** facts plus memory → two sentences, every number checked, no predictions;
- **Promise and safety net:** day-1 note → goal, person and horizon; failure or life change → the fitting route (pause, fix the account, move the date), no amounts, no guilt;
- **Life chapters:** memory → life change detected or not, and the right question (memories written for the test, in several languages);
- **Letter home (v1.1):** facts → a formal letter in the chosen language, every fact traceable.

A visible check runs before anything is shown: numbers match the slip; no advice, urgency or guilt words; no account-number patterns. If it fails, a plain template is shown instead, marked as the fallback.
