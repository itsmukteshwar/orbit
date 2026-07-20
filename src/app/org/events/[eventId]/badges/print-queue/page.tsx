"use client";

/**
 * P-39 — Badges → Print queue (/org/events/[eventId]/badges/print-queue)
 * Queue tab: approved registrations whose badge has not been printed yet
 * (category filter, added time). Select-all → batch print renders N badges
 * into one print flow with page breaks (P-38 engine), then marks printed.
 * Reprints tab: queued jobs raised from the detail-drawer reprint flow.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, History, Printer, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { DataTable } from "@/components/kit/DataTable";
import { FilterBar } from "@/components/kit/FilterBar";
import { EmptyState } from "@/components/kit/EmptyState";
import { Tabs } from "@/components/kit/Tabs";
import { toastSuccess } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { db } from "@/services/mock/db";
import { badgeService } from "@/services/badge";
import { useBadgeStore, defaultTemplateFor } from "@/lib/badgeStore";
import { DEFAULT_FIELD_CONFIG, type BadgeTemplateId } from "@/components/badge/templates";
import { PrintPreviewModal, type BadgePrintItem } from "@/components/badge/BadgePrint";
import { badgeDataFor } from "@/components/badge/badgeData";
import type { Pass, Registration } from "@/types/domain";

/** One printable badge: approved registration + active pass. */
interface QueueRow {
  key: string; // passId
  reg: Registration;
  pass: Pass;
  /** Existing queued job id (staff approvals / reprints); null = never queued. */
  jobId: string | null;
  categoryName: string;
  addedAt: string;
  source: string;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PrintQueuePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const qc = useQueryClient();
  const store = useBadgeStore();

  const [tab, setTab] = useState<"queue" | "reprints">("queue");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [printItems, setPrintItems] = useState<BadgePrintItem[] | null>(null);
  const [printRows, setPrintRows] = useState<QueueRow[]>([]);

  /* Service call keeps mock latency/error realism; joins below read db raw
   * (reporting reads are intentionally raw, same as Overview/TV mode). */
  const { data: jobsPage, isLoading, refetch } = useQuery({
    queryKey: queryKeys.badges.printJobs({ filters: { eventId } }),
    queryFn: () => badgeService.listPrintJobs({ filters: { eventId }, limit: 1000 }),
  });

