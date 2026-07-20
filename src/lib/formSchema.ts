/**
 * P-29 — FormSchema types (Blueprint §5.2)
 * The single source of truth for registration form definitions.
 * 8 field types · options · required · help text · conditional rules.
 * Consumed by FormRenderer (public forms) and the Form Builder.
 */

import { z } from "zod";

/* ── Field types (8 per Blueprint §5.2) ─────────────────────────────────── */

export const FORM_FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "select",
  "radio",
  "checkbox",
  "date",
  "file",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

/* ── Conditional visibility rule ────────────────────────────────────────── */

export interface ConditionalRule {
  /** Key of an earlier field whose value controls visibility. */
  showIf: string;
  /** Field is visible only when the controlling field equals this value. */
  equals: string;
}

/* ── Field definition ───────────────────────────────────────────────────── */

export interface SchemaField {
  /** Stable machine key — auto-generated from label, immutable once published. */
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  /** Help text shown under the input. */
  help?: string;
  placeholder?: string;
  /** For select / radio. */
  options?: string[];
  /** Conditional visibility. */
  condition?: ConditionalRule;
  /** text-only: validate as GSTIN. */
  gstin?: boolean;
  /** file-only constraints. */
  file?: { maxSizeMb: number; accept: string[] };
}

export interface FormSchema {
  id: string;
  name: string;
  version: number;
  fields: SchemaField[];
  /** Consent text — rendered as a required checkbox, ALWAYS last. */
  consentText: string;
}

/* ── Validators ─────────────────────────────────────────────────────────── */

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Full GSTIN mod-36 checksum validation. */
export function gstinChecksumValid(gstin: string): boolean {
  if (!GSTIN_REGEX.test(gstin)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = GSTIN_CHARS.indexOf(gstin[i]);
    const factor = i % 2 === 0 ? 1 : 2;
    const product = value * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const checksum = (36 - (sum % 36)) % 36;
  return GSTIN_CHARS[checksum] === gstin[14];
}

/* ── Zod generation ─────────────────────────────────────────────────────── */

/**
 * Builds a zod schema from a FormSchema. File fields validate a `File | null`;
 * checkbox fields are boolean; everything else is string.
 * Conditional fields are validated only when visible — pass current values.
 */
export function buildZodSchema(schema: FormSchema, values: Record<string, unknown>) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of schema.fields) {
    const visible = isFieldVisible(field, values);
    if (!visible) {
      shape[field.key] = z.any().optional();
      continue;
    }

    switch (field.type) {
      case "email": {
        let s = z.string().trim();
        shape[field.key] = field.required
          ? s.min(1, `${field.label} is required`).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email")
          : s.regex(/^$|^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email").optional().or(z.literal(""));
        break;
      }
      case "phone": {
        const s = z.string().trim();
        shape[field.key] = field.required
          ? s.regex(PHONE_REGEX, "Enter a valid 10-digit Indian mobile number")
          : s.regex(PHONE_REGEX, "Enter a valid 10-digit Indian mobile number").optional().or(z.literal(""));
        break;
      }
      case "checkbox": {
        shape[field.key] = field.required
          ? z.boolean().refine((v) => v === true, `${field.label} must be checked`)
          : z.boolean().optional();
        break;
      }
      case "date": {
        const s = z.string();
        shape[field.key] = field.required ? s.min(1, `${field.label} is required`) : s.optional().or(z.literal(""));
        break;
      }
      case "select":
      case "radio": {
        const s = z.string();
        shape[field.key] = field.required
          ? s.min(1, `Select ${field.label.toLowerCase()}`)
          : s.optional().or(z.literal(""));
        break;
      }
      case "file": {
        const max = (field.file?.maxSizeMb ?? 5) * 1024 * 1024;
        const accept = field.file?.accept ?? [];
        let s = z
          .instanceof(File)
          .refine((f) => f.size <= max, `File must be under ${field.file?.maxSizeMb ?? 5} MB`)
          .refine(
            (f) => accept.length === 0 || accept.some((a) => f.type === a || f.name.toLowerCase().endsWith(a)),
            `Allowed: ${accept.join(", ")}`,
          );
        shape[field.key] = field.required ? s : s.nullable().optional();
        break;
      }
      default: {
        // text
        let s = z.string().trim();
        if (field.gstin) {
          shape[field.key] = field.required
            ? s.refine(gstinChecksumValid, "Invalid GSTIN (format or checksum)")
            : s.refine((v) => v === "" || gstinChecksumValid(v), "Invalid GSTIN (format or checksum)").optional().or(z.literal(""));
        } else {
          shape[field.key] = field.required ? s.min(1, `${field.label} is required`) : s.optional().or(z.literal(""));
        }
      }
    }
  }

  // Consent — always required, always last
  shape.__consent = z.boolean().refine((v) => v === true, "You must accept to continue");

  return z.object(shape);
}

/** Evaluates a field's conditional rule against current values. */
export function isFieldVisible(field: SchemaField, values: Record<string, unknown>): boolean {
  if (!field.condition) return true;
  return String(values[field.condition.showIf] ?? "") === field.condition.equals;
}

/** Auto-generates a machine key from a label: "Company Name" → "company_name". */
export function keyFromLabel(label: string, existing: string[]): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field";
  let key = base;
  let n = 2;
  while (existing.includes(key)) {
    key = `${base}_${n}`;
    n += 1;
  }
  return key;
}

/** Default values object for a schema (rhf initialisation). */
export function defaultValues(schema: FormSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema.fields) {
    out[f.key] = f.type === "checkbox" ? false : f.type === "file" ? null : "";
  }
  out.__consent = false;
  return out;
}

/* ── Lint (used by builder validation panel) ────────────────────────────── */

export interface LintIssue {
  severity: "error" | "warning";
  fieldKey: string | null;
  message: string;
}

export function lintSchema(schema: FormSchema): LintIssue[] {
  const issues: LintIssue[] = [];
  const keys = schema.fields.map((f) => f.key);

  schema.fields.forEach((f, i) => {
    if (!f.label.trim()) {
      issues.push({ severity: "error", fieldKey: f.key, message: `Field ${i + 1} has an empty label` });
    }
    if (keys.filter((k) => k === f.key).length > 1) {
      issues.push({ severity: "error", fieldKey: f.key, message: `Duplicate key "${f.key}"` });
    }
    if ((f.type === "select" || f.type === "radio") && (!f.options || f.options.length < 2)) {
      issues.push({ severity: "warning", fieldKey: f.key, message: `"${f.label}" needs at least 2 options` });
    }
    if (f.condition) {
      const targetIndex = schema.fields.findIndex((x) => x.key === f.condition!.showIf);
      if (targetIndex === -1) {
        issues.push({ severity: "error", fieldKey: f.key, message: `"${f.label}" references missing field "${f.condition.showIf}"` });
      } else if (targetIndex >= i) {
        issues.push({ severity: "error", fieldKey: f.key, message: `"${f.label}" can only depend on fields ABOVE it` });
      }
    }
  });

  if (!schema.consentText.trim()) {
    issues.push({ severity: "warning", fieldKey: null, message: "Consent text is empty" });
  }

  return issues;
}
