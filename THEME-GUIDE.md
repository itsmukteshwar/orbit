# THEME-GUIDE — Orbit Event ERP Design System

> **Single source of truth for all styling decisions.**  
> Every token below is extracted from `src/app/globals.css` and the existing component library. Any value not listed here is FORBIDDEN. If it isn't in this file, it doesn't exist in Orbit.

---

## 1. Design Tokens (`src/app/globals.css`)

### Color Scale — Orbit Blue (brand)

| Token | Tailwind class | Hex | Usage |
|---|---|---|---|
| `--color-orbit-50` | `orbit-50` | `#E6F0FF` | Icon backgrounds, tint chips, hover fill |
| `--color-orbit-100` | `orbit-100` | `#D6E6FF` | Ring focus color, subtle highlight |
| `--color-orbit-200` | `orbit-200` | `#B3D1FF` | Chart secondary fill, column chart pale |
| `--color-orbit-300` | `orbit-300` | `#60A5FA` | Sky/accent, chart series 3, Skyblue dot |
| `--color-orbit-400` | `orbit-400` | `#3B82F6` | Hover rings |
| `--color-orbit-500` | `orbit-500` | `#2563EB` | **Primary brand — buttons, links, active states, chart series 1** |
| `--color-orbit-600` | `orbit-600` | `#1D4ED8` | Button hover (`hover:bg-orbit-600`) |
| `--color-orbit-700` | `orbit-700` | `#1E40AF` | Active sidebar text |
| `--color-orbit-900` | `orbit-900` | `#0B132B` | **Deep Navy — page titles, icon rail bg, dark accent, chart series 2** |

### Semantic Colors (Tailwind built-ins used canonically)

| Semantic | Tailwind class | Hex approx | Usage |
|---|---|---|---|
| Success | `emerald-500 / emerald-50 / emerald-600` | `#22C55E / #ECFDF5` | Live status, positive trends, check-in |
| Warning | `amber-400 / amber-50 / amber-500 / amber-700` | `#F59E0B / #FFFBEB` | Queue load, no-show, early bird tickets |
| Danger | `red-500 / red-50 / red-600` | `#EF4444 / #FEF2F2` | Errors, duplicate scans, delete |
| Info | `sky-500 / sky-50 / sky-600` | `#0EA5E9 / #F0F9FF` | Revenue info, online registration source |
| Secondary | `violet-500 / violet-50 / violet-600` | `#8B5CF6 / #F5F3FF` | Beta badges, delegate category |
| Neutral | `slate-*` (full scale) | — | All text, borders, backgrounds |

### Background

| Token | Tailwind | Value | Usage |
|---|---|---|---|
| `--color-surface` | `surface` | `#F4F6F8` | `<body>` background — the page canvas |
| — | `white` | `#FFFFFF` | Card surfaces, header, sidebar |
| — | `slate-50` | `#F8FAFC` | Table header stripe (`bg-slate-50/60`) |
| — | `slate-100` | `#F1F5F9` | Input background, scrollbar thumb, dividers |

### Typography

| Token | Tailwind var | Font | Role |
|---|---|---|---|
| `--font-sans` | `font-sans` | Inter (via `--font-inter`) | All body text, UI labels, table cells |
| `--font-display` | `font-display` | Poppins (via `--font-poppins`) | Page titles (`h1`), card titles (`h2`), stat values |

**Weight conventions:**
- `font-medium` (500) — nav items, field labels, table cell text
- `font-semibold` (600) — stat values, card headings, active nav, table header
- `font-bold` (700) — brand name "ORBIT." in sidebar

**Size scale in use (rem / px):**

| Class | px | Used for |
|---|---|---|
| `text-[10px]` | 10 | Sub-labels, "EVENT ERP" brand tag |
| `text-[11px]` | 11 | Table headers (uppercase tracking), avatar initials, tiny hints |
| `text-[12px]` | 12 | Secondary cell text, timestamps, chart legend |
| `text-[13px]` | 13 | Sidebar nav items, filter selects, form labels, tooltip body |
| `text-sm` | 14 | Button labels, global search, primary UI text |
| `text-base` (default) | `0.875rem` | Body (set on `<body>`) |
| `text-lg` | 18 | Badge poster headings |
| `text-xl` | 20 | Page `<h1>` via `PageHeader` |
| `text-xl` in StatCard | — | Stat value (`font-display text-xl font-semibold`) |

