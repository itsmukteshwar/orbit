# GAP-MAP — Orbit Event ERP Kit Components

> Every kit component the Orbit playbook needs. Each row has a declared source. Nothing is "decided later."
>
> **Source key:**
> - **EXISTS** — use the named ORBIT-ERP file as-is (or with additive props only, no restyling)
> - **EXTEND** — the ORBIT-ERP component is 90% there; add props/variants without changing existing output
> - **PORT-VYZOR** — port structure/behaviour from the listed Vyzor file; discard all Vyzor styling; apply THEME-GUIDE tokens
> - **BUILD-TO-TOKEN** — no suitable source; build from scratch using THEME-GUIDE only

---

## Existing primitives (never rebuild)

| Component | File | Notes |
|---|---|---|
| AppShell | `src/components/layout/AppShell.tsx` | EXISTS — chrome, never touch |
| IconRail | `src/components/layout/IconRail.tsx` | EXISTS — never touch |
| Sidebar | `src/components/layout/Sidebar.tsx` | EXISTS — never touch |
| Header | `src/components/layout/Header.tsx` | EXISTS — never touch |
| Footer | `src/components/layout/Footer.tsx` | EXISTS — never touch |
| OrbitLogo | `src/components/layout/OrbitLogo.tsx` | EXISTS — never touch |
| Badge | `src/components/ui/Badge.tsx` | EXISTS — compose, never restyle |
| Card / CardHeader | `src/components/ui/Card.tsx` | EXISTS — compose, never restyle |
| PageHeader | `src/components/ui/PageHeader.tsx` | EXISTS — use on every screen |
| ProgressBar | `src/components/ui/ProgressBar.tsx` | EXISTS — compose |
| EventSwitcher | `src/components/ui/EventSwitcher.tsx` | EXISTS — canon |
| StatCard | `src/components/ui/StatCard.tsx` | EXISTS — compose |
| AreaChart | `src/components/charts/AreaChart.tsx` | EXISTS |
| ColumnChart | `src/components/charts/ColumnChart.tsx` | EXISTS |
| DonutChart | `src/components/charts/DonutChart.tsx` | EXISTS |
| ApexChart | `src/components/charts/ApexChart.tsx` | EXISTS — used by chart wrappers |

---

## Kit components needed (`src/components/kit/`)

### Data Display

| Component | Output path | Source | Source reference | Notes |
|---|---|---|---|---|
| **DataTable** | `kit/DataTable.tsx` | PORT-VYZOR + BUILD-TO-TOKEN | `../WEB THEME/Vyzor-html/src/html/data-tables.html` — structural pattern (column headers, row density, pagination); DISCARD Bootstrap styling | Built on `@tanstack/react-table`. Shell = existing table recipe from THEME-GUIDE §6. Accepts `columns`, `data`, `loading` (skeleton rows). |
| **FilterBar** | `kit/FilterBar.tsx` | BUILD-TO-TOKEN | — | Flex toolbar: search input (`w-56 h-8`) + `<select>` filters + optional date pickers. Recipe from `/visitors` page toolbar. |
| **EmptyState** | `kit/EmptyState.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/empty.html` — layout structure (icon + heading + body + CTA); DISCARD all Vyzor colour/type | Slot: `icon` (LucideIcon), `title`, `description`, `action`. Centred inside `Card`. Icon: `h-12 w-12 text-slate-300`, title `font-display font-semibold text-orbit-900`, body `text-[13px] text-slate-400`. |
| **SkeletonRow** | `kit/SkeletonRow.tsx` | BUILD-TO-TOKEN | — | `animate-pulse bg-slate-100 rounded` cells matching `DataTable` column widths. Used inside `DataTable` when `loading=true`. |
| **SkeletonCard** | `kit/SkeletonCard.tsx` | BUILD-TO-TOKEN | — | Full-card placeholder: title block + body lines. `h-[260px] animate-pulse rounded-xl bg-slate-50`. |
| **StatTile** | `kit/StatTile.tsx` | EXTEND | `src/components/ui/StatCard.tsx` | StatCard already covers all KPI needs. StatTile = StatCard; use the existing component. Do NOT create a second stat component. |

### Navigation & Containers

