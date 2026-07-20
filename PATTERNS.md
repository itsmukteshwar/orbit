# PATTERNS — Orbit Event ERP Layout Law

> The four canonical layout patterns extracted from the 6 reference pages. Every future screen **must name which pattern it follows** at the top of its spec. A screen assembled correctly from this file will be indistinguishable from the reference pages.

---

## How to use this file

1. Pick the pattern whose data shape matches your screen.
2. Copy the annotated structure into your page file.
3. Replace placeholder components with real data; do NOT change spacing, grid columns, or component choices.
4. All patterns share the same outer container provided by `AppShell` → `<main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6">`.

---

## PATTERN: DASHBOARD

**Reference pages:** `/dashboard/organizer`, `/dashboard/event`, `/dashboard/super-admin`  
**Use for:** Any screen that displays live KPIs, charts, and activity/recent-record lists.

### Annotated structure

```
<>                                                        {/* Fragment — children of <main> */}

  {/* ── ZONE 1: Page header ──────────────────────────── */}
  <PageHeader
    title="…"                                             {/* font-display text-xl font-semibold text-orbit-900 */}
    subtitle="…"                                          {/* muted breadcrumb / event context */}
    actions={<>…buttons…</>}                              {/* right-aligned; see button recipes */}
  />

  {/* ── ZONE 2: KPI row ──────────────────────────────── */}
  {/*   4-up on xl, 2-up on sm, 1-up on mobile           */}
  {/*   Use 6-up (2xl:grid-cols-6) on super-admin scale   */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard label="…" value="…" icon={…} accent="…" trend={…} hint="…" />
    <StatCard … />
    <StatCard … />
    <StatCard … />
  </div>

  {/* ── ZONE 3: Chart cards row ──────────────────────── */}
  {/*   Wide chart 2/3 + narrow chart 1/3                 */}
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

    <Card className="xl:col-span-2">
      <CardHeader title="…" subtitle="…" />
      <div className="px-5 pb-5">
        <AreaChart … />   {/* or ColumnChart */}
      </div>
    </Card>

    <Card>
      <CardHeader title="…" subtitle="…" />
      <div className="px-5 pb-5">
        <DonutChart … />
        {/* Legend list below donut: space-y-2 text-[13px] */}
        <ul className="mt-4 space-y-2 text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orbit-500" />
            Label
            <span className="ml-auto font-semibold text-slate-800">value</span>
            <span className="w-10 text-right text-slate-400">share%</span>
          </li>
        </ul>
      </div>
    </Card>

  </div>

  {/* ── ZONE 4: Wide table + right sidebar column ─────── */}
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

    {/* Table card (2/3 width) */}
    <Card className="overflow-hidden xl:col-span-2">
      <CardHeader title={<span className="flex items-center gap-2">…<Badge …>…</Badge></span>} subtitle="…" />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
              <th className="px-5 py-2.5 font-semibold">Col</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="transition-colors hover:bg-slate-50/60">
              <td className="px-5 py-3">…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    {/* Right column (1/3 width): stacked cards */}
    <div className="space-y-4">

      {/* Alert / Attention card */}
      <Card className="p-5">
        <h2 className="mb-3 font-display font-semibold text-orbit-900">Needs Attention</h2>
        <ul className="space-y-3">
          {/* AlertTile: bg-red-50/70 | bg-amber-50/70 | bg-orbit-50/70 */}
          <li className="flex gap-3 rounded-lg bg-red-50/70 p-3">
            <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-slate-800">Title</p>
              <p className="mt-0.5 text-[12px] text-slate-500">Detail · timestamp</p>
            </div>
          </li>
        </ul>
      </Card>

      {/* Activity / recent list card */}
      <Card className="p-5">
        <h2 className="mb-3 font-display font-semibold text-orbit-900">Recent …</h2>
        <ul className="space-y-3.5">
          <li className="flex items-center gap-3">
            {/* Avatar initials */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
              AB
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-800">Name</p>
              <p className="text-[12px] text-slate-400">Detail · time</p>
            </div>
            <Badge variant="…">Label</Badge>
          </li>
        </ul>
      </Card>

    </div>
  </div>

  {/* ── ZONE 5 (optional): Full-width chart ───────────── */}
  <Card>
    <CardHeader title="…" subtitle="…" />
    <div className="px-5 pb-5">
      <ColumnChart … />
    </div>
  </Card>

</>
```

### Spacing rules

