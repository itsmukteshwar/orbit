/**
 * Orbit Event ERP — Canon Visual Regression Suite
 *
 * Screenshots all 6 reference pages at desktop (1440×900) and mobile (375×812).
 * These are the DESIGN FREEZE pages — no styling change to them is ever allowed.
 *
 * WORKFLOW:
 *   npm run test:visual:update   → capture / refresh baseline
 *   npm run test:visual          → compare; any pixel drift > threshold fails CI
 *
 * MASKING:
 *   - <footer> is masked because it contains `new Date().getFullYear()`.
 *   - ApexCharts canvases are waited on (1 500 ms settle) then snapped as-is;
 *     chart content is static mock data so it is stable across runs.
 *
 * PROVING THE FREEZE WORKS:
 *   1. Temporarily change any StatCard to `accent="danger"` on a canon page.
 *   2. Run `npm run test:visual` — it should FAIL (left border color drifts).
 *   3. Revert — run again — it should PASS.
 */

import { test, expect, type Locator, type Page } from "@playwright/test";

/* ── Canon routes ─────────────────────────────────────────────────────────── */
const CANON_ROUTES = [
  { name: "super-admin-dashboard", path: "/dashboard/super-admin" },
  { name: "organizer-dashboard",   path: "/dashboard/organizer"   },
  { name: "event-dashboard",       path: "/dashboard/event"       },
  { name: "visitors-list",         path: "/visitors"              },
  { name: "visitor-register",      path: "/visitors/register"     },
  { name: "food-coupons",          path: "/onsite/food-coupons"   },
] as const;

/* ── Shared helpers ────────────────────────────────────────────────────────── */

/**
 * Elements whose content is legitimately dynamic across runs.
 * We mask these so pixel diffs are caused only by styling changes.
 */
async function getDynamicMasks(page: Page): Promise<Locator[]> {
  const masks: Locator[] = [];

  // Footer contains `new Date().getFullYear()` — changes annually
  const footer = page.locator("footer");
  if ((await footer.count()) > 0) masks.push(footer);

  return masks;
}

/**
 * Wait until all ApexCharts canvases have finished their initial render.
 * Falls back to a 1.5 s timeout if no charts are present on the page.
 */
async function waitForCharts(page: Page): Promise<void> {
  const charts = page.locator(".apexcharts-canvas");
  const count = await charts.count();

  if (count > 0) {
    // Wait for every chart's SVG to appear (render complete)
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        charts.nth(i).locator("svg").waitFor({ state: "visible", timeout: 10_000 })
      )
    );
    // Extra settle time for gradient/animation frames
    await page.waitForTimeout(400);
  } else {
    await page.waitForTimeout(500);
  }
}

/** Disable CSS transitions & animations injected at the document level */
async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
      }
    `,
  });
}

/* ── Tests ─────────────────────────────────────────────────────────────────── */

for (const route of CANON_ROUTES) {
  test.describe(route.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await freezeAnimations(page);
      await waitForCharts(page);
    });

    test("desktop snapshot", async ({ page }, testInfo) => {
      // Only run on the desktop project
      if (!testInfo.project.name.startsWith("desktop")) return;

      const masks = await getDynamicMasks(page);
      await expect(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        fullPage: true,
        mask: masks,
        animations: "disabled",
      });
    });

    test("mobile snapshot", async ({ page }, testInfo) => {
      // Only run on the mobile project
      if (!testInfo.project.name.startsWith("mobile")) return;

      const masks = await getDynamicMasks(page);
      await expect(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        fullPage: true,
        mask: masks,
        animations: "disabled",
      });
    });
  });
}

/* ── Canary test — proves the freeze enforces styling ─────────────────────── */
test.describe("canary — design freeze enforcement", () => {
  /**
   * This test is NOT a screenshot test; it asserts that the StatCard's
   * left-border CSS custom property is orbit-500, not any other colour.
   * If someone removes the accent border or changes it to a non-token value,
   * this structural test fails immediately without needing a baseline update.
   */
  test("StatCard has correct left-accent border colour on super-admin page", async ({ page }) => {
    await page.goto("/dashboard/super-admin", { waitUntil: "networkidle" });

    // The first StatCard on the page (Monthly Recurring Revenue) uses accent="primary"
    // which maps to `border-l-orbit-500` → computed color should be orbit-500 #2563EB
    const firstCard = page.locator("article").first();
    const borderColor = await firstCard.evaluate((el) =>
      window.getComputedStyle(el).borderLeftColor
    );

    // #2563EB in rgb is rgb(37, 99, 235)
    expect(borderColor).toBe("rgb(37, 99, 235)");
  });

  test("Page body background is surface (#F4F6F8)", async ({ page }) => {
    await page.goto("/dashboard/super-admin", { waitUntil: "networkidle" });
    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    // #F4F6F8 = rgb(244, 246, 248)
    expect(bgColor).toBe("rgb(244, 246, 248)");
  });

  test("Primary button uses orbit-500 background", async ({ page }) => {
    await page.goto("/dashboard/super-admin", { waitUntil: "networkidle" });
    // The "Add Organizer" button is the primary CTA
    const btn = page.getByRole("button", { name: /Add Organizer/i });
    const bgColor = await btn.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    // orbit-500 = #2563EB = rgb(37, 99, 235)
    expect(bgColor).toBe("rgb(37, 99, 235)");
  });
});
