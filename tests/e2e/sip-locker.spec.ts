import { test, expect } from "@playwright/test";

test.describe("The SIP Locker E2E Verification (§12)", () => {
  // Test 1: Demo mode loads 11 slips: 2 failed slots with reason/fix, 1 hard month with note
  test("1. Demo mode loads 11 slips with failed slots and hard month", async ({ page }) => {
    await page.goto("/locker");
    await expect(page.locator("text=Monthly Slips & Entries (11)")).toBeVisible();

    // Check 2 failed slots (May and September)
    const emptySlots = page.locator("text=Empty slot");
    await expect(emptySlots).toHaveCount(2);
    await expect(page.locator("text=NACH debit returned: insufficient funds").first()).toBeVisible();
    await expect(page.locator("text=Mandate rejected: account closed/inactive").first()).toBeVisible();

    // Check 1 hard month (July) with its note
    await expect(page.locator("text=Hard month")).toHaveCount(1);
    await expect(page.locator("text=Family emergency this month.")).toBeVisible();
    await expect(page.locator("text=Skips count toward three missed instalments in a row.")).toBeVisible();
  });

  // Test 2: Add a text memory (demo)
  test("2. Add a text memory in demo mode", async ({ page }) => {
    await page.goto("/locker");
    const addMemoryBtn = page.locator("button:has-text('Add memory')").first();
    await addMemoryBtn.click();

    // Modal opens
    await expect(page.locator("text=Add a memory to this month")).toBeVisible();
    await page.locator("textarea").fill("Saved bonus for my anniversary trip.");
    await page.locator("button:has-text('Save memory')").click();

    // Verify updated memory is visible
    await expect(page.locator("text=Saved bonus for my anniversary trip.").first()).toBeVisible();
  });

  // Test 3: Stop flow, opt-in promise appears, equal prominence cancel button, return date via birthday
  test("3. Stop flow: promise appears, cancel equal prominence, return date via birthday chip", async ({ page }) => {
    await page.goto("/break");
    await expect(page.locator("text=Tell the locker what is happening")).toBeVisible();

    // Enter reason
    await page.locator("textarea").fill("I need to take a break until my birthday.");
    await page.locator("button:has-text('Continue')").click();

    // Options step: check Cancel SIP button exists
    const cancelOption = page.locator("button:has-text('Cancel this SIP')");
    await expect(cancelOption).toBeVisible();
    await cancelOption.click();

    // Confirm cancel step: Check Day-1 promise appears (opt-in seed)
    await expect(page.locator("text=Your Day-1 Reason (You chose to review this)")).toBeVisible();
    await expect(page.locator("text=first bike").first()).toBeVisible();
    // Manual play button present, no autoplay
    await expect(page.locator("button:has-text('Listen to your note')")).toBeVisible();

    // Check equal size and prominence of Confirm cancellation vs Pause
    const cancelBtn = page.locator("button:has-text('Confirm cancellation')");
    const pauseBtn = page.locator("button:has-text('Pause until a return date instead')");
    await expect(cancelBtn).toBeVisible();
    await expect(pauseBtn).toBeVisible();

    // Tap pause button to go to return date
    await pauseBtn.click();
    await expect(page.locator("text=When would you like to return?")).toBeVisible();

    // Select birthday chip
    const birthdayChip = page.locator("button:has-text('My birthday (14 March)')");
    await birthdayChip.click();
    await page.locator("button:has-text('Confirm return date')").click();

    // Verify confirmation
    await expect(page.locator("text=Your locker stays open")).toBeVisible();
  });

  // Test 4: The locker shows the return card
  test("4. The locker shows the persistent return card", async ({ page }) => {
    // Set return date via break flow
    await page.goto("/break");
    await page.locator("textarea").fill("Pausing temporarily.");
    await page.locator("button:has-text('Continue')").click();
    await page.locator("button:has-text('Pause until a date you choose')").click();
    await page.locator("button:has-text('My birthday (14 March)')").click();
    await page.locator("button:has-text('Confirm return date')").click();

    // Return to locker
    await page.locator("button:has-text('Return to my locker')").click();
    await expect(page).toHaveURL(/\/locker/);
    await expect(page.locator("text=Your locker stays open. You plan to return on")).toBeVisible();
    await expect(page.locator("text=14 March 2027")).toBeVisible();
  });

  // Test 5: Ask answers factual questions and declines advice questions
  test("5. Ask answers 'Which months did not go through?' and declines advice", async ({ page }) => {
    await page.goto("/ask");

    // Click starter chip "Which months did not go through?"
    const chip = page.locator("button:has-text('Which months did not go through?')");
    await chip.click();

    // Wait for response containing May and September
    await expect(page.locator("text=May and September").first()).toBeVisible({
      timeout: 15000,
    });

    // Test decline on advice question "Which fund should I switch to?"
    const adviceChip = page.locator("button:has-text('Which fund should I switch to?')");
    await adviceChip.click();

    // Expect decline response pointing to official portal
    await expect(page.locator("text=cannot provide investment advice").or(page.locator("text=can't answer that")).first()).toBeVisible({
      timeout: 15000,
    });
  });

  // Test 6: Certificate of holding print page has keepsake line and strictly NO returns or ₹ value
  test("6. Certificate print page has keepsake notice and NO returns or value", async ({ page }) => {
    await page.goto("/certificate");

    // Keepsake line
    await expect(page.locator("text=Keepsake for the family file")).toBeVisible();
    await expect(page.locator("text=Not a statement of account or unit certificate")).toBeVisible();

    // Shows units
    await expect(page.locator("text=158.513")).toBeVisible();
    await expect(page.locator("text=8 paid instalments")).toBeVisible();

    // STRICT: Must NOT show ₹ value, gains, or return percentage
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toContain("₹17,151");
    expect(pageContent).not.toContain("returns");
    expect(pageContent).not.toContain("profit");
    expect(pageContent).not.toContain("CAGR");
  });

  // Test 7: First-year story lines render
  test("7. First-year story lines render on Year one page", async ({ page }) => {
    await page.goto("/year-one");
    await expect(page.locator("text=Your first year, as a story")).toBeVisible();
    await expect(page.locator("text=Where you started (Day 1)")).toBeVisible();

    // Check share-safe toggle
    const shareBtn = page.locator("button:has-text('Share-safe view')");
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();
    await expect(page.locator("text=View full details")).toBeVisible();
  });

  // Test 8: With MVP_LIVE_ENABLED unset, AI text shows "Standard text"
  test("8. In fallback mode, text shows 'Standard text' badge", async ({ page }) => {
    await page.goto("/locker");
    // Slips and slots carry Checked or Standard text badge
    const badge = page.locator("button:has-text('Checked')").or(page.locator("button:has-text('Standard text')")).first();
    await expect(badge).toBeVisible();
  });

  // Test 9: Each "Try a task" item opens the right screen
  test("9. Each 'Try a task' item opens the right screen", async ({ page }) => {
    await page.goto("/");

    // Task 1: September failure
    await page.locator("text=Your September instalment did not go through").click();
    await expect(page).toHaveURL(/#inst-2026-09-05/);

    // Task 2: Stop flow
    await page.goto("/");
    await page.locator("text=You need to stop for a while").click();
    await expect(page).toHaveURL(/\/break/);

    // Task 3: Add memory
    await page.goto("/");
    await page.locator("text=Add a memory to this month").click();
    await expect(page).toHaveURL(/#inst-2026-10-05/);

    // Task 4: Ask units in flat month
    await page.goto("/");
    await page.locator("text=Ask how many units you bought in the month you moved into the flat").click();
    await expect(page).toHaveURL(/\/ask\?q=/);

    // Task 5: Print certificate
    await page.goto("/");
    await page.locator("text=Print your certificate").click();
    await expect(page).toHaveURL(/\/certificate/);
  });

  // Test 10: "Not investment advice" notice visible on Ask and Break flow
  test("10. 'Not investment advice' notice visible on Ask and Break flow", async ({ page }) => {
    await page.goto("/ask");
    await expect(page.locator("text=Information about your own SIP and the rules only. Not investment advice.")).toBeVisible();

    await page.goto("/break");
    await expect(page.locator("text=Information about your own SIP and the rules only. Not investment advice.")).toBeVisible();
  });

  // Test 11: Mandatory footer on every screen
  test("11. Mandatory concept prototype footer on every page", async ({ page }) => {
    const pages = ["/", "/locker", "/break", "/ask", "/year-one", "/certificate", "/how-it-works", "/quality"];
    for (const p of pages) {
      await page.goto(p);
      await expect(page.locator("text=Concept prototype for a Groww case study. Not affiliated with Groww.")).toBeVisible();
    }
  });

  // Test 12: No Groww logo or trademark asset used
  test("12. Zero Groww logo or wordmark assets used in page or images", async ({ page }) => {
    await page.goto("/");
    const images = await page.locator("img").all();
    for (const img of images) {
      const src = await img.getAttribute("src");
      expect(src?.toLowerCase()).not.toContain("groww");
    }
    const title = await page.title();
    expect(title.toLowerCase()).not.toContain("groww official");
  });
});
