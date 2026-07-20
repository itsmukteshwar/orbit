"use client";

/**
 * Modal — centered dialog. Structure ported from Vyzor modals_closes.html
 * (dialog/backdrop/header/footer skeleton); skinned entirely with Orbit tokens.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
  /** Footer slot — action buttons. */
  footer?: React.ReactNode;
}

const SIZE_CLASSES = { md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" } as const;

export function Modal({ open, onClose, title, subtitle, size = "lg", children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-orbit-900/50" aria-hidden="true" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn("relative w-full rounded-xl bg-white shadow-card-hover", SIZE_CLASSES[size])}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-display font-semibold text-orbit-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-orbit-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 px-5">{footer}</div>
        )}
      </div>
    </div>
  );
}
