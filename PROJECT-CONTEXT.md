# PROJECT-CONTEXT — Orbit Event ERP

Multi-tenant event SaaS for Indian exhibitions: registration, badges, QR check-in, food coupons, live dashboards. This repo exists and its visual design is FINAL. Read this file before writing any code.

---

## 1) STACK

**Existing (do not change):**

- Next.js 15 App Router + TypeScript (strict)
- Tailwind CSS v4 — all design tokens live in `src/app/globals.css` (`@theme` block)
- lucide-react (icons)
- react-apexcharts + apexcharts (charts, SSR-disabled via `src/components/charts/ApexChart.tsx`)
- Fonts: Inter (`--font-inter`, body) + Poppins (`--font-poppins`, display) via `next/font`

**ADD ONLY these dependencies:**

- `@tanstack/react-query` — server-state / async cache over mock services
- `@tanstack/react-table` — headless tables (DataTable composite)
- `react-hook-form` + `zod` — forms + validation
- `zustand` — client UI state
- `@dnd-kit/core` — drag & drop (badge designer, form builder)
- `papaparse` — CSV import/export
- `qrcode.react` — QR rendering (passes, badges)
- `sonner` — toasts (restyled with our tokens)

**Data:** Mock data only — NO real API, NO database. Everything flows through mock services (see §3).

---

## 2) DESIGN LAW (unbreakable)

The visual language is **FINAL**. Canon =

- `src/components/**` (layout, ui, charts — every existing component)
- The 6 reference pages:
  1. `/dashboard/event` — `src/app/dashboard/event/page.tsx`
  2. `/dashboard/organizer` — `src/app/dashboard/organizer/page.tsx`
  3. `/dashboard/super-admin` — `src/app/dashboard/super-admin/page.tsx`
  4. `/onsite/food-coupons` — `src/app/onsite/food-coupons/page.tsx`
  5. `/visitors` — `src/app/visitors/page.tsx`
  6. `/visitors/register` — `src/app/visitors/register/page.tsx`

Rules:

- **Never restyle canon.** No visual edits to these files or components.
- Only colors/fonts/shadows/radii from `globals.css` tokens (`--color-orbit-*`, `--color-surface`, `--font-sans`, `--font-display`, `--shadow-card`, `--shadow-card-hover`) plus the Tailwind slate/emerald/amber/red/sky/violet tints already used in canon.
- `../WEB THEME/` (`Vyzor-html` + `vyzor-nextjs-ts-approuter`) is a **READ-ONLY pattern library**: when a component is missing here, port the Vyzor pattern (structure/behaviour) and reskin it with our tokens. Never copy Vyzor styling verbatim; never edit those folders.
- **Never install default-styled UI kits** — no shadcn defaults, no MUI, no AntD, no DaisyUI, etc.
- New screens must be **indistinguishable in style** from canon: same StatCard KPI rows, Card/CardHeader surfaces, table header style (`text-[11px] uppercase tracking-wider text-slate-400`, `bg-slate-50/60`), soft-tint Badges, h-9 buttons (`bg-orbit-500` primary / white-bordered secondary), 9px-radius inputs with `focus:ring-orbit-100`, `gap-4` grids.

---

## 3) ARCHITECTURE

- **Routes:** `src/app/**` (App Router). Server Components by default; `"use client"` only where interaction demands it.
- **Composites:** `src/components/kit/**` — built FROM existing `src/components/ui/*` primitives (DataTable, FilterBar, EmptyState, ConfirmDialog, Drawer, Tabs, etc.). Never fork a primitive; compose it.
- **Data access:** interfaces in `src/services/{domain}.ts`, implemented in `src/services/mock/**` over fixtures in `src/mocks/fixtures/**`.
  - Existing `src/data/*` (events, gates, visitors) will migrate into `src/mocks/fixtures` in **P-02**; until then it remains the source for canon pages.
- **Mock realism:** every mock call resolves with ~**300ms latency**; a `window.__mockErrors` toggle makes ~**5%** of calls fail (for testing error/rollback UX).
- Pages consume services via React Query — components never import fixtures directly.

---

## 4) DOMAIN GLOSSARY

Hierarchy: **Organization (org) → Events →**

