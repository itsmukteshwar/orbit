/**
 * EmptyState — layout ported from Vyzor empty.html (icon/title/body/CTA
 * centered stack); skinned with Orbit tokens.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** CTA slot — typically a kit Button. */
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
        <Icon className="h-7 w-7 text-slate-300" aria-hidden="true" />
      </span>
      <h3 className="font-display font-semibold text-orbit-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
