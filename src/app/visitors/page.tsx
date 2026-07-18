import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Eye,
  Footprints,
  Globe,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { VISITORS, type RegistrationSource, type VisitorCategory, type VisitorStatus } from "@/data/visitors";

export const metadata: Metadata = { title: "All Visitors" };

const CATEGORY_TONE: Record<VisitorCategory, BadgeVariant> = {
  "Trade Visitor": "primary",
  Delegate: "secondary",
  VIP: "warning",
  Student: "info",
  Media: "danger",
};

const STATUS_TONE: Record<VisitorStatus, BadgeVariant> = {
  "Checked-in": "success",
  Registered: "primary",
  "No-show": "danger",
  Cancelled: "neutral",
};

const SOURCE_TONE: Record<RegistrationSource, BadgeVariant> = {
  Online: "info",
  "QR Self-Scan": "primary",
  "Reception Desk": "secondary",
  WhatsApp: "success",
  "Exhibitor Invite": "warning",
};

const FILTERS = [
  { label: "All Events", options: ["All Events", "Bharat Tech Expo 2026", "Jaipur Handicrafts Fair", "MedTech Summit South"] },
  { label: "All Categories", options: ["All Categories", "Trade Visitor", "Delegate", "VIP", "Student", "Media"] },
  { label: "All Gender", options: ["All Gender", "Male", "Female", "Other"] },
  { label: "All Status", options: ["All Status", "Checked-in", "Registered", "No-show", "Cancelled"] },
  { label: "All Sources", options: ["All Sources", "Online", "QR Self-Scan", "Reception Desk", "WhatsApp", "Exhibitor Invite"] },
];

export default function VisitorsPage() {
  return (
    <>
      <PageHeader
        title="All Visitors"
        subtitle="Dashboard · Visitors"
        actions={
          <>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <Link
              href="/visitors/register"
              className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600"
            >
              <UserPlus className="h-4 w-4" /> Register New Visitor
            </Link>
          </>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Visitors" value="14,208" icon={Users} accent="primary" />
        <StatCard label="Checked-in" value="8,914" icon={CheckCircle2} accent="success" />
        <StatCard label="Pre-Registered" value="12,046" icon={Globe} accent="info" />
        <StatCard label="Walk-ins" value="2,162" icon={Footprints} accent="warning" />
      </div>

      <Card className="overflow-hidden">
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
          <p className="text-slate-500">
            Showing <span className="font-semibold text-slate-800">14,208</span> visitors · Page 1 of 711
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => (
              <select
                key={filter.label}
                aria-label={filter.label}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-600 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
              >
                {filter.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ))}
            <label className="relative">
              <span className="sr-only">Search visitors</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search name, ID, badge, phone"
                className="h-8 w-56 rounded-lg border border-slate-200 pl-8 pr-2 text-[13px] focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase">
                <th className="px-5 py-2.5 font-semibold">Visitor ID</th>
                <th className="px-4 py-2.5 font-semibold">Badge No</th>
                <th className="px-4 py-2.5 font-semibold">Visitor Name</th>
                <th className="px-4 py-2.5 font-semibold">Company</th>
                <th className="px-4 py-2.5 font-semibold">City</th>
                <th className="px-4 py-2.5 font-semibold">Gender</th>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-4 py-2.5 font-semibold">Registered On</th>
                <th className="px-4 py-2.5 font-semibold">Registered Via</th>
                <th className="px-4 py-2.5 font-semibold">Check-in</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VISITORS.map((visitor) => (
                <tr key={visitor.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href="#" className="font-medium text-orbit-500 hover:text-orbit-600">
                      {visitor.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{visitor.badgeNo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-[11px] font-semibold text-orbit-600">
                        {visitor.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">{visitor.name}</p>
                        <p className="text-[11px] text-slate-400">{visitor.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{visitor.company}</td>
                  <td className="px-4 py-3 text-slate-600">{visitor.city}</td>
                  <td className="px-4 py-3 text-slate-600">{visitor.gender}</td>
                  <td className="px-4 py-3">
                    <Badge variant={CATEGORY_TONE[visitor.category]}>{visitor.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{visitor.registeredOn}</td>
                  <td className="px-4 py-3">
                    <Badge variant={SOURCE_TONE[visitor.registeredVia]}>{visitor.registeredVia}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {visitor.checkIn ? (
                      <>
                        <span className="text-[12px] text-slate-700">
                          {visitor.checkIn.day} · {visitor.checkIn.time}
                        </span>
                        <span className="block text-[11px] text-slate-400">{visitor.checkIn.gate}</span>
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_TONE[visitor.status]} dot>
                      {visitor.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button aria-label={`View ${visitor.name}`} className="rounded-lg bg-orbit-50 p-1.5 text-orbit-500 hover:bg-orbit-100">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button aria-label={`Edit ${visitor.name}`} className="rounded-lg bg-sky-50 p-1.5 text-sky-500 hover:bg-sky-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button aria-label={`Delete ${visitor.name}`} className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5">
          <span className="text-[13px] text-slate-400">Showing 12 of 14,208 entries</span>
          <nav aria-label="Visitors pagination" className="flex items-center gap-1">
            {["Prev", "1", "2", "3", "…", "711", "Next"].map((page) => (
              <button
                key={page}
                disabled={page === "Prev" || page === "…"}
                className={
                  page === "1"
                    ? "h-8 min-w-8 rounded-lg bg-orbit-500 px-2 text-[13px] font-medium text-white"
                    : "h-8 min-w-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                }
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      </Card>
    </>
  );
}
