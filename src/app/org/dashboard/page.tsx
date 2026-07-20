"use client";

/**
 * P-14 — Org Dashboard
 * Organisation-level overview: active events, registration totals, pending
 * approvals, plan usage, next-event hero with countdown, and recent activity.
 * Shows a friendly empty state for brand-new orgs.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  ScanLine,
  Ticket,
  UserCheck,
  UserPlus,
  Utensils,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { EmptyState } from "@/components/kit/EmptyState";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { queryKeys } from "@/lib/queries";
import { usePlanStore } from "@/lib/plan";
import { eventService } from "@/services/event";
import { registrationService } from "@/services/registration";
import { formatIndian } from "@/lib/utils";
import type { OrbitEvent, Registration } from "@/types/domain";

/* ── Countdown ───────────────────────────────────────────────────────────── */

interface Cd {
  days: number;
  hrs: number;
  mins: number;
  secs: number;
  ended: boolean;
}

function computeDiff(ms: number): Cd {
  if (ms <= 0) return { days: 0, hrs: 0, mins: 0, secs: 0, ended: true };
  return {
    days: Math.floor(ms / 86_400_000),
    hrs: Math.floor((ms % 86_400_000) / 3_600_000),
    mins: Math.floor((ms % 3_600_000) / 60_000),
    secs: Math.floor((ms % 60_000) / 1_000),
    ended: false,
  };
}

