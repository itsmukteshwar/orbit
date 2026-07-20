"use client";

/**
 * P-15 — Events List (/org/events)
 * Tab-filtered list of all org events with cards/table toggle.
 * New Event modal (rhf + zod) → creates mock event → routes into EventShell.
 * Clone and Archive (typed ConfirmDialog) mutations.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  CalendarDays,
  ChevronRight,
  Copy,
  LayoutGrid,
  LayoutList,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/kit/Button";
import { Tabs } from "@/components/kit/Tabs";
import { Modal } from "@/components/kit/Modal";
import { ConfirmDialog } from "@/components/kit/ConfirmDialog";
import { EmptyState } from "@/components/kit/EmptyState";
import { FormField, TextInput, SelectInput } from "@/components/kit/inputs";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { SkeletonRows } from "@/components/kit/Skeleton";
import { toastError, toastSuccess } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { eventService } from "@/services/event";
import { registrationService } from "@/services/registration";
import { ORG } from "@/mocks/fixtures";
import type { EventStatus, OrbitEvent } from "@/types/domain";

/* ── Tab config ──────────────────────────────────────────────────────────── */

type TabId = "all" | "live" | "upcoming" | "draft" | "past" | "archived";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "draft", label: "Draft" },
  { id: "past", label: "Past" },
  { id: "archived", label: "Archived" },
];

