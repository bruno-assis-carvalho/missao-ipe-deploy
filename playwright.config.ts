import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8443";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  outputDir: "./test-results",
  use: {
    baseURL,
    browserName: "chromium",
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    viewport: { width: 1440, height: 1000 },
    video: "on",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
