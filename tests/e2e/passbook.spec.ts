import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function fakeMicrophone(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest);
      osc.start();
      return dest.stream;
    };
  });
}

const screenshotsDir = path.resolve(process.cwd(), "reports/screenshots");

test.describe("SPEC-07 End-to-End Suite", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  // Task 1: 5 Nov entry details & explainer
  test("Task 1: November entry shows debited, order placed, units pending with as_of, explainer answers", async ({
    page,
  }) => {
    // Check /passbook shows "Units not confirmed yet"
    await page.goto("/passbook");
    await expect(page.getByText("Units not confirmed yet").first()).toBeVisible();

    await page.goto("/passbook/inst-2026-11-05");
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.getByText(/Bank debit|debit/i).first()).toBeVisible();
    await expect(page.getByText(/Order placed|order/i).first()).toBeVisible();
    await expect(page.getByText("Not confirmed yet").first()).toBeVisible();
    await expect(page.getByText(/Nov.*2026/i).first()).toBeVisible();

    // "What does this mean?" question click
    const questionBtn = page.getByRole("button", {
      name: /Why are my units not visible yet\?/i,
    });
    await expect(questionBtn).toBeVisible();
    await questionBtn.click();

    // Verify explainer response
    await expect(page.getByText(/units are not confirmed yet/i)).toBeVisible({
      timeout: 15000,
    });

    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: path.join(screenshotsDir, "03_entry_nov_explainer.png"),
        fullPage: true,
      });
    }
  });

  // Task 2: May failed & September refunded
  test("Task 2: May shows Not debited with reason, September shows Refunded", async ({
    page,
  }) => {
    // Check May entry
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByText(/insufficient balance/i).first()).toBeVisible();
    await expect(page.getByText(/Nothing was taken from your bank account/i)).toBeVisible();
    await expect(page.getByText(/How do I pay a missed SIP installment\?/i).first()).toBeVisible();

    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: path.join(screenshotsDir, "04_entry_may.png"),
        fullPage: true,
      });
    }

    // Check September entry
    await page.goto("/passbook/inst-2026-09-05");
    await expect(page.getByText(/order was not accepted/i).first()).toBeVisible();
    await expect(page.getByText(/amount is refunded to your bank account/i)).toBeVisible();
  });

  // Task 3 (final MVP): What can I do next? Six equal cards in two groups, Stop card shows SEBI's rule and Groww's two pages
  test("Task 3: What can I do next? shows 6 equal cards in 2 groups, no recommended, Stop notice, Manage SIP note", async ({
    page,
  }) => {
    await page.goto("/options");
    await expect(page.getByRole("heading", { name: "What can I do next?", level: 1 }).last()).toBeVisible();
    await expect(page.getByTestId("option-group")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Change future instalments" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stop, and come back later" })).toBeVisible();
    for (const t of ["Keep as is", "Change the AutoPay bank", "Change amount or date", "Skip one instalment", "Restart later"]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Stop", exact: true })).toBeVisible();
    await expect(page.getByText(/Pause \(where the fund house allows\)/)).toHaveCount(0);

    const cards = page.locator('[data-testid="option-card"]');
    await expect(cards).toHaveCount(6);
    const heights: number[] = [];
    for (let i = 0; i < 6; i++) {
      const card = cards.nth(i);
      const metrics = await card.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
      const box = await card.boundingBox();
      if (box) heights.push(Math.round(box.height));
    }
    expect(new Set(heights).size).toBe(1);
    await expect(page.getByText(/recommended/i)).not.toBeVisible();

    // Stop card: SEBI's 2-working-day rule and both Groww pages
    const stop = page.locator("#stop");
    await stop.getByRole("button", { name: "Read the rule" }).click();
    await expect(stop.getByText(/processed within 2 working days/i)).toBeVisible();
    await expect(stop.getByTestId("cancel-notice")).toContainText("3 days");
    await expect(stop.getByTestId("cancel-notice")).toContainText("7 working-day");

    const manageBtn = page.getByRole("button", { name: /Manage SIP in the Groww app/i });
    await manageBtn.click();
    await expect(page.getByText(/In the real app this opens Manage SIP. Nothing is changed in this prototype./i)).toBeVisible();
  });

  // Task 4: Cover totals
  test("Task 4: Cover shows 5 Oct 2026, 158.513 units, ₹16,000, no current value", async ({
    page,
  }) => {
    await page.goto("/passbook");
    await expect(
      page.getByText(/Last fully confirmed instalment:.*5 Oct 2026/i)
    ).toBeVisible();
    await expect(page.getByTestId("what-you-own")).toBeVisible();
    await expect(page.getByText("158.513")).toBeVisible();
    await expect(page.getByText("₹16,000")).toBeVisible();
    // No passbook name on the cover (owner, 8 Nov)
    await expect(page.getByText("My first bike")).toHaveCount(0);

    // No current value on cover
    await expect(page.getByText(/current value/i)).not.toBeVisible();
    await expect(page.getByText(/₹15,534/)).not.toBeVisible();

    // CAS line
    await expect(
      page.getByText(/Your official record is your Consolidated Account Statement \(CAS\)/i)
    ).toBeVisible();

    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: path.join(screenshotsDir, "01_passbook_running.png"),
        fullPage: true,
      });
    }
  });

  // Task 5: Stopped scenario
  test("Task 5: Stopped scenario shows stamp, stop != sell note, no restart button", async ({
    page,
  }) => {
    // Set scenario to stopped in demo tools
    await page.goto("/demo-tools");
    await page.getByLabel("stopped").check();

    await page.goto("/passbook");
    await expect(page.getByText(/Stopped on 20 Oct 2026/i)).toBeVisible();
    await expect(
      page.getByText(
        /Stopping ends future instalments. It does not sell your units: your 158.513 units stay in your folio/i
      )
    ).toBeVisible();

    // No restart button or nudge
    await expect(page.getByRole("button", { name: /restart/i })).not.toBeVisible();

    // All previous entries stay visible
    await expect(page.getByText("5 Oct 2026").first()).toBeVisible();
    await expect(page.getByText("5 Dec 2025").first()).toBeVisible();

    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: path.join(screenshotsDir, "02_passbook_stopped.png"),
        fullPage: true,
      });
    }

    // Reset back to running
    await page.goto("/demo-tools");
    await page.getByLabel("running").check();
  });

  // Task 6: Stale scenario
  test("Task 6: Stale scenario shows can't confirm latest status right now", async ({
    page,
  }) => {
    await page.goto("/demo-tools");
    await page.getByLabel("stale").check();

    await page.goto("/passbook");
    await expect(
      page.getByText("Can't confirm right now").first()
    ).toBeVisible();
    await expect(page.getByText(/as of 5 Nov 2026, 11:40 IST/i).first()).toBeVisible();

    if (page.viewportSize()?.width === 390) {
      await page.screenshot({
        path: path.join(screenshotsDir, "02b_passbook_stale.png"),
        fullPage: true,
      });
    }

    // The money is not in doubt: the debit and order are confirmed, only the units step is unknown
    await page.goto("/passbook/inst-2026-11-05");
    await expect(page.getByText("Your bank confirmed the debit on 5 Nov 2026, 09:12 IST and the order was placed. Only the units step can't be confirmed right now.")).toBeVisible();
    await expect(page.getByText("Not known yet.")).toHaveCount(0);

    // Reset back to running
    await page.goto("/demo-tools");
    await page.getByLabel("running").check();
  });

  // Task 7 (final MVP): version A has no personal layer; version B has why I started, memories and Ask a friend
  test("Task 7: Version A hides the personal layer; Version B shows it; nav has three tabs", async ({ page }) => {
    await page.goto("/demo-tools");
    await page.getByLabel("Version A (ledger only)").check();
    await page.goto("/passbook");
    await expect(page.getByTestId("personal-layer")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-10-05");
    await expect(page.getByTestId("memory-card")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByRole("button", { name: /Ask a friend about this/ })).toHaveCount(0);

    await page.goto("/demo-tools");
    await page.getByLabel("Version B (personal layer)").check();
    await page.goto("/passbook");
    await expect(page.getByTestId("personal-layer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Write why you started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Record it" })).toBeVisible();
    await expect(page.locator("a[href='/family-file']")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByRole("button", { name: /Ask a friend about this/ })).toBeVisible();

    const nav = page.locator("nav").last();
    await expect(nav.getByRole("link")).toHaveCount(3);
    await expect(nav.getByRole("link", { name: "Passbook" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Ask" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Next steps" })).toBeVisible();
  });

  // Task 8 (final MVP): a memory for a month (photo + line), shown on the passbook; deleted from Your data
  test("Task 8: Add a photo and a line to October, see it on the passbook, then delete it", async ({
    page,
  }) => {
    await page.goto("/demo-tools");
    await page.getByLabel("Version B (personal layer)").check();

    // Allotted month: gentle invitation
    await page.goto("/passbook/inst-2026-10-05");
    const card = page.getByTestId("memory-card");
    await expect(card.getByText(/Keep something from Oct 2026 for your future self/)).toBeVisible();
    await card.getByRole("button", { name: "Add a memory to Oct 2026" }).click();
    await card.getByLabel("Choose a photo for Oct 2026").setInputFiles(path.resolve(process.cwd(), "tests/fixtures/photo-with-gps.jpg"));
    await expect(card.getByRole("img", { name: "Selected photo" })).toBeVisible({ timeout: 10000 });
    await card.getByLabel("A line").fill("First month at the new job");
    await card.getByRole("button", { name: "Save memory" }).click();
    await expect(card.getByTestId("memory-text")).toHaveText(/First month at the new job/);
    await expect(card.getByTestId("memory-photo")).toBeVisible();

    // Failed month: no invitation, but adding stays possible
    await page.goto("/passbook/inst-2026-05-05");
    const may = page.getByTestId("memory-card");
    await expect(may.getByText(/for your future self/)).toHaveCount(0);
    await expect(may.getByRole("button", { name: "Add a memory to May 2026" })).toBeVisible();

    // Passbook row shows the memory mark; survives a reload (stored on the device)
    await page.goto("/passbook");
    await expect(page.getByTestId("memory-indicator")).toHaveCount(1);
    await page.reload();
    await expect(page.getByTestId("memory-indicator")).toHaveCount(1);

    // Your data: delete all memories
    await page.goto("/your-data");
    await expect(page.getByTestId("delete-section")).toContainText("1 memory");
    await page.getByRole("button", { name: "Delete all memories" }).click();
    await expect(page.getByTestId("delete-section")).toContainText("0 memories");
    await page.goto("/passbook");
    await expect(page.getByTestId("memory-indicator")).toHaveCount(0);
  });

  // Task 9: notices on every page; removed pages redirect; no Groww logo; no /locker links
  test("Task 9: Notices on every page, removed pages redirect, no Groww logo asset, no link to /locker", async ({ page }) => {
    const pages = ["/", "/passbook", "/passbook/inst-2026-11-05", "/ask", "/options", "/quality", "/your-data", "/demo-tools"];
    for (const url of pages) {
      await page.goto(url);
      await expect(
        page.getByText("Concept prototype, not affiliated with Groww. All data is synthetic demo data.").first()
      ).toBeVisible();
      expect(await page.locator("a[href*='/locker']").count()).toBe(0);
      expect(await page.locator("a[href='/settings'], a[href='/signin'], a[href='/consent'], a[href='/thread'], a[href='/markers'], a[href='/family-file']").count()).toBe(0);
    }
    for (const [from, to] of [["/settings", "/your-data"], ["/signin", "/your-data"], ["/consent", "/your-data"], ["/thread", "/passbook"], ["/markers", "/passbook"], ["/family-file", "/passbook"]]) {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(to + "$"));
    }

    await page.goto("/passbook/inst-2026-11-05");
    await expect(page.getByText(/Not investment advice/i).first()).toBeVisible();
    await page.goto("/options");
    await expect(page.getByText(/Not investment advice/i).first()).toBeVisible();

    await page.goto("/passbook");
    const growwImages = await page
      .locator("img[src*='groww-logo'], img[src*='groww_logo'], img[src*='groww-wordmark'], img[src*='groww_wordmark']")
      .count();
    expect(growwImages).toBe(0);
  });

  // Task 10: Aborted/failing sensecheck request shows neutral message
  test("Task 10: Aborted/failing sensecheck on /passbook/inst-2026-05-05 shows neutral message", async ({
    page,
  }) => {
    await page.route("**/api/ai/sensecheck", (route) => route.abort());
    await page.goto("/passbook/inst-2026-05-05");

    const questionBtn = page.getByRole("button", {
      name: /Why did my May instalment fail\?/i,
    });
    await expect(questionBtn).toBeVisible();
    await questionBtn.click();

    await expect(
      page.getByText(
        "Sensecheck can't answer right now. The entry above shows the latest confirmed status."
      )
    ).toBeVisible({ timeout: 10000 });
  });

  // Task 11 (final MVP): Ask a friend builds a plain first-person message the investor sends from their own app
  test("Task 11: Ask a friend about the failed May instalment: own words, no references, WhatsApp link, name stays on device", async ({ page }) => {
    await page.goto("/demo-tools");
    await page.getByLabel("Version B (personal layer)").check();
    await page.goto("/passbook/inst-2026-05-05");
    await page.getByRole("button", { name: "Ask a friend about this" }).click();
    const panel = page.getByTestId("ask-friend");
    await expect(panel).toContainText("nothing goes through Groww");
    await expect(page.getByTestId("friend-safety")).toContainText("Never send OTPs, PINs, passwords or full account numbers");
    await expect(page.getByTestId("friend-safety")).toContainText("isn't financial advice");

    const message = page.getByLabel(/Your message/);
    await expect(message).toHaveValue(/^Hi, can I ask you something about my SIP\?/);
    await expect(message).toHaveValue(/didn't go through/);
    await expect(message).toHaveValue(/insufficient balance/);
    await expect(message).toHaveValue(/\(Sample data from a concept prototype\.\)$/);
    const value = await message.inputValue();
    expect(value).not.toMatch(/BNK-|ORD-|REG-|folio|Nifty/i);

    // A first name updates the greeting and stays on the device
    await page.getByLabel(/Their first name/).fill("Demo");
    await expect(message).toHaveValue(/^Hi Demo, /);
    await page.getByRole("button", { name: "Remember" }).click();
    await expect(panel.getByRole("status")).toHaveText("Saved on this device.");
    const href = await page.getByTestId("friend-whatsapp").getAttribute("href");
    expect(href!.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(href!.slice("https://wa.me/?text=".length))).toBe(await message.inputValue());

    // Edits are the investor's own and go into the link
    await message.fill("Hi Demo, my May SIP didn't go through. Seen this?");
    expect(decodeURIComponent((await page.getByTestId("friend-whatsapp").getAttribute("href"))!.split("text=")[1])).toBe(
      "Hi Demo, my May SIP didn't go through. Seen this?"
    );

    await page.reload();
    await expect(page.getByRole("button", { name: "Ask Demo about this" })).toBeVisible();

    // Your data lists the name and can forget it
    await page.goto("/your-data");
    await expect(page.getByTestId("delete-section")).toContainText("your friend's first name");
    await page.getByRole("button", { name: "Forget my friend's name" }).click();
    await expect(page.getByTestId("delete-section")).toContainText("no friend's name");
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByRole("button", { name: "Ask a friend about this" })).toBeVisible();
  });

  // Task 12: Timezone America/New_York displays 5 Oct 2026 on cover
  test("Task 12: Timezone America/New_York displays 5 Oct 2026 on cover", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      timezoneId: "America/New_York",
    });
    const page = await context.newPage();
    await page.goto("/passbook");
    await expect(
      page.getByText(/Last fully confirmed instalment:.*5 Oct 2026/i)
    ).toBeVisible();
    await context.close();
  });

  // Task 13 (R42, updated for the final MVP): the links between pages
  test("Task 13: Flow links between passbook, entry, Ask, What can I do next?, Quality and Your data", async ({ page }) => {
    // Home task 2 opens the May entry
    await page.goto("/");
    await page.getByRole("link", { name: /The May instalment failed/i }).click();
    await expect(page).toHaveURL(/\/passbook\/inst-2026-05-05$/);

    // Cover's latest line opens that instalment; the UPI line explains the wait
    await page.goto("/passbook");
    await page.getByTestId("latest-line").click();
    await expect(page).toHaveURL(/\/passbook\/inst-2026-11-05$/);
    await expect(page.getByTestId("upi-line")).toContainText("UPI moves money in seconds");
    await expect(page.getByTestId("upi-line")).toContainText("T+2");

    // Entry → Ask with the entry selected; AI disclosure visible
    await page.getByRole("link", { name: "Ask your own question" }).click();
    await expect(page).toHaveURL(/\/ask\?entry_id=inst-2026-11-05/);
    await expect(page.locator("#entry-picker")).toHaveValue("inst-2026-11-05");
    await expect(page.getByTestId("ai-disclosure")).toContainText("written by an AI model");
    await expect(page.getByRole("link", { name: /Open the 5 Nov 2026 entry/i })).toBeVisible();

    // An advice question is shown as declined, with the link to how answers are checked
    await page.getByLabel("Your question").fill("Which fund should I switch to?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByTestId("answer-state").last()).toHaveText(/Declined: not advice/);
    await page.getByRole("link", { name: "How answers are checked" }).last().click();
    await expect(page).toHaveURL(/\/quality$/);
    await expect(page.getByTestId("off-switch")).toContainText("One setting turns the AI off");
    await expect(page.getByText(/Future Thread one-line tidy/)).toHaveCount(0);
    await expect(page.getByText(/later cut from the product; only Sensecheck is live/)).toBeVisible();

    // Entry → What can I do next?
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByTestId("upi-line")).toHaveCount(0);
    await page.getByRole("link", { name: "What can I do next?" }).click();
    await expect(page).toHaveURL(/\/options$/);

    // Read the rule, then ask about it
    const skip = page.locator("#skip-one-instalment");
    await skip.getByRole("button", { name: "Read the rule" }).click();
    await expect(skip.getByText(/you can skip only one SIP installment at a time/i)).toBeVisible();
    await expect(skip.getByRole("link", { name: /Source: What is the maximum period/i })).toBeVisible();
    await skip.getByRole("link", { name: "Ask about this" }).click();
    await expect(page).toHaveURL(/\/ask\?q=/);
    await expect(page.getByLabel("Your question")).toHaveValue("What happens if I skip next month?");

    // Entry answer → How answers are checked (AI off in tests: standard answer)
    await page.goto("/passbook/inst-2026-11-05");
    await page.getByRole("button", { name: "Why are my units not visible yet?" }).click();
    await expect(page.getByTestId("answer-state")).toHaveText(/Standard answer|Checked/);
    await expect(page.getByRole("link", { name: "How answers are checked" })).toBeVisible();
    await expect(page.getByText(/rule-[a-z]/)).toHaveCount(0);

    // Account icon → Your data
    await page.getByRole("link", { name: "Your data and privacy" }).click();
    await expect(page).toHaveURL(/\/your-data$/);
    await expect(page.getByText(/What you add stays on this device/)).toBeVisible();

    // Stopped scenario → how restarting works opens the Restart card
    await page.goto("/demo-tools");
    await page.getByLabel("stopped").check();
    await page.goto("/passbook");
    await page.getByRole("link", { name: "How restarting works" }).click();
    await expect(page).toHaveURL(/\/options#restart-later$/);
    await expect(page.locator("#restart-later").getByText(/You can create a new SIP in the same fund/i)).toBeVisible();
    await page.goto("/demo-tools");
    await page.getByLabel("running").check();
  });

  // Task 14 (final MVP): why I started, written and recorded; folded next to a stop
  test("Task 14: Why I started can be written or recorded, stays after reload, and folds away when stopped", async ({ page }) => {
    await fakeMicrophone(page);
    await page.goto("/demo-tools");
    await page.getByLabel("Version B (personal layer)").check();

    await page.goto("/passbook");
    const reason = page.getByTestId("reason-card");
    await reason.getByRole("button", { name: "Write why you started" }).click();
    await reason.getByLabel("Why I started").fill("To buy my first bike without a loan");
    await reason.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("reason-text")).toHaveText(/To buy my first bike without a loan/);

    // Add a voice note as well
    await reason.getByRole("button", { name: "Add a voice note" }).click();
    await reason.getByRole("button", { name: /Record a voice note/ }).click();
    await expect(reason.getByText(/Recording 0:0/)).toBeVisible();
    await page.waitForTimeout(1500);
    await reason.getByRole("button", { name: "Stop" }).click();
    await expect(reason.getByRole("button", { name: "Record again" })).toBeVisible();
    await reason.getByRole("button", { name: "Save" }).click();
    await expect(reason.getByTestId("voice-player")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("reason-text")).toHaveText(/To buy my first bike without a loan/);
    await expect(page.getByTestId("reason-card").getByTestId("voice-player")).toBeVisible();

    // Stopped SIP: the reason folds away; the investor can choose to show it
    await page.goto("/demo-tools");
    await page.getByLabel("stopped").check();
    await page.goto("/passbook");
    await expect(page.getByTestId("reason-text")).toHaveCount(0);
    await expect(page.getByText("Your reason for starting is saved.")).toBeVisible();
    await page.getByRole("button", { name: "Show", exact: true }).click();
    await expect(page.getByTestId("reason-text")).toBeVisible();

    // Reset clears it
    await page.goto("/demo-tools");
    await page.getByRole("button", { name: /Reset demo modifications/i }).click();
    await expect(page.getByText("Demo state reset!")).toBeVisible();
    await page.goto("/passbook");
    await expect(page.getByRole("button", { name: "Write why you started" })).toBeVisible();
  });
});
