"use client";

/**
 * Form primitives — pixel-identical to the field styles on /visitors/register.
 * The base input recipe is lifted verbatim from that canon page.
 */

import { forwardRef, useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Canon input recipe from /visitors/register. */
export const INPUT_CLASSES =
  "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none";

const INPUT_ERROR_CLASSES = "border-red-300 focus:border-red-300 focus:ring-red-100";

/* ── FormField wrapper ────────────────────────────────────────────────── */

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/** Label + control + hint/error. Matches canon label/hint typography. */
export function FormField({ label, required, hint, error, htmlFor, children, className }: FormFieldProps) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-[12px] text-red-500">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
      )}
    </div>
  );
}

/* ── TextInput ────────────────────────────────────────────────────────── */

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { error, className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(INPUT_CLASSES, error && INPUT_ERROR_CLASSES, className)} {...props} />;
});

/* ── Textarea ─────────────────────────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 transition focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none",
        error && INPUT_ERROR_CLASSES,
        className,
      )}
      {...props}
    />
  );
});

/* ── SelectInput ──────────────────────────────────────────────────────── */

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: Array<{ value: string; label: string } | string>;
  placeholder?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { error, options, placeholder, className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(INPUT_CLASSES, error && INPUT_ERROR_CLASSES, className)} {...props}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((opt) =>
        typeof opt === "string" ? (
          <option key={opt} value={opt}>{opt}</option>
        ) : (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ),
      )}
      {children}
    </select>
  );
});

/* ── PhoneInput (+91 prefix group, from /visitors/register) ───────────── */

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { error, className, ...props },
  ref,
) {
  return (
    <div className="flex">
      <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
        +91
      </span>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]{10}"
        className={cn(INPUT_CLASSES, "rounded-l-none", error && INPUT_ERROR_CLASSES, className)}
        {...props}
      />
    </div>
  );
});

/* ── Checkbox / Radio ─────────────────────────────────────────────────── */

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <label htmlFor={props.id ?? id} className={cn("flex items-center gap-2 text-[13px] text-slate-600", className)}>
      <input
        ref={ref}
        id={props.id ?? id}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 accent-orbit-500"
        {...props}
      />
      {label}
    </label>
  );
});

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <label htmlFor={props.id ?? id} className={cn("flex items-center gap-2 text-[13px] text-slate-600", className)}>
      <input ref={ref} id={props.id ?? id} type="radio" className="h-4 w-4 accent-orbit-500" {...props} />
      {label}
    </label>
  );
});

/** Horizontal group wrapper for Checkbox/Radio rows — canon `flex flex-wrap gap-4 pt-1`. */
export function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{label}</span>
      <div className="flex flex-wrap gap-4 pt-1">{children}</div>
    </div>
  );
}

/* ── SearchInput ──────────────────────────────────────────────────────── */

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** "sm" = h-8 filter-bar variant (canon /visitors); "md" = h-9. */
  size?: "sm" | "md";
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { size = "sm", className, ...props },
  ref,
) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{props.placeholder ?? "Search"}</span>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "w-full rounded-lg border border-slate-200 pl-8 pr-2 text-[13px] focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none",
          size === "sm" ? "h-8" : "h-9",
        )}
        {...props}
      />
    </label>
  );
});