const TAB_STATUSES: Record<TabId, EventStatus[] | null> = {
  all: null,
  live: ["live"],
  upcoming: ["published"],
  draft: ["draft"],
  past: ["completed"],
  archived: ["archived"],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const day: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const full: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString("en-IN", full)} – ${e.toLocaleDateString("en-IN", full)}`;
  }
  if (s.getMonth() !== e.getMonth()) {
    return `${s.toLocaleDateString("en-IN", day)} – ${e.toLocaleDateString("en-IN", full)}`;
  }
  return `${s.getDate()}–${e.toLocaleDateString("en-IN", full)}`;
}

/* ── Per-event registration count hook ───────────────────────────────────── */

function useRegCount(eventId: string) {
  return useQuery({
    queryKey: queryKeys.registrations.list({ filters: { eventId } }),
    queryFn: () => registrationService.list({ limit: 1, filters: { eventId } }),
    staleTime: 60_000,
  });
}

/* ── Event Card ──────────────────────────────────────────────────────────── */

interface EventCardProps {
  event: OrbitEvent;
  onClone: (event: OrbitEvent) => void;
  onArchive: (event: OrbitEvent) => void;
}

function EventCard({ event, onClone, onArchive }: EventCardProps) {
  const { data: regsData } = useRegCount(event.id);
  const regCount = regsData?.total ?? 0;
  const regPct = event.capacity > 0 ? Math.min(Math.round((regCount / event.capacity) * 100), 100) : 0;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          {event.isDemo && <Badge variant="neutral">Demo</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            icon={Copy}
            iconOnly
            aria-label={`Clone ${event.name}`}
            onClick={() => onClone(event)}
          />
          {event.status !== "archived" && (
            <Button
              variant="ghost"
              icon={Archive}
              iconOnly
              aria-label={`Archive ${event.name}`}
              onClick={() => onArchive(event)}
            />
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 px-4 pb-4">
        <h3 className="font-display font-semibold leading-snug text-orbit-900">{event.name}</h3>
        <p className="mt-0.5 truncate text-[12px] text-slate-500">
          {event.venue} · {event.city}
        </p>
        <p className="text-[12px] text-slate-400">{fmtRange(event.startDate, event.endDate)}</p>

        {/* Registration usage */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Registrations</span>
            <span className="font-medium text-slate-600">
              {regCount.toLocaleString("en-IN")} / {event.capacity.toLocaleString("en-IN")}
            </span>
          </div>
          <ProgressBar
            value={regPct}
            label={`${regCount} of ${event.capacity} registrations`}
            tone={regPct >= 100 ? "danger" : regPct >= 80 ? "warning" : "success"}
          />
        </div>
      </div>

      {/* Card footer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <Link
          href={`/org/events/${event.id}/overview`}
          className="flex items-center gap-1 text-[12px] font-medium text-orbit-600 hover:text-orbit-700"
        >
          Open workspace <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

/* ── Event Table Row ─────────────────────────────────────────────────────── */

interface EventTableRowProps {
  event: OrbitEvent;
  onClone: (event: OrbitEvent) => void;
  onArchive: (event: OrbitEvent) => void;
}

function EventTableRow({ event, onClone, onArchive }: EventTableRowProps) {
  const { data: regsData } = useRegCount(event.id);
  const regCount = regsData?.total ?? 0;
  const regPct = event.capacity > 0 ? Math.min(Math.round((regCount / event.capacity) * 100), 100) : 0;

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="px-5 py-3">
        <p className="font-medium text-slate-800">{event.name}</p>
        <p className="text-[12px] text-slate-400">{event.category}</p>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <StatusBadge status={event.status} />
        {event.isDemo && (
          <Badge variant="neutral" className="ml-1">
            Demo
          </Badge>
        )}
      </td>
      <td className="hidden px-4 py-3 text-[13px] text-slate-600 md:table-cell">
        {fmtRange(event.startDate, event.endDate)}
      </td>
      <td className="hidden px-4 py-3 text-[13px] text-slate-500 lg:table-cell">
        {event.venue}, {event.city}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={regPct}
            label={`${regCount} of ${event.capacity} registrations`}
            tone={regPct >= 100 ? "danger" : regPct >= 80 ? "warning" : "success"}
            className="w-16"
          />
          <span className="text-[12px] text-slate-500">
            {regCount.toLocaleString("en-IN")} / {event.capacity.toLocaleString("en-IN")}
          </span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            icon={Copy}
            iconOnly
            aria-label={`Clone ${event.name}`}
            onClick={() => onClone(event)}
          />
          {event.status !== "archived" && (
            <Button
              variant="ghost"
              icon={Archive}
              iconOnly
              aria-label={`Archive ${event.name}`}
              onClick={() => onArchive(event)}
            />
          )}
          <Link href={`/org/events/${event.id}/overview`}>
            <Button variant="ghost" icon={ChevronRight} iconOnly aria-label={`Open ${event.name}`} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

/* ── New Event Form ──────────────────────────────────────────────────────── */

const newEventSchema = z
  .object({
    name: z.string().min(3, "At least 3 characters"),
    category: z.string().min(1, "Select a category"),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().min(1, "Required"),
    venue: z.string().min(2, "Enter venue name"),
    city: z.string().min(2, "Enter city"),
    timezone: z.string().min(1, "Required"),
    capacity: z.coerce.number().int().min(10, "Minimum 10").max(1_000_000, "Maximum 1,000,000"),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

type NewEventInput = z.infer<typeof newEventSchema>;

const EVENT_CATEGORIES = [
  "Trade / B2B Exhibition",
  "Conference",
  "Workshop",
  "Product Launch",
  "Cultural / Entertainment",
  "Sports / Fitness",
  "Other",
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST — Asia/Kolkata (+05:30)" },
  { value: "Asia/Dubai", label: "GST — Asia/Dubai (+04:00)" },
  { value: "Asia/Singapore", label: "SGT — Asia/Singapore (+08:00)" },
  { value: "UTC", label: "UTC (+00:00)" },
];

interface NewEventFormProps {
  onSuccess: (event: OrbitEvent) => void;
  onCancel: () => void;
}

function NewEventForm({ onSuccess, onCancel }: NewEventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewEventInput>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      category: "Trade / B2B Exhibition",
      timezone: "Asia/Kolkata",
      capacity: 1000,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: NewEventInput) =>
      eventService.create({
        orgId: ORG.id,
        name: data.name,
        slug: data.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-"),
        status: "draft",
        mode: "in_person",
        category: data.category,
        venue: data.venue,
        city: data.city,
        timezone: data.timezone,
        startDate: data.startDate,
        endDate: data.endDate,
        dailyStart: "09:00",
        dailyEnd: "18:00",
        capacity: data.capacity,
        halls: [],
      }),
    onSuccess: (event) => {
      toastSuccess(`"${event.name}" created`);
      onSuccess(event);
    },
    onError: () => toastError("Failed to create event. Please try again."),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <FormField label="Event name" required error={errors.name?.message}>
        <TextInput
          {...register("name")}
          placeholder="e.g. Malwa Trade Expo 2027"
          error={!!errors.name}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </FormField>

      <FormField label="Category" required error={errors.category?.message}>
        <SelectInput {...register("category")} error={!!errors.category}>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectInput>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start date" required error={errors.startDate?.message}>
          <TextInput {...register("startDate")} type="date" error={!!errors.startDate} />
        </FormField>
        <FormField label="End date" required error={errors.endDate?.message}>
          <TextInput {...register("endDate")} type="date" error={!!errors.endDate} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Venue" required error={errors.venue?.message}>
          <TextInput
            {...register("venue")}
            placeholder="e.g. Pragati Maidan"
            error={!!errors.venue}
          />
        </FormField>
        <FormField label="City" required error={errors.city?.message}>
          <TextInput {...register("city")} placeholder="e.g. New Delhi" error={!!errors.city} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Timezone" required error={errors.timezone?.message}>
          <SelectInput {...register("timezone")} error={!!errors.timezone}>
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <FormField
          label="Total capacity"
          required
          error={errors.capacity?.message}
          hint="Max registrations across all days"
        >
          <TextInput
            {...register("capacity")}
            type="number"
            min="10"
            placeholder="1000"
            error={!!errors.capacity}
          />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function OrgEventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabId>("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [showNew, setShowNew] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<OrbitEvent | null>(null);
  const [archiving, setArchiving] = useState(false);

  const { data: eventsPage, isLoading } = useQuery({
    queryKey: queryKeys.events.list({}),
    queryFn: () => eventService.list({ limit: 50 }),
  });

  const allEvents = eventsPage?.items ?? [];

  const filteredEvents = useMemo(() => {
    const statuses = TAB_STATUSES[tab];
    if (!statuses) return allEvents;
    return allEvents.filter((e) => statuses.includes(e.status));
  }, [allEvents, tab]);

  const tabsWithCounts = TABS.map((t) => {
    const count =
      t.id === "all"
        ? allEvents.length
        : allEvents.filter((e) => (TAB_STATUSES[t.id] ?? []).includes(e.status)).length;
    return {
      ...t,
      badge:
        count > 0 ? (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            {count}
          </span>
        ) : null,
    };
  });

  /* Clone mutation */
  const cloneMutation = useMutation({
    mutationFn: async (event: OrbitEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, ...rest } = event;
      return eventService.create({
        ...rest,
        name: `${event.name} (Copy)`,
        status: "draft",
        isDemo: false,
      });
    },
    onSuccess: (cloned) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
      toastSuccess(`"${cloned.name}" created as draft`);
      router.push(`/org/events/${cloned.id}/overview`);
    },
    onError: () => toastError("Clone failed — please try again"),
  });

  /* Archive mutation */
  const archiveMutation = useMutation({
    mutationFn: (id: string) => eventService.transition(id, "archived"),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
      toastSuccess(`"${updated.name}" archived`);
      setArchiveTarget(null);
    },
    onError: () => toastError("Archive failed — please try again"),
  });

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveMutation.mutateAsync(archiveTarget.id);
    } finally {
      setArchiving(false);
    }
  }

  function handleNewSuccess(event: OrbitEvent) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.events.all() });
    setShowNew(false);
    router.push(`/org/events/${event.id}/overview`);
  }

  const emptyLabel =
    tab === "all" ? "No events yet" : `No ${tab === "upcoming" ? "upcoming" : tab} events`;
  const emptyDesc =
    tab === "all"
      ? "Create your first event to start managing registrations, check-ins, and more."
      : `There are no events with status "${tab}" right now.`;

  return (
    <>
      <PageHeader
        title="Events"
        breadcrumbs={[{ label: "Organisation", href: "/org/dashboard" }, { label: "Events" }]}
        subtitle={
          !isLoading && allEvents.length > 0
            ? `${allEvents.length} event${allEvents.length !== 1 ? "s" : ""} in your organisation`
            : undefined
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>
            New Event
          </Button>
        }
      />

      {/* Tabs + view toggle */}
      <div className="flex items-center gap-2">
        <Tabs
          tabs={tabsWithCounts}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
          className="flex-1 overflow-x-auto"
        />
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 p-0.5">
          {(["cards", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-label={`${v === "cards" ? "Cards" : "Table"} view`}
              onClick={() => setView(v)}
              className={cn(
                "rounded p-1.5 transition",
                view === v
                  ? "bg-orbit-50 text-orbit-600"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              {v === "cards" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredEvents.length === 0 && (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title={emptyLabel}
            description={emptyDesc}
            action={
              tab === "all" || tab === "draft" ? (
                <Button variant="primary" icon={Plus} onClick={() => setShowNew(true)}>
                  New Event
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {/* Cards view */}
      {!isLoading && filteredEvents.length > 0 && view === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClone={(e) => cloneMutation.mutate(e)}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {!isLoading && filteredEvents.length > 0 && view === "table" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5">Event</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">Status</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Dates</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">Venue</th>
                  <th className="px-4 py-2.5">Registrations</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => (
                  <EventTableRow
                    key={event.id}
                    event={event}
                    onClone={(e) => cloneMutation.mutate(e)}
                    onArchive={setArchiveTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Event Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Create Event"
        subtitle="Fill in the basics — everything else can be configured later."
        size="lg"
      >
        <NewEventForm onSuccess={handleNewSuccess} onCancel={() => setShowNew(false)} />
      </Modal>

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive event"
        description={
          <>
            <strong>{archiveTarget?.name}</strong> will be moved to Archived and will no longer
            appear in active lists. Registrations and data are preserved.
          </>
        }
        confirmText={archiveTarget?.name ?? ""}
        actionLabel="Archive event"
        loading={archiving}
      />
    </>
  );
}