### Shadows

| Token | Tailwind class | Value | Usage |
|---|---|---|---|
| `--shadow-card` | `shadow-card` | `0 1px 2px rgb(11 19 43/0.04), 0 1px 3px rgb(11 19 43/0.06)` | All white cards, secondary buttons |
| `--shadow-card-hover` | `shadow-card-hover` | `0 4px 12px rgb(11 19 43/0.08)` | Dropdowns (EventSwitcher), hover states |
| `shadow-sm` | `shadow-sm` | Tailwind default | Primary action buttons (`bg-orbit-500`) |

### Border Radius

| Value | Used on |
|---|---|
| `rounded-lg` (8px) | Inputs, buttons, filter selects, dropdown rows, table action buttons, alert tiles |
| `rounded-xl` (12px) | **Cards** (main surface), StatCard, action-grid buttons, pass preview, poster |
| `rounded-full` | Avatar initials, Badge/pill, status dots, progress bar, scrollbar |
| `rounded-[3px]` | Scrollbar thumb (inline CSS) |

### Spacing Habits

- **Page grid gap:** `gap-4` (1rem) between all grid cells and stacked cards
- **Card internal padding:** `p-5` (1.25rem) for body sections; `px-5 py-3` for table rows
- **Card header:** `p-5 pb-3` (title block inside CardHeader)
- **Stat card:** `p-5` with `gap-3` between icon and text block
- **Sidebar nav:** `px-3 py-2` section header; `py-1.5 pr-3 pl-11` child links
- **Table rows:** `px-5 py-2.5` headers; `px-4 py-3` / `px-5 py-3` data cells
- **Form fields:** `gap-3` grid, `mb-1` label-to-input, `mt-1` hint text
- **Button height:** `h-9` (36px) for all toolbar buttons
- **Input height:** `h-9` for all text inputs and selects
- **Avatar sizes:** `h-8 w-8` small (table cells); `h-9 w-9` medium (lists); `h-11 w-11` StatCard icon box

---

## 2. Component Library

### `Badge` — `src/components/ui/Badge.tsx`

**Props:**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `BadgeVariant` | `"primary"` | 7 options below |
| `dot` | `boolean` | `false` | Renders a 1.5×1.5 rounded dot before text |
| `children` | `ReactNode` | — | Badge text |
| `className` | `string` | — | Extra classes |

**Variants:**

| Variant | Bg | Text | Used for |
|---|---|---|---|
| `primary` | `orbit-50` | `orbit-600` | Online source, ticket type Regular |
| `success` | `emerald-50` | `emerald-600` | Checked-in, Live, Synced, Published |
| `warning` | `amber-50` | `amber-700` | Approvals, queue alerts, Early Bird |
| `danger` | `red-50` | `red-600` | Duplicate, No-show, Error |
| `info` | `sky-50` | `sky-600` | Online registration source, Revenue |
| `secondary` | `violet-50` | `violet-600` | Beta, Delegate, AI |
| `neutral` | `slate-100` | `slate-500` | Completed, Walk-in, Cancelled |

**Visual recipe:** `inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold` + variant classes.

**Usage example (from `/dashboard/organizer`):**
```tsx
<Badge variant="success" dot>Day 2 Live</Badge>
<Badge variant="warning">18</Badge>
```

---

### `Card` + `CardHeader` — `src/components/ui/Card.tsx`

**`Card` props:**

| Prop | Type | Notes |
|---|---|---|
| `children` | `ReactNode` | — |
| `className` | `string` | Extend with `overflow-hidden`, `p-5`, `self-start` etc. |

**Visual recipe:** `rounded-xl bg-white shadow-card` — always a `<section>` element.

**`CardHeader` props:**

| Prop | Type | Notes |
|---|---|---|
| `title` | `ReactNode` | Bold heading; may include inline Badge |
| `subtitle` | `string` | Optional muted sub-line |
| `action` | `ReactNode` | Right-aligned slot (links, small buttons) |

**Visual recipe:** `flex items-start justify-between gap-3 p-5 pb-3`. Title: `font-display font-semibold text-orbit-900`. Subtitle: `mt-0.5 text-[13px] text-slate-400`.

