"use client";

/**
 * P-25 — Approval Queue (/org/events/[eventId]/registrations/approvals)
 * Keyboard-first: J/K navigate · A approve · R reject (reason dialog) ·
 * Space toggles selection · bulk approve. Running count with progress.
 * Celebration empty state when the queue is cleared.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Keyboard,
  PartyPopper,
  Phone,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { Modal } from "@/components/kit/Modal";
import { KbdHint } from "@/components/kit/misc";
import { Textarea, FormField } from "@/components/kit/inputs";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { registrationService } from "@/services/registration";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";
import type { Registration } from "@/types/domain";

/* ── Duplicate-phone detection ───────────────────────────────────────────── */

function findDuplicatePhones(regs: Registration[]): Set<string> {
  const seen = new Map<string, number>();
  db.registrations.forEach((r) => {
    seen.set(r.phone, (seen.get(r.phone) ?? 0) + 1);
  });
  return new Set(regs.filter((r) => (seen.get(r.phone) ?? 0) > 1).map((r) => r.id));
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ApprovalQueuePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const qc = useQueryClient();

  const [cursor, setCursor] = useState(0); // focused row index
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [initialCount, setInitialCount] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { data: pageData, isLoading } = useQuery({
    queryKey: [...queryKeys.registrations.list({ filters: { eventId, status: "pending" } }), "queue"],
    queryFn: () => registrationService.list({ limit: 100, filters: { eventId, status: "pending" } }),
  });

  const pending = useMemo(() => pageData?.items ?? [], [pageData]);
  const duplicates = useMemo(() => findDuplicatePhones(pending), [pending]);

  // Capture the initial queue size once for progress display
  useEffect(() => {
    if (initialCount === null && pageData) setInitialCount(pageData.total);
  }, [pageData, initialCount]);

  const done = initialCount !== null ? initialCount - pending.length : 0;
  const progressPct = initialCount ? Math.round((done / initialCount) * 100) : 0;

  /* Keep cursor in bounds */
  useEffect(() => {
    if (cursor >= pending.length && pending.length > 0) setCursor(pending.length - 1);
  }, [pending.length, cursor]);

  function invalidate() {
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => registrationService.approve(id, "usr_admin"),
    onSuccess: ({ registration, pass }) => {
      invalidate();
      toastSuccess(`${registration.firstName} approved — ${pass.badgeNo}`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Approve failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => registrationService.reject(id, "usr_admin"),
    onSuccess: (reg) => {
      invalidate();
      setRejectTarget(null);
      setRejectReason("");
      toastSuccess(`${reg.firstName} rejected`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Reject failed"),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await Promise.allSettled(ids.map((id) => registrationService.approve(id, "usr_admin")));
      return res.filter((r) => r.status === "fulfilled").length;
    },
    onSuccess: (ok, ids) => {
      invalidate();
      setSelected(new Set());
      toastSuccess(`${ok}/${ids.length} approved in bulk`);
    },
  });

  /* Keyboard handling */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when a modal/input is focused
      if (rejectTarget) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (pending.length === 0) return;

      const current = pending[cursor];

      switch (e.key.toLowerCase()) {
        case "j":
          e.preventDefault();
          setCursor((c) => Math.min(c + 1, pending.length - 1));
          break;
        case "k":
          e.preventDefault();
          setCursor((c) => Math.max(c - 1, 0));
          break;
        case "a":
          e.preventDefault();
          if (current && !approveMutation.isPending) approveMutation.mutate(current.id);
          break;
        case "r":
          e.preventDefault();
          if (current) setRejectTarget(current);
          break;
        case " ":
          e.preventDefault();
          if (current) {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(current.id)) next.delete(current.id);
              else next.add(current.id);
              return next;
            });
          }
          break;
      }
    },
    [pending, cursor, rejectTarget, approveMutation],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  /* Scroll focused card into view */
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor]);

  const allClear = !isLoading && pending.length === 0;

  return (
    <>
      <PageHeader
        title="Approval Queue"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Registrations", href: `/org/events/${eventId}/registrations` },
          { label: "Approvals" },
        ]}
        subtitle={
          initialCount
            ? `${initialCount} pending → ${pending.length} left`
            : "Review pending registrations"
        }
        actions={
          selected.size > 0 ? (
            <Button
              variant="primary"
              icon={CheckCircle2}
              onClick={() => bulkApproveMutation.mutate([...selected])}
              disabled={bulkApproveMutation.isPending}
            >
              Approve {selected.size} Selected
            </Button>
          ) : undefined
        }
      />

      {/* Progress strip */}
      {initialCount !== null && initialCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[12px] tabular-nums text-slate-500">
            {done} done · {pending.length} left
          </span>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50/70 px-4 py-2.5 text-[12px] text-slate-500">
        <span className="flex items-center gap-1.5 font-medium text-slate-400">
          <Keyboard className="h-3.5 w-3.5" /> Shortcuts
        </span>
        <span className="flex items-center gap-1.5"><KbdHint keys={["J"]} /> / <KbdHint keys={["K"]} /> navigate</span>
        <span className="flex items-center gap-1.5"><KbdHint keys={["A"]} /> approve</span>
        <span className="flex items-center gap-1.5"><KbdHint keys={["R"]} /> reject</span>
        <span className="flex items-center gap-1.5"><KbdHint keys={["Space"]} /> select</span>
      </div>

      {/* Queue */}
      {allClear ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 text-center shadow-card">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <PartyPopper className="h-8 w-8 text-emerald-500" />
          </span>
          <h2 className="font-display text-xl font-bold text-orbit-900">Queue cleared! 🎉</h2>
          <p className="mt-1.5 text-[13px] text-slate-400">
            {initialCount ? `All ${initialCount} pending registrations reviewed.` : "Nothing pending — you're all caught up."}
          </p>
        </div>
      ) : (
        <ul ref={listRef} className="space-y-2">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="h-[76px] animate-pulse rounded-xl bg-white shadow-card" />
              ))
            : pending.map((reg, i) => {
                const cat = db.categories.find((c) => c.id === reg.categoryId);
                const isFocused = i === cursor;
                const isSelected = selected.has(reg.id);
                const isDup = duplicates.has(reg.id);
                return (
                  <li key={reg.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setCursor(i)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border-2 bg-white px-4 py-3 shadow-card transition-all",
                        isFocused ? "border-orbit-400 ring-2 ring-orbit-100" : "border-transparent",
                        isSelected && "bg-orbit-50/40",
                      )}
                    >
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        aria-label={`Select ${reg.firstName}`}
                        checked={isSelected}
                        onChange={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(reg.id)) next.delete(reg.id);
                            else next.add(reg.id);
                            return next;
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 accent-orbit-500"
                      />

                      {/* Avatar */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
                        {reg.firstName[0]}{reg.lastName[0]}
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate">
                          <span className="font-medium text-slate-800">{reg.firstName} {reg.lastName}</span>
                          {isDup && (
                            <span
                              className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600"
                              title="Another registration shares this phone number"
                            >
                              <Phone className="h-2.5 w-2.5" /> Duplicate phone
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[12px] text-slate-400">
                          {reg.company ?? "No company"} · {reg.city} · {timeAgo(reg.createdAt)}
                        </p>
                      </div>

                      {/* Category */}
                      {cat && <Badge variant={cat.color}>{cat.name}</Badge>}

                      {/* Row actions */}
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          variant="secondary"
                          icon={CheckCircle2}
                          onClick={(e) => { e.stopPropagation(); approveMutation.mutate(reg.id); }}
                          disabled={approveMutation.isPending}
                          aria-label={`Approve ${reg.firstName}`}
                        >
                          <span className="hidden lg:inline">Approve</span>
                        </Button>
                        <Button
                          variant="ghost"
                          icon={XCircle}
                          iconOnly
                          onClick={(e) => { e.stopPropagation(); setRejectTarget(reg); }}
                          aria-label={`Reject ${reg.firstName}`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
        </ul>
      )}

      {/* Reject dialog */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(""); }}
        title={`Reject ${rejectTarget?.firstName ?? ""}?`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={rejectMutation.isPending}
              onClick={() => rejectTarget && rejectMutation.mutate(rejectTarget.id)}
            >
              {rejectMutation.isPending ? "Rejecting…" : "Reject"}
            </Button>
          </>
        }
      >
        <FormField label="Reason (optional, sent to visitor)">
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Duplicate registration"
            rows={3}
            autoFocus
          />
        </FormField>
      </Modal>
    </>
  );
}
