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
    // Owner, 9 Nov: every month lives on its own page; November's tracker shows the units on the way
    await page.goto("/passbook/months");
    await expect(page.getByText("Waiting for units").first()).toBeVisible();
    await expect(page.getByText("On the way").first()).toBeVisible();

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
    await expect(page.getByTestId("amount-label")).toHaveText("Amount refunded");
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

    const manageBtn = page.getByRole("button", { name: /Open Manage SIP/i });
    await manageBtn.click();
    await expect(page.getByText(/Manage SIP is where you make any of these changes. Nothing is changed in this demo./i)).toBeVisible();
    // Groww's own voice (owner, 8 Nov): never "Groww already offers these"
    await expect(page.getByText(/Groww already/i)).toHaveCount(0);
  });

  // Task 4: Cover totals
  test("Task 4: Cover shows 5 Oct 2026, 158.513 units, ₹16,000 invested, ₹15,534 current value and the loss", async ({
    page,
  }) => {
    await page.goto("/passbook");
    await expect(
      page.getByText(/Last fully confirmed instalment:.*5 Oct 2026/i)
    ).toBeVisible();
    await expect(page.getByTestId("what-you-own")).toBeVisible();
    // Owner, 9 Nov: the payment route shows in the latest month's delivery line (and on each month's page)
    await expect(page.getByTestId("latest-month").getByTestId("delivery-line")).toContainText("with Groww AutoPay");
    await expect(page.getByText("158.513", { exact: true })).toBeVisible();
    await expect(page.getByText("₹16,000", { exact: true })).toBeVisible();
    // No passbook name on the cover (owner, 8 Nov)
    await expect(page.getByText("My first bike")).toHaveCount(0);

    // Owner, 8 Nov: invested vs current value, with the loss shown plainly (158.513 units x NAV 98.00 = ₹15,534)
    await expect(page.getByTestId("current-value")).toHaveText("₹15,534");
    await expect(page.getByTestId("total-returns")).toContainText("−₹466 (−2.91%)");
    await expect(page.getByText(/At NAV ₹98.00, 4 Nov 2026/)).toBeVisible();

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
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("stopped").check();

    await page.goto("/passbook");
    await expect(page.getByText(/Stopped on 20 Oct 2026/i)).toBeVisible();
    await expect(
      page.getByText(
        /Stopping ends future instalments. It does not sell your units: your 158.513 units stay in your folio/i
      )
    ).toBeVisible();

    // No restart button or nudge; one plain link to the Start SIP demo (owner, 9 Nov)
    await expect(page.getByRole("button", { name: /restart/i })).not.toBeVisible();
    await expect(page.locator("a[href='/start']")).toHaveCount(0);

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
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("running").check();
  });

  // Task 6: Stale scenario
  test("Task 6: Stale scenario shows can't confirm latest status right now", async ({
    page,
  }) => {
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("stale").check();

    await page.goto("/passbook");
    await expect(page.getByText(/as of 5 Nov 2026, 11:40 IST/i).first()).toBeVisible();
    await page.goto("/passbook/months");
    await expect(page.getByText("Can't confirm right now").first()).toBeVisible();

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
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("running").check();
  });

  // Task 7 (final MVP): version A has no personal layer; version B has why I started, memories and Ask a friend
  test("Task 7: Version A hides the personal layer; Version B shows it; nav has three tabs", async ({ page }) => {
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("Version A (ledger only)").check();
    await page.goto("/passbook");
    await expect(page.getByTestId("personal-layer")).toHaveCount(0);
    await expect(page.getByTestId("tile-goal")).toHaveCount(0);
    await page.goto("/passbook/months");
    await expect(page.getByTestId("add-memory")).toHaveCount(0);
    await page.goto("/passbook/goal");
    await expect(page).toHaveURL(/\/passbook$/);
    await page.goto("/passbook/inst-2026-10-05");
    await expect(page.getByTestId("memory-card")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByRole("button", { name: /Ask a friend about this/ })).toHaveCount(0);

    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("Version B (personal layer)").check();
    await page.goto("/passbook/months");
    // Owner, 8 Nov: a memory can be added to every month
    await expect(page.getByTestId("add-memory")).toHaveCount(12);
    await expect(page.getByRole("button", { name: "Write it" })).toHaveCount(0);
    await page.goto("/passbook");
    await expect(page.locator("a[href='/family-file']")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByRole("button", { name: /Ask a friend about this/ })).toBeVisible();

    const nav = page.locator("nav").last();
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(nav.getByRole("link", { name: "Passbook" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Ask" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Next steps" })).toBeVisible();
  });

  // Task 8 (final MVP): a memory for a month (photo + line), shown on the passbook; deleted from Your data
  test("Task 8: Add a photo and a line to October, see it on the passbook, then delete it", async ({
    page,
  }) => {
    await page.goto("/demo-tools?ab=1");
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

    // The month list shows the memory mark; survives a reload (stored on the device)
    await page.goto("/passbook/months");
    await expect(page.getByTestId("memory-indicator")).toHaveCount(1);
    await page.reload();
    await expect(page.getByTestId("memory-indicator")).toHaveCount(1);

    // Owner, 8 Nov: any month can take a memory straight from the passbook (here the failed May)
    await page.getByRole("button", { name: "Add a memory to May 2026" }).click();
    const inline = page.getByTestId("memory-card");
    await inline.getByLabel("A line").fill("Salary came late this month");
    await inline.getByRole("button", { name: "Save memory" }).click();
    await expect(page.getByTestId("memory-indicator")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "View your May 2026 memory" })).toBeVisible();

    // Your data: delete all memories
    await page.goto("/your-data");
    await expect(page.getByTestId("delete-section")).toContainText("2 memories");
    await page.getByRole("button", { name: "Delete all memories" }).click();
    await expect(page.getByTestId("delete-section")).toContainText("0 memories");
    await page.goto("/passbook/months");
    await expect(page.getByTestId("memory-indicator")).toHaveCount(0);
  });

  // Task 9: notices on every page; removed pages redirect; no Groww logo; no /locker links
  test("Task 9: Notices on every page, removed pages redirect, no Groww logo asset, no link to /locker", async ({ page }) => {
    const pages = ["/", "/passbook", "/passbook/inst-2026-11-05", "/ask", "/options", "/quality", "/your-data", "/demo-tools"];
    for (const url of pages) {
      await page.goto(url);
      await expect(
        page.getByText("Concept prototype, not affiliated with Groww. All data is synthetic demo data. Not investment advice.").first()
      ).toBeVisible();
      expect(await page.locator("a[href*='/locker']").count()).toBe(0);
      expect(await page.locator("a[href='/settings'], a[href='/signin'], a[href='/consent'], a[href='/thread'], a[href='/markers'], a[href='/family-file']").count()).toBe(0);
    }
    for (const [from, to] of [["/settings", "/your-data"], ["/signin", "/your-data"], ["/consent", "/your-data"], ["/thread", "/passbook"], ["/markers", "/passbook"], ["/family-file", "/passbook"], ["/start", "/"]]) {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(to + "$"));
    }

    await page.goto("/passbook/inst-2026-11-05");
    await expect(page.getByText(/isn't investment advice/i).first()).toBeVisible();
    await page.goto("/options");
    await expect(page.getByText(/isn't investment advice/i).first()).toBeVisible();
    await page.goto("/ask");
    await expect(page.getByTestId("ai-disclosure")).toContainText("isn't investment advice");
    // Owner, 9 Nov: no demo strip or boilerplate line under the top bar
    for (const url of ["/passbook", "/passbook/months", "/options", "/ask"]) {
      await page.goto(url);
      await expect(page.getByText("Information about your own SIP and the rules only")).toHaveCount(0);
      await expect(page.getByText("Demo data. What you add stays here.")).toHaveCount(0);
      await expect(page.locator("footer").getByRole("link", { name: "Your data" })).toHaveAttribute("href", "/your-data");
    }

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
    await page.goto("/demo-tools?ab=1");
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

    // MVP sessions, 9 Nov: the amount is left out unless the investor ticks the box
    expect(value).not.toContain("₹");
    await page.getByTestId("friend-amount-toggle").getByRole("checkbox").check();
    await expect(message).toHaveValue(/My ₹2,000 instalment for 5 May 2026/);
    await page.getByTestId("friend-amount-toggle").getByRole("checkbox").uncheck();
    await expect(message).toHaveValue(/My instalment for 5 May 2026/);

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
    // Owner, 8 Nov 23:38: Home leads with the passbook and Sensecheck, above the fold
    await page.goto("/");
    const open = page.getByRole("link", { name: "Open my passbook" });
    await expect(open).toBeVisible();
    const box = await open.boundingBox();
    expect(box && box.y + box.height).toBeLessThan(page.viewportSize()!.height);
    await expect(page.getByTestId("lock-screen")).toHaveCount(0);
    await page.goto("/passbook/inst-2026-11-05");
    await expect(page.getByTestId("second-message")).toHaveCount(0);

    // Owner, 9 Nov: no version label anywhere a mentor sees; the A/B switch is hidden without ?ab=1
    await page.goto("/demo-tools");
    await expect(page.getByText(/Version [AB]/)).toHaveCount(0);
    await expect(page.getByText("Prototype Version (A / B)")).toHaveCount(0);

    // Owner, 9 Nov: tapping a suggested question scrolls its answer into view
    await page.goto("/passbook/inst-2026-05-05");
    await page.getByRole("button", { name: /Why did my May instalment fail\?/ }).click();
    await page.waitForTimeout(900);
    const anchor = await page.getByTestId("answer-anchor").boundingBox();
    expect(anchor && anchor.y).toBeLessThan(page.viewportSize()!.height * 0.6);

    // Owner, 9 Nov: the passbook cover leads with current value; its two views are tiles above the fold
    await page.goto("/passbook");
    await expect(page.getByTestId("current-value")).toHaveText("₹15,534");
    // Owner, 9 Nov: on a phone, the latest month and both views sit above the bottom bar, no scroll
    if (page.viewportSize()!.width < 768) {
      const navTop = (await page.locator("nav").last().boundingBox())!.y;
      for (const t of ["latest-month", "tile-months"]) {
        const b = await page.getByTestId(t).boundingBox();
        expect(b && b.y + b.height).toBeLessThanOrEqual(navTop);
      }
    }
    // Owner, 9 Nov (03:47): Piece by piece removed; the latest month is a delivery tracker in delivery words
    await expect(page.getByTestId("tile-goal")).toHaveCount(0);
    await expect(page.getByTestId("latest-month")).toContainText("Tracking your 5 Nov 2026 instalment");
    await expect(page.getByTestId("latest-month").getByTestId("tracker-stop")).toHaveCount(3);
    await expect(page.getByTestId("latest-month")).toContainText("Picked up");
    await expect(page.getByTestId("latest-month")).toContainText("Handed to the fund");
    await expect(page.getByTestId("latest-month")).toContainText("On the way");
    await page.goto("/passbook");
    await page.getByTestId("tile-months").click();
    await expect(page).toHaveURL(/\/passbook\/months$/);
    await expect(page.getByText("Every month (12)")).toBeVisible();

    // Owner, 9 Nov: Home is two doors only, the passbook and Sensecheck; no task list
    await page.goto("/");
    await expect(page.getByTestId("task-card")).toHaveCount(0);
    await expect(page.locator("main").getByRole("link")).toHaveCount(2);
    await expect(page.locator("main").getByRole("link", { name: "Ask Sensecheck a question" })).toHaveAttribute("href", "/ask");
    await expect(page.locator("a[href='/start']")).toHaveCount(0);
    await page.locator("main").getByRole("link", { name: "Open my passbook" }).click();
    await expect(page).toHaveURL(/\/passbook$/);
    // Owner, 9 Nov: the latest month in the delivery format; no Start SIP link on the running passbook
    await expect(page.getByTestId("latest-month")).toContainText("Tracking your 5 Nov 2026 instalment");
    await expect(page.getByTestId("latest-month").getByTestId("delivery-line")).toContainText("Not delivered to your name yet");
    await expect(page.locator("main a[href='/start']")).toHaveCount(0);
    // Back returns to where you came from: Every month → a month → back lands on Every month
    await page.getByTestId("tile-months").click();
    await page.locator("a[href='/passbook/inst-2026-05-05']").click();
    await expect(page).toHaveURL(/inst-2026-05-05$/);
    await page.getByLabel("Go back").click();
    await expect(page).toHaveURL(/\/passbook\/months$/);
    await page.goto("/passbook");

    // Cover's latest line opens that instalment; the UPI line explains the wait
    await page.goto("/passbook");
    await page.getByTestId("latest-line").click();
    await expect(page).toHaveURL(/\/passbook\/inst-2026-11-05$/);
    await expect(page.getByTestId("upi-line")).toContainText("UPI moves money in seconds");
    await expect(page.getByTestId("upi-line")).toContainText("T+2");
    // R45: the amount says what happened to it; a pending step has no reference yet; the route is named
    await expect(page.getByTestId("upi-line")).toContainText("paid through Groww AutoPay");
    await expect(page.getByTestId("upi-line")).toContainText("T+5 or T+6");
    // MVP sessions, 9 Nov: what to do if the units are late, by Groww's own help (page 98), never a predicted date
    await expect(page.getByTestId("units-late-step")).toContainText("up to 4 working days");
    await expect(page.getByTestId("units-late-step")).toContainText("more than 6 working days");
    await expect(page.getByRole("link", { name: /Open Groww help: units not allotted yet/ })).toHaveAttribute("href", /--98$/);
    await expect(page.getByTestId("amount-label")).toHaveText("Amount debited");
    await expect(page.getByText("Not issued yet")).toBeVisible();
    await expect(page.getByText("REG-DEMO-1105")).toHaveCount(0);

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
    // Brief, 9 Nov: not investment advice, where AI earns its place, and the golden set's home in the Evidence Log
    await expect(page.getByTestId("not-advice")).toContainText("Nothing in this app is investment advice.");
    await expect(page.getByTestId("why-ai")).toContainText("Without AI:");
    await expect(page.getByTestId("golden-source").getByRole("link", { name: "Evidence Log, section 5" })).toHaveAttribute("href", "https://site-bice-three-88.vercel.app/evidence");
    await expect(page.getByText(/Future Thread one-line tidy/)).toHaveCount(0);
    await expect(page.getByText(/later cut from the product; only Sensecheck is live/)).toBeVisible();

    // Entry → What can I do next?
    await page.goto("/passbook/inst-2026-05-05");
    await expect(page.getByTestId("upi-line")).toHaveCount(0);
    await expect(page.getByTestId("amount-label")).toHaveText("Instalment amount (not debited)");
    await expect(page.getByTestId("pay-now-note")).toContainText("For this instalment, that window has closed.");
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
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("stopped").check();
    await page.goto("/passbook");
    await page.getByRole("link", { name: "How restarting works" }).click();
    await expect(page).toHaveURL(/\/options#restart-later$/);
    await expect(page.locator("#restart-later").getByText(/You can create a new SIP in the same fund/i)).toBeVisible();
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("running").check();
  });

  // Task 15 (owner, 9 Nov 03:47): the delivery tracker carries the passbook; Piece by piece is gone
  test("Task 15: Delivery tracker on a month: delivery words over banking terms with times; Piece by piece removed", async ({ page }) => {
    await page.goto("/passbook/inst-2026-11-05");
    const tracker = page.getByTestId("delivery-tracker");
    await expect(tracker).toContainText("Delivery tracker");
    await expect(tracker).toContainText("Bank debit");
    await expect(tracker).toContainText("Picked up");
    await expect(tracker).toContainText("5 Nov, 09:12");
    await expect(tracker).toContainText("Handed to the fund");
    await expect(tracker).toContainText("On the way");
    await expect(tracker.getByTestId("delivery-line")).toContainText("Not delivered to your name yet");
    await page.goto("/passbook/inst-2026-10-05");
    await expect(page.getByTestId("delivery-tracker")).toContainText("Delivered: 18.709 units");
    await page.goto("/passbook/goal");
    await expect(page).toHaveURL(/\/passbook$/);
    expect((await page.request.get("/illustrations/piece-home.svg")).status()).toBe(404);

    // Delivery wording under the money trail
    await page.goto("/passbook/inst-2026-09-05");
    await expect(page.getByTestId("delivery-line").first()).toHaveText("Returned to your bank: the full ₹2,000 came back on 12 Sep 2026.");

    await page.goto("/your-data");
    await expect(page.getByTestId("delete-is-safe")).toContainText("It never changes your SIP, your units");
    await expect(page.getByTestId("delete-section")).not.toContainText("goal photo");
  });

  // Task 14 (owner, 9 Nov: the Start SIP demo and "why I started" were removed): a voice memory on a month
  test("Task 14: A voice memory on October plays back after a reload and can be deleted; no Start SIP anywhere", async ({ page }) => {
    await fakeMicrophone(page);
    await page.goto("/demo-tools?ab=1");
    await page.getByLabel("Version B (personal layer)").check();

    await page.goto("/passbook/inst-2026-10-05");
    const card = page.getByTestId("memory-card");
    await card.getByRole("button", { name: "Add a memory to Oct 2026" }).click();
    await card.getByRole("button", { name: /Record a voice note/ }).click();
    await expect(card.getByText(/Recording 0:0/)).toBeVisible();
    await page.waitForTimeout(1500);
    await card.getByRole("button", { name: "Stop" }).click();
    await card.getByRole("button", { name: "Save memory" }).click();
    await expect(card.getByTestId("voice-player")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("memory-card").getByTestId("voice-player")).toBeVisible();
    await page.getByTestId("memory-card").getByRole("button", { name: "Delete this memory" }).click();
    await expect(page.getByTestId("memory-card").getByTestId("voice-player")).toHaveCount(0);

    for (const url of ["/", "/passbook", "/passbook/months"]) {
      await page.goto(url);
      await expect(page.locator("a[href='/start']")).toHaveCount(0);
      await expect(page.getByText("Why I started")).toHaveCount(0);
    }
    await page.goto("/start");
    await expect(page).toHaveURL(/\/$/);
  });
});
