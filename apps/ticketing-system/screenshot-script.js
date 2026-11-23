import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5175/");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test.png", fullPage: true });
  await browser.close();
})();
