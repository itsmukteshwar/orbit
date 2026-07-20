import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatAccent = "primary" | "success" | "warning" | "danger" | "info" | "dark";

const ACCENT_BORDER: Record<StatAccent, string> = {
  primary: "border-l-orbit-500",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
  info: "border-l-sky-500",
  dark: "border-l-orbit-900",
};

const ACCENT_ICON: Record<StatAccent, string> = {
  primary: "bg-orbit-50 text-orbit-500",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  dark: "bg-slate-100 text-orbit-900",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: StatAccent;
  /** Optional trend chip, e.g. "+12.6%". */
  trend?: { text: string; positive: boolean };
  /** Muted context line after the trend chip. */
  hint?: string;
  /**
   * StatTile extension (P-04): numeric delta — auto-formats into the trend
   * chip ("+412" / "-3.4%"). Ignored when `trend` is provided explicitly.
   */
  delta?: { value: number; suffix?: string; positiveIsGood?: boolean };
  /** StatTile extension (P-04): renders a skeleton placeholder while data loads. */
  loading?: boolean;
}

/** KPI card with a coloured left accent border — the Orbit dashboard stat style. */
export function StatCard({ label, value, icon: Icon, accent = "primary", trend, hint, delta, loading }: StatCardProps) {
  if (loading) {
    return (
      <article className={cn("rounded-xl border-l-4 bg-white p-5 shadow-card", ACCENT_BORDER[accent])} aria-busy="true">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-100" />
          <div className="min-w-0 flex-1">
            <span className="mb-2 block h-2.5 w-24 animate-pulse rounded bg-slate-100" />
            <span className="block h-5 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </article>
    );
  }

  const resolvedTrend =
    trend ??
    (delta
      ? {
          text: `${delta.value > 0 ? "+" : ""}${delta.value.toLocaleString("en-IN")}${delta.suffix ?? ""}`,
          positive: (delta.positiveIsGood ?? true) ? delta.value >= 0 : delta.value < 0,
        }
      : undefined);

  return (
    <article className={cn("rounded-xl border-l-4 bg-white p-5 shadow-card", ACCENT_BORDER[accent])}>
      <div className="flex items-center gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", ACCENT_ICON[accent])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
          <p className="font-display text-xl font-semibold text-orbit-900">{value}</p>
        </div>
      </div>
      {(resolvedTrend || hint) && (
        <p className="mt-2 text-[12px] leading-none">
          {resolvedTrend && (
            <span
              className={cn(
                "mr-1.5 inline-block rounded-full px-1.5 py-0.5 font-semibold",
                resolvedTrend.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
              )}
            >
              {resolvedTrend.text}
            </span>
          )}
          {hint && <span className="text-slate-400">{hint}</span>}
        </p>
      )}
    </article>
  );
}
