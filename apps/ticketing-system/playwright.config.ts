import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * WSL/Linux: bundled Chromium needs system libs (libnspr4, etc.).
 * Prefer `sudo pnpm exec playwright install-deps`, or use the local
 * extracted libs under ~/.local/playwright-libs (see scripts/ensure-playwright-libs.sh).
 * Optional: PLAYWRIGHT_CHROME_EXECUTABLE=/path/to/chrome
 */

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://itc-ts.localhost.test:5173";

const localLibs = path.join(
  os.homedir(),
  ".local/playwright-libs/usr/lib/x86_64-linux-gnu",
);
if (fs.existsSync(localLibs)) {
  process.env.LD_LIBRARY_PATH = [localLibs, process.env.LD_LIBRARY_PATH ?? ""]
    .filter(Boolean)
    .join(":");
}

const chromeExecutable = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...(chromeExecutable
      ? { launchOptions: { executablePath: chromeExecutable } }
      : {}),
  },
  webServer: {
    command: "pnpm exec vite --host --port 5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
