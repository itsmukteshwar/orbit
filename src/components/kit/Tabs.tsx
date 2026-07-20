"use client";

/**
 * Tabs — horizontal tab bar. Structure ported from Vyzor navs_tabs.html;
 * active state uses the Orbit underline recipe.
 */

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 border-b border-slate-200", className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px flex h-10 items-center gap-2 border-b-2 px-3.5 text-[13px] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-orbit-500",
              active
                ? "border-orbit-500 font-semibold text-orbit-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
