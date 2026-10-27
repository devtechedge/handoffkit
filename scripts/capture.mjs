import { chromium } from "@playwright/test";

const base = "http://localhost:3000";
const out = process.argv[2] ?? "docs/screenshots";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${base}/`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/01-home.png`, fullPage: true });

await page.goto(`${base}/demo`);
await page.getByRole("button", { name: /Risky sample/i }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/02-demo-risky.png`, fullPage: true });

await page.goto(`${base}/pricing`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${out}/03-pricing.png`, fullPage: true });

await page.goto(`${base}/`);
await page.evaluate(() => {
  document.documentElement.dataset.theme = "dark";
});
await page.waitForTimeout(400);
await page.screenshot({
  path: `${out}/social-preview.png`,
  clip: { x: 80, y: 0, width: 1280, height: 640 },
});

await browser.close();
console.log("captured to", out);