| Component | Output path | Source | Source reference | Notes |
|---|---|---|---|---|
| **Tabs** | `kit/Tabs.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/navs_tabs.html` — tab bar structure; DISCARD Bootstrap nav/active classes | Active tab: `border-b-2 border-orbit-500 text-orbit-600 font-semibold`. Inactive: `text-slate-500 hover:text-slate-700`. Height h-10, `text-[13px]`. |
| **Drawer / Sheet** | `kit/Drawer.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/offcanvas.html` — offcanvas slide-in; DISCARD Bootstrap offcanvas classes | Right-side slide: `fixed inset-y-0 right-0 z-50 w-[480px] bg-white shadow-card-hover`. Overlay: `fixed inset-0 bg-orbit-900/40`. Header `h-16 px-5 border-b border-slate-100`. |
| **Modal** | `kit/Modal.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/modals_closes.html` — dialog structure; DISCARD Bootstrap modal classes | Centred dialog: `rounded-xl bg-white shadow-card-hover`. Overlay `bg-orbit-900/50`. Header/footer border-slate-100 `p-5`. Max-width variants: `max-w-md`, `max-w-lg`, `max-w-2xl`. |
| **SettingsTabs** | `kit/SettingsTabs.tsx` | BUILD-TO-TOKEN | — | Vertical left tabs for settings pages. `w-48 border-r border-slate-100`. Active: `bg-orbit-50 text-orbit-600 rounded-lg`. Composed from Tabs + Card. |
| **Wizard / Stepper** | `kit/Stepper.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/form_wizards.html` — multi-step form progression; DISCARD Bootstrap step classes | Horizontal step bar. Completed step: `bg-orbit-500 text-white`. Current: `border-2 border-orbit-500 text-orbit-500`. Pending: `border border-slate-200 text-slate-400`. Connector line: `bg-slate-200` (filled `bg-orbit-500` for completed). |

### Forms & Inputs

| Component | Output path | Source | Source reference | Notes |
|---|---|---|---|---|
| **FormSection** | `kit/FormSection.tsx` | BUILD-TO-TOKEN | — | `<fieldset>` wrapper: `<legend>` with LucideIcon + label (`font-semibold text-slate-800 flex items-center gap-2`). `border-t border-slate-100 pt-5` between sections. Matches `/visitors/register` fieldset pattern. |
| **FormField** | `kit/FormField.tsx` | BUILD-TO-TOKEN | — | `<label>` wrapper: label text (`text-[13px] font-medium text-slate-600 mb-1 block`) + input slot + error message (`text-[12px] text-red-500 mt-1`) + hint (`text-[11px] text-slate-400 mt-1`). Integrates with `react-hook-form` error state. |
| **TextInput** | `kit/TextInput.tsx` | BUILD-TO-TOKEN | — | Standard `h-9 rounded-lg border border-slate-200 px-3 text-sm` input. Error state: `border-red-300 focus:ring-red-100`. Integrates `{...register()}`. |
| **SelectInput** | `kit/SelectInput.tsx` | BUILD-TO-TOKEN | — | `<select>` with same h-9 recipe. ChevronDown via CSS bg-image or overlay — no third-party select. |
| **PhoneInput** | `kit/PhoneInput.tsx` | BUILD-TO-TOKEN | — | `+91` prefix group pattern from `/visitors/register`. Prefix span + `rounded-l-none` input. |
| **CheckboxGroup** | `kit/CheckboxGroup.tsx` | BUILD-TO-TOKEN | — | `flex flex-wrap gap-4` of `<label>` + `<input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-orbit-500">`. |
| **RadioGroup** | `kit/RadioGroup.tsx` | BUILD-TO-TOKEN | — | Same pattern with `type="radio"`. |
| **SearchInput** | `kit/SearchInput.tsx` | BUILD-TO-TOKEN | — | `relative` wrapper with `<Search>` icon `absolute top-1/2 left-2.5 h-3.5 w-3.5 text-slate-400` + `pl-8` input. Heights: `h-8` (filter bar) or `h-9` (standalone). |

### Feedback & Overlays

