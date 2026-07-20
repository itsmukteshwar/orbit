"use client";

/** CopyField + KbdHint + PasswordStrengthMeter — small utility components. */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── PasswordStrengthMeter ────────────────────────────────────────────────── */

function calcStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const BAR_CLS = ["", "bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-emerald-500"] as const;
const LBL_CLS = ["", "text-red-500", "text-amber-500", "text-yellow-600", "text-emerald-600"] as const;

/** Password strength bar + label. Renders nothing when password is empty. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = calcStrength(password);
  if (!password) return null;
  const missing = [
    !/[A-Z]/.test(password) && "uppercase letter",
    !/[0-9]/.test(password) && "number",
    !/[^A-Za-z0-9]/.test(password) && "symbol",
  ].filter(Boolean);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              n <= score ? BAR_CLS[score] : "bg-slate-100",
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", LBL_CLS[score])}>
        {LABELS[score]}
        {score < 4 && missing.length > 0 && (
          <span className="ml-1 font-normal text-slate-400">— add {missing.join(", ")}</span>
        )}
      </p>
    </div>
  );
}

/* ── CopyField ────────────────────────────────────────────────────────── */

interface CopyFieldProps {
  value: string;
  label?: string;
  /** Mask the middle of the value (tokens, keys). */
  masked?: boolean;
  className?: string;
}

export function CopyField({ value, label, masked, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const display = masked && value.length > 12
    ? `${value.slice(0, 6)}••••••${value.slice(-4)}`
    : value;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={cn("block", className)}>
      {label && <span className="mb-1 block text-[13px] font-medium text-slate-600">{label}</span>}
      <div className="flex">
        <code className="flex h-9 min-w-0 flex-1 items-center truncate rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 font-sans text-[13px] text-slate-600">
          {display}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-orbit-500"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ── KbdHint ──────────────────────────────────────────────────────────── */

/** Keyboard shortcut hint, e.g. <KbdHint keys={["⌘", "K"]} /> */
export function KbdHint({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {keys.map((k) => (
        <kbd
          key={k}
          className="flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 font-sans text-[10px] font-medium text-slate-400"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
