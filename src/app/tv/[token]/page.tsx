"use client";

/**
 * P-21 — TV Mode (/tv/[token])
 * Standalone dark-theme broadcast display. No AppShell (bypassed in AppShell.tsx).
 * Auto-fits 6 tiles across the viewport. Auto-refreshes every 10 s.
 * Token = eventId from the mock db.
 * Zero interactive elements except the fullscreen hotkey (F11).
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  DoorOpen,
  MonitorPlay,
  RefreshCw,
  ShieldAlert,
  Ticket,
  Utensils,
  Wifi,
  WifiOff,
} from "lucide-react";
import { db } from "@/services/mock/db";
import type { OrbitEvent } from "@/types/domain";

/* ── Token validation ────────────────────────────────────────────────────── */

function resolveEvent(token: string): OrbitEvent | null {
  return db.events.find((e) => e.id === token) ?? null;
}

/* ── Stats computation (direct db reads for speed) ──────────────────────── */

interface TvStats {
  insideNow: number;
  totalCheckins: number;
  totalRegistrations: number;
  pendingApprovals: number;
  foodRedeemed: number;
  queueTotal: number;
  devOnline: number;
  devOffline: number;
  okRate: number; // % of ok scans vs total scans
}

function computeStats(eventId: string): TvStats {
  const checkins = db.checkins.filter((c) => c.eventId === eventId);
  const okCheckins = checkins.filter((c) => c.result === "ok");
  const inPassIds = new Set(okCheckins.filter((c) => c.direction === "in").map((c) => c.passId));
  const outPassIds = new Set(okCheckins.filter((c) => c.direction === "out").map((c) => c.passId));
  const insideNow = [...inPassIds].filter((id) => !outPassIds.has(id)).length;

  const regs = db.registrations.filter((r) => r.eventId === eventId);
  const pending = regs.filter((r) => r.status === "pending").length;

  const mealIds = new Set(db.mealSessions.filter((ms) => ms.eventId === eventId && ms.status === "live").map((ms) => ms.id));
  const foodRedeemed = db.redemptions.filter((r) => mealIds.has(r.mealSessionId) && r.result === "ok").length;

  const gateIds = new Set(db.gates.filter((g) => g.eventId === eventId).map((g) => g.id));
  const counterIds = new Set(db.counters.filter((c) => c.eventId === eventId).map((c) => c.id));
  const devices = db.devices.filter(
    (d) => !d.revoked && ((d.gateId && gateIds.has(d.gateId)) || (d.counterId && counterIds.has(d.counterId))),
  );
  const queueTotal = devices.reduce((acc, d) => acc + d.queuedScans, 0);
  const devOnline = devices.filter((d) => d.sync === "synced").length;
  const devOffline = devices.filter((d) => d.sync === "offline").length;

  const okRate = checkins.length > 0 ? Math.round((okCheckins.length / checkins.length) * 100) : 100;

  return {
    insideNow,
    totalCheckins: okCheckins.length,
    totalRegistrations: regs.length,
    pendingApprovals: pending,
    foodRedeemed,
    queueTotal,
    devOnline,
    devOffline,
    okRate,
  };
}

/* ── Animated number ─────────────────────────────────────────────────────── */

function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    if (fromRef.current === target) return;
    const from = fromRef.current;
    const start = performance.now();
    fromRef.current = target;

    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return display;
}

/* ── TV tile ─────────────────────────────────────────────────────────────── */

interface TvTileProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red" | "slate" | "violet";
}

const ACCENT_CLASSES: Record<NonNullable<TvTileProps["accent"]>, { border: string; icon: string; value: string }> = {
  blue:   { border: "border-blue-500/30",   icon: "text-blue-400",   value: "text-white" },
  green:  { border: "border-emerald-500/30", icon: "text-emerald-400",value: "text-white" },
  amber:  { border: "border-amber-500/30",   icon: "text-amber-400",  value: "text-amber-100" },
  red:    { border: "border-red-500/30",     icon: "text-red-400",    value: "text-red-100" },
  slate:  { border: "border-slate-600/50",   icon: "text-slate-400",  value: "text-slate-200" },
  violet: { border: "border-violet-500/30",  icon: "text-violet-400", value: "text-white" },
};

