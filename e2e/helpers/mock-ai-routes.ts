import type { Page } from "@playwright/test";

/** Shared strings so `/api/generate` tools (bio, hashtag, title) can assert the same marker. */
export const MOCK_LINE_RESULTS = [
  "E2E mock line 1 — copy me",
  "E2E mock line 2 — copy me",
  "E2E mock line 3 — copy me"
];

const MOCK_PACKAGE_BODY = JSON.stringify({
  packages: [
    {
      topic: "E2E mock topic",
      hook: "E2E mock hook visible",
      script_talking_points: "E2E mock script line",
      caption: "E2E mock caption body",
      cta_line: "E2E mock cta",
      hashtags: "#e2e #mock",
      why_it_works: "E2E mock why",
      posting_tips: "E2E mock tips"
    }
  ],
  tierApplied: "free",
  resultQuality: "compact_post_package"
});

/**
 * Intercepts AI calls so Playwright runs without OpenAI keys (see docs/MEMORY — 可观测 / 稳定 CI).
 */
export async function installAiRouteMocks(page: Page): Promise<void> {
  await page.route("**/api/generate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: MOCK_LINE_RESULTS })
    });
  });

  await page.route("**/api/generate-package", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: MOCK_PACKAGE_BODY
    });
  });
}
