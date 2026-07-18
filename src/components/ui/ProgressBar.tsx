import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label: string;
  tone?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_CLASSES = {
  primary: "bg-orbit-500",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  danger: "bg-red-400",
} as const;

/** Slim accessible progress bar. */
export function ProgressBar({ value, label, tone = "primary", className }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full rounded-full bg-slate-100", className)}
    >
      <div className={cn("h-1.5 rounded-full", TONE_CLASSES[tone])} style={{ width: `${value}%` }} />
    </div>
  );
}
