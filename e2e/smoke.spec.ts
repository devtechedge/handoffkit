import { expect, test } from "@playwright/test";

test("home page renders the hero and main navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HandoffKit/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hand over the workflow");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Demo", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "See a sample handover" })).toBeVisible();
});

test("pricing page shows both plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$49/month").first()).toBeVisible();
});

test("demo page loads a sample workflow and renders a pack", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("See the pack");
  await page.getByRole("button", { name: /Sample/i }).first().click();
  await expect(page.getByText("Readiness score").first()).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toMatchObject({ ok: true });
});

test("theme toggle switches to dark and back", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Switch to dark theme/ }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await expect(html).not.toHaveAttribute("data-theme", "dark");
});