| Gap | Value |
|---|---|
| Between zones | `space-y-6` (provided by `<main>`) |
| Grid gutter | `gap-4` (1rem) |
| Stat card grid | `sm:grid-cols-2 xl:grid-cols-4` (or 6 for super-admin) |
| Chart grid | `xl:grid-cols-3` (wide=2, narrow=1) |
| Table+sidebar grid | `xl:grid-cols-3` (table=2, sidebar=1) |

### Kit components used

PageHeader · StatCard · Card · CardHeader · Badge · AreaChart · ColumnChart · DonutChart · ProgressBar · ActivityFeed (kit) · AlertTile (kit)

### Quick-action grid (organizer-only variant)

```tsx
<div className="grid grid-cols-2 gap-2">
  {ACTIONS.map(a => (
    <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3.5 transition hover:border-orbit-300 hover:bg-orbit-50/40">
      <a.icon className="h-5 w-5 text-orbit-500" />
      <span className="text-[12px] font-medium text-slate-700">{a.label}</span>
    </button>
  ))}
</div>
```

---

## PATTERN: LIST

**Reference page:** `/visitors`  
**Use for:** Any screen showing a paginated, filterable list of records (visitors, exhibitors, registrations, badges, etc.).

### Annotated structure

```
<>

  {/* ── ZONE 1: Page header ──────────────────────────── */}
  <PageHeader title="…" subtitle="Dashboard · Module" actions={<>…</>} />

  {/* ── ZONE 2: Stat row (4-up) ──────────────────────── */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard … />  {/* × 4 summary KPIs */}
  </div>

  {/* ── ZONE 3: Table card ───────────────────────────── */}
  <Card className="overflow-hidden">

    {/* Filter toolbar */}
    <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
      {/* Left: record count */}
      <p className="text-slate-500">
        Showing <span className="font-semibold text-slate-800">N,NNN</span> records · Page X of Y
      </p>
      {/* Right: filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-600 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
        >
          <option>All Categories</option>
        </select>
        {/* SearchInput (kit): h-8 w-56 pl-8 */}
        <SearchInput placeholder="Search name, ID…" className="h-8 w-56" />
      </div>
    </div>

    {/* Density: compact (py-3 rows) with whitespace-nowrap */}
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
            <th className="px-5 py-2.5 font-semibold">ID</th>
            <th className="px-4 py-2.5 font-semibold">Name</th>
            {/* Responsive hiding: className="hidden sm:table-cell" or "hidden md:table-cell" */}
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-5 py-2.5 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr className="transition-colors hover:bg-slate-50/60">
            <td className="px-5 py-3">
              <Link href="#" className="font-medium text-orbit-500 hover:text-orbit-600">ID</Link>
            </td>
            <td className="px-4 py-3">
              {/* Name+avatar cell */}
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-[11px] font-semibold text-orbit-600">AB</span>
                <div>
                  <p className="font-medium text-slate-800">Name</p>
                  <p className="text-[11px] text-slate-400">sub-text</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge variant="success" dot>Active</Badge>
            </td>
            <td className="px-5 py-3">
              {/* Action cluster: view/edit/delete */}
              <div className="flex justify-end gap-1.5">
                <button className="rounded-lg bg-orbit-50 p-1.5 text-orbit-500 hover:bg-orbit-100"><Eye className="h-3.5 w-3.5" /></button>
                <button className="rounded-lg bg-sky-50   p-1.5 text-sky-500   hover:bg-sky-100"  ><Pencil className="h-3.5 w-3.5" /></button>
                <button className="rounded-lg bg-red-50   p-1.5 text-red-500   hover:bg-red-100"  ><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Pagination footer */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5">
      <span className="text-[13px] text-slate-400">Showing 20 of N,NNN entries</span>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {/* Pagination (kit) */}
      </nav>
    </div>

  </Card>

</>
```

### Spacing rules

| Element | Value |
|---|---|
| Filter toolbar padding | `p-5 pb-3` |
| Table header row | `py-2.5` |
| Table data rows | `py-3` |
| Pagination footer | `p-4 px-5` |
| Filter selects height | `h-8` |
| Search input width | `w-56` |

### Responsive column hiding

- Columns that fit on tablet only: `className="hidden sm:table-cell"`
- Columns for desktop only: `className="hidden md:table-cell"`
- Always visible: ID/badge, name, status, action column

### Kit components used

PageHeader · StatCard · Card · Badge · SearchInput (kit) · DataTable (kit) · FilterBar (kit) · EmptyState (kit) · Pagination (kit) · ConfirmDialog (kit, triggered by delete button)

