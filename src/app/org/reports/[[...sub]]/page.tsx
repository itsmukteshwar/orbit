"use client";

/**
 * P-18 — Org Reports (/org/reports)
 * Cross-event analytics table · season totals · date-range filter ·
 * client-side CSV export (real data, opens in Excel).
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  FileBarChart2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { queryKeys } from "@/lib/queries";
import { eventService } from "@/services/event";
import { toastSuccess } from "@/components/kit/toast";
// Direct db access for aggregation — reporting reads are intentionally raw
import { db } from "@/services/mock/db";
import type { OrbitEvent } from "@/types/domain";

/* ── Event stats computed from mock db ───────────────────────────────────── */

interface EventStats {
  eventId: string;
  totalRegistrations: number;
  approved: number;
  attended: number; // unique passes with at least one OK checkin
  foodRedeemed: number; // redemptions with result "ok"
}

function computeStats(eventId: string): EventStats {
  const regs = db.registrations.filter((r) => r.eventId === eventId);
  const approved = regs.filter((r) => r.status === "approved").length;

  // Attended = distinct passes with at least one OK check-in
  const checkedPassIds = new Set(
    db.checkins
      .filter((c) => c.eventId === eventId && c.result === "ok")
      .map((c) => c.passId),
  );
  const attended = checkedPassIds.size;

  // Food redeemed = redemptions for this event's meal sessions where result = "ok"
  const mealIds = new Set(
    db.mealSessions.filter((ms) => ms.eventId === eventId).map((ms) => ms.id),
  );
  const foodRedeemed = db.redemptions.filter(
    (r) => mealIds.has(r.mealSessionId) && r.result === "ok",
  ).length;

  return { eventId, totalRegistrations: regs.length, approved, attended, foodRedeemed };
}

/* ── Date helpers ────────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── CSV generation ──────────────────────────────────────────────────────── */

