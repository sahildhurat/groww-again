import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), "reports/screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log("Connecting to local app on port 3000...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });

  const page = await context.newPage();

  // Baseline screens
  const screens = [
    { url: "http://localhost:3000/", file: "01_home.png" },
    { url: "http://localhost:3000/locker", file: "02_locker_cover.png" },
    { url: "http://localhost:3000/locker", file: "02b_locker_slips.png", action: async () => {
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(500);
    }},
    { url: "http://localhost:3000/break", file: "03_break_options.png" },
    { url: "http://localhost:3000/ask", file: "04_ask.png" },
    { url: "http://localhost:3000/certificate", file: "05_certificate.png" },
    { url: "http://localhost:3000/year-one", file: "06_year_one.png" },
    { url: "http://localhost:3000/how-it-works", file: "07_how_it_works.png" },
    { url: "http://localhost:3000/quality", file: "08_quality.png" },
    { url: "http://localhost:3000/consent", file: "09_consent.png" },
    { url: "http://localhost:3000/settings", file: "10_settings.png" },
    { url: "http://localhost:3000/demo-tools", file: "11_demo_tools.png" },
  ];

  for (const screen of screens) {
    console.log(`Capturing ${screen.file}...`);
    await page.goto(screen.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    if (screen.action) {
      await screen.action();
    }
    await page.screenshot({
      path: path.join(screenshotsDir, screen.file),
      fullPage: false,
    });
  }

  // Interactive 1: Break flow distress / options
  console.log("Capturing 03b_break_distress.png...");
  await page.goto("http://localhost:3000/break", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.fill("textarea", "Job loss, need to pause for 3 months");
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(screenshotsDir, "03b_break_distress.png"),
  });

  // Interactive 2: Break flow cancellation promise
  console.log("Capturing 03c_break_promise.png...");
  const cancelBtn = page.locator('button:has-text("Cancel this SIP")').first();
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(screenshotsDir, "03c_break_promise.png"),
    });
  }

  // Interactive 3: Memory modal on locker
  console.log("Capturing 02d_memory_modal.png...");
  await page.goto("http://localhost:3000/locker", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const memoryBtn = page.locator('button:has-text("Add a memory")').first();
  if (await memoryBtn.isVisible()) {
    await memoryBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(screenshotsDir, "02d_memory_modal.png"),
    });
  }

  // Full page locker
  console.log("Capturing full page locker...");
  await page.goto("http://localhost:3000/locker", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, "02c_locker_fullpage.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