  const { queueRows, reprintRows } = useMemo(() => {
    const jobs = jobsPage?.items ?? [];
    const doneByPass = new Set(jobs.filter((j) => j.status === "done").map((j) => j.passId));
    const queuedByPass = new Map(jobs.filter((j) => j.status === "queued").map((j) => [j.passId, j]));

    const queue: QueueRow[] = [];
    const reprints: QueueRow[] = [];

    for (const pass of db.passes) {
      if (pass.eventId !== eventId || pass.status !== "active") continue;
      const reg = db.registrations.find((r) => r.id === pass.registrationId);
      if (!reg || reg.status !== "approved") continue;
      const queued = queuedByPass.get(pass.id);
      const isReprint = queued?.station === "reprint";
      // Printed and no new queued job → not in any tab.
      if (doneByPass.has(pass.id) && !queued) continue;
      const cat = db.categories.find((c) => c.id === reg.categoryId);
      const row: QueueRow = {
        key: pass.id,
        reg,
        pass,
        jobId: queued?.id ?? null,
        categoryName: cat?.name ?? "—",
        addedAt: queued?.createdAt ?? pass.issuedAt,
        source: isReprint ? "Reprint request" : queued ? queued.station.replace(/-/g, " ") : "Approval",
      };
      (isReprint ? reprints : queue).push(row);
    }

    const byAdded = (a: QueueRow, b: QueueRow) => b.addedAt.localeCompare(a.addedAt);
    return { queueRows: queue.sort(byAdded), reprintRows: reprints.sort(byAdded) };
  }, [jobsPage, eventId]);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);

  const activeRows = tab === "queue" ? queueRows : reprintRows;
  const filteredRows = useMemo(
    () => (categoryFilter ? activeRows.filter((r) => r.categoryName === categoryFilter) : activeRows),
    [activeRows, categoryFilter],
  );

  /** Mark rows printed: reuse queued job if present, else create+complete one. */
  const markPrinted = useMutation({
    mutationFn: async (rows: QueueRow[]) => {
      const ids: string[] = [];
      for (const r of rows) {
        if (r.jobId) {
          ids.push(r.jobId);
        } else {
          const job = await badgeService.queuePrint(
            eventId,
            r.pass.id,
            db.badgeDesigns.find((d) => d.eventId === eventId)?.id ?? "",
            "desk-1",
          );
          ids.push(job.id);
        }
      }
      await badgeService.markPrinted(ids);
      return rows.length;
    },
    onSuccess: (count) => {
      void qc.invalidateQueries({ queryKey: queryKeys.badges.all() });
      void refetch();
      toastSuccess(`${count} badge${count === 1 ? "" : "s"} marked printed`);
    },
  });

  function templateFor(reg: Registration): BadgeTemplateId {
    const cat = db.categories.find((c) => c.id === reg.categoryId);
    return store.assignments[reg.categoryId] ?? defaultTemplateFor(cat?.name ?? "");
  }

  function startPrint(rows: QueueRow[]) {
    const items: BadgePrintItem[] = rows.map((r) => {
      const tplId = templateFor(r.reg);
      return {
        data: badgeDataFor(r.reg, store.sponsorStripUrl),
        templateId: tplId,
        fields: store.fieldConfig[tplId] ?? DEFAULT_FIELD_CONFIG,
      };
    });
    setPrintRows(rows);
    setPrintItems(items);
  }

  const columns = useMemo<ColumnDef<QueueRow, unknown>[]>(
    () => [
      {
        id: "visitor",
        header: "Visitor",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-800">{row.original.reg.firstName} {row.original.reg.lastName}</p>
            <p className="text-[11px] text-slate-400">{row.original.reg.company ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "badge",
        header: "Badge No.",
        cell: ({ row }) => (
          <span className="font-mono text-[12px] font-semibold text-slate-600">{row.original.pass.badgeNo}</span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="primary">{row.original.categoryName}</Badge>,
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => <span className="text-[12px] text-slate-500">{row.original.source}</span>,
      },
      {
        id: "added",
        header: "Added",
        cell: ({ row }) => <span className="text-[12px] text-slate-500">{fmtWhen(row.original.addedAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            icon={Printer}
            onClick={(e) => { e.stopPropagation(); startPrint([row.original]); }}
          >
            Print
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.assignments, store.fieldConfig, store.sponsorStripUrl],
  );

  return (
    <>
      <PageHeader
        title="Print Queue"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Badges", href: `/org/events/${eventId}/badges` },
          { label: "Print Queue" },
        ]}
        subtitle="Approved badges waiting to print"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={History}
              onClick={() => router.push(`/org/events/${eventId}/badges/reprints`)}
            >
              Reprint Log
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              disabled={filteredRows.length === 0}
              onClick={() => startPrint(filteredRows)}
            >
              Print All ({filteredRows.length})
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="px-5 pt-4">
          <Tabs
            value={tab}
            onChange={(id) => setTab(id as "queue" | "reprints")}
            tabs={[
              {
                id: "queue",
                label: "Queue",
                badge: queueRows.length > 0 ? (
                  <span className="rounded-full bg-orbit-50 px-1.5 py-0.5 text-[10px] font-bold text-orbit-600">
                    {queueRows.length}
                  </span>
                ) : undefined,
              },
              {
                id: "reprints",
                label: "Reprints",
                badge: reprintRows.length > 0 ? (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {reprintRows.length}
                  </span>
                ) : undefined,
              },
            ]}
          />
        </div>

        <FilterBar
          summary={
            <span className="text-[13px]">
              <strong className="text-slate-700">{filteredRows.length}</strong> badge
              {filteredRows.length === 1 ? "" : "s"} waiting
            </span>
          }
          selects={[
            {
              id: "category",
              label: "All Categories",
              options: categories.map((c) => c.name),
              value: categoryFilter,
              onChange: setCategoryFilter,
            },
          ]}
          chips={categoryFilter ? [{ id: "cat", label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter("") }] : []}
          onClearAll={categoryFilter ? () => setCategoryFilter("") : undefined}
        />

        <DataTable
          columns={columns}
          data={filteredRows}
          loading={isLoading}
          getRowId={(r) => r.key}
          enableSelection
          bulkActions={(ids, clear) => (
            <>
              <Button
                variant="primary"
                icon={Printer}
                onClick={() => {
                  startPrint(filteredRows.filter((r) => ids.includes(r.key)));
                  clear();
                }}
              >
                Print Selected ({ids.length})
              </Button>
              <Button
                variant="secondary"
                icon={CheckCircle2}
                disabled={markPrinted.isPending}
                onClick={() => { markPrinted.mutate(filteredRows.filter((r) => ids.includes(r.key))); clear(); }}
              >
                Mark Printed
              </Button>
            </>
          )}
          emptyState={
            <EmptyState
              icon={tab === "queue" ? Printer : RotateCcw}
              title={tab === "queue" ? "Queue is clear" : "No reprint requests"}
              description={
                tab === "queue"
                  ? "Newly approved registrations and staff badges land here automatically."
                  : "Reprints raised from a registration's detail drawer appear here."
              }
            />
          }
        />
      </Card>

      {/* P-38 print engine modal — marks rows printed after the dialog closes */}
      <PrintPreviewModal
        open={printItems !== null}
        onClose={() => { setPrintItems(null); setPrintRows([]); }}
        items={printItems ?? []}
        onPrinted={() => {
          if (printRows.length) markPrinted.mutate(printRows);
          setPrintItems(null);
          setPrintRows([]);
        }}
      />
    </>
  );
}