---

## PATTERN: FORM

**Reference page:** `/visitors/register`  
**Use for:** Any create/edit screen where user fills in details (visitor, exhibitor, event, badge, etc.).

### Annotated structure

```
<>

  {/* ── ZONE 1: Page header ──────────────────────────── */}
  <PageHeader
    title="Register New …"
    subtitle="Dashboard · Module · Action"
    actions={
      <Link href="/…" className="…secondary button…">
        <ArrowLeft className="h-4 w-4" /> Back to list
      </Link>
    }
  />

  {/* ── ZONE 2: Form + side panel ──────────────────────── */}
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

    {/* ── Main form card (2/3) ─────────────────────────── */}
    <Card className="xl:col-span-2">
      <CardHeader title="… Details" />
      <form className="space-y-6 px-5 pb-5" noValidate>

        {/* Section 1 */}
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <SomeIcon className="h-4 w-4 text-orbit-500" /> Section Label
          </legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-slate-600">
                Field Name <span className="text-red-500">*</span>
              </span>
              <input className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
                placeholder="…" required />
              <span className="mt-1 block text-[11px] text-slate-400">Hint text</span>
            </label>
          </div>
        </fieldset>

        {/* Section 2 (separated by border-t) */}
        <fieldset className="border-t border-slate-100 pt-5">
          …
        </fieldset>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          <button type="submit" className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
            <Send className="h-4 w-4" /> Save & Send
          </button>
          <button type="submit" className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Printer className="h-4 w-4" /> Save & Print
          </button>
          <Link href="/…" className="ml-auto flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Cancel
          </Link>
        </div>

      </form>
    </Card>

    {/* ── Side column (1/3): preview + info cards ─────── */}
    <div className="space-y-4">

      {/* Preview card (domain-specific) */}
      <Card>
        <CardHeader title="Preview" />
        <div className="px-5 pb-5">
          {/* Badge/pass preview, image preview, etc. */}
        </div>
      </Card>

      {/* Info / next-steps card */}
      <Card>
        <CardHeader title="What Happens Next" />
        <ul className="space-y-3.5 px-5 pb-5">
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-orbit-500">
              <StepIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-slate-800">Step title</p>
              <p className="text-[12px] text-slate-400">Step description</p>
            </div>
          </li>
        </ul>
      </Card>

    </div>
  </div>

</>
```

### Spacing rules

| Element | Value |
|---|---|
| Form `space-y` | `space-y-6` between fieldsets |
| Fieldset separator | `border-t border-slate-100 pt-5` |
| Field grid gap | `gap-3` |
| Field grid cols | `md:grid-cols-2` (default), `md:grid-cols-3` (professional section) |
| Label margin | `mb-1 block` |
| Hint margin | `mt-1 block` |
| Action bar separator | `border-t border-slate-100 pt-5` |
| Action bar gap | `gap-2` |
| Card padding | `px-5 pb-5` |

### Grid column widths for fields

- Standard field: `md:col-span-1` (half in 2-col) or `md:col-span-1` (third in 3-col)
- Wide field: `md:col-span-2` spans two columns
- Full-width: no col-span (1-col grid)

### Kit components used

PageHeader · Card · CardHeader · FormSection (kit) · FormField (kit) · TextInput (kit) · SelectInput (kit) · PhoneInput (kit) · CheckboxGroup (kit) · RadioGroup (kit)

---

## PATTERN: OPS

**Reference page:** `/onsite/food-coupons`  
**Use for:** Real-time operations screens — live counters, scanner views, queue dashboards, gate monitor, badge print queue.

### Annotated structure

