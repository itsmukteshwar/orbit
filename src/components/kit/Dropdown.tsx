"use client";

/**
 * Dropdown menu — follows the EventSwitcher popover recipe exactly
 * (same border, radius, shadow-card-hover, row states).
 */

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface DropdownProps {
  /** The trigger element — receives open state via render prop. */
  trigger: (open: boolean) => React.ReactNode;
  items: (DropdownItem | "separator")[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card-hover",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) =>
            item === "separator" ? (
              <div key={`sep-${i}`} className="my-1 border-t border-slate-100" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                  item.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                {item.icon && <item.icon className={cn("h-4 w-4", item.danger ? "text-red-500" : "text-slate-400")} />}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
