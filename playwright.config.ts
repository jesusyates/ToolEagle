import { defineConfig, devices } from "@playwright/test";

/**
 * E2E “试用”：浏览器里走主路径（输入 → 生成 → 出结果）。
 * `/api/generate` 在测试里用 route mock，不依赖 OpenAI / 额度。
 *
 * 本地：先 `npm run build`，再 `npm run test:e2e`；或先 `npm run dev` 再跑（会复用 3000）。
 */
export default defineConfig({
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
        ...devices["Pixel 5"]
      }
    }
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
