"use client";

/**
 * P-20 — Event Command Center (/org/events/[eventId]/overview)
 * Live StatTiles · per-gate occupancy bars · gate throughput sparkline ·
 * device status strip · activity ticker.
 * Polls every 5 s via refetchInterval. Dev toggle simulates check-in activity.
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  DoorOpen,
  FlaskConical,
  MonitorPlay,
  Pause,
  Play,
  ShieldAlert,
  Ticket,
  Users,
  Utensils,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AreaChart } from "@/components/charts/AreaChart";
import { Button } from "@/components/kit/Button";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { queryKeys } from "@/lib/queries";
import { eventService } from "@/services/event";
import { registrationService } from "@/services/registration";
import { checkinService } from "@/services/checkin";
import { foodService } from "@/services/food";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";
import type { Checkin, Registration } from "@/types/domain";

/* ── Smooth animated number ──────────────────────────────────────────────── */

function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<{ from: number; to: number; start: number } | null>(null);

  useEffect(() => {
    if (startRef.current?.to === target) return;
    const from = display;
    const start = performance.now();
    startRef.current = { from, to: target, start };
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function tick(now: number) {
      if (!startRef.current) return;
      const progress = Math.min((now - startRef.current.start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current.from + (startRef.current.to - startRef.current.from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

/* ── Throughput sparkline buckets ────────────────────────────────────────── */

/** Groups checkins into 10-minute buckets for the last 60 min. */
function buildThroughputBuckets(checkins: Checkin[]): { label: string; count: number }[] {
  const now = Date.now();
  return Array.from({ length: 6 }, (_, i) => {
    const bucketEnd = now - i * 10 * 60 * 1000;
    const bucketStart = bucketEnd - 10 * 60 * 1000;
    const count = checkins.filter((c) => {
      const t = new Date(c.at).getTime();
      return t >= bucketStart && t < bucketEnd && c.result === "ok";
    }).length;
    const label = new Date(bucketEnd).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { label, count };
  }).reverse();
}

/* ── Activity item type ──────────────────────────────────────────────────── */

type ActivityItem =
  | { kind: "checkin"; id: string; label: string; at: string; result: string }
  | { kind: "registration"; id: string; name: string; at: string };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/* ── Dev simulator ───────────────────────────────────────────────────────── */

const MOCK_NAMES = ["Anil Kumar", "Priya Mehta", "Sanjay Rao", "Divya Iyer", "Karan Shah", "Neha Gupta"];

function useSimulator(eventId: string, onTick: () => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [running, setRunning] = useState(false);

  function start() {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      // Create a mock OK checkin
      const passes = db.passes.filter((p) => p.eventId === eventId && p.status === "active");
      if (passes.length) {
        const pass = passes[Math.floor(Math.random() * passes.length)];
        const gates = db.gates.filter((g) => g.eventId === eventId);
        const gate = gates[Math.floor(Math.random() * gates.length)];
        if (gate) {
          db.checkins.unshift({
            id: `sim_chk_${Date.now()}`,
            eventId,
            passId: pass.id,
            gateId: gate.id,
            deviceId: db.devices[0]?.id ?? "dev_sim",
            direction: "in",
            result: "ok",
            day: 1,
            at: new Date().toISOString(),
          });
        }
      }
      onTick();
    }, 800);

    // Also simulate new registrations every 3s
    const regInterval = setInterval(() => {
      const fullName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const [firstName, ...rest] = fullName.split(" ");
      db.registrations.push({
        id: `sim_reg_${Date.now()}`,
        eventId,
        formVersionId: db.formVersions[0]?.id ?? "",
        categoryId: db.categories[0]?.id ?? "",
        firstName: firstName ?? "Sim",
        lastName: rest.join(" ") || "User",
        email: `${fullName.toLowerCase().replace(/ /g, ".")}@sim.test`,
        phone: "9999999999",
        company: "Simulated Co",
        designation: "Attendee",
        city: "Mumbai",
        state: "Maharashtra",
        gender: "male" as const,
        foodPreference: "veg" as const,
        daysAttending: [1],
        amountPaise: 0,
        status: "pending",
        source: "online",
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
      });
    }, 3000);

    (intervalRef as unknown as { _reg: ReturnType<typeof setInterval> })._reg = regInterval;
  }

  function stop() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    const cast = intervalRef as unknown as { _reg?: ReturnType<typeof setInterval> };
    if (cast._reg) { clearInterval(cast._reg); delete cast._reg; }
    setRunning(false);
  }

  useEffect(() => () => stop(), []);

  return { running, start, stop };
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function EventOverviewPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const qc = useQueryClient();

  // Tick state to force re-render when simulator adds data
  const [tick, setTick] = useState(0);
  const sim = useSimulator(eventId, () => setTick((t) => t + 1));

  /* ── Queries (5s poll) ─────────────────────────────────────────────────── */

  const { data: event, isLoading: evtLoading } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => eventService.get(eventId),
    refetchInterval: 5000,
  });

  const { data: regsPage } = useQuery({
    queryKey: [...queryKeys.registrations.list({ filters: { eventId } }), tick],
    queryFn: () => registrationService.list({ limit: 50, filters: { eventId } }),
    refetchInterval: 5000,
  });

  const { data: pendingPage } = useQuery({
    queryKey: [...queryKeys.registrations.list({ filters: { eventId, status: "pending" } }), tick],
    queryFn: () => registrationService.list({ limit: 1, filters: { eventId, status: "pending" } }),
    refetchInterval: 5000,
  });

  const { data: checkinPage } = useQuery({
    queryKey: [...queryKeys.checkins.list({ filters: { eventId } }), tick],
    queryFn: () => checkinService.list({ limit: 200, filters: { eventId } }),
    refetchInterval: 5000,
  });

  const { data: gates = [] } = useQuery({
    queryKey: queryKeys.checkins.gates(eventId),
    queryFn: () => checkinService.gates(eventId),
    refetchInterval: 5000,
  });

  const { data: devices = [] } = useQuery({
    queryKey: queryKeys.checkins.devices(eventId),
    queryFn: () => checkinService.devices(eventId),
    refetchInterval: 5000,
  });

  const { data: mealSessions = [] } = useQuery({
    queryKey: queryKeys.food.mealSessions(eventId),
    queryFn: () => foodService.mealSessions(eventId),
    refetchInterval: 5000,
  });

  /* ── Derived stats ─────────────────────────────────────────────────────── */

  const allCheckins = useMemo(() => checkinPage?.items ?? [], [checkinPage]);
  const allRegs = useMemo(() => regsPage?.items ?? [], [regsPage]);

  // "Inside now" = unique passes with at least one ok "in" checkin today
  const insideNow = useMemo(() => {
    const ins = new Set(allCheckins.filter((c) => c.result === "ok" && c.direction === "in" && c.day === 1).map((c) => c.passId));
    const outs = new Set(allCheckins.filter((c) => c.result === "ok" && c.direction === "out" && c.day === 1).map((c) => c.passId));
    return [...ins].filter((id) => !outs.has(id)).length;
  }, [allCheckins]);

  const todayRegs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allRegs.filter((r) => r.createdAt.startsWith(today)).length;
  }, [allRegs]);

  const pendingCount = pendingPage?.total ?? 0;

  const activeMeals = mealSessions.filter((ms) => ms.status === "live");
  const foodRedeemed = useMemo(() => {
    const mealIds = new Set(activeMeals.map((ms) => ms.id));
    return db.redemptions.filter((r) => mealIds.has(r.mealSessionId) && r.result === "ok").length;
  }, [activeMeals, tick]);

  const queueTotal = devices.reduce((acc, d) => acc + d.queuedScans, 0);

  // Gate occupancy bars: per-gate OK in checkins
  const gateOccupancy = useMemo(() => {
    const perGate = gates.map((g) => {
      const count = allCheckins.filter((c) => c.gateId === g.id && c.result === "ok").length;
      const peak = Math.max(count, Math.floor(Math.random() * count * 1.4 + 5)); // mock peak
      const cap = Math.max(count, 80);
      return { gate: g, count, peak, pct: Math.round((count / cap) * 100) };
    });
    return perGate;
  }, [gates, allCheckins]);

  // Throughput sparkline
  const throughputBuckets = useMemo(() => buildThroughputBuckets(allCheckins), [allCheckins]);

  // Activity ticker: last 10 events mixed
  const activityFeed = useMemo((): ActivityItem[] => {
    const checkinItems: ActivityItem[] = allCheckins.slice(0, 20).map((c) => {
      const pass = db.passes.find((p) => p.id === c.passId);
      const reg = pass ? db.registrations.find((r) => r.id === pass.registrationId) : null;
      return {
        kind: "checkin" as const,
        id: c.id,
        label: reg ? `${reg.firstName} ${reg.lastName}` : "Unknown",
        at: c.at,
        result: c.result,
      };
    });
    const regItems: ActivityItem[] = allRegs.slice(0, 10).map((r) => ({
      kind: "registration" as const,
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      at: r.createdAt,
    }));
    return [...checkinItems, ...regItems]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 12);
  }, [allCheckins, allRegs]);

  // Device strip counts
  const devOnline = devices.filter((d) => d.sync === "synced").length;
  const devOffline = devices.filter((d) => d.sync === "offline").length;

  /* Animated numbers */
  const dispInside = useAnimatedNumber(insideNow);
  const dispRegs = useAnimatedNumber(allRegs.length);
  const dispPending = useAnimatedNumber(pendingCount);
  const dispFood = useAnimatedNumber(foodRedeemed);

  const isLoading = evtLoading;

  return (
    <>
      <PageHeader
        title={event?.name ?? "Event Overview"}
        breadcrumbs={[{ label: "Events", href: "/org/events" }, { label: "Overview" }]}
        subtitle={event ? `${event.venue}, ${event.city}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            {/* Dev simulator toggle */}
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={() => sim.running ? sim.stop() : sim.start()}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-colors",
                  sim.running
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
                title="Dev: simulate live event activity"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {sim.running ? "Stop Sim" : "Simulate Day"}
              </button>
            )}
            {event && <StatusBadge status={event.status} />}
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Inside Now"
          value={String(dispInside)}
          icon={Users}
          accent="primary"
          loading={isLoading}
          hint="currently on-site"
        />
        <StatCard
          label="Registrations"
          value={String(dispRegs)}
          icon={Ticket}
          accent="success"
          loading={isLoading}
          hint="all time"
        />
        <StatCard
          label="Pending Approval"
          value={String(dispPending)}
          icon={CheckCircle2}
          accent="warning"
          loading={isLoading}
          hint="awaiting review"
        />
        <StatCard
          label={activeMeals.length ? `Food (${activeMeals.length} active)` : "Food Redeemed"}
          value={String(dispFood)}
          icon={Utensils}
          accent={activeMeals.length ? "info" : "neutral" as "info"}
          loading={isLoading}
          hint={activeMeals.length ? activeMeals.map((m) => m.name).join(", ") : "no active windows"}
        />
        <StatCard
          label="Current Queue"
          value={String(queueTotal)}
          icon={Activity}
          accent={queueTotal > 0 ? "warning" : "dark"}
          loading={isLoading}
          hint="scans pending sync"
        />
        <StatCard
          label="Alerts"
          value="0"
          icon={ShieldAlert}
          accent="dark"
          loading={isLoading}
          hint="no active alerts"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left col: gate occupancy + device strip */}
        <div className="space-y-4">
          {/* Per-gate occupancy */}
          <Card className="p-5">
            <h2 className="mb-4 font-display font-semibold text-orbit-900">Gate Occupancy</h2>
            {gateOccupancy.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <DoorOpen className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-[13px] text-slate-400">No gates configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gateOccupancy.map(({ gate, count, peak, pct }) => (
                  <div key={gate.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                      <span className="min-w-0 truncate font-medium text-slate-700">
                        {gate.name.split(" — ")[0]}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        <span className="font-semibold text-slate-800">{count}</span>
                        &thinsp;
                        <span className="text-[11px] text-slate-400">
                          (peak {peak})
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <ProgressBar
                        value={pct}
                        label={`${gate.name} occupancy ${pct}%`}
                        tone={pct >= 90 ? "danger" : pct >= 70 ? "warning" : "primary"}
                      />
                      {/* Peak marker */}
                      <div
                        className="absolute top-0 h-1.5 w-0.5 rounded bg-slate-400"
                        style={{ left: `${Math.min((peak / Math.max(count, 80)) * 100, 100)}%` }}
                        title={`Peak: ${peak}`}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{pct}% · {gate.kind}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Device strip */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-orbit-900">
              <Cpu className="h-4 w-4 text-slate-400" />
              Device Status
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Online", value: devOnline, color: "text-emerald-600", bg: "bg-emerald-50", icon: Wifi },
                { label: "Offline", value: devOffline, color: "text-slate-500", bg: "bg-slate-50", icon: WifiOff },
                { label: "Queued", value: queueTotal, color: "text-amber-600", bg: "bg-amber-50", icon: Activity },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={cn("rounded-lg p-3", bg)}>
                  <Icon className={cn("mx-auto mb-1 h-4 w-4", color)} />
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            {devices.some((d) => d.queuedScans > 0) && (
              <div className="mt-3 space-y-1.5">
                {devices.filter((d) => d.queuedScans > 0).map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-slate-600">{d.label}</span>
                    <Badge variant="warning">{d.queuedScans} queued</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Center col: throughput chart */}
        <Card className="self-start">
          <CardHeader title="Gate Throughput" subtitle="Check-ins per 10-min window (last hour)" />
          <div className="px-2 pb-4">
            <AreaChart
              categories={throughputBuckets.map((b) => b.label)}
              series={[{ name: "OK Check-ins", data: throughputBuckets.map((b) => b.count) }]}
              colors={["#2563EB"]}
              height={200}
            />
          </div>

          {/* Active meals strip */}
          {mealSessions.length > 0 && (
            <div className="border-t border-slate-100 px-5 pb-5 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Meal Windows
              </p>
              <div className="space-y-2">
                {mealSessions.slice(0, 4).map((ms) => (
                  <div key={ms.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">
                      Day {ms.day} · {ms.name}
                    </span>
                    <Badge
                      variant={
                        ms.status === "live"
                          ? "success"
                          : ms.status === "upcoming"
                            ? "primary"
                            : "neutral"
                      }
                      dot={ms.status === "live"}
                    >
                      {ms.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Right col: activity ticker */}
        <Card className="self-start">
          <CardHeader title="Live Activity" subtitle="Recent check-ins and registrations" />
          <ul className="divide-y divide-slate-100 px-5 pb-2">
            {activityFeed.length === 0 ? (
              <li className="py-8 text-center text-[13px] text-slate-400">
                No activity yet
              </li>
            ) : (
              activityFeed.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-2.5"
                >
                  <span className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                    item.kind === "checkin"
                      ? item.result === "ok"
                        ? "bg-emerald-500"
                        : "bg-red-400"
                      : "bg-orbit-500",
                  )}>
                    {item.kind === "checkin"
                      ? <DoorOpen className="h-3 w-3" />
                      : <Ticket className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-800">
                      {item.kind === "checkin" ? item.label : item.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.kind === "checkin"
                        ? item.result === "ok" ? "Checked in" : `Scan: ${item.result}`
                        : "Registered"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                    {timeAgo(item.at)}
                  </span>
                </li>
              ))
            )}
          </ul>
          {activityFeed.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">
                Polling every 5s
                {sim.running && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    Simulating
                  </span>
                )}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
