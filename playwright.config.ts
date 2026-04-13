import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });

/**
 * E2E “试用”：浏览器里走主路径（输入 → 生成 → 出结果）。
 * `/api/generate` 在测试里用 route mock，不依赖 OpenAI / 额度。
 *
 * 本地：先 `npm run build`，再 `npm run test:e2e`；或先 `npm run dev` 再跑（会复用 3000）。
 */
export default defineConfig({
  globalSetup: require.resolve("./playwright.global-setup.ts"),
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        /** Avoid downloading chromium_headless_shell — set PLAYWRIGHT_USE_SYSTEM_CHROME=1 if Google Chrome is installed. */
        ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1" ? { channel: "chrome" as const } : {})
      }
    }
  ],
  /** Set PLAYWRIGHT_NO_WEBSERVER=1 when `next dev` already owns :3000 (avoids EADDRINUSE with `next start`). */
  ...(process.env.PLAYWRIGHT_NO_WEBSERVER === "1"
    ? {}
    : {
        webServer: {
          command: "npm run start",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000
        }
      })
});
