/**
 * FormSection — the /visitors/register fieldset pattern as a component:
 * icon + legend, border-t separator between sections, gap-3 field grid.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  /** false for the first section of a form (no top border). */
  divider?: boolean;
  /** Field grid columns at md+. */
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

const COLS = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3" } as const;

export function FormSection({ icon: Icon, title, divider = true, columns = 2, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn(divider && "border-t border-slate-100 pt-5", className)}>
      <legend className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
        <Icon className="h-4 w-4 text-orbit-500" /> {title}
      </legend>
      <div className={cn("grid grid-cols-1 gap-3", COLS[columns])}>{children}</div>
    </fieldset>
  );
}

/** Form action bar — canon /visitors/register bottom row. */
export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5", className)}>
      {children}
    </div>
  );
}