function useCountdown(iso: string | null): Cd {
  const [cd, setCd] = useState<Cd>(() =>
    iso
      ? computeDiff(new Date(iso).getTime() - Date.now())
      : { days: 0, hrs: 0, mins: 0, secs: 0, ended: true },
  );
  useEffect(() => {
    if (!iso) return;
    const tick = () => setCd(computeDiff(new Date(iso).getTime() - Date.now()));
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [iso]);
  return cd;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

/** Pick the most relevant event for the hero card: live > published > draft. */
function pickHeroEvent(events: OrbitEvent[]): OrbitEvent | null {
  const priority: Record<string, number> = {
    live: 0,
    published: 1,
    draft: 2,
    completed: 3,
    archived: 4,
  };
  return (
    [...events].sort(
      (a, b) =>
        (priority[a.status] ?? 5) - (priority[b.status] ?? 5) ||
        a.startDate.localeCompare(b.startDate),
    )[0] ?? null
  );
}

/** Build ISO datetime countdown target in IST (+05:30). */
function cdTarget(event: OrbitEvent): string {
  const [date, time] =
    event.status === "live"
      ? [event.endDate, event.dailyEnd]
      : [event.startDate, event.dailyStart];
  return `${date}T${time}:00+05:30`;
}

/* ── Quick actions on hero card ──────────────────────────────────────────── */

const HERO_ACTIONS = [
  { label: "Registrations", icon: ClipboardList, path: "registrations" },
  { label: "Check-in", icon: ScanLine, path: "checkin" },
  { label: "Badges", icon: Ticket, path: "badges" },
  { label: "Food", icon: Utensils, path: "food" },
] as const;

/* ── Activity icon per registration status ───────────────────────────────── */

const STATUS_ICON: Record<Registration["status"], typeof UserPlus> = {
  pending: UserPlus,
  approved: UserCheck,
  rejected: UserPlus,
  revoked: UserPlus,
};

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function OrgDashboardPage() {
  const plan = usePlanStore();

  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events.list({}),
    queryFn: () => eventService.list({ limit: 50 }),
  });

  const { data: regsTotal, isLoading: regsTotalLoading } = useQuery({
    queryKey: queryKeys.registrations.list({}),
    queryFn: () => registrationService.list({ limit: 1 }),
  });

  const { data: regsPending } = useQuery({
    queryKey: queryKeys.registrations.list({ filters: { status: "pending" } }),
    queryFn: () => registrationService.list({ limit: 1, filters: { status: "pending" } }),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["registrations", "recent-activity"],
    queryFn: () => registrationService.list({ limit: 8 }),
  });

  const events = eventsPage?.items ?? [];
  const heroEvent = useMemo(() => pickHeroEvent(events), [events]);
  const activeEvents = events.filter((e) => e.status === "live" || e.status === "published");

  const planPct =
    plan.activeEventLimit > 0
      ? Math.round((plan.activeEventsUsed / plan.activeEventLimit) * 100)
      : 0;

  const cdIso = heroEvent ? cdTarget(heroEvent) : null;
  const cd = useCountdown(cdIso);

  const isLoading = eventsLoading;
  const isEmpty = !isLoading && events.length === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Organisation overview · all events"
        actions={
          <Link href="/org/events">
            <Button variant="primary" icon={Plus}>
              New Event
            </Button>
          </Link>
        }
      />

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {isEmpty && (
        <Card className="py-4">
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create your first event to start managing registrations, check-ins, badges, and food coupons."
            action={
              <Link href="/org/events">
                <Button variant="primary" icon={Plus}>
                  Create your first event
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* ── Main content (only when events exist) ───────────────────────── */}
      {!isEmpty && (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Active Events"
              value={isLoading ? "—" : String(activeEvents.length)}
              icon={CalendarCheck}
              accent="primary"
              hint="Live + upcoming"
              loading={isLoading}
            />
            <StatCard
              label="Total Registrations"
              value={regsTotalLoading ? "—" : formatIndian(regsTotal?.total ?? 0)}
              icon={ClipboardList}
              accent="success"
              hint="Across all events"
              loading={regsTotalLoading}
            />
            <StatCard
              label="Pending Approvals"
              value={regsPending ? formatIndian(regsPending.total) : "—"}
              icon={Clock}
              accent="warning"
              hint="Awaiting review"
            />
            <StatCard
              label="Plan Usage"
              value={`${planPct}%`}
              icon={Zap}
              accent={planPct >= 100 ? "danger" : planPct >= 80 ? "warning" : "info"}
              hint={`${plan.activeEventsUsed} of ${plan.activeEventLimit} active events`}
            />
          </div>

          {/* Next event hero + recent activity */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Hero card */}
            {heroEvent && (
              <Card className="xl:col-span-2 p-5">
                {/* Identity row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={heroEvent.status} />
                      {heroEvent.isDemo && <Badge variant="neutral">Demo</Badge>}
                      <span className="text-[11px] text-slate-400">{heroEvent.category}</span>
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-snug text-orbit-900">
                      {heroEvent.name}
                    </h2>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">
                      {heroEvent.venue} · {heroEvent.city}
                    </p>
                    <p className="text-[12px] text-slate-400">
                      {fmtDate(heroEvent.startDate)} – {fmtDate(heroEvent.endDate)}
                      {" · "}
                      {heroEvent.dailyStart}–{heroEvent.dailyEnd}
                    </p>
                  </div>
                  <Link href={`/org/events/${heroEvent.id}/overview`} className="shrink-0">
                    <Button
                      variant="secondary"
                      icon={ChevronRight}
                      iconOnly
                      aria-label="Open event workspace"
                    />
                  </Link>
                </div>

                {/* Countdown */}
                {!cd.ended ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {heroEvent.status === "live" ? "Ends in" : "Starts in"}
                    </span>
                    {[
                      { v: cd.days, l: "d" },
                      { v: cd.hrs, l: "h" },
                      { v: cd.mins, l: "m" },
                      { v: cd.secs, l: "s" },
                    ].map(({ v, l }) => (
                      <span
                        key={l}
                        className="flex min-w-[2.75rem] flex-col items-center rounded-lg bg-orbit-50 px-2.5 py-2 text-center"
                      >
                        <span className="font-display text-xl font-bold leading-none text-orbit-700">
                          {String(v).padStart(2, "0")}
                        </span>
                        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-orbit-400">
                          {l}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] text-slate-400">
                    {heroEvent.status === "live"
                      ? "Event concluded · view final reports"
                      : heroEvent.status === "draft"
                        ? "Not published — complete setup to go live"
                        : "Event completed"}
                  </p>
                )}

                {/* Quick-link grid */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {HERO_ACTIONS.map(({ label, icon: Icon, path }) => (
                    <Link key={label} href={`/org/events/${heroEvent.id}/${path}`}>
                      <div className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-slate-200 p-3 transition hover:border-orbit-300 hover:bg-orbit-50/40">
                        <Icon className="h-5 w-5 text-orbit-500" />
                        <span className="text-[11px] font-medium text-slate-600">{label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent activity */}
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-orbit-900">
                <Activity className="h-4 w-4 text-orbit-400" />
                Recent Activity
              </h2>

              {recentActivity?.items.length ? (
                <>
                  <ul className="space-y-3.5">
                    {recentActivity.items.map((reg) => {
                      const Icon = STATUS_ICON[reg.status] ?? UserPlus;
                      return (
                        <li key={reg.id} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50">
                            <Icon className="h-4 w-4 text-orbit-500" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-slate-800">
                              {reg.firstName} {reg.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {reg.company ?? reg.city} · {timeAgo(reg.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={reg.status} />
                        </li>
                      );
                    })}
                  </ul>
                  {(recentActivity.total ?? 0) > 8 && (
                    <Link
                      href={
                        heroEvent
                          ? `/org/events/${heroEvent.id}/registrations`
                          : "/org/events"
                      }
                      className="mt-4 flex items-center gap-1 text-[12px] font-medium text-orbit-600 hover:text-orbit-700"
                    >
                      View all {formatIndian(recentActivity.total)} registrations
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </>
              ) : (
                <p className="py-6 text-center text-[13px] text-slate-400">
                  No recent activity
                </p>
              )}
            </Card>
          </div>

          {/* All events at-a-glance (only when > 1 event) */}
          {events.length > 1 && (
            <Card>
              <CardHeader
                title="All Events"
                subtitle={`${events.length} events in your organisation`}
              />
              <ul className="divide-y divide-slate-100">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{e.name}</p>
                      <p className="text-[12px] text-slate-400">
                        {e.venue} · {fmtDate(e.startDate)} – {fmtDate(e.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                    <Link href={`/org/events/${e.id}/overview`}>
                      <Button
                        variant="ghost"
                        icon={ChevronRight}
                        iconOnly
                        aria-label={`Open ${e.name}`}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 px-5 py-3">
                <Link
                  href="/org/events"
                  className="text-[12px] font-medium text-orbit-600 hover:text-orbit-700"
                >
                  Manage all events →
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
