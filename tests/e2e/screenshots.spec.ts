import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.describe("Screenshot Capture at 390x844", () => {
  const screenshotsDir = path.resolve(process.cwd(), "reports/screenshots");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test("Capture all primary surfaces and flows", async ({ page }) => {
    // 1. Home
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "01_home.png") });

    // 2. Locker cover
    await page.goto("/locker");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "02_locker_cover.png") });

    // 2b. Locker slips scrolled
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, "02b_locker_slips.png") });

    // 2c. Locker full page
    await page.screenshot({ path: path.join(screenshotsDir, "02c_locker_fullpage.png"), fullPage: true });

    // 2d. Memory modal
    const memoryBtn = page.locator('button:has-text("Add a memory")').first();
    if (await memoryBtn.isVisible()) {
      await memoryBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(screenshotsDir, "02d_memory_modal.png") });
    }

    // 3. Break options
    await page.goto("/break");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "03_break_options.png") });

    // 3b. Break distress mode
    await page.fill("textarea", "Job loss, need to pause for 3 months");
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, "03b_break_distress.png") });

    // 3c. Break cancellation promise
    const cancelBtn = page.locator('button:has-text("Cancel this SIP")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(screenshotsDir, "03c_break_promise.png") });
    }

    // 4. Ask
    await page.goto("/ask");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "04_ask.png") });

    // 5. Certificate
    await page.goto("/certificate");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "05_certificate.png") });

    // 6. Year One
    await page.goto("/year-one");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "06_year_one.png") });

    // 7. How it works
    await page.goto("/how-it-works");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "07_how_it_works.png") });

    // 8. Quality & Safety
    await page.goto("/quality");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "08_quality.png") });

    // 9. Consent
    await page.goto("/consent");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "09_consent.png") });

    // 10. Settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "10_settings.png") });

    // 11. Demo tools
    await page.goto("/demo-tools");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(screenshotsDir, "11_demo_tools.png") });
  });
});