function TvTile({ icon: Icon, label, value, sub, accent = "slate" }: TvTileProps) {
  const cls = ACCENT_CLASSES[accent];
  return (
    <div className={`flex flex-col justify-between rounded-3xl border bg-slate-900/80 p-8 ${cls.border}`}>
      <div className="flex items-center justify-between">
        <p className="text-[clamp(12px,1.2vw,18px)] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <Icon className={`h-[clamp(20px,2vw,32px)] w-[clamp(20px,2vw,32px)] ${cls.icon}`} />
      </div>
      <div>
        <p className={`font-display text-[clamp(48px,7vw,120px)] font-bold leading-none tabular-nums ${cls.value}`}>
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </p>
        {sub && <p className="mt-2 text-[clamp(11px,1vw,16px)] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Refresh progress bar ────────────────────────────────────────────────── */

const INTERVAL = 10; // seconds

function RefreshBar({ remaining }: { remaining: number }) {
  const pct = ((INTERVAL - remaining) / INTERVAL) * 100;
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function TvModePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const event = useMemo(() => resolveEvent(token), [token]);
  const [stats, setStats] = useState<TvStats | null>(event ? computeStats(event.id) : null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [remaining, setRemaining] = useState(INTERVAL);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!event) return;
    const eventId = event.id;

    function refresh() {
      try {
        setIsReconnecting(false);
        setStats(computeStats(eventId));
        setLastRefresh(new Date());
        setRemaining(INTERVAL);
      } catch {
        setIsReconnecting(true);
      }
    }

    refreshRef.current = setInterval(refresh, INTERVAL * 1000);
    countRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [event]);

  /* Animated values */
  const dispInside = useAnimatedNumber(stats?.insideNow ?? 0);
  const dispCheckins = useAnimatedNumber(stats?.totalCheckins ?? 0);
  const dispRegs = useAnimatedNumber(stats?.totalRegistrations ?? 0);
  const dispPending = useAnimatedNumber(stats?.pendingApprovals ?? 0);
  const dispFood = useAnimatedNumber(stats?.foodRedeemed ?? 0);
  const dispQueue = useAnimatedNumber(stats?.queueTotal ?? 0);

  /* ── Invalid token ─────────────────────────────────────────────────────── */
  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-center">
        <MonitorPlay className="mb-6 h-16 w-16 text-slate-700" />
        <h1 className="font-display text-3xl font-bold text-white">Invalid TV Link</h1>
        <p className="mt-3 text-slate-400">
          The token <code className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">{token}</code> does not match any event.
        </p>
        <p className="mt-2 text-[13px] text-slate-600">
          Generate a new TV link from the event header → TV Mode.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 p-[clamp(16px,2vw,40px)] font-sans">
      {/* Header */}
      <div className="mb-[clamp(12px,1.5vw,24px)] flex items-start justify-between gap-4">
        <div>
          <p className="text-[clamp(10px,0.9vw,13px)] font-semibold uppercase tracking-widest text-slate-600">
            Orbit Event ERP · Live
          </p>
          <h1 className="font-display text-[clamp(20px,2.5vw,40px)] font-bold text-white leading-tight mt-0.5">
            {event.name}
          </h1>
          <p className="text-[clamp(11px,1vw,15px)] text-slate-500">
            {event.venue}, {event.city}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {isReconnecting ? (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-900/20 px-3 py-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span className="text-[12px] text-amber-400">Reconnecting…</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-900/20 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[12px] text-emerald-400">Live</span>
            </div>
          )}
          <p className="text-[clamp(10px,0.8vw,12px)] text-slate-600">
            Next refresh in {remaining}s · Last:{" "}
            {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Refresh bar */}
      <div className="mb-[clamp(12px,1.5vw,24px)]">
        <RefreshBar remaining={remaining} />
      </div>

      {/* Tiles grid — auto-fit 3 cols on 1080p, 3 cols on 4K */}
      <div className="grid flex-1 grid-cols-2 gap-[clamp(8px,1vw,20px)] lg:grid-cols-3">
        <TvTile
          icon={DoorOpen}
          label="Inside Now"
          value={dispInside}
          sub="visitors currently on-site"
          accent="blue"
        />
        <TvTile
          icon={CheckCircle2}
          label="Check-ins Today"
          value={dispCheckins}
          sub="successful gate scans"
          accent="green"
        />
        <TvTile
          icon={Ticket}
          label="Registered"
          value={dispRegs}
          sub="total registrations"
          accent="violet"
        />
        <TvTile
          icon={Activity}
          label="Pending Approval"
          value={dispPending}
          sub={dispPending === 0 ? "all clear" : "awaiting review"}
          accent={dispPending > 0 ? "amber" : "slate"}
        />
        <TvTile
          icon={Utensils}
          label="Food Redeemed"
          value={dispFood}
          sub="active meal windows"
          accent="green"
        />
        <TvTile
          icon={dispQueue > 0 ? WifiOff : Wifi}
          label={dispQueue > 0 ? "Queue Backlog" : "Devices Online"}
          value={dispQueue > 0 ? dispQueue : stats?.devOnline ?? 0}
          sub={
            dispQueue > 0
              ? "scans pending upload"
              : `of ${(stats?.devOnline ?? 0) + (stats?.devOffline ?? 0)} total devices`
          }
          accent={dispQueue > 0 ? "red" : "green"}
        />
      </div>

      {/* Footer */}
      <div className="mt-[clamp(12px,1.5vw,24px)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${(stats?.okRate ?? 100) >= 90 ? "bg-emerald-400" : "bg-amber-400"}`} />
          <p className="text-[clamp(10px,0.8vw,13px)] text-slate-600">
            Scan OK rate: <span className="text-slate-400 font-semibold">{stats?.okRate ?? 100}%</span>
          </p>
        </div>
        <p className="text-[clamp(10px,0.8vw,13px)] text-slate-700">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