**Usage example:**
```tsx
<Card className="overflow-hidden">
  <CardHeader title="Gate & Counter Status" subtitle="Scanner devices, throughput and sync health" />
  <div className="overflow-x-auto">…table…</div>
</Card>
```

---

### `StatCard` — `src/components/ui/StatCard.tsx`

**Props:**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — | UPPERCASE tracking label above value |
| `value` | `string` | — | Large formatted number/text |
| `icon` | `LucideIcon` | — | 20×20 icon in tinted square |
| `accent` | `StatAccent` | `"primary"` | Controls left border + icon bg |
| `trend` | `{text,positive}` | — | Green/red pill chip |
| `hint` | `string` | — | Muted context after trend |

**Accent options:** `primary` (orbit-500) · `success` (emerald) · `warning` (amber) · `danger` (red) · `info` (sky) · `dark` (orbit-900/slate).

**Visual recipe:** `rounded-xl border-l-4 bg-white p-5 shadow-card` + accent border class. Icon: `h-11 w-11 rounded-lg` tinted bg. Label: `text-[11px] font-medium tracking-wide text-slate-400 uppercase`. Value: `font-display text-xl font-semibold text-orbit-900`.

**Usage example (from `/dashboard/event`):**
```tsx
<StatCard label="Seats Left" value="72" icon={Armchair} accent="warning" hint="14% remaining of 500" />
```

---

### `PageHeader` — `src/components/ui/PageHeader.tsx`

**Props:**

| Prop | Type | Notes |
|---|---|---|
| `title` | `ReactNode` | `<h1>` — may include inline Badge |
| `subtitle` | `string` | Breadcrumb-style muted text |
| `actions` | `ReactNode` | Right slot — buttons, dropdowns |

**Visual recipe:** `flex flex-wrap items-end justify-between gap-3`. Title: `font-display text-xl font-semibold text-orbit-900`. Subtitle: `mt-0.5 text-slate-500`. Actions: `flex flex-wrap items-center gap-2`.

**Usage example:**
```tsx
<PageHeader
  title="All Visitors"
  subtitle="Dashboard · Visitors"
  actions={<button className="…">Export</button>}
/>
```

---

### `ProgressBar` — `src/components/ui/ProgressBar.tsx`

**Props:** `value` (0–100), `label` (ARIA), `tone` (`primary|success|warning|danger`), `className`.

**Visual recipe:** `h-1.5 w-full rounded-full bg-slate-100` track; inner fill `h-1.5 rounded-full` with tone color. Full ARIA `role="progressbar"`.

**Tone colors:** primary → `orbit-500`; success → `emerald-500`; warning → `amber-400`; danger → `red-400`.

**Usage example:**
```tsx
<ProgressBar value={gate.queueLoad} label={`Queue load ${gate.queueLoad}%`}
  tone={gate.queueLoad > 80 ? "danger" : gate.queueLoad > 60 ? "warning" : "success"}
  className="w-24" />
```

---

### `EventSwitcher` — `src/components/ui/EventSwitcher.tsx`

**Props:** `value: string`, `onChange: (name: string) => void`.

**Visual recipe:** Trigger `h-9 rounded-lg border border-slate-200 bg-white px-3.5 shadow-card` with CalendarRange icon + ChevronDown. Dropdown: `w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-card-hover`. Search input inside. List rows use `orbit-50` selected state.

---

### Layout Components

#### `AppShell` — `src/components/layout/AppShell.tsx`

Client component. Orchestrates icon rail + sidebar + header + footer. Content column: `lg:pl-[19.5rem]` (14px rail + 256px sidebar). Main: `mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6`.

**Do not rebuild.** Pass `children` — AppShell wraps them automatically via `layout.tsx`.

#### `IconRail` — `src/components/layout/IconRail.tsx`

Fixed `w-14`, hidden on mobile (`hidden lg:flex`). One 40×40 rounded-lg button per `NAV_SECTION`. Active: `bg-orbit-50 text-orbit-600`; rest: `text-slate-400 hover:bg-orbit-50/60 hover:text-orbit-500`.

#### `Sidebar` — `src/components/layout/Sidebar.tsx`

Fixed `w-64`, offset `left-14` on desktop, drawer on mobile. Accordion: one section open at a time. Child links: `py-1.5 pr-3 pl-11 text-[13px]` with active `bg-orbit-50 font-semibold text-orbit-600`.

