import { test, expect } from "@playwright/test";
import { installAiRouteMocks } from "./helpers/mock-ai-routes";

const LINE_MARKER = /E2E mock line 1/;

/**
 * E2E scope (aligned with docs/MEMORY: 英文主站优先、Mobile-First):
 * Cover `isPopular: true` global tools in tools.ts — the default “hero” set for SEO and directory,
 * without waiting on analytics. Douyin-only routes are skipped here (分区体验 / 显式分支另测).
 */
test.describe("Tool happy paths (mocked AI)", () => {
  test.beforeEach(async ({ page }) => {
    await installAiRouteMocks(page);
  });

  test("TikTok Bio — input → Generate → line results", async ({ page }) => {
    await page.goto("/tools/tiktok-bio-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/TikTok Bio/i);
    await page.getByRole("textbox").first().fill("fitness coach");
    await page.getByRole("button", { name: /Generate Bios/i }).click();
    await expect(page.getByText(LINE_MARKER)).toBeVisible({ timeout: 20_000 });
  });

  test("Hashtag — input → Generate → line results", async ({ page }) => {
    await page.goto("/tools/hashtag-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Hashtag/i);
    await page.getByRole("textbox").first().fill("travel vlog tips");
    await page.getByRole("button", { name: /Generate Hashtags/i }).click();
    await expect(page.getByText(LINE_MARKER)).toBeVisible({ timeout: 20_000 });
  });

  test("Title — input → Generate → line results", async ({ page }) => {
    await page.goto("/tools/title-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Title/i);
    await page.getByRole("textbox").first().fill("batch editing workflow");
    await page.getByRole("button", { name: /Generate Titles/i }).click();
    await expect(page.getByText(LINE_MARKER)).toBeVisible({ timeout: 20_000 });
  });

  test("Hook — input → Generate → package hook visible", async ({ page }) => {
    await page.goto("/tools/hook-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Hook/i);
    await page.getByRole("textbox").first().fill("small business reels");
    await page.getByRole("button", { name: /Generate Hooks/i }).click();
    await expect(page.getByText(/E2E mock hook visible/)).toBeVisible({ timeout: 20_000 });
  });

  test("TikTok Caption — input → Generate → package hook visible", async ({ page }) => {
    await page.goto("/tools/tiktok-caption-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/TikTok Caption/i);
    await page.getByRole("textbox").first().fill("morning routine tips");
    await page.getByRole("button", { name: /Generate post packages/i }).click();
    await expect(page.getByText(/E2E mock hook visible/)).toBeVisible({ timeout: 20_000 });
  });

  test("AI Caption (canonical /ai-caption-generator) — package hook visible", async ({ page }) => {
    await page.goto("/ai-caption-generator", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/AI Caption/i);
    await page.getByRole("textbox").first().fill("weekly batch filming");
    await page.getByRole("button", { name: /Generate a post package/i }).click();
    await expect(page.getByText(/E2E mock hook visible/)).toBeVisible({ timeout: 20_000 });
  });
});
