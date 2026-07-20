# Visual Regression Tests — Orbit Event ERP

Mechanical enforcement of the design freeze. These tests screenshot all 6 canon reference pages at two viewports and diff against committed baselines. Any CSS change to a canon page or component **causes a failure** — intentional.

---

## First-time setup (run once per machine)

```bash
# Install the Playwright chromium browser binary
npx playwright install chromium

# Start the dev server in one terminal
npm run dev

# In another terminal — capture baseline screenshots
npm run test:visual:update
```

This creates PNG files in `tests/visual/__snapshots__/`. **Commit them to git.**

---

## Daily workflow

```bash
# Compare current render against baseline (CI uses this)
npm run test:visual

# If a visual change is INTENTIONAL (design system update approved by Mukteshwar):
npm run test:visual:update
git add tests/visual/__snapshots__
git commit -m "chore(visual): update baselines after [reason]"
```

---

## Viewports

| Project | Width | Height | Notes |
|---|---|---|---|
| `desktop-1440` | 1440px | 900px | Primary design target |
| `mobile-375` | 375px | 812px | iPhone SE — minimum mobile |

---

## Pages under freeze

| Snapshot name | Route |
|---|---|
| `super-admin-dashboard` | `/dashboard/super-admin` |
| `organizer-dashboard` | `/dashboard/organizer` |
| `event-dashboard` | `/dashboard/event` |
| `visitors-list` | `/visitors` |
| `visitor-register` | `/visitors/register` |
| `food-coupons` | `/onsite/food-coupons` |

---

## Masking

The `<footer>` element is masked in all screenshots because it contains `new Date().getFullYear()` which changes annually. Everything else is static mock data and is pixel-tested.

---

## Canary tests (no snapshot needed)

Three structural assertions run on every `npm run test:visual` call without needing a screenshot:

1. **StatCard left border** is `rgb(37, 99, 235)` (orbit-500 `#2563EB`)
2. **Body background** is `rgb(244, 246, 248)` (surface `#F4F6F8`)
3. **Primary button** background is `rgb(37, 99, 235)` (orbit-500)

These catch token drift even before a full screenshot diff.

---

## Proving the freeze works

1. Open `src/components/ui/StatCard.tsx`
2. Change `"border-l-orbit-500"` to `"border-l-red-500"` for the primary accent
3. Run `npm run test:visual`  
   → The **canary test** fails immediately (wrong border color) AND the desktop/mobile snapshots differ
4. Revert the change and run again → all green

---

## CI integration (future)

Add to `.github/workflows/ci.yml`:

```yaml
- name: Install Playwright browsers
  run: npx playwright install chromium --with-deps

- name: Visual regression
  run: npm run test:visual
  env:
    CI: true
```

Set `CI=true` so Playwright treats any snapshot mismatch as a hard failure (no interactive prompts).
