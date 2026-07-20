"use client";

/**
 * Toast conventions — wraps sonner with Orbit patterns.
 * Styling lives in the Toaster config (src/app/providers.tsx).
 *
 * Convention (PROJECT-CONTEXT §5): saves are optimistic; on mock failure the
 * mutation must roll back and show `toastError` with a Retry action.
 */

import { toast as sonner } from "sonner";

export const toastSuccess = (title: string, description?: string) =>
  sonner.success(title, { description });

export const toastError = (title: string, opts?: { description?: string; onRetry?: () => void }) =>
  sonner.error(title, {
    description: opts?.description,
    action: opts?.onRetry ? { label: "Retry", onClick: opts.onRetry } : undefined,
  });

export const toastWarning = (title: string, description?: string) =>
  sonner.warning(title, { description });

export const toastInfo = (title: string, description?: string) =>
  sonner.info(title, { description });

/** Optimistic-save helper: success toast with an Undo action. */
export const toastUndo = (title: string, onUndo: () => void, description?: string) =>
  sonner.success(title, {
    description,
    action: { label: "Undo", onClick: onUndo },
    duration: 6000,
  });
