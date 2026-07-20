"use client";

/**
 * P-19 — EventContextBar (upgraded)
 * • Inline-editable event name
 * • StatusBadge + lifecycle transition dropdown (guarded with dialogs)
 * • Copy public registration link
 * • Open TV mode
 * • Syncs current event status to useEventStore for downstream gating
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronDown,
  Copy,
  MapPin,
  MonitorPlay,
  Pencil,
  TriangleAlert,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/services/event";
import { queryKeys } from "@/lib/queries";
import { useEventStore } from "@/lib/eventStore";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { Skeleton } from "@/components/kit/Skeleton";
import { Modal } from "@/components/kit/Modal";
import { Button } from "@/components/kit/Button";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/types/domain";

/* ── Transition definitions ──────────────────────────────────────────────── */

interface TransitionDef {
  to: EventStatus;
  label: string;
  /** Shown in the confirm dialog body. */
  description: string;
  unlocks: string;
  destructive: boolean;
}

const TRANSITIONS: Record<EventStatus, TransitionDef[]> = {
  draft: [
    {
      to: "published",
      label: "Publish Event",
      description: "Publishing opens registration to the public.",
      unlocks: "Visitors can now discover and register. Registration form goes live.",
      destructive: false,
    },
    {
      to: "archived",
      label: "Archive",
      description: "This event will be hidden from all active lists.",
      unlocks: "Event becomes read-only. Cannot be un-archived.",
      destructive: true,
    },
  ],
  published: [
    {
      to: "live",
      label: "Go Live",
      description: "Mark the event as started.",
      unlocks: "Check-in gates activate. QR scanning begins. Food coupon windows open.",
      destructive: false,
    },
    {
      to: "archived",
      label: "Archive",
      description: "This event will be hidden from all active lists.",
      unlocks: "Event becomes read-only. Cannot be un-archived.",
      destructive: true,
    },
  ],
  live: [
    {
      to: "completed",
      label: "Close Event",
      description: "Mark the event as finished.",
      unlocks: "All check-in and food coupon scanning is disabled. Event report finalised.",
      destructive: true,
    },
    {
      to: "archived",
      label: "Archive",
      description: "This event will be hidden from all active lists.",
      unlocks: "Event becomes read-only. Cannot be un-archived.",
      destructive: true,
    },
  ],
  completed: [
    {
      to: "archived",
      label: "Archive",
      description: "This event will be hidden from all active lists.",
      unlocks: "Event becomes read-only. Cannot be un-archived.",
      destructive: true,
    },
  ],
  archived: [],
};

/* ── Transition confirm dialog ───────────────────────────────────────────── */

