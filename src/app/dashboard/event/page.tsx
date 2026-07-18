"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Armchair,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Hash,
  IndianRupee,
  Leaf,
  MapPin,
  Monitor,
  Share2,
  Tag,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DonutChart } from "@/components/charts/DonutChart";
import { EventSwitcher } from "@/components/ui/EventSwitcher";

const PROGRESS = [
  { label: "Capacity Filled", value: 86 },
  { label: "Sales Conversion Rate", value: 42 },
  { label: "Registration Momentum", value: 78 },
];

const RECENT_REGISTRATIONS = [
  { initials: "AK", name: "Arjun Kumar", company: "Zoho Corporation", ticket: "Early Bird", tone: "warning" as const, time: "2m ago" },
  { initials: "PN", name: "Priya Nair", company: "Freshworks", ticket: "Regular", tone: "primary" as const, time: "15m ago" },
  { initials: "KR", name: "Karthik R", company: "Chargebee", ticket: "VIP", tone: "success" as const, time: "28m ago" },
  { initials: "DS", name: "Divya S", company: "Amazon", ticket: "Regular", tone: "primary" as const, time: "45m ago" },
  { initials: "RM", name: "Rahul Menon", company: "TCS", ticket: "Early Bird", tone: "warning" as const, time: "1h ago" },
];

const EVENT_DETAILS = [
  { icon: Calendar, label: "Date", value: "12 – 14 Nov 2026" },
  { icon: Clock, label: "Time", value: "9:00 AM – 6:00 PM" },
  { icon: Tag, label: "Category", value: "Sustainability / Clean-Tech" },
  { icon: Monitor, label: "Mode", value: "In Person" },
  { icon: MapPin, label: "Location", value: "Yashobhoomi (IICC), Dwarka, New Delhi" },
  { icon: Users, label: "Capacity", value: "500" },
];

export default function EventDashboardPage() {
  const [eventName, setEventName] = useState("Green Bharat Expo V.2 2026");

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            {eventName} <Badge variant="success">Published</Badge>
          </span>
        }
        subtitle="TechFairs India · Events · Event Dashboard"
        actions={
          <>
            <EventSwitcher value={eventName} onChange={setEventName} />
            <button
              aria-label="Share event"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-card hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-card hover:bg-slate-50">
              <Edit className="h-4 w-4" /> Edit Event
            </button>
            <button className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600">
              <Eye className="h-4 w-4" /> Preview Event Page
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registrations" value="428" icon={Users} accent="primary" trend={{ text: "+32", positive: true }} hint="this week" />
        <StatCard label="Confirmed" value="396" icon={CheckCircle2} accent="success" hint="92.5% of total" />
        <StatCard label="Seats Left" value="72" icon={Armchair} accent="warning" hint="14% remaining of 500" />
        <StatCard label="Revenue" value="₹4,86,500" icon={IndianRupee} accent="info" trend={{ text: "+₹86,400", positive: true }} hint="this week" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Progress + ticket sales */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 font-display font-semibold text-orbit-900">Registration Progress</h2>
            <div className="space-y-4">
              {PROGRESS.map((row) => (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <span className="font-semibold text-slate-800">{row.value}%</span>
                  </div>
                  <ProgressBar value={row.value} label={`${row.label} ${row.value}%`} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Ticket Sales" />
            <div className="px-5 pb-5">
              <DonutChart
                labels={["Early Bird", "Regular", "VIP"]}
                series={[180, 216, 32]}
                colors={["#F59E0B", "#2563EB", "#22C55E"]}
                totalLabel="Total Tickets"
                totalValue="428"
                format={{ suffix: " tickets" }}
              />
              <ul className="mt-4 space-y-2 text-[13px]">
                {[
                  { label: "Early Bird", value: "180 (42%)", color: "bg-amber-400" },
                  { label: "Regular", value: "216 (50%)", color: "bg-orbit-500" },
                  { label: "VIP", value: "32 (8%)", color: "bg-emerald-500" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    {row.label}
                    <span className="ml-auto font-medium text-slate-800">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* Recent registrations */}
        <Card className="self-start">
          <CardHeader
            title="Recent Registrations"
            action={
              <Link href="/visitors" className="text-[13px] font-medium text-orbit-500 hover:text-orbit-600">
                View All
              </Link>
            }
          />
          <ul className="space-y-3.5 px-5 pb-3">
            {RECENT_REGISTRATIONS.map((reg) => (
              <li key={reg.name} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
                  {reg.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{reg.name}</p>
                  <p className="text-[12px] text-slate-400">{reg.company}</p>
                </div>
                <div className="text-right">
                  <Badge variant={reg.tone} className="mb-1 block">{reg.ticket}</Badge>
                  <span className="text-[11px] text-slate-400">{reg.time}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 p-4 text-center">
            <Link href="/visitors" className="text-[13px] font-medium text-orbit-500 hover:text-orbit-600">
              + 423 more registrations
            </Link>
          </div>
        </Card>

        {/* Event details */}
        <Card className="self-start p-5">
          <div className="mb-3 flex gap-2">
            <button className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              <Edit className="h-3.5 w-3.5" /> Edit Event
            </button>
            <button className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-[13px] font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Published
            </button>
          </div>

          {/* Poster */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-[#0B3D2E] via-[#14532D] to-[#166534] p-5 text-center text-white">
            <Badge variant="success" className="mb-3">UPCOMING</Badge>
            <Leaf className="mx-auto mb-2 h-9 w-9" />
            <h3 className="font-display text-lg leading-tight font-bold">
              GREEN BHARAT
              <br />
              EXPO V.2 2026
            </h3>
            <p className="mt-1 mb-3 text-[12px] opacity-75">India&apos;s Sustainability &amp; Clean-Tech Expo</p>
            <div className="flex justify-center gap-2">
              {["Solar", "EV", "Recycling"].map((tag) => (
                <span key={tag} className="rounded-full bg-white/15 px-2 py-1 text-[11px]">{tag}</span>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {EVENT_DETAILS.map((detail) => (
              <li key={detail.label} className="flex items-start gap-3 text-[13px]">
                <detail.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="flex-1 text-slate-400">{detail.label}</span>
                <span className="max-w-[55%] text-right font-medium text-slate-700">{detail.value}</span>
              </li>
            ))}
            <li className="flex items-start gap-3 text-[13px]">
              <Hash className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="flex-1 text-slate-400">Tags</span>
              <span className="space-x-1 text-right">
                <Badge variant="success">#green</Badge>
                <Badge variant="primary">#cleantech</Badge>
                <Badge variant="neutral">+2</Badge>
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
