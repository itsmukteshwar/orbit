/**
 * Skeleton loaders — the only permitted loading pattern (no spinners).
 * Matches the ApexChart placeholder recipe: animate-pulse + slate tint.
 */

import { cn } from "@/lib/utils";

/** Generic skeleton block. Compose with height/width utilities. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} aria-hidden="true" />;
}

/** Full-card placeholder (matches chart loading state). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-white p-5 shadow-card", className)}>
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="mb-4 h-3 w-56" />
      <Skeleton className="h-[220px] w-full bg-slate-50" />
    </div>
  );
}

/** Table skeleton rows: pass column count + row count. */
export function SkeletonRows({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: columns }, (_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={cn("h-3.5", c === 0 ? "w-24" : c % 3 === 1 ? "w-32" : "w-16")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** StatCard-shaped skeleton. */
export function SkeletonStat() {
  return (
    <div className="rounded-xl border-l-4 border-l-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-2.5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}
