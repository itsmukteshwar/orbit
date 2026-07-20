"use client";

/**
 * SettingsTabs — vertical tab list for settings pages. Structure from the
 * Vyzor vertical-nav pattern; active state matches the Sidebar child-link
 * recipe (orbit-50 tint + semibold).
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface SettingsTabsProps {
  tabs: SettingsTab[];
  value: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SettingsTabs({ tabs, value, onChange, children, className }: SettingsTabsProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row", className)}>
      <nav aria-label="Settings sections" className="shrink-0 md:w-48 md:border-r md:border-slate-100 md:pr-4">
        <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {tabs.map((tab) => {
            const active = tab.id === value;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onChange(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] whitespace-nowrap transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-orbit-500",
                    active
                      ? "bg-orbit-50 font-semibold text-orbit-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  )}
                >
                  {tab.icon && (
                    <tab.icon className={cn("h-4 w-4", active ? "text-orbit-500" : "text-slate-400")} />
                  )}
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