- **visitor categories** (Trade Visitor, Delegate, VIP, Student, Media…)
- **form versions** (registration form schema per event, versioned)
- **registrations** — status: `pending | approved | rejected | revoked`
- **passes** (QR) — issued against approved registrations
- **exhibitors + staff** (exhibitor company + its booth staff passes)
- **badges** (designs + print jobs)
- **gates + devices** (scanner hardware, sync state)
- **sessions** (conference/agenda sessions)
- **meal_sessions + entitlements + redemptions** (food coupons: window → who's entitled → scan log)
- **counters** (food/registration desks)
- **comm templates + messages** (WhatsApp/email/SMS)

**Roles:** `owner`, `org_admin`, `event_manager`, `desk`, `scanner`, `food_operator`, `catering_supervisor`, `super_admin`.

---

## 5) UI LAWS

- **Dense-but-calm B2B.** Information-dense, whitespace-separated, no decoration.
- Every list = **DataTable + FilterBar + EmptyState** (no bare tables on new screens).
- Destructive actions = **typed ConfirmDialog** (user types the record name/word to confirm).
- Saves are **optimistic with rollback toast** (sonner) on mock failure.
- Everything usable at **1366×768**.
- Dates render in the **event's timezone**.
- Money is stored in **paise**, displayed as INR with Indian digit grouping (`formatIndian` / `₹1,42,381`).
- Loading = **skeletons, not spinners** (match `ApexChart`'s `animate-pulse bg-slate-50` pattern).

---

## 6) CURRENT STATE (scanned 2026-07-20 — do not guess, re-scan before editing)

### Routes (`src/app`)

**Canon (ZERO edits):** `/dashboard/event` · `/dashboard/organizer` · `/dashboard/super-admin` · `/onsite/food-coupons` · `/visitors` · `/visitors/register`

**Auth** (AppShell bypassed): `/auth/login` · `/auth/signup` · `/auth/verify-email` · `/auth/forgot-password` · `/auth/reset-password/[token]`

**Other flows:** `/invite/[token]` · `/onboarding` · `/styleguide` · `/styleguide/forms`

**Org tree** (RouteGuard + AppShell):
`/org` (redirect) · `/org/dashboard` · `/org/events` · `/org/events/new` (PlaceholderPage)
`/org/team/[[...sub]]` · `/org/settings/[[...sub]]` (7 tabs) · `/org/reports/[[...sub]]`
`/org/events/[eventId]` → redirect to overview; EventContextBar in layout
`/org/events/[eventId]/overview` — StatTiles, occupancy, gate sparkline, device strip, 5s poll
`/org/events/[eventId]/checkin` — Gates CRUD, device list, PairingCodeModal, revoke
`/org/events/[eventId]/food` — meal sessions
`/org/events/[eventId]/registrations` — DataTable, FilterBar, bulk actions, RegistrationDrawer (P/T/A tabs, reprint mutation)
`/org/events/[eventId]/registrations/approvals` — keyboard-first queue (J/K/A/R)
`/org/events/[eventId]/registrations/new` — walk-in desk (phone search → form → success)
`/org/events/[eventId]/registrations/import` — CSV wizard (4 steps, column mapping)
`/org/events/[eventId]/registrations/categories` — sortable list, color picker
`/org/events/[eventId]/registrations/forms` — dnd-kit form builder, live preview, autosave
`/org/events/[eventId]/registrations/forms/versions` — version history, publish, clone
`/org/events/[eventId]/exhibitors` — DataTable, add/edit Drawer (rhf+zod), magic-link generate/copy/revoke, CSV import, quota chip amber at full
`/org/events/[eventId]/exhibitors/staff` — submissions grouped by exhibitor, approve/reject per row or company; approval creates Registration + Pass + BadgePrintJob; over-quota rows blocked
`/org/events/[eventId]/badges` — 8-template gallery, per-category assignment, field mapping toggles, sponsor strip upload, live preview
`/org/events/[eventId]/badges/print-queue` — queue tab + reprints tab, batch print (PrintPreviewModal), mark-printed, bulk select
`/org/events/[eventId]/badges/reprints` — audit table, void-badge banner, CSV export
`/org/events/[eventId]/[...module]` — PlaceholderPage catch-all

**Public (AppShell bypassed):**
`/e/[slug]` · `/e/[slug]/register` (FormRenderer → success + .ics) · `/e/[slug]/status` (OTP 482913)
`/x/[token]` — exhibitor magic-link form: quota bar, staff rows up to quota, expired/invalid states; mobile-first
`/tv/[token]` — 6-tile dark broadcast, 10s poll

### Kit components (`src/components/kit`)

`Button` · `inputs` (FormField, TextInput, Textarea, SelectInput, PhoneInput, Checkbox, Radio, ChoiceGroup, SearchInput) · `Modal` · `Drawer` · `Dropdown` · `Tabs` · `Skeleton`+`SkeletonCard`+`SkeletonRows`+`SkeletonStat` · `toast` · `DataTable` · `FilterBar` · `EmptyState` · `ConfirmDialog` · `FormSection`+`FormActions` · `StatusBadge` · `SettingsTabs` · `Stepper` · `misc` (CopyField, KbdHint, PasswordStrengthMeter) · `CmdK` · `RouteGuard` · `EventContextBar` · `PlaceholderPage` · `TrialBanner` · `PlanLimitModal` · `TrialLockScreen`

**UI primitives:** `Badge` · `Card`+`CardHeader` · `EventSwitcher` · `PageHeader` · `ProgressBar` · `StatCard`

**Charts:** `ApexChart` · `AreaChart` · `ColumnChart` · `DonutChart`

**Form system:** `FormRenderer` — 8 field types, conditionals, dynamic zod resolver, GSTIN mod-36

**Badge system (`src/components/badge`):** `templates.tsx` — 8 `BadgeTemplateDef` components (classic, bold-strip, photo-left, minimal, vip-gold, staff, exhibitor, thermal-compact); `BadgePrint.tsx` — `BadgePrintPortal` (`createPortal`, `@media print`, `@page` A6/thermal), `BadgeScaled`, `PrintPreviewModal`; `badgeData.ts` — `badgeDataFor()`, `sampleRegistrationFor()`, `fmtEventDates()`

**Collocated:** `registrations/RegistrationDrawer.tsx` — extended with `reprintMutation` + PinModal reason input

### Service interfaces + mock implementations

13 interface/mock pairs: `auth` · `org` · `event` · `registration` · `form` · `exhibitor` (extended: `generateMagicLink`, `revokeMagicLink`, `resolveMagicToken`, `submitStaff`, `approveStaff`, `rejectStaff`) · `badge` (extended: `markPrinted`, `reprint`, `listReprints`) · `checkin` · `food` · `comm` · `report` · `admin` · `invite`

`mock/db.ts` — 20 mutable collections: …+ `badgePrintJobs` (seeded) · `reprints` (seeded)

### Fixtures (`src/mocks/fixtures/index.ts`)

ORG · USERS[8] · EVENT_EXPO · EVENT_CONCLAVE · CATEGORIES[5] · FORM_VERSIONS[2] · GATES[4] · COUNTERS[4] · DEVICES · MEAL_SESSIONS[6] · REGISTRATIONS[400] · PASSES · EXHIBITORS[12] (8 with magic links; 1 expired; index 0 at quota) · EXHIBITOR_STAFF (mixed pending/approved, with `designation`/`status`/`submittedAt`) · BADGE_DESIGNS · BADGE_PRINT_JOBS (24 queued, remainder done) · REPRINTS[2] · CHECKINS[60] · EVENT_SESSIONS · REDEMPTIONS[250] · COMM_TEMPLATES[3] · COMM_MESSAGES[36]

### Stores / lib

`useRoleStore` · `useOnboardingStore` · `usePlanStore` · `useEventStore` · `useBuilderStore` · `useBadgeStore` (badgeStore.ts — template assignments, field toggles, sponsor strip URL; persisted to `localStorage orbit_badge_config_{eventId}`)
`src/lib/formSchema.ts` · `src/lib/queries.ts` (13 domains) · `src/lib/utils.ts` · `src/config/navigation.ts`

**Legacy (canon only):** `src/data/events.ts` · `src/data/gates.ts` · `src/data/visitors.ts`

### Deviations from §1 plan

- `@dnd-kit/*` + `papaparse` + `qrcode.react` now installed; all fixtures in one file
- Badge template gallery uses 8 fixed pre-built templates, not a free designer (designer not yet built)
- Form versions dual-storage: `db.formVersions` (seed) + `localStorage orbit_form_versions_{eventId}` (publish)
- `printColorAdjust` used as inline style (non-standard CSS property; acceptable for print targeting)
- Thermal print forces `thermal_compact` template regardless of category assignment

### Not yet built

`/org/events/new` (real create flow) · Badge designer (free-draw canvas) · QR check-in live scan view · Stall allocation · Lead retrieval · Sponsors / vendors / volunteers · Session management · Comm broadcast UI · Report drilldowns · Super-admin org management · Real auth session persistence
