import type { Metadata } from "next";
import {
  ClipboardList,
  ContactRound,
  DoorOpen,
  Download,
  IndianRupee,
  Printer,
  ScanLine,
  Send,
  UserPlus,
  UserX,
  Utensils,
  WifiOff,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { GATES } from "@/data/gates";
import { formatIndian } from "@/lib/utils";

export const metadata: Metadata = { title: "Organizer Command Center" };

const QUICK_ACTIONS = [
  { label: "Walk-in Reg.", icon: UserPlus },
  { label: "Reprint Badge", icon: Printer },
  { label: "WhatsApp Blast", icon: Send },
  { label: "Open Gate", icon: DoorOpen },
];

const RECENT_REGISTRATIONS = [
  { initials: "AK", name: "Arjun Kumar", detail: "Tata Elxsi · 2 min ago", badge: "Trade", tone: "primary" as const },
  { initials: "PN", name: "Priya Nair", detail: "Freshworks · 9 min ago", badge: "VIP", tone: "warning" as const },
  { initials: "RS", name: "Rohit Sharma", detail: "Walk-in, Gate 1 · 14 min ago", badge: "Walk-in", tone: "neutral" as const },
  { initials: "SD", name: "Sneha Desai", detail: "IIT Delhi · 21 min ago", badge: "Student", tone: "secondary" as const },
];

export default function OrganizerDashboardPage() {
  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            Command Center <Badge variant="success" dot>Day 2 Live</Badge>
          </span>
        }
        subtitle="Bharat Tech Expo 2026 · Bharat Mandapam, New Delhi · 18–20 July 2026 · Gates close 6:00 PM"
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Printer className="h-4 w-4" /> Print Badges
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
              <UserPlus className="h-4 w-4" /> Walk-in Registration
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Registrations" value="14,208" icon={ClipboardList} accent="primary" trend={{ text: "+412", positive: true }} hint="Today · 94% of target" />
        <StatCard label="Checked-in Now" value="8,914" icon={ScanLine} accent="success" hint="Peak 9,640 · 6 gates open" />
        <StatCard label="Coupons Redeemed" value="6,482" icon={Utensils} accent="warning" hint="Lunch · 4 counters active" />
        <StatCard label="Exhibitor Leads" value="21,730" icon={ContactRound} accent="dark" trend={{ text: "+32%", positive: true }} hint="vs Day 1" />
        <StatCard label="Onsite Revenue" value="₹4.86L" icon={IndianRupee} accent="info" trend={{ text: "+₹86.4k", positive: true }} hint="This Week" />
        <StatCard label="No-shows" value="2,162" icon={UserX} accent="danger" trend={{ text: "15.2%", positive: false }} hint="of registered" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Gate Traffic — Today" subtitle="Entries and exits per hour, all gates" />
          <div className="px-5 pb-5">
            <AreaChart
              categories={["8 AM", "9", "10", "11", "12 PM", "1", "2", "3", "4", "5 PM"]}
              colors={["#2563EB", "#94A3B8"]}
              series={[
                { name: "Entries", data: [120, 480, 1240, 1840, 1620, 1180, 940, 1060, 820, 460] },
                { name: "Exits", data: [10, 60, 180, 420, 760, 900, 680, 540, 980, 1220] },
              ]}
              format={{ suffix: " visitors", indian: true }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Visitor Categories" subtitle="14,208 registrations" />
          <div className="px-5 pb-5">
            <DonutChart
              labels={["Trade Visitor", "Delegate", "Student", "VIP"]}
              series={[8382, 3270, 1704, 852]}
              colors={["#2563EB", "#0B132B", "#60A5FA", "#F59E0B"]}
              totalLabel="Registered"
              totalValue="14,208"
              format={{ suffix: " visitors", indian: true }}
            />
            <ul className="mt-4 space-y-2 text-[13px]">
              {[
                { label: "Trade Visitor", value: "8,382", share: "59%", color: "bg-orbit-500" },
                { label: "Delegate", value: "3,270", share: "23%", color: "bg-orbit-900" },
                { label: "Student", value: "1,704", share: "12%", color: "bg-orbit-300" },
                { label: "VIP", value: "852", share: "6%", color: "bg-amber-400" },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                  {row.label}
                  <span className="ml-auto font-semibold text-slate-800">{row.value}</span>
                  <span className="w-10 text-right text-slate-400">{row.share}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Gates + right column */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader title="Gate & Counter Status" subtitle="Scanner devices, throughput and sync health" />
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
                    <th className="px-5 py-2.5 font-semibold">Gate / Counter</th>
                    <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Devices</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Scans / hr</th>
                    <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Queue</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GATES.map((gate) => (
                    <tr key={gate.name} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{gate.name}</p>
                        <p className="text-[12px] text-slate-400">{gate.location}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{gate.devices}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatIndian(gate.scansPerHour)}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <ProgressBar
                          value={gate.queueLoad}
                          label={`Queue load ${gate.queueLoad}%`}
                          tone={gate.queueLoad > 80 ? "danger" : gate.queueLoad > 60 ? "warning" : "success"}
                          className="w-24"
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={gate.sync === "Synced" ? "success" : "warning"} dot>
                          {gate.sync}
                          {gate.syncNote ? ` · ${gate.syncNote}` : ""}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Food Coupon Redemptions" subtitle="By meal window, Day 1 vs Day 2" />
            <div className="px-5 pb-5">
              <ColumnChart
                categories={["Breakfast", "Lunch", "Snacks", "Dinner"]}
                series={[
                  { name: "Day 1", data: [1420, 4890, 2140, 1260] },
                  { name: "Day 2 (so far)", data: [1680, 4802, 0, 0] },
                ]}
                format={{ suffix: " coupons", indian: true }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-display font-semibold text-orbit-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3.5 transition hover:border-orbit-300 hover:bg-orbit-50/40"
                >
                  <action.icon className="h-5 w-5 text-orbit-500" />
                  <span className="text-[12px] font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display font-semibold text-orbit-900">Alerts</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 rounded-lg bg-red-50/70 p-3">
                <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-slate-800">Food court queue critical</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">88% load · open Counter 5? · 4 min ago</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-amber-50/70 p-3">
                <WifiOff className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-slate-800">Gate 3 running offline</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">42 scans queued locally · will auto-sync</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-orbit-50/70 p-3">
                <Printer className="mt-0.5 h-[18px] w-[18px] shrink-0 text-orbit-500" />
                <div>
                  <p className="font-medium text-slate-800">Badge stock low at Gate 1</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">~180 blanks left · restock requested</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display font-semibold text-orbit-900">Recent Registrations</h2>
            <ul className="space-y-3.5">
              {RECENT_REGISTRATIONS.map((reg) => (
                <li key={reg.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
                    {reg.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{reg.name}</p>
                    <p className="text-[12px] text-slate-400">{reg.detail}</p>
                  </div>
                  <Badge variant={reg.tone}>{reg.badge}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
