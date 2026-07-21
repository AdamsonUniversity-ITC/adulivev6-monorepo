import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

/**
 * WSL/Linux: run `sudo npx playwright install-deps` once so bundled Chromium can launch.
 * Optional: set PLAYWRIGHT_USE_WINDOWS_CHROME=1 to try Windows Chrome (often fails headless from WSL).
 */

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://college-drs.localhost.test:5173';

const windowsChrome =
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
const chromeExecutable = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;
const useWindowsChrome =
  chromeExecutable ??
  (process.env.PLAYWRIGHT_USE_WINDOWS_CHROME === '1' &&
  fs.existsSync(windowsChrome)
    ? windowsChrome
    : undefined);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...(useWindowsChrome
      ? { launchOptions: { executablePath: useWindowsChrome } }
      : {}),
  },
  webServer: {
    command: 'npm run dev -- --host',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
