import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "../e2e",
  outputDir: "../test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm start" : "npm run build && npm start",
    url: "http://127.0.0.1:3000/api/subject/DEMO-1",
    env: {
      ...process.env,
      CACHE_DB_PATH: ":memory:",
      NODE_ENV: "test",
      PORT: "3000",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
