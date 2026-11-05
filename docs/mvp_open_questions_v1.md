# The SIP locker: open questions answered

**Version** v1, 5 Nov 2026. Built by `analysis/build_mvp_open_questions_v1.py`; numbers are read from the result files. It answers the project owner's questions of 5 Nov (10:50 IST) before the build starts. Nothing here is decided until the owner approves.

## 1. Short answers
| Question | Answer |
|---|---|
| Which Part 5 category? | **A feature within the product** (the home of each SIP in Groww's SIPs section), with **an AI-powered workflow** at the moment an instalment fails or the investor wants to stop. It is not an agent (it never acts on its own) and not standalone. |
| Is 8 features too much? | **As eight separate features, yes.** Mentors judge one mechanism with visible states. As **one product with four surfaces and one central AI feature**, no (section 3). |
| What problem statement does it answer? | First-year SIPs end at a break (a failed instalment, a cash shock, a change in life) because the SIP feels like an expense, the break is silent or confusing, and there is no way through or back (section 4). |
| Are we solving it? | **Yes for two of the three root causes, with strong evidence** (silent breaks; no way back). **Partly for the third** (no personal meaning), where the evidence is real but correlational, so Part 6 must test it. Payment failures are handled at the first failure, not prevented (section 5). |
| The judging factors | Solves the problem: strong at breaks. Business value: Active@12 through survival and recovery, plus support and platform retention. Hard to copy: low at launch, rising with every month of a user's history. Creativity: high, and native to money (section 7). |

## 2. Category
The locker sits inside Groww's existing SIP page: every SIP gets its locker, and the break flow opens from the failed month or from Cancel. Our prototype runs on its own URL only because we cannot ship inside Groww. Of the four Part 5 forms it is **"a feature within the product you have chosen"**, built around **"an AI-powered workflow"** (understanding what happened or what the investor says at a break, then offering the right fact and next step). It is not "an AI agent", because it never moves money or changes a SIP by itself, and not "a standalone experience", because it lives in the SIP's own page.

## 3. Eight features → one product, four surfaces, one central AI
| Surface | Features merged into it | What the investor does |
|---|---|---|
| **The locker** (the SIP's home) | F1 slips, memories, cover and dedication; F7 hard months; F2 the month story on each slip | Sees every month, including failed and skipped ones; adds a memory |
| **The break flow** | F3 the day-1 promise; F6 the return date and pause-until; the failed-month fix | Tells the locker what is happening; gets the right path and a return date |
| **Ask your locker** | F5 | Asks anything about their own SIP; fund questions are declined |
| **Year one** | F8 the first-year story; F4 the certificate | Looks back; prints a keepsake |

**The central eval-gated AI feature, the break assistant:** one assistant with one job at every break. It reads what happened (a failure reason or a bank message) or what the investor says (in any language), then answers with the fact that applies and the next step, from the investor's own locker and the rules. It never advises; it declines and points to an official source when it should. It serves the failed slot, the break flow and Ask. One golden set covers it, sliced by moment:
- real failure descriptions (135 coded; the scored set excludes the code 'other');
- stop reasons;
- return dates;
- locker questions, including must-decline ones.

The month story, the promise summary and the year story are smaller AI touches behind the same check. The certificate needs no AI.

## 4. The problem statement, reverse-engineered
> **In their first year, first-time investors on Groww experience their SIP as a monthly debit rather than something they are building. When a break comes (a failed instalment, a cash shock, a change in their life), nothing in the product shows them clearly what happened, connects them back to why they started, or gives them a way to pause and return. So a break they meant to be temporary becomes a permanent exit: first-year exits are mostly about being unable to continue, not unwilling, and those who leave want to come back but do not.**

**Who:** first-time mutual-fund investors whose first SIP is on Groww, in months 1–12. **Outcome:** Active@12.

### Root causes and their evidence

**R1. Breaks are where first-year SIPs end.**
- Part 1: a failed instalment is followed by a stop in 84% of 135 labelled stories (Reddit alone 83% of 41), and by a full exit in 41%. After seeing a loss the figures are 27% and 8%.
- Other breaks: the first debit or the gap before it (71% of 111); a life event or cash need (56% on Reddit, n=41).
- Full exits are about ability, not will: money, app and cash problems are 69% of stated causes (148 exits with a stated cause); returns and market views 13%. In posts about Groww, returns are 0%.
- Interviews: 5 of 8 had stopped. 4 of those exits followed a break in life: job loss (P01), a job switch with a new salary account (P04), a stipend ending (P07), a family emergency (P08). They came after 3 to 11 paid months.

**R2. The break is silent or confusing.**
- Interviews: P04, as coded: "Sep and Oct instalments failed; saw a failure message and dismissed it; the listed SIP and next date looked like proof it was running; the moving portfolio value hid the missing contributions; found both failures only during the interview". 6 of 8 follow their SIP through bank SMS, not the app.
- Part 1: debited but no units: 91% stopped (n=33). The commonest confusions in stop stories (n=306) are skip, pause or cancel (20%), the SIP date and first debit (20%), where the money went (17%) and order status (16%). Support was "not resolved" in 40% of stoppers' in-app attempts (n=256).

**R3. The SIP has no personal meaning to hold onto.**
- Part 1: continuers name a long-term view as what kept them going in 71% [65–76] of early-journey cases, against 49% [36–62] for those who later stopped (difference 22 points, CI [7–37]).
- Starters with a specific goal: 26% [21–31] of continuers against 16% [11–22] of stoppers (difference CI [2–18]). Stoppers more often started because a friend or colleague did (22% vs 16%) or to save tax (16% vs 6%).
- Interviews: the wobblers who were steadied were steadied by someone asking them to look again at their own intent: P02 (colleague asked what period he was comparing), P03 (friend asked what she had expected so quickly). The monthly touchpoint for 6 of 8 is a debit message.
- **Caveat:** this evidence is correlational and self-reported. The locker's emotional layer is the creative bet that Part 6 tests.

**R4. There is no way through or back.**
- Groww: a one-instalment skip only (its 1 help page titled "pause" describes a skip); cancelling cannot be undone; 0 help pages are titled for restarting.
- Interviews: a one-month skip did not fit what 6 of 8 needed. 5 of 5 leavers want or might want to return; 0 have. P01 "paused then never restarted" ("unsure the paused SIP can be restarted"). P08, as coded: "depends on when family costs settle; a break with a set return point might have brought him back". P07: "no income until a full-time job".
- Part 1: 19 stories with a restart against 394 with a stop. Using a skip or pause instead is named in only 1.4% of stories that say what kept the investor going (n=3180).

**Secondary: understanding and red numbers.**
- 8 of 8 saw red; 4 of 8 confused their own return with the fund's.
- Returns are the main reason in 42% of stories about considering a stop, but only 13% of full exits.

## 5. Does the locker solve it?
| Root cause | What answers it | Evidence strength | Verdict |
|---|---|---|---|
| R1 breaks end SIPs | The break flow at the first failure and at Cancel; pause until a return date for cash shocks | Strong | **Answered at the break, not prevented** |
| R2 silent, confusing breaks | The failed month as an empty slot with the reason and the fix; the break assistant; Ask | Strong (P04; failure and confusion data) | **Solved** |
| R3 no personal meaning | Promise in their own voice; memories; dedication; month story in their own life; year one | Correlational (goal and long-term-view gaps; re-anchoring in interviews) | **Addressed; the bet to test in Part 6** |
| R4 no way through or back | Return date (date or milestone), pause until then where allowed, the locker kept open with the plan ready; hard months recorded without shame | Strong (5 of 5 want to return, 0 have; P01, P08) | **Solved** |
| Secondary: understanding | Month story; Ask | Moderate | **Addressed** |

**The gap a mentor will press on: payment failures are the top exit moment.** The locker does not prevent a first failure; it makes it impossible to miss and routes it correctly.
- A failed month opens the break assistant at once (a notification and the empty slot).
- SEBI's rule leaves two more instalments before a monthly SIP is cancelled, so the first failure is the moment to act.
- The assistant routes a bank change to the AutoPay fix, a short balance to Pay Now or a pause until a date, and an unclear reason to support.
- P04 found both of his failures only during the interview; this design surfaces the first one the day it happens.

**Proposed change (needs approval):** make the failed slot open the break flow proactively. This re-adds none of the rejected features.

## 6. The metric link (Part 2)
Active@12 follows a(m) = a(m−1)·s(m) + (1−a(m−1))·r(m):
- **s(m), survival in month m:** raised where breaks happen. Failures are fixed at the first miss; cash shocks become pauses that resume on a date the investor chose; the promise is there at the break.
- **r(m), recovery:** raised from near zero by the committed return date and the plan kept ready.

One honest limit: a SIP that is paused during month 12 counts as inactive. Pauses are capped by fund houses (the demo uses 3 months), so a cash shock early in the year resumes before month 12.

## 7. The four judging factors

### Does it solve the problem?
Strong at the moments the evidence points to: silent failures, cash and life breaks, the cancel screen, and the way back. The emotional layer is a reasoned bet with supporting evidence, not proof.

### Does it add business value?
- **Active@12** through s(m) and r(m), above.
- **Platform retention:** SIP-first users are a large share of Groww's new users (`groww-baseline.md`). An investor whose first SIP lapses has little reason to open the app.
- **Support cost:** failure and cancel questions are answered in the product. Support was "not resolved" in a large share of stoppers' attempts.
- **Differentiation:** every direct-plan app sells the same funds at no commission, so the experience is what competes.
- **Costs:** storage, AI calls, DPDP compliance, and hosting private user content (keep it private and unshared).

### How easily can rivals copy it?
- **Easy to copy:** the screens, a memories feature, a certificate, a question box.
- **Hard to copy:**
  1. **The investor's own history.** Every month adds slips and memories, so moving to another app means starting an empty locker; a rival launching later starts at zero for this cohort.
  2. **The break assistant's accuracy.** It depends on failure reasons from order flow, and Groww sees the largest flow of new SIPs, so its failure set grows fastest.
  3. **Pause until a return date.** It needs fund-house terms, BSE's pause facility and compliance work.
  4. **Trust:** DPDP-compliant memory storage and SEBI-safe AI are slow to build well.
- **Verdict:** low at launch, rising with time. To strengthen it: make the locker the SIP's default home, so history accrues even for people who never add a memory.

### Creativity
A money-native emotional object (the locker, the FD-like certificate), the investor's own voice, and a committed return date. The risk is that memories alone read as a gimmick; anchoring them in the break moments is what makes them a product.

## 8. Where AI earns its place, and what a non-AI version would miss
| Moment | Non-AI version | What it misses | What the AI does |
|---|---|---|---|
| A failed month | A status code and "check with your bank" (Groww today) | Cryptic reasons; whose fix it is | Reads the reason or bank message and states the cause and the fix |
| "I want to stop" | A reason picker and a cancel button | Nuance ("salary now goes to a new bank" needs an AutoPay fix, not a pause); Hinglish; distress | Reads the reason in the investor's words, picks the fitting path, switches to a plain tone for distress |
| The return date | A date picker | "After my sister's wedding", "my birthday", "when I join in July" | Turns words into a date, and asks to confirm when the phrase is vague |
| A question | Help articles | The investor's own months and units | Answers from the locker and the rules; declines advice; points to the source |
| A memory | A photo album | What the month meant for their money | Two checked sentences linking their month to their units |

## 9. The interface
The prototype will closely follow Groww's layout and interaction patterns: clean white screens, card lists, a bottom navigation bar, a green accent, the "My SIPs" structure. It will carry no Groww logo, wordmark or other trademark, and every page will say it is a concept prototype, not affiliated with Groww.

## 10. For the owner to decide
1. The problem statement in section 4 (or edits).
2. Eight features as four surfaces with one central AI feature, the break assistant.
3. The failed month opening the break flow proactively.
4. Year one (story and certificate) in v1 as the fourth surface, or dropped to keep v1 tighter.
