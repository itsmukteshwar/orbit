import type { Metadata } from "next";
import {
  AlertCircle,
  Radio,
  Building2,
  CreditCard,
  Download,
  IndianRupee,
  LineChart,
  Plus,
  ScanLine,
  Server,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { LIVE_EVENTS } from "@/data/events";
import { formatIndian } from "@/lib/utils";

export const metadata: Metadata = { title: "Super Admin Dashboard" };

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const RECENT_SIGNUPS = [
  { initials: "PK", name: "Pune Konnect Expos", detail: "Nebula · Trial day 4 of 14", badge: "Trial", tone: "primary" as const },
  { initials: "KE", name: "Kerala Expo Council", detail: "Galaxy · Paid yesterday", badge: "Paid", tone: "success" as const },
  { initials: "SU", name: "Surat Textile Mart", detail: "Launchpad · Onboarding call due", badge: "Action", tone: "warning" as const },
  { initials: "IG", name: "IndoGlobal MICE", detail: "Nebula · Paid 3 days ago", badge: "Paid", tone: "success" as const },
];

export default function SuperAdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="Saturday, 18 July 2026 · All systems operational"
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
              <Plus className="h-4 w-4" /> Add Organizer
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Monthly Recurring Revenue" value="₹18.4L" icon={IndianRupee} accent="primary" trend={{ text: "+12.6%", positive: true }} hint="This Month" />
        <StatCard label="Active Organizers" value="148" icon={Building2} accent="dark" trend={{ text: "+9", positive: true }} hint="This Month" />
        <StatCard label="Events Live Today" value="12" icon={Radio} accent="success" hint="38 upcoming in 30 days" />
        <StatCard label="Check-ins Today" value="46,208" icon={ScanLine} accent="info" trend={{ text: "+18.2%", positive: true }} hint="vs Yesterday" />
        <StatCard label="Revenue YTD" value="₹1.42 Cr" icon={LineChart} accent="warning" trend={{ text: "+21.4%", positive: true }} hint="This Year" />
        <StatCard label="Outstanding Dues" value="₹8.6L" icon={AlertCircle} accent="danger" trend={{ text: "-3.4%", positive: false }} hint="3 tenants past due" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Platform Revenue" subtitle="Subscriptions + per-visitor fees, last 12 months" />
          <div className="px-5 pb-5">
            <AreaChart
              categories={MONTHS}
              series={[
                { name: "Subscriptions", data: [5.2, 5.8, 7.4, 8.9, 9.6, 8.1, 9.4, 10.8, 9.9, 10.6, 11.8, 12.6] },
                { name: "Per-visitor fees", data: [3.0, 3.4, 4.9, 6.2, 6.8, 4.2, 5.1, 6.4, 4.3, 4.9, 5.4, 5.8] },
              ]}
              format={{ prefix: "₹", suffix: "L", decimals: 1 }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Plan Distribution" subtitle="148 active organizers" />
          <div className="px-5 pb-5">
            <DonutChart
              labels={["Nebula", "Galaxy", "Launchpad"]}
              series={[64, 38, 46]}
              colors={["#2563EB", "#0B132B", "#60A5FA"]}
              totalLabel="Organizers"
              totalValue="148"
              format={{ suffix: " organizers" }}
            />
            <ul className="mt-4 space-y-2 text-[13px]">
              {[
                { label: "Nebula", value: 64, share: "43%", color: "bg-orbit-500" },
                { label: "Galaxy", value: 38, share: "26%", color: "bg-orbit-900" },
                { label: "Launchpad", value: 46, share: "31%", color: "bg-orbit-300" },
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

      {/* Live events + right column */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                Live Events Monitor <Badge variant="success" dot>12 Live</Badge>
              </span>
            }
            subtitle="Real-time check-in & coupon activity across tenants"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
                  <th className="px-5 py-2.5 font-semibold">Event</th>
                  <th className="px-4 py-2.5 font-semibold">Organizer</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Checked-in</th>
                  <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Coupons</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Gate Load</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LIVE_EVENTS.map((row) => (
                  <tr key={row.event} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{row.event}</p>
                      <p className="text-[12px] text-slate-400">{row.venue}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.organizer}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800">{formatIndian(row.checkedIn)}</span>
                      <span className="block text-[11px] text-slate-400">of {formatIndian(row.capacity)}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-slate-600 md:table-cell">{formatIndian(row.coupons)}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <ProgressBar
                        value={row.gateLoad}
                        label={`Gate load ${row.gateLoad}%`}
                        tone={row.gateLoad < 40 ? "warning" : "primary"}
                        className="w-24"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge variant={row.status === "Live" ? "success" : "warning"} dot>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-display font-semibold text-orbit-900">Needs Attention</h2>
            <ul className="space-y-3">
              <li className="flex gap-3 rounded-lg bg-red-50/70 p-3">
                <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
                <div>
                  <p className="font-medium text-slate-800">WhatsApp delivery failing</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">Gupshup BSP errors for 2 tenants · 22 min ago</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-amber-50/70 p-3">
                <CreditCard className="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-slate-800">3 subscriptions past due</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">₹1.2L outstanding · dunning emails sent</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-lg bg-orbit-50/70 p-3">
                <Server className="mt-0.5 h-[18px] w-[18px] shrink-0 text-orbit-500" />
                <div>
                  <p className="font-medium text-slate-800">Sync queue elevated</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">Offline check-in backlog at AgriBiz Fair</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display font-semibold text-orbit-900">Recent Signups</h2>
            <ul className="space-y-3.5">
              {RECENT_SIGNUPS.map((signup) => (
                <li key={signup.name} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
                    {signup.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{signup.name}</p>
                    <p className="text-[12px] text-slate-400">{signup.detail}</p>
                  </div>
                  <Badge variant={signup.tone}>{signup.badge}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Growth chart */}
      <Card>
        <CardHeader title="Organizer Growth" subtitle="New vs churned tenants, last 12 months" />
        <div className="px-5 pb-5">
          <ColumnChart
            categories={MONTHS}
            colors={["#2563EB", "#CBD5E1"]}
            series={[
              { name: "New", data: [4, 5, 9, 11, 12, 6, 8, 10, 5, 7, 8, 9] },
              { name: "Churned", data: [-1, -1, -2, -1, -3, -2, -1, -2, -1, -1, -2, -1] },
            ]}
          />
        </div>
      </Card>
    </>
  );
}