```
<>

  {/* ── ZONE 1: Page header with live badge ──────────── */}
  <PageHeader
    title={
      <span className="flex items-center gap-2.5">
        Module Name <Badge variant="success" dot>Window Live</Badge>
      </span>
    }
    subtitle="Dashboard · Onsite Ops · Sub-module"
    actions={<>…primary action + export + secondary…</>}
  />

  {/* ── ZONE 2: Live KPI row (4-up) ──────────────────── */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard label="…Issued"    value="N,NNN" icon={Ticket}    accent="primary" hint="…" />
    <StatCard label="…Redeemed"  value="N,NNN" icon={CheckCircle2} accent="success" trend={…} hint="…" />
    <StatCard label="Active Now" value="N / M" icon={Utensils}  accent="warning" trend={…} hint="…" />
    <StatCard label="Blocked"    value="NN"    icon={ShieldX}   accent="danger"  hint="…" />
  </div>

  {/* ── ZONE 3: Ops table + live feed column ──────────── */}
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

    {/* Left: stacked ops cards (2/3) */}
    <div className="space-y-4 xl:col-span-2">

      {/* Session/window status table */}
      <Card className="overflow-hidden">
        <CardHeader title="… Windows" subtitle="Entitlements and progress per window" />
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-2.5 font-semibold">Window</th>
                <th className="px-4 py-2.5 font-semibold">Timing</th>
                <th className="px-4 py-2.5 font-semibold">Entitled</th>
                <th className="px-4 py-2.5 text-right font-semibold">Redeemed</th>
                <th className="w-1/4 px-4 py-2.5 font-semibold">Progress</th>
                <th className="px-5 py-2.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <WindowIcon className="h-4 w-4 text-amber-500" /> Window Name
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">HH:MM – HH:MM</td>
                <td className="px-4 py-3 text-slate-600">{formatIndian(n)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatIndian(n)}</td>
                <td className="px-4 py-3">
                  <ProgressBar value={pct} label="…" tone="success" />
                </td>
                <td className="px-5 py-3 text-right">
                  <Badge variant="success" dot>Live</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Throughput chart */}
      <Card>
        <CardHeader title="Throughput Per Hour" subtitle="Day 1 vs Day 2" />
        <div className="px-5 pb-5">
          <ColumnChart … />
        </div>
      </Card>

    </div>

    {/* Right: live feed + split donut (1/3) */}
    <div className="space-y-4">

      {/* Live redemption / scan log */}
      <Card>
        <CardHeader title="Live Log" action={<Badge variant="success" dot>Live</Badge>} />
        <ul className="space-y-3.5 px-5 pb-5">
          {LOG.map(entry => (
            <li className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${entry.ok ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>
                {entry.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800">{entry.title}</p>
                <p className="text-[12px] text-slate-400">{entry.detail}</p>
              </div>
              <Badge variant={entry.tone}>{entry.badge}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      {/* Split / preference donut */}
      <Card>
        <CardHeader title="Category Split" />
        <div className="px-5 pb-5">
          <DonutChart … />
        </div>
      </Card>

    </div>
  </div>

</>
```

### Spacing rules

| Element | Value |
|---|---|
| Live log item gap | `space-y-3.5` |
| Log icon size | `h-8 w-8 rounded-full` |
| Log icon inner | `h-4 w-4` |
| Session table progress col | `w-1/4 px-4` |
| Status column | `px-5 text-right` |
| All other columns | `px-4` |

### OPS-specific conventions

- The page title always includes a live `<Badge variant="success" dot>…</Badge>` when a window is active.
- Timestamps and counts update in real time — render via React Query polling (refetchInterval).
- Offline entries show `<WifiOff>` icon with `bg-amber-50 text-amber-500` and `<Badge variant="warning">Queued</Badge>`.
- Error/duplicate entries show `<X>` icon with `bg-red-50 text-red-500` and `<Badge variant="danger">Duplicate</Badge>`.
- Never use spinners. Show `animate-pulse` skeleton if the log hasn't loaded yet.

### Kit components used

PageHeader · StatCard · Card · CardHeader · Badge · ProgressBar · ColumnChart · DonutChart · ActivityFeed (kit, adapted for live log) · formatIndian

---

## Pattern decision matrix

| Screen type | Pattern |
|---|---|
| Platform overview, organizer command center, event overview | DASHBOARD |
| Visitor list, exhibitor list, registration list, badge list, report table | LIST |
| Register visitor, create event, edit exhibitor, badge designer setup | FORM |
| Gate monitor, food coupon redemption, QR check-in, print queue, counter view | OPS |
| Settings / account / plan | FORM (with SettingsTabs from GAP-MAP) |
| Analytics / reports | DASHBOARD (chart-heavy variant, no activity column) |

---

## Compound screens

Some screens combine two patterns. Always put the dominant flow first:

- **LIST + embedded FORM** (e.g. inline edit) — use LIST, open edit in a `Drawer` (PORT-VYZOR from GAP-MAP).
- **DASHBOARD + drill-down table** — use DASHBOARD with the table in Zone 4.
- **OPS + quick FORM** (e.g. walk-in registration from command center) — open FORM in a `Drawer` or `Modal` over the OPS page.
