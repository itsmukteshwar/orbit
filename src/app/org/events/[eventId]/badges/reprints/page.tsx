"use client";

/**
 * P-40 — Badges → Reprint log (/org/events/[eventId]/badges/reprints)
 * Audit table (who, when, visitor, reason, supervisor, old/new badge no.) ·
 * void-badge explanation banner · CSV export. Fed by the P-24 drawer reprint.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, History, Printer, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/kit/Button";
import { DataTable } from "@/components/kit/DataTable";
import { FilterBar } from "@/components/kit/FilterBar";
import { EmptyState } from "@/components/kit/EmptyState";
import { toastSuccess } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { badgeService } from "@/services/badge";
import type { ReprintRecord } from "@/types/domain";

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(records: ReprintRecord[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["When", "Visitor", "Reason", "Requested By", "Supervisor", "Old Badge", "New Badge"];
  const rows = records.map((r) =>
    [new Date(r.at).toLocaleString("en-IN"), r.visitorName, r.reason, r.actor, r.supervisor, r.oldBadgeNo, r.newBadgeNo]
      .map(esc)
      .join(","),
  );
  const csv = "﻿" + [header.map(esc).join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reprint-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReprintLogPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: queryKeys.badges.reprints(eventId),
    queryFn: () => badgeService.listReprints(eventId),
  });

  const filtered = useMemo(() => {
    const all = records ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (r) =>
        r.visitorName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.actor.toLowerCase().includes(q) ||
        r.supervisor.toLowerCase().includes(q) ||
        r.oldBadgeNo.toLowerCase().includes(q) ||
        r.newBadgeNo.toLowerCase().includes(q),
    );
  }, [records, search]);

  const columns = useMemo<ColumnDef<ReprintRecord, unknown>[]>(
    () => [
      {
        id: "when",
        header: "When",
        cell: ({ row }) => <span className="text-[12px] text-slate-500">{fmtWhen(row.original.at)}</span>,
      },
      {
        id: "visitor",
        header: "Visitor",
        cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.visitorName}</span>,
      },
      {
        id: "reason",
        header: "Reason",
        cell: ({ row }) => <span className="text-[13px] text-slate-600">{row.original.reason}</span>,
      },
      {
        id: "actor",
        header: "Requested By",
        cell: ({ row }) => <span className="text-[12px] text-slate-500">{row.original.actor}</span>,
      },
      {
        id: "supervisor",
        header: "Supervisor",
        cell: ({ row }) => <span className="text-[12px] text-slate-500">{row.original.supervisor}</span>,
      },
      {
        id: "badges",
        header: "Badge No.",
        cell: ({ row }) => (
          <span className="font-mono text-[12px]">
            <span className="text-slate-400 line-through">{row.original.oldBadgeNo}</span>
            <span className="mx-1 text-slate-300">→</span>
            <span className="font-semibold text-slate-700">{row.original.newBadgeNo}</span>
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Reprint Log"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Badges", href: `/org/events/${eventId}/badges` },
          { label: "Reprint Log" },
        ]}
        subtitle="Every badge reprint with actor and supervisor sign-off"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Printer}
              onClick={() => router.push(`/org/events/${eventId}/badges/print-queue`)}
            >
              Print Queue
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              disabled={filtered.length === 0}
              onClick={() => {
                exportCSV(filtered);
                toastSuccess(`Exported ${filtered.length} records to CSV`);
              }}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Void-badge explanation banner */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="text-[13px] leading-relaxed text-amber-800">
          <strong>Old badges are voided on reprint.</strong> Each reprint rotates the pass QR token
          and issues a new badge number — the previous QR is invalidated immediately and scans as{" "}
          <span className="font-mono text-[12px]">revoked</span> at every gate and food counter.
        </div>
      </div>

      <Card className="overflow-hidden">
        <FilterBar
          summary={
            <span className="text-[13px]">
              <strong className="text-slate-700">{filtered.length}</strong> reprint
              {filtered.length === 1 ? "" : "s"} logged
            </span>
          }
          search={{ value: search, onChange: setSearch, placeholder: "Search visitor, reason, badge no…" }}
        />

        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
          getRowId={(r) => r.id}
          emptyState={
            <EmptyState
              icon={History}
              title="No reprints yet"
              description="Reprints raised from a registration's detail drawer are logged here with the supervisor who approved them."
            />
          }
        />
      </Card>
    </>
  );
}