| Component | Output path | Source | Source reference | Notes |
|---|---|---|---|---|
| **ConfirmDialog** | `kit/ConfirmDialog.tsx` | BUILD-TO-TOKEN | — | Typed-confirmation modal: user must type record name/phrase before the danger button enables. Built on `Modal`. Danger button: `bg-red-500 hover:bg-red-600 text-white`. Cancel: secondary. Input inside: full width, `border-red-300`. |
| **Toast (Sonner)** | `kit/toast.ts` | BUILD-TO-TOKEN | — | `sonner` restyled via its `style`/`className` API to match Orbit tokens. Success: `border-l-4 border-emerald-500`. Error: `border-l-4 border-red-500`. Warning: `border-l-4 border-amber-400`. Font inherit, `rounded-xl shadow-card-hover`. Export `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`. |
| **AlertTile** | `kit/AlertTile.tsx` | BUILD-TO-TOKEN | — | Inline alert inside a card (`flex gap-3 rounded-lg p-3`). Variants: `error` (`bg-red-50/70 text-red-500`) · `warning` (`bg-amber-50/70 text-amber-500`) · `info` (`bg-orbit-50/70 text-orbit-500`). Pattern lifted from `/dashboard/super-admin` "Needs Attention". |
| **StatusBadge** | `kit/StatusBadge.tsx` | EXTEND | `src/components/ui/Badge.tsx` | StatusBadge = Badge with forced `dot`. Pass a `status` string → maps to Badge `variant`. No new component needed for most cases — just `<Badge variant="success" dot>Live</Badge>`. Only create StatusBadge if domain-specific status → variant mapping is complex enough to warrant a wrapper. |

### Utility

| Component | Output path | Source | Source reference | Notes |
|---|---|---|---|---|
| **Cmd-K / Global Search** | `kit/CmdK.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/partials/responsive-search-modal.html` — search modal pattern; DISCARD Vyzor styling | Full-screen `fixed inset-0 z-50` overlay. Input: `h-12 w-full border-0 px-4 text-base focus:outline-none`. Results: scrollable list of `rounded-lg px-4 py-2.5 hover:bg-orbit-50` items. Triggered by `Cmd/Ctrl+K`. |
| **Breadcrumb** | `kit/Breadcrumb.tsx` | PORT-VYZOR | `../WEB THEME/Vyzor-html/src/html/breadcrumb.html` — DOM structure; DISCARD Vyzor styling | `text-[13px]` links separated by `/`. Active segment: `text-slate-700 font-medium`. Previous: `text-slate-400 hover:text-slate-600`. Note: PageHeader `subtitle` already serves this role on most pages — use Breadcrumb only when a separate nav trail is required. |
| **Pagination** | `kit/Pagination.tsx` | BUILD-TO-TOKEN | — | Matches `/visitors` page pagination: `h-8 min-w-8 rounded-lg border border-slate-200` pages. Active: `bg-orbit-500 text-white`. Composed into DataTable footer. |
| **ActivityFeed** | `kit/ActivityFeed.tsx` | BUILD-TO-TOKEN | — | Vertical list of timestamped events. Avatar initials + primary text + secondary text + timestamp chip. Pattern from "Recent Registrations" lists in dashboard pages. |

---

## Summary counts

| Source | Count |
|---|---|
| EXISTS / EXTEND | 18 |
| PORT-VYZOR | 7 |
| BUILD-TO-TOKEN | 14 |
| **Total** | **39** |

---

## Vyzor source files index (for quick reference)

| Vyzor file | Pattern used for |
|---|---|
| `Vyzor-html/src/html/data-tables.html` | DataTable structure |
| `Vyzor-html/src/html/empty.html` | EmptyState layout |
| `Vyzor-html/src/html/offcanvas.html` | Drawer / Sheet |
| `Vyzor-html/src/html/modals_closes.html` | Modal |
| `Vyzor-html/src/html/navs_tabs.html` | Tabs |
| `Vyzor-html/src/html/form_wizards.html` | Stepper / Wizard |
| `Vyzor-html/src/html/partials/responsive-search-modal.html` | Cmd-K |
| `Vyzor-html/src/html/breadcrumb.html` | Breadcrumb |

> **Reminder:** When porting Vyzor, copy only the HTML element structure and ARIA attributes. Replace every Bootstrap/Vyzor class with THEME-GUIDE token classes. Never import Vyzor CSS or JS.
