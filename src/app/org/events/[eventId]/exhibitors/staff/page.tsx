"use client";

/**
 * P-35 — Exhibitors → Staff badges (/org/events/[eventId]/exhibitors/staff)
 * Pending submissions grouped by exhibitor · approve/reject per row or per
 * company · approval creates a mock registration in the "Exhibitor Staff"
 * category (+ pass + print job) · over-quota rows blocked with a clear reason.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCheck,
  Printer,
  Store,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { EmptyState } from "@/components/kit/EmptyState";
import { SkeletonRows } from "@/components/kit/Skeleton";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { exhibitorService } from "@/services/exhibitor";
import { db } from "@/services/mock/db";
import type { Exhibitor, ExhibitorStaff } from "@/types/domain";

const REVIEWER = "usr_admin";

interface CompanyGroup {
  exhibitor: Exhibitor;
  pending: ExhibitorStaff[];
  approvedCount: number;
  remaining: number;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function StaffApprovalsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const qc = useQueryClient();
  const [version, setVersion] = useState(0);

  const { data, isLoading } = useQuery({
    // version forces re-read of raw db aggregation after each mutation
    queryKey: [...queryKeys.exhibitors.all(), "staff-approvals", eventId, version],
    queryFn: async () => {
      const page = await exhibitorService.list({ filters: { eventId }, limit: 100 });
      return page.items;
    },
  });

  /** Group pending submissions per company with quota headroom. */
  const groups = useMemo<CompanyGroup[]>(() => {
    const exhibitors = data ?? [];
    return exhibitors
      .map((ex) => {
        const all = db.exhibitorStaff.filter((s) => s.exhibitorId === ex.id);
        const pending = all
          .filter((s) => s.status === "pending")
          .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
        const approvedCount = all.filter((s) => s.status === "approved").length;
        return { exhibitor: ex, pending, approvedCount, remaining: ex.staffQuota - approvedCount };
      })
      .filter((g) => g.pending.length > 0)
      .sort((a, b) => b.pending.length - a.pending.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, version]);

  const totalPending = groups.reduce((acc, g) => acc + g.pending.length, 0);

  const invalidateAll = () => {
    setVersion((v) => v + 1);
    void qc.invalidateQueries({ queryKey: queryKeys.exhibitors.all() });
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
    void qc.invalidateQueries({ queryKey: queryKeys.badges.all() });
  };

  const approveOne = useMutation({
    mutationFn: (staffId: string) => exhibitorService.approveStaff(staffId, REVIEWER),
    onSuccess: (staff) => {
      invalidateAll();
      toastSuccess(`${staff.name} approved — registration created & badge queued for print`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Approval failed"),
  });

  const rejectOne = useMutation({
    mutationFn: (staffId: string) => exhibitorService.rejectStaff(staffId, REVIEWER),
    onSuccess: (staff) => {
      invalidateAll();
      toastSuccess(`${staff.name} rejected`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Reject failed"),
  });

  const approveCompany = useMutation({
    mutationFn: async (g: CompanyGroup) => {
      // Approve in submission order, only up to remaining quota.
      const toApprove = g.pending.slice(0, Math.max(0, g.remaining));
      let ok = 0;
      for (const s of toApprove) {
        try {
          await exhibitorService.approveStaff(s.id, REVIEWER);
          ok++;
        } catch {
          /* quota reached mid-batch — stop counting */
        }
      }
      return { ok, blocked: g.pending.length - toApprove.length };
    },
    onSuccess: ({ ok, blocked }) => {
      invalidateAll();
      blocked > 0
        ? toastSuccess(`${ok} approved · ${blocked} blocked by quota`)
        : toastSuccess(`${ok} staff approved — badges queued for print`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Batch approval failed"),
  });

  const busy = approveOne.isPending || rejectOne.isPending || approveCompany.isPending;

  return (
    <>
      <PageHeader
        title="Staff Badge Approvals"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Exhibitors", href: `/org/events/${eventId}/exhibitors` },
          { label: "Staff Badges" },
        ]}
        subtitle="Review staff submitted through exhibitor magic links"
        actions={
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => router.push(`/org/events/${eventId}/badges/print-queue`)}
          >
            Print Queue
          </Button>
        }
      />

      {isLoading ? (
        <Card className="p-5"><SkeletonRows columns={4} rows={6} /></Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={BadgeCheck}
            title="All staff reviewed"
            description="New submissions from exhibitor magic links will appear here."
            action={
              <Button variant="secondary" icon={Store} onClick={() => router.push(`/org/events/${eventId}/exhibitors`)}>
                Back to Exhibitors
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-slate-500">
            <strong className="text-slate-700">{totalPending}</strong> staff awaiting review across{" "}
            <strong className="text-slate-700">{groups.length}</strong> companies
          </p>

          {groups.map((g) => {
            const quotaFull = g.remaining <= 0;
            return (
              <Card key={g.exhibitor.id} className="overflow-hidden">
                {/* Company header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orbit-50 text-orbit-500">
                      <Store className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{g.exhibitor.companyName}</p>
                      <p className="text-[11px] text-slate-400">
                        Stall {g.exhibitor.stallNo} · {g.pending.length} pending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
                        quotaFull ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <Users className="h-3 w-3" />
                      {g.approvedCount}/{g.exhibitor.staffQuota} used
                    </span>
                    <Button
                      variant="secondary"
                      icon={CheckCheck}
                      disabled={busy || quotaFull}
                      onClick={() => approveCompany.mutate(g)}
                      title={quotaFull ? "Quota fully used" : `Approve up to ${g.remaining}`}
                    >
                      Approve All{g.remaining > 0 && g.remaining < g.pending.length ? ` (${g.remaining})` : ""}
                    </Button>
                  </div>
                </div>

                {/* Quota warning */}
                {quotaFull && (
                  <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-2 text-[12px] text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Quota {g.exhibitor.staffQuota}/{g.exhibitor.staffQuota} reached — increase the quota on the
                    exhibitor record or reject other staff to free a slot.
                  </div>
                )}

                {/* Rows */}
                <ul className="divide-y divide-slate-100">
                  {g.pending.map((s, idx) => {
                    // Rows beyond the remaining quota are blocked (in submission order).
                    const blocked = idx >= g.remaining;
                    return (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className={cn("font-medium", blocked ? "text-slate-400" : "text-slate-800")}>
                            {s.name}
                            {s.designation && (
                              <span className="ml-2 text-[12px] font-normal text-slate-400">{s.designation}</span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            <span className="font-mono">{s.phone}</span> · submitted {fmtWhen(s.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {blocked ? (
                            <Badge variant="warning">Over quota — blocked</Badge>
                          ) : (
                            <Button
                              variant="secondary"
                              icon={Check}
                              disabled={busy}
                              onClick={() => approveOne.mutate(s.id)}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            icon={X}
                            disabled={busy}
                            onClick={() => rejectOne.mutate(s.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