#### `Header` — `src/components/layout/Header.tsx`

Sticky `h-16`, `bg-white/90 backdrop-blur`, `border-b border-slate-200/80`. Global search: `w-80 h-9 bg-slate-100/80 rounded-lg`. Right slot: Bell (with red dot badge) + Maximize + Profile avatar.

#### `Footer` — `src/components/layout/Footer.tsx`

`py-4 text-center text-[12px] text-slate-400`. Brand tagline only.

#### `OrbitLogo` — `src/components/layout/OrbitLogo.tsx`

SVG infinity mark. Stroke: `#2563EB` (orbit-500). Dot: `#60A5FA` (orbit-300). Accepts `size` (px) and `className`.

---

## 3. Chart Components (`src/components/charts/`)

### `ApexChart` — SSR wrapper

Dynamic import with `ssr: false`. Loading state: `h-[260px] animate-pulse rounded-lg bg-slate-50`. All chart components use this wrapper.

### Chart Color Conventions

| Role | Color | Hex |
|---|---|---|
| Series 1 (primary) | orbit-500 | `#2563EB` |
| Series 2 (secondary) | orbit-900 | `#0B132B` |
| Series 3 (accent) | orbit-300 | `#60A5FA` |
| Series pale fill | orbit-200 | `#B3D1FF` |
| Success series | emerald-500 | `#22C55E` |
| Warning series | amber-400 | `#F59E0B` |
| Exits / neutral | slate-400 | `#94A3B8` |
| Churned / dim | slate-300 | `#CBD5E1` |

**Grid:** `borderColor: "#eef2f6"`, `strokeDashArray: 4`.  
**Axis labels:** `colors: "#94A3B8"`, `fontSize: "11px"`.  
**Legend:** `position: "top"`, `horizontalAlign: "right"`, `fontSize: "12px"`.  
**Font:** `fontFamily: "inherit"` (Inter via body).

### `AreaChart`

Default height 290. `stroke.curve: "smooth"`, `stroke.width: 2.5`. Fill: `gradient`, opacityFrom 0.25 → opacityTo 0.02. Default colors: `["#2563EB", "#60A5FA"]`.

### `ColumnChart`

Default height 260. `columnWidth: "40%"`, `borderRadius: 4`, `borderRadiusApplication: "end"`. Default colors: `["#B3D1FF", "#2563EB"]`.

### `DonutChart`

Default height 220. `donut.size: "76%"`. Centre labels: name `12px slate-400`; value `20px orbit-900 font-semibold`; total label `12px slate-400`. `stroke.width: 2, colors: ["#fff"]`.

### `ValueFormat` (serialisable)

```ts
interface ValueFormat {
  prefix?: string;   // e.g. "₹"
  suffix?: string;   // e.g. "L" or " visitors"
  decimals?: number; // fixed decimal places
  indian?: boolean;  // Indian digit grouping 1,42,381
}
```

Pass to any chart via `format` prop. Builds ApexCharts `y.formatter`.

---

## 4. Button Recipes

All buttons use `h-9`, `rounded-lg`, `text-sm font-medium`, `flex items-center gap-2`.

| Variant | Classes |
|---|---|
| **Primary** | `bg-orbit-500 px-3.5 text-white shadow-sm hover:bg-orbit-600` |
| **Secondary** | `border border-slate-200 bg-white px-3.5 text-slate-600 shadow-card hover:bg-slate-50` |
| **Icon-only** | `w-9 justify-center border border-slate-200 bg-white text-slate-600 shadow-card hover:bg-slate-50` |
| **Ghost / cancel** | `px-3.5 text-slate-500 hover:bg-slate-100` (no border, no bg) |
| **Danger** | `bg-red-500 px-3.5 text-white shadow-sm hover:bg-red-600` |

---

## 5. Input / Form Element Recipes

```
h-9 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400
transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none
```

- **Prefix/suffix group:** prefix `h-9 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500`; input `rounded-l-none`
- **Label:** `block text-[13px] font-medium text-slate-600` with `mb-1`
- **Required star:** `<span className="text-red-500">*</span>`
- **Hint text:** `mt-1 block text-[11px] text-slate-400`
- **Checkbox/radio accent:** `accent-orbit-500`
- **Select:** same classes as text input