function buildCSV(rows: Array<{ event: OrbitEvent; stats: EventStats }>): string {
  const esc = (v: string | number) =>
    typeof v === "number" ? String(v) : `"${String(v).replace(/"/g, '""')}"`;

  const header = [
    "Event Name",
    "Status",
    "Start Date",
    "End Date",
    "Venue",
    "City",
    "Capacity",
    "Total Registrations",
    "Approved",
    "Attended",
    "Food Redeemed",
    "Attendance Rate %",
    "Food Redemption Rate %",
  ].map(esc).join(",");

  const dataRows = rows.map(({ event, stats }) => {
    const attRate = stats.approved > 0 ? Math.round((stats.attended / stats.approved) * 100) : 0;
    const foodRate = stats.approved > 0 ? Math.round((stats.foodRedeemed / stats.approved) * 100) : 0;
    return [
      event.name,
      event.status,
      event.startDate,
      event.endDate,
      event.venue,
      event.city,
      event.capacity,
      stats.totalRegistrations,
      stats.approved,
      stats.attended,
      stats.foodRedeemed,
      attRate,
      foodRate,
    ].map(esc).join(",");
  });

  // Season totals row
  const totals = rows.reduce(
    (acc, { stats }) => {
      acc.regs += stats.totalRegistrations;
      acc.approved += stats.approved;
      acc.attended += stats.attended;
      acc.food += stats.foodRedeemed;
      return acc;
    },
    { regs: 0, approved: 0, attended: 0, food: 0 },
  );
  const totalAttRate = totals.approved > 0 ? Math.round((totals.attended / totals.approved) * 100) : 0;
  const totalFoodRate = totals.approved > 0 ? Math.round((totals.food / totals.approved) * 100) : 0;
  const totalsRow = [
    "SEASON TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    totals.regs,
    totals.approved,
    totals.attended,
    totals.food,
    totalAttRate,
    totalFoodRate,
  ].map(esc).join(",");

  // UTF-8 BOM so Excel opens without encoding issues
  return "﻿" + [header, ...dataRows, totalsRow].join("\r\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function OrgReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: eventsPage, isLoading } = useQuery({
    queryKey: queryKeys.events.list({}),
    queryFn: () => eventService.list({ limit: 50 }),
  });

  const allEvents = eventsPage?.items ?? [];

  /* Apply date filter */
  const filteredEvents = useMemo(() => {
    if (!fromDate && !toDate) return allEvents;
    return allEvents.filter((e) => {
      if (fromDate && e.endDate < fromDate) return false;
      if (toDate && e.startDate > toDate) return false;
      return true;
    });
  }, [allEvents, fromDate, toDate]);

  /* Compute stats for each visible event */
  const rows = useMemo(
    () =>
      filteredEvents.map((event) => ({
        event,
        stats: computeStats(event.id),
      })),
    [filteredEvents],
  );

  /* Season totals */
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, { stats }) => {
          acc.regs += stats.totalRegistrations;
          acc.approved += stats.approved;
          acc.attended += stats.attended;
          acc.food += stats.foodRedeemed;
          return acc;
        },
        { regs: 0, approved: 0, attended: 0, food: 0 },
      ),
    [rows],
  );

  const attendanceRate =
    totals.approved > 0 ? Math.round((totals.attended / totals.approved) * 100) : 0;

  function handleExport() {
    const csv = buildCSV(rows);
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `orbit-season-report-${today}.csv`);
    toastSuccess("CSV downloaded — open in Excel or Google Sheets");
  }

  return (
    <>
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: "Organisation", href: "/org/dashboard" }, { label: "Reports" }]}
        subtitle="Cross-event analytics for the current season"
        actions={
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      {/* Season totals */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Events"
          value={String(filteredEvents.length)}
          icon={Calendar}
          accent="primary"
          hint="In selected range"
          loading={isLoading}
        />
        <StatCard
          label="Total Registrations"
          value={totals.regs.toLocaleString("en-IN")}
          icon={FileBarChart2}
          accent="success"
          hint="All events combined"
          loading={isLoading}
        />
        <StatCard
          label="Attended"
          value={totals.attended.toLocaleString("en-IN")}
          icon={TrendingUp}
          accent="info"
          hint={`${attendanceRate}% of approved`}
          loading={isLoading}
        />
        <StatCard
          label="Food Redeemed"
          value={totals.food.toLocaleString("en-IN")}
          icon={FileBarChart2}
          accent="warning"
          hint="OK redemptions"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-500">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-[13px] focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-500">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-[13px] focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              onClick={() => { setFromDate(""); setToDate(""); }}
            >
              Clear filter
            </Button>
          )}
          <p className="ml-auto text-[12px] text-slate-400">
            Showing {filteredEvents.length} of {allEvents.length} event{allEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      {/* Cross-event table */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Event Summary"
          subtitle="Registration, attendance and food data per event"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-2.5">Event</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Status</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Dates</th>
                <th className="px-4 py-2.5 text-right">Registrations</th>
                <th className="px-4 py-2.5 text-right">Approved</th>
                <th className="px-4 py-2.5 text-right">Attended</th>
                <th className="hidden px-4 py-2.5 text-right lg:table-cell">Food Redeemed</th>
                <th className="hidden px-5 py-2.5 text-right xl:table-cell">Att. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 2 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }, (_, c) => (
                      <td key={c} className="px-4 py-3">
                        <div className="h-3.5 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-slate-400">
                    No events in selected date range
                  </td>
                </tr>
              ) : (
                rows.map(({ event, stats }) => {
                  const attRate =
                    stats.approved > 0
                      ? Math.round((stats.attended / stats.approved) * 100)
                      : 0;
                  return (
                    <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{event.name}</p>
                        <p className="text-[11px] text-slate-400">{event.venue}</p>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-[13px] text-slate-500 md:table-cell">
                        {fmtDate(event.startDate)} – {fmtDate(event.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {stats.totalRegistrations.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {stats.approved.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {stats.attended.toLocaleString("en-IN")}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-slate-600 lg:table-cell">
                        {stats.foodRedeemed.toLocaleString("en-IN")}
                      </td>
                      <td className="hidden px-5 py-3 text-right xl:table-cell">
                        <span
                          className={
                            attRate >= 70
                              ? "text-emerald-600 font-semibold"
                              : attRate >= 40
                                ? "text-amber-600"
                                : "text-slate-400"
                          }
                        >
                          {stats.approved > 0 ? `${attRate}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Season totals footer */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold text-slate-700">
                  <td className="px-5 py-3" colSpan={3}>
                    Season Total
                  </td>
                  <td className="px-4 py-3 text-right">{totals.regs.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">{totals.approved.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">{totals.attended.toLocaleString("en-IN")}</td>
                  <td className="hidden px-4 py-3 text-right lg:table-cell">
                    {totals.food.toLocaleString("en-IN")}
                  </td>
                  <td className="hidden px-5 py-3 text-right xl:table-cell">
                    {totals.approved > 0 ? `${attendanceRate}%` : "—"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Export footer */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-[12px] text-slate-400">
              Data current as of this session · reload for latest
            </p>
            <Button variant="ghost" icon={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
