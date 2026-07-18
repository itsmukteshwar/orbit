import { cn } from "@/lib/utils";

export type BadgeVariant = "primary" | "success" | "warning" | "danger" | "info" | "secondary" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary: "bg-orbit-50 text-orbit-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  secondary: "bg-violet-50 text-violet-600",
  neutral: "bg-slate-100 text-slate-500",
};

interface BadgeProps {
  variant?: BadgeVariant;
  /** Show a small status dot before the label. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Soft-tinted pill badge used for statuses and counts. */
export function Badge({ variant = "primary", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
