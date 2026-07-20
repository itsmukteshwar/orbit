"use client";

/**
 * P-23 — Registrations → All (/org/events/[eventId]/registrations)
 * DataTable in the canon /visitors skin · FilterBar · bulk-select bar ·
 * ?selected=id deep-link Drawer · cursor pagination · CSV export of selection.
 */

import { Suspense, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  Plus,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { DataTable } from "@/components/kit/DataTable";
import { FilterBar } from "@/components/kit/FilterBar";
import { EmptyState } from "@/components/kit/EmptyState";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { registrationService, type RegistrationFilters } from "@/services/registration";
import { db } from "@/services/mock/db";
import { RegistrationDrawer } from "./RegistrationDrawer";
import type { Registration, RegistrationStatus, RegistrationSource } from "@/types/domain";

const PAGE_SIZE = 20;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function maskPhone(phone: string): string {
  return `${phone.slice(0, 2)}•••••${phone.slice(-3)}`;
}

const SOURCE_LABEL: Record<RegistrationSource, string> = {
  online: "Online",
  qr_self_scan: "QR Self-scan",
  reception_desk: "Desk",
  whatsapp: "WhatsApp",
  exhibitor_invite: "Exhibitor",
  import: "Import",
};

const STATUS_OPTIONS = ["pending", "approved", "rejected", "revoked"];
const SOURCE_OPTIONS = Object.keys(SOURCE_LABEL);

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Client-side CSV of the given registrations (selection export). */
function exportCSV(regs: Registration[]) {
  const esc = (v: string | number | null) =>
    v === null ? '""' : typeof v === "number" ? String(v) : `"${String(v).replace(/"/g, '""')}"`;
  const header = ["First Name", "Last Name", "Phone", "Email", "Company", "Category", "Status", "Source", "City", "Registered At"];
  const rows = regs.map((r) => {
    const cat = db.categories.find((c) => c.id === r.categoryId);
    return [r.firstName, r.lastName, r.phone, r.email, r.company, cat?.name ?? "", r.status, SOURCE_LABEL[r.source], r.city, r.createdAt]
      .map(esc).join(",");
  });
  const csv = "﻿" + [header.map(esc).join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-selection-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Page (wrapped for useSearchParams) ──────────────────────────────────── */

export default function RegistrationsPage() {
  return (
    <Suspense>
      <RegistrationsInner />
    </Suspense>
  );
}

function RegistrationsInner() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const selectedId = searchParams.get("selected");

  /* Filters + paging state */
  const [status, setStatus] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);
  const categoryId = categories.find((c) => c.name === categoryName)?.id;

  const filters: RegistrationFilters = useMemo(
    () => ({
      eventId,
      ...(status && { status: status as RegistrationStatus }),
      ...(categoryId && { categoryId }),
      ...(source && { source: source as RegistrationSource }),
    }),
    [eventId, status, categoryId, source],
  );

  const { data: pageData, isLoading } = useQuery({
    queryKey: [...queryKeys.registrations.list({ filters }), page, search, dateFrom],
    queryFn: () =>
      registrationService.list({
        limit: PAGE_SIZE,
        cursor: String((page - 1) * PAGE_SIZE),
        q: search || undefined,
        filters,
      }),
  });

  /* Client-side date filter on the current page (mock API lacks date filter) */
  const rows = useMemo(() => {
    const items = pageData?.items ?? [];
    if (!dateFrom) return items;
    return items.filter((r) => r.createdAt >= dateFrom);
  }, [pageData, dateFrom]);

  const openDrawer = useCallback(
    (id: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("selected", id);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const closeDrawer = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("selected");
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  /* Bulk mutations */
  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => registrationService.approve(id, "usr_admin")));
      return results.filter((r) => r.status === "fulfilled").length;
    },
    onSuccess: (okCount, ids) => {
      void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
      okCount === ids.length
        ? toastSuccess(`${okCount} registrations approved`)
        : toastError(`${okCount}/${ids.length} approved — some were not pending`);
    },
  });

  const bulkReject = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => registrationService.reject(id, "usr_admin")));
      return results.filter((r) => r.status === "fulfilled").length;
    },
    onSuccess: (okCount, ids) => {
      void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
      okCount === ids.length
        ? toastSuccess(`${okCount} registrations rejected`)
        : toastError(`${okCount}/${ids.length} rejected — some were not pending`);
    },
  });

  /* Columns */
  const columns = useMemo<ColumnDef<Registration, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-800">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-[11px] text-slate-400">{row.original.email ?? "no email"}</p>
          </div>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="font-mono text-[13px] text-slate-600">{maskPhone(row.original.phone)}</span>
        ),
      },
      {
        id: "company",
        header: "Company",
        cell: ({ row }) => (
          <span className="text-[13px] text-slate-600">{row.original.company ?? "—"}</span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = db.categories.find((c) => c.id === row.original.categoryId);
          return cat ? <Badge variant={cat.color}>{cat.name}</Badge> : <span className="text-slate-400">—</span>;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-[12px] text-slate-500">{SOURCE_LABEL[row.original.source]}</span>
        ),
      },
      {
        id: "createdAt",
        header: "Registered",
        cell: ({ row }) => (
          <span className="text-[12px] text-slate-500">{fmtDateTime(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  const total = pageData?.total ?? 0;
  const hasFilters = !!(status || categoryName || source || dateFrom || search);

  return (
    <>
      <PageHeader
        title="Registrations"
        breadcrumbs={[{ label: "Events", href: "/org/events" }, { label: "Registrations" }]}
        subtitle="All visitors registered for this event"
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => router.push(`/org/events/${eventId}/registrations/new`)}
          >
            Register New
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar
          summary={
            <span className="text-[13px]">
              Showing <strong className="text-slate-700">{rows.length}</strong> of{" "}
              <strong className="text-slate-700">{total.toLocaleString("en-IN")}</strong> registrations
            </span>
          }
          selects={[
            { id: "status", label: "All Statuses", options: STATUS_OPTIONS, value: status, onChange: (v) => { setStatus(v); setPage(1); } },
            { id: "category", label: "All Categories", options: categories.map((c) => c.name), value: categoryName, onChange: (v) => { setCategoryName(v); setPage(1); } },
            { id: "source", label: "All Sources", options: SOURCE_OPTIONS, value: source, onChange: (v) => { setSource(v); setPage(1); } },
          ]}
          search={{
            value: search,
            onChange: (v) => { setSearch(v); setPage(1); },
            placeholder: "Search name, phone, company…",
          }}
          chips={[
            ...(status ? [{ id: "status", label: `Status: ${status}`, onRemove: () => setStatus("") }] : []),
            ...(categoryName ? [{ id: "cat", label: `Category: ${categoryName}`, onRemove: () => setCategoryName("") }] : []),
            ...(source ? [{ id: "src", label: `Source: ${source}`, onRemove: () => setSource("") }] : []),
            ...(dateFrom ? [{ id: "date", label: `From: ${dateFrom}`, onRemove: () => setDateFrom("") }] : []),
          ]}
          onClearAll={hasFilters ? () => { setStatus(""); setCategoryName(""); setSource(""); setDateFrom(""); setSearch(""); setPage(1); } : undefined}
        />

        {/* Date filter row */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <label className="text-[12px] text-slate-400" htmlFor="reg-date-from">Registered after</label>
          <input
            id="reg-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 px-2 text-[13px] text-slate-600 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
          />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          getRowId={(r) => r.id}
          onRowClick={(r) => openDrawer(r.id)}
          enableSelection
          bulkActions={(ids, clear) => (
            <>
              <Button
                variant="secondary"
                icon={CheckCircle2}
                onClick={() => { bulkApprove.mutate(ids); clear(); }}
                disabled={bulkApprove.isPending}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                icon={XCircle}
                onClick={() => { bulkReject.mutate(ids); clear(); }}
                disabled={bulkReject.isPending}
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                icon={Download}
                onClick={() => {
                  const selected = rows.filter((r) => ids.includes(r.id));
                  // Fall back to db lookup for rows selected on other pages
                  const extra = ids
                    .filter((id) => !selected.some((s) => s.id === id))
                    .map((id) => db.registrations.find((r) => r.id === id))
                    .filter((r): r is Registration => !!r);
                  exportCSV([...selected, ...extra]);
                  toastSuccess(`Exported ${ids.length} rows to CSV`);
                }}
              >
                Export Selection
              </Button>
            </>
          )}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title={hasFilters ? "No matches" : "No registrations yet"}
              description={hasFilters ? "Try adjusting the filters above." : "Registrations will appear here once visitors sign up."}
            />
          }
        />
      </Card>

      {/* Deep-linked detail drawer */}
      <RegistrationDrawer
        registrationId={selectedId}
        eventId={eventId}
        onClose={closeDrawer}
      />
    </>
  );
}
