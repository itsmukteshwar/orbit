import type { Metadata } from "next";
import {
  Check,
  CheckCircle2,
  Coffee,
  Download,
  Moon,
  PlusCircle,
  QrCode,
  ShieldX,
  Sun,
  Ticket,
  Utensils,
  UtensilsCrossed,
  WifiOff,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { formatIndian } from "@/lib/utils";

export const metadata: Metadata = { title: "Food Coupons" };

const MEAL_WINDOWS = [
  { icon: Sun, iconClass: "text-amber-500", name: "Breakfast", timing: "8:00 – 10:00 AM", entitled: 9400, redeemed: 1680, progress: 18, tone: "primary" as const, status: "Closed", statusTone: "neutral" as BadgeVariant },
  { icon: UtensilsCrossed, iconClass: "text-emerald-500", name: "Lunch", timing: "12:00 – 3:00 PM", entitled: 14208, redeemed: 4802, progress: 34, tone: "success" as const, status: "Live", statusTone: "success" as BadgeVariant },
  { icon: Coffee, iconClass: "text-orbit-500", name: "Evening Snacks", timing: "4:00 – 5:30 PM", entitled: 14208, redeemed: 0, progress: 0, tone: "primary" as const, status: "Upcoming", statusTone: "primary" as BadgeVariant },
  { icon: Moon, iconClass: "text-violet-500", name: "VIP Dinner", timing: "7:30 – 9:30 PM", entitled: 852, redeemed: 0, progress: 0, tone: "primary" as const, status: "Invite Only", statusTone: "secondary" as BadgeVariant },
];

const REDEMPTION_LOG = [
  { ok: true, title: "Arjun Kumar · Lunch", detail: "Counter 2 · Veg · just now", badge: "OK", tone: "success" as BadgeVariant },
  { ok: true, title: "Priya Nair · Lunch", detail: "Counter 1 · Veg · 14s ago", badge: "OK", tone: "success" as BadgeVariant },
  { ok: false, title: "Badge BT26-4412 · Lunch", detail: "Counter 3 · already redeemed 12:41 PM", badge: "Duplicate", tone: "danger" as BadgeVariant },
  { ok: true, title: "Sneha Desai · Lunch", detail: "Counter 4 · Jain · 48s ago", badge: "OK", tone: "success" as BadgeVariant },
  { ok: true, title: "Rohit Sharma · Lunch", detail: "Counter 2 · Non-Veg · 1m ago", badge: "OK", tone: "success" as BadgeVariant },
];

export default function FoodCouponsPage() {
  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            Food Coupons <Badge variant="success" dot>Lunch Window Live</Badge>
          </span>
        }
        subtitle="Dashboard · Onsite Ops · Food Coupons"
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <PlusCircle className="h-4 w-4" /> New Meal Plan
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
              <QrCode className="h-4 w-4" /> Open Redemption Scanner
            </button>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Coupons Issued" value="28,416" icon={Ticket} accent="primary" hint="2 per visitor per day · linked to QR badge" />
        <StatCard label="Redeemed Today" value="6,482" icon={CheckCircle2} accent="success" trend={{ text: "+4.2%", positive: true }} hint="vs Day 1 lunch" />
        <StatCard label="Counters Active" value="4 / 5" icon={Utensils} accent="warning" trend={{ text: "Queue 88%", positive: false }} hint="open Counter 5?" />
        <StatCard label="Duplicate Attempts" value="37" icon={ShieldX} accent="danger" hint="Blocked automatically · zero paper fraud" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Meal windows */}
          <Card className="overflow-hidden">
            <CardHeader title="Meal Windows — Day 2" subtitle="Entitlements and redemption per window" />
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
                    <th className="px-5 py-2.5 font-semibold">Meal Window</th>
                    <th className="px-4 py-2.5 font-semibold">Timing</th>
                    <th className="px-4 py-2.5 font-semibold">Entitled</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Redeemed</th>
                    <th className="w-1/4 px-4 py-2.5 font-semibold">Progress</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MEAL_WINDOWS.map((meal) => (
                    <tr key={meal.name} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <meal.icon className={`h-4 w-4 ${meal.iconClass}`} /> {meal.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{meal.timing}</td>
                      <td className="px-4 py-3 text-slate-600">{formatIndian(meal.entitled)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatIndian(meal.redeemed)}</td>
                      <td className="px-4 py-3">
                        <ProgressBar value={meal.progress} label={`${meal.name} redemption ${meal.progress}%`} tone={meal.tone} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={meal.statusTone} dot={meal.status === "Live"}>{meal.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Redemptions chart */}
          <Card>
            <CardHeader title="Redemptions Per Hour" subtitle="Lunch window, Day 1 vs Day 2" />
            <div className="px-5 pb-5">
              <ColumnChart
                categories={["12 PM", "12:30", "1 PM", "1:30", "2 PM"]}
                series={[
                  { name: "Day 1", data: [480, 1240, 1610, 1120, 440] },
                  { name: "Day 2 (so far)", data: [520, 1380, 1870, 1032, 0] },
                ]}
                format={{ suffix: " coupons", indian: true }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Live log */}
          <Card>
            <CardHeader title="Live Redemption Log" action={<Badge variant="success" dot>Live</Badge>} />
            <ul className="space-y-3.5 px-5 pb-5">
              {REDEMPTION_LOG.map((entry) => (
                <li key={entry.title} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      entry.ok ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {entry.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">{entry.title}</p>
                    <p className="text-[12px] text-slate-400">{entry.detail}</p>
                  </div>
                  <Badge variant={entry.tone}>{entry.badge}</Badge>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <WifiOff className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800">Counter 3 offline burst</p>
                  <p className="text-[12px] text-slate-400">18 scans queued · auto-sync on</p>
                </div>
                <Badge variant="warning">Queued</Badge>
              </li>
            </ul>
          </Card>

          {/* Food preference */}
          <Card>
            <CardHeader title="Food Preference Split" />
            <div className="px-5 pb-5">
              <DonutChart
                labels={["Veg", "Non-Veg", "Jain"]}
                series={[9312, 3894, 1002]}
                colors={["#22C55E", "#F59E0B", "#2563EB"]}
                totalLabel="Visitors"
                totalValue="14,208"
                format={{ suffix: " visitors", indian: true }}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