---

## 6. Table Recipe (canonical)

```html
<table class="w-full text-left whitespace-nowrap">
  <thead>
    <tr class="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
      <th class="px-5 py-2.5 font-semibold">Column</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-slate-100">
    <tr class="transition-colors hover:bg-slate-50/60">
      <td class="px-5 py-3">…</td>
    </tr>
  </tbody>
</table>
```

Wrap in `<div class="overflow-x-auto">` inside `<Card class="overflow-hidden">`.

---

## 7. Action Button Cluster (table rows)

```tsx
<div className="flex justify-end gap-1.5">
  <button className="rounded-lg bg-orbit-50 p-1.5 text-orbit-500 hover:bg-orbit-100"><Eye /></button>
  <button className="rounded-lg bg-sky-50   p-1.5 text-sky-500   hover:bg-sky-100" ><Pencil /></button>
  <button className="rounded-lg bg-red-50   p-1.5 text-red-500   hover:bg-red-100" ><Trash2 /></button>
</div>
```

Icon size: `h-3.5 w-3.5`.

---

## 8. Alert / Attention Tile Recipe

```tsx
<li className="flex gap-3 rounded-lg bg-red-50/70 p-3">
  <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
  <div>
    <p className="font-medium text-slate-800">Title</p>
    <p className="mt-0.5 text-[12px] text-slate-500">Detail · timestamp</p>
  </div>
</li>
```

Variants: `bg-red-50/70` · `bg-amber-50/70` · `bg-orbit-50/70`.

---

## 9. Avatar / Initials Pattern

```tsx
<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
  {initials}
</span>
```

Sizes: `h-8 w-8` (small, table), `h-9 w-9` (list items), `h-11 w-11` (StatCard icon).

---

## 10. FORBIDDEN LIST

The following are **absolutely prohibited** on any new screen or component:

### Colors
- ❌ Any hex literal not in the token table above (e.g. `#FF6B35`, `#1A1A2E`)
- ❌ Any `bg-blue-*`, `bg-indigo-*`, `bg-gray-*`, `bg-zinc-*`, `bg-neutral-*`, `bg-stone-*`, `bg-teal-*`, `bg-cyan-*`, `bg-lime-*`, `bg-pink-*`, `bg-fuchsia-*`, `bg-rose-*` classes — use Orbit tokens or the semantic slate/emerald/amber/red/sky/violet classes that are already in canon
- ❌ Arbitrary CSS color values in `style={}` props
- ❌ Tailwind `arbitrary` color syntax like `bg-[#abc123]`

### Shadows / Radius / Spacing
- ❌ `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` — only `shadow-card`, `shadow-card-hover`, `shadow-sm`
- ❌ `rounded-2xl`, `rounded-3xl`, `rounded-none` on cards/inputs — only `rounded-lg` or `rounded-xl`
- ❌ Spacing values outside the Tailwind scale (no `p-[13px]`, no `mt-[7px]`)

### Fonts
- ❌ Any Google Font or system font not already loaded — no `font-mono`, no `font-serif`
- ❌ Explicit `font-family` in `style={}`
- ❌ `text-2xl` or larger for any non-display element

### Libraries
- ❌ shadcn/ui default styles (you may use its component logic if you bring our own token classes)
- ❌ MUI, AntD, DaisyUI, ChakraUI, Mantine, or any component kit that ships its own CSS
- ❌ `react-select` with default styling — build searchable select from scratch with our input recipe
- ❌ Bootstrap, Bulma, or any CSS framework
- ❌ Tailwind plugin classes not already in the codebase (`@tailwindcss/typography`, `@tailwindcss/forms` etc.)

### Structure
- ❌ Rebuilding `AppShell`, `IconRail`, `Sidebar`, `Header`, `Footer` — they exist, use them
- ❌ Rebuilding `StatCard`, `PageHeader`, `Badge`, `Card`, `ProgressBar`, `AreaChart`, `ColumnChart`, `DonutChart` — extend or compose them
- ❌ New chart colors not in §3 chart color table
- ❌ Spinners — only skeleton loaders (`animate-pulse rounded-lg bg-slate-50`)
- ❌ Hardcoded dates/INR amounts without using `formatIndian()` or event-timezone formatting
