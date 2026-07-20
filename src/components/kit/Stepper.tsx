/**
 * Stepper — horizontal wizard progression. Structure ported from Vyzor
 * form_wizards.html; skinned with Orbit tokens. Used by import + onboarding.
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  /** Index of the current step (0-based). */
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-0", className)}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2.5">
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                  done && "bg-orbit-500 text-white",
                  active && "border-2 border-orbit-500 bg-white text-orbit-500",
                  !done && !active && "border border-slate-200 bg-white text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="hidden sm:block">
                <span
                  className={cn(
                    "block text-[13px] leading-tight",
                    active ? "font-semibold text-orbit-900" : done ? "font-medium text-slate-700" : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
                {step.description && <span className="block text-[11px] text-slate-400">{step.description}</span>}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("mx-3 h-px flex-1", done ? "bg-orbit-500" : "bg-slate-200")} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
