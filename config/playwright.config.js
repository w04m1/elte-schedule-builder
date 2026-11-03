import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "../e2e",
  outputDir: "../test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
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
    url: `${baseURL}/api/subject/DEMO-1`,
    env: {
      ...process.env,
      CACHE_DB_PATH: ":memory:",
      NODE_ENV: "test",
      PORT: String(port),
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
