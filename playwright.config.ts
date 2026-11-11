import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the PRODUCTION build (`next build` + `next start`),
 * which is what Vercel serves. They need a migrated database (DATABASE_URL in .env)
 * and they create real users/places in it, so point them at a development database.
 *
 *   bun run build && bun run test:e2e
 *
 * Set PLAYWRIGHT_CHROMIUM_PATH to use a pre-installed Chromium binary.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
  webServer: {
    command: "bun run start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
