# Orbit Event ERP

**One Platform. Endless Possibilities.**

Cloud-native, multi-tenant Event ERP for the Indian market — registration, badges,
QR check-in, food coupons, exhibitors and analytics in a single product.

## Tech Stack

| Layer      | Choice                                   |
| ---------- | ---------------------------------------- |
| Framework  | Next.js 15 (App Router)                  |
| Language   | TypeScript (strict)                      |
| Styling    | Tailwind CSS v4 (design tokens in `globals.css`) |
| Icons      | lucide-react                             |
| Charts     | ApexCharts (`react-apexcharts`, client-only) |
| Fonts      | Poppins (display) + Inter (body) via `next/font` |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Project Structure

```
src/
├── app/                          # App Router pages
│   ├── layout.tsx                # Root layout: fonts, metadata, AppShell
│   ├── globals.css               # Tailwind v4 + Orbit design tokens
│   ├── dashboard/
│   │   ├── super-admin/page.tsx  # Platform owner dashboard
│   │   ├── organizer/page.tsx    # Organizer command center
│   │   └── event/page.tsx        # Per-event dashboard (Green Bharat Expo)
│   ├── visitors/
│   │   ├── page.tsx              # Visitors table (filters, sources, actions)
│   │   └── register/page.tsx     # Registration form + live pass preview
│   └── onsite/food-coupons/page.tsx
├── components/
│   ├── layout/                   # App chrome — each piece is separate
│   │   ├── AppShell.tsx          # Composes rail + sidebar + header + footer
│   │   ├── IconRail.tsx          # Narrow icon strip (one icon per section)
│   │   ├── Sidebar.tsx           # Text menu: all sections, one expanded
│   │   ├── Header.tsx            # Search, notifications, profile
│   │   ├── Footer.tsx
│   │   └── OrbitLogo.tsx
│   ├── ui/                       # Reusable design-system pieces
│   │   ├── StatCard.tsx          # KPI card with left accent border
│   │   ├── Card.tsx              # Card + CardHeader
│   │   ├── Badge.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ProgressBar.tsx
│   │   └── EventSwitcher.tsx     # Searchable event dropdown
│   └── charts/                   # ApexCharts wrappers (SSR-safe)
│       ├── ApexChart.tsx
│       ├── AreaChart.tsx
│       ├── DonutChart.tsx
│       └── ColumnChart.tsx
├── config/
│   └── navigation.ts             # Single source of truth for the side menu
├── data/                         # Typed mock data (replace with API calls)
│   ├── visitors.ts
│   ├── events.ts
│   └── gates.ts
└── lib/
    └── utils.ts                  # cn(), formatIndian()
```

## Navigation Behaviour

The side navigation has **two synced parts** (see `AppShell.tsx`):

1. **Icon rail** — one icon per section. Clicking an icon expands that section
   in the text sidebar and collapses all others.
2. **Text sidebar** — every section title is always visible; exactly one
   section is expanded at a time (accordion). The expanded section follows the
   current route automatically.

To add a menu section or item, edit `src/config/navigation.ts` only — both the
rail and sidebar render from it.

## Brand Tokens

Defined in `src/app/globals.css` under `@theme`:
Orbit Blue `#2563EB` · Deep Navy `#0B132B` · Sky `#60A5FA` · Surface `#F4F6F8`.
Use `orbit-*` colour utilities (e.g. `bg-orbit-500`, `text-orbit-900`).
