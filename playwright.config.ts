import { defineConfig, devices } from "@playwright/test";

/**
 * Orbit Event ERP — Visual Regression Configuration
 *
 * Captures full-page screenshots of the 6 canon reference pages at two
 * viewports and diffs them against committed baselines.
 *
 * FIRST RUN: `npm run test:visual:update` to capture baseline snapshots.
 * THEREAFTER: `npm run test:visual` — any styling drift fails the suite.
 *
 * Snapshots live in tests/visual/__snapshots__/ — commit them to git.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false, // screenshots must be deterministic; run sequentially
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    /* Disable CSS animations & transitions so screenshots are pixel-stable */
    launchOptions: {
      args: ["--disable-web-security", "--force-prefers-reduced-motion"],
    },
  },

  expect: {
    toHaveScreenshot: {
      /** Allow up to 150 pixels of anti-aliasing/font-rendering diff */
      maxDiffPixels: 150,
      /** Threshold per-pixel (0–1). 0.2 = 20% luminance tolerance */
      threshold: 0.2,
      animations: "disabled",
    },
  },

  projects: [
    {
      name: "desktop-1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile-375",
      use: {
        ...devices["iPhone SE"],
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
      },
    },
  ],

  /**
   * Auto-start the Next.js dev server.
   * `reuseExistingServer` lets devs keep their own `npm run dev` running.
   */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