function TransitionDialog({
  open,
  onClose,
  onConfirm,
  def,
  eventName,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  def: TransitionDef | null;
  eventName: string;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const needsTyped = def?.destructive ?? false;
  const confirmed = !needsTyped || typed === eventName;

  useEffect(() => {
    if (!open) { setTyped(""); return; }
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  if (!def) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          {def.destructive
            ? <TriangleAlert className="h-4 w-4 text-red-500" />
            : <Check className="h-4 w-4 text-orbit-500" />}
          {def.label}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant={def.destructive ? "danger" : "primary"}
            disabled={!confirmed || loading}
            onClick={onConfirm}
          >
            {loading ? "Working…" : `Confirm — ${def.label}`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-slate-600">{def.description}</p>
        <div className={cn(
          "rounded-lg p-3 text-[12px]",
          def.destructive ? "bg-red-50/70 text-red-600" : "bg-orbit-50 text-orbit-700",
        )}>
          <strong>Unlocks: </strong>{def.unlocks}
        </div>
        {needsTyped && (
          <label className="block">
            <span className="mb-1 block text-[13px] font-medium text-slate-600">
              Type <span className="font-semibold text-slate-800">{eventName}</span> to confirm
            </span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={eventName}
              className={cn(
                "h-9 w-full rounded-lg border px-3 text-[13px] focus:outline-none focus:ring-2",
                typed.length > 0 && typed !== eventName
                  ? "border-red-300 focus:ring-red-100"
                  : "border-slate-200 focus:border-orbit-300 focus:ring-orbit-100",
              )}
            />
          </label>
        )}
      </div>
    </Modal>
  );
}

/* ── Inline name editor ──────────────────────────────────────────────────── */

function InlineName({
  value,
  onSave,
  saving,
}: {
  value: string;
  onSave: (name: string) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) { setEditing(false); return; }
    onSave(trimmed);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
          className="h-7 min-w-0 max-w-[280px] rounded-md border border-orbit-300 bg-white px-2 font-display text-[15px] font-semibold text-orbit-900 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
          disabled={saving}
        />
        <button
          type="button"
          aria-label="Cancel rename"
          onMouseDown={(e) => { e.preventDefault(); cancel(); }}
          className="rounded p-0.5 text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title="Click to rename"
      className="group flex items-center gap-1.5 rounded-md px-1 hover:bg-slate-100"
    >
      <span className="truncate font-display font-semibold text-orbit-900">{value}</span>
      <Pencil className="h-3 w-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ── Transition dropdown trigger ─────────────────────────────────────────── */

function StatusDropdown({
  status,
  transitions,
  onSelect,
}: {
  status: EventStatus;
  transitions: TransitionDef[];
  onSelect: (def: TransitionDef) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => transitions.length && setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 rounded-full focus:outline-none",
          transitions.length > 0 && "cursor-pointer hover:opacity-80",
        )}
        aria-haspopup={transitions.length > 0}
        aria-expanded={open}
      >
        <StatusBadge status={status} />
        {transitions.length > 0 && (
          <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", open && "rotate-180")} />
        )}
      </button>

      {open && transitions.length > 0 && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card-hover"
        >
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Transition to
          </p>
          {transitions.map((t) => (
            <button
              key={t.to}
              type="button"
              role="menuitem"
              onClick={() => { onSelect(t); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]",
                t.destructive
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {t.destructive && <Archive className="h-3.5 w-3.5 shrink-0 text-red-400" />}
              <span className="flex-1">{t.label}</span>
              <span className={cn(
                "text-[10px]",
                t.destructive ? "text-red-400" : "text-slate-400",
              )}>
                → {t.to}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatRange(startDate: string, endDate: string, timezone: string): string {
  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { ...opts, timeZone: timezone });
  return `${fmt(startDate, { day: "numeric" })}–${fmt(endDate, { day: "numeric", month: "short", year: "numeric" })}`;
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function EventContextBar({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const setEvent = useEventStore((s) => s.setEvent);

  const { data: event, isPending } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventService.get(eventId),
  });

  // Sync to zustand store so sub-pages can gate on status
  useEffect(() => {
    if (event) setEvent(event.id, event.status);
  }, [event, setEvent]);

  const renameMutation = useMutation({
    mutationFn: (name: string) => eventService.update(eventId, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.events.all() });
      toastSuccess("Event renamed");
    },
    onError: () => toastError("Rename failed"),
  });

  const transitionMutation = useMutation({
    mutationFn: (to: EventStatus) => eventService.transition(eventId, to),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.events.all() });
      setEvent(updated.id, updated.status);
      toastSuccess(`Event is now ${updated.status}`);
    },
    onError: (err) => toastError(err instanceof Error ? err.message : "Transition failed"),
  });

  const [pendingTransition, setPendingTransition] = useState<TransitionDef | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `https://orbit.events/r/${eventId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toastSuccess("Registration link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  const transitions = event ? (TRANSITIONS[event.status] ?? []) : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
        {/* Back */}
        <Link
          href="/org/events"
          aria-label="Back to all events"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-orbit-500"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {isPending || !event ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            {/* Name + status */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 leading-tight">
                <InlineName
                  value={event.name}
                  onSave={(name) => renameMutation.mutate(name)}
                  saving={renameMutation.isPending}
                />
                <StatusDropdown
                  status={event.status}
                  transitions={transitions}
                  onSelect={setPendingTransition}
                />
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarRange className="h-3.5 w-3.5" />
                  {formatRange(event.startDate, event.endDate, event.timezone)}
                </span>
                <span className="hidden items-center gap-1 sm:flex">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue}, {event.city}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void copyLink()}
                title="Copy public registration link"
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium shadow-card transition-colors",
                  copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {copied
                  ? <Check className="h-3.5 w-3.5" />
                  : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/tv/${eventId}`)}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 shadow-card hover:bg-slate-50"
              >
                <MonitorPlay className="h-4 w-4 text-orbit-500" />
                <span className="hidden sm:inline">TV Mode</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Transition confirm dialog */}
      <TransitionDialog
        open={!!pendingTransition}
        onClose={() => setPendingTransition(null)}
        onConfirm={() => {
          if (!pendingTransition) return;
          transitionMutation.mutate(pendingTransition.to);
          setPendingTransition(null);
        }}
        def={pendingTransition}
        eventName={event?.name ?? ""}
        loading={transitionMutation.isPending}
      />
    </>
  );
}
