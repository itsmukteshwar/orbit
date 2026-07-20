"use client";

/**
 * Drawer (right sheet) — structure ported from Vyzor offcanvas.html;
 * skinned with Orbit tokens. Used for record detail / quick edit.
 */

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  /** Width: "md" 420px · "lg" 480px · "xl" 560px */
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZE_CLASSES = { md: "w-[420px]", lg: "w-[480px]", xl: "w-[560px]" } as const;

export function Drawer({ open, onClose, title, subtitle, size = "lg", children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-orbit-900/40" aria-hidden="true" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex max-w-full flex-col bg-white shadow-card-hover",
          SIZE_CLASSES[size],
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5">
          <div className="min-w-0">
            <h2 className="truncate font-display font-semibold text-orbit-900">{title}</h2>
            {subtitle && <p className="truncate text-[12px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-orbit-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 p-4 px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
