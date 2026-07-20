"use client";

/**
 * P-29 — FormRenderer
 * Renders a FormSchema with react-hook-form + zod generated from the schema.
 * Handles conditional visibility, phone/GSTIN validators, file constraints,
 * and the consent checkbox (always last). The builder preview uses this SAME
 * component — "preview IS the renderer".
 */

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, X } from "lucide-react";
import {
  buildZodSchema,
  defaultValues,
  isFieldVisible,
  type FormSchema,
  type SchemaField,
} from "@/lib/formSchema";
import { cn } from "@/lib/utils";

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  /** Compact spacing for narrow (mobile-frame) previews. */
  compact?: boolean;
  disabled?: boolean;
}

export function FormRenderer({ schema, onSubmit, submitLabel = "Submit", compact, disabled }: FormRendererProps) {
  const defaults = useMemo(() => defaultValues(schema), [schema]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    // Re-resolve against live values so conditional fields validate correctly
    resolver: async (values, ctx, opts) =>
      zodResolver(buildZodSchema(schema, values) as never)(values, ctx, opts),
    defaultValues: defaults,
  });

  const values = watch();

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      className={cn("space-y-4", compact && "space-y-3")}
      noValidate
    >
      {schema.fields.map((field) => {
        if (!isFieldVisible(field, values)) return null;
        const error = errors[field.key]?.message as string | undefined;
        return (
          <FieldControl
            key={field.key}
            field={field}
            register={register}
            control={control}
            error={error}
            compact={compact}
            disabled={disabled}
          />
        );
      })}

      {/* Consent — ALWAYS last */}
      <label className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3",
        errors.__consent ? "border-red-200 bg-red-50/40" : "border-slate-200",
      )}>
        <input
          type="checkbox"
          {...register("__consent")}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-orbit-500"
        />
        <span className="text-[12px] leading-relaxed text-slate-600">{schema.consentText}</span>
      </label>
      {errors.__consent && (
        <p className="text-[12px] text-red-500">{errors.__consent.message as string}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="h-11 w-full rounded-lg bg-orbit-500 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-orbit-600 disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}

/* ── Individual field control ────────────────────────────────────────────── */

function FieldControl({
  field,
  register,
  control,
  error,
  compact,
  disabled,
}: {
  field: SchemaField;
  register: ReturnType<typeof useForm<Record<string, unknown>>>["register"];
  control: ReturnType<typeof useForm<Record<string, unknown>>>["control"];
  error?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const inputClass = cn(
    "w-full rounded-lg border px-3 text-[13px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-colors",
    compact ? "h-9" : "h-10",
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-orbit-300 focus:ring-orbit-100",
  );

  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium text-slate-600">
        {field.label}
        {field.required && <span className="text-red-400"> *</span>}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          {...register(field.key)}
          placeholder={field.placeholder ?? (field.gstin ? "22AAAAA0000A1Z5" : undefined)}
          disabled={disabled}
          className={cn(inputClass, field.gstin && "font-mono uppercase")}
        />
      )}

      {field.type === "email" && (
        <input type="email" {...register(field.key)} placeholder={field.placeholder ?? "you@example.com"} disabled={disabled} className={inputClass} />
      )}

      {field.type === "phone" && (
        <div className="flex">
          <span className={cn(
            "flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-400",
            compact ? "h-9" : "h-10",
          )}>
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            {...register(field.key)}
            placeholder={field.placeholder ?? "98765 43210"}
            disabled={disabled}
            className={cn(inputClass, "rounded-l-none")}
          />
        </div>
      )}

      {field.type === "date" && (
        <input type="date" {...register(field.key)} disabled={disabled} className={inputClass} />
      )}

      {field.type === "select" && (
        <select {...register(field.key)} disabled={disabled} className={cn(inputClass, "bg-white")}>
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-600 transition-colors has-[:checked]:border-orbit-300 has-[:checked]:bg-orbit-50/60 has-[:checked]:text-orbit-700"
            >
              <input type="radio" value={o} {...register(field.key)} disabled={disabled} className="accent-orbit-500" />
              {o}
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-slate-600">
          <input type="checkbox" {...register(field.key)} disabled={disabled} className="h-4 w-4 rounded border-slate-300 accent-orbit-500" />
          {field.placeholder ?? "Yes"}
        </label>
      )}

      {field.type === "file" && (
        <Controller
          name={field.key}
          control={control}
          render={({ field: rhf }) => <FileInput field={field} value={rhf.value as File | null} onChange={rhf.onChange} disabled={disabled} error={!!error} compact={compact} />}
        />
      )}

      {field.help && !error && <p className="mt-1 text-[11px] text-slate-400">{field.help}</p>}
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

/* ── File input ──────────────────────────────────────────────────────────── */

function FileInput({
  field,
  value,
  onChange,
  disabled,
  error,
  compact,
}: {
  field: SchemaField;
  value: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
  error?: boolean;
  compact?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const acceptAttr = field.file?.accept.join(",");

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">{value.name}</span>
        <span className="shrink-0 text-[11px] text-slate-400">{(value.size / 1024).toFixed(0)} KB</span>
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => onChange(null)}
          className="rounded p-0.5 text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onChange(f);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors",
        compact ? "py-3" : "py-5",
        dragOver ? "border-orbit-400 bg-orbit-50/40" : error ? "border-red-200" : "border-slate-200 hover:border-orbit-300",
      )}
    >
      <Paperclip className="mb-1 h-4 w-4 text-slate-300" />
      <span className="text-[12px] text-slate-500">Drop file or click to browse</span>
      <span className="text-[10px] text-slate-400">
        {field.file ? `Max ${field.file.maxSizeMb} MB · ${field.file.accept.join(", ")}` : "Max 5 MB"}
      </span>
      <input
        type="file"
        accept={acceptAttr}
        disabled={disabled}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
