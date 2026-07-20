"use client";

/**
 * P-30 — Form Builder zustand store.
 * Holds the working draft schema, selection, preview mode.
 * Autosave: the builder page debounces persistDraft() into localStorage
 * (mock draft persistence — survives refresh).
 */

import { create } from "zustand";
import { keyFromLabel, type FormSchema, type SchemaField, type FormFieldType } from "@/lib/formSchema";

const DRAFT_KEY = "orbit_form_builder_draft";

export const DEFAULT_CONSENT =
  "I agree to the event terms & conditions and consent to receiving my pass via WhatsApp/email.";

function newField(type: FormFieldType, existingKeys: string[]): SchemaField {
  const labels: Record<FormFieldType, string> = {
    text: "Text Field",
    email: "Email",
    phone: "Phone Number",
    select: "Dropdown",
    radio: "Choice",
    checkbox: "Checkbox",
    date: "Date",
    file: "File Upload",
  };
  const label = labels[type];
  const field: SchemaField = {
    key: keyFromLabel(label, existingKeys),
    label,
    type,
    required: false,
  };
  if (type === "select" || type === "radio") field.options = ["Option 1", "Option 2"];
  if (type === "file") field.file = { maxSizeMb: 5, accept: ["image/jpeg", "image/png", ".pdf"] };
  return field;
}

interface BuilderState {
  schema: FormSchema;
  selectedKey: string | null;
  preview: boolean;
  previewMobile: boolean;
  dirty: boolean;
  published: boolean;

  addField(type: FormFieldType): void;
  removeField(key: string): void;
  updateField(key: string, patch: Partial<SchemaField>): void;
  moveField(from: number, to: number): void;
  select(key: string | null): void;
  setName(name: string): void;
  setConsent(text: string): void;
  togglePreview(): void;
  toggleMobile(): void;
  markSaved(): void;
  loadDraft(eventId: string): void;
  persistDraft(eventId: string): void;
  reset(eventId: string): void;
}

function blankSchema(): FormSchema {
  return {
    id: `draft_${Date.now()}`,
    name: "Untitled Form",
    version: 3,
    consentText: DEFAULT_CONSENT,
    fields: [
      { key: "first_name", label: "First Name", type: "text", required: true },
      { key: "last_name", label: "Last Name", type: "text", required: true },
      { key: "mobile", label: "Mobile Number", type: "phone", required: true },
    ],
  };
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  schema: blankSchema(),
  selectedKey: null,
  preview: false,
  previewMobile: false,
  dirty: false,
  published: false,

  addField(type) {
    set((s) => {
      const field = newField(type, s.schema.fields.map((f) => f.key));
      return {
        schema: { ...s.schema, fields: [...s.schema.fields, field] },
        selectedKey: field.key,
        dirty: true,
      };
    });
  },

  removeField(key) {
    set((s) => ({
      schema: {
        ...s.schema,
        fields: s.schema.fields
          .filter((f) => f.key !== key)
          // Drop conditions that pointed at the removed field
          .map((f) => (f.condition?.showIf === key ? { ...f, condition: undefined } : f)),
      },
      selectedKey: s.selectedKey === key ? null : s.selectedKey,
      dirty: true,
    }));
  },

  updateField(key, patch) {
    set((s) => {
      const fields = s.schema.fields.map((f) => {
        if (f.key !== key) return f;
        const next = { ...f, ...patch };
        // Auto-regenerate key from label while NOT published
        if (patch.label !== undefined && !s.published) {
          const others = s.schema.fields.filter((x) => x.key !== key).map((x) => x.key);
          next.key = keyFromLabel(patch.label, others);
        }
        return next;
      });
      // If a key changed, keep selection + rewire conditions
      const changed = fields.find((f, i) => s.schema.fields[i]?.key === key && f.key !== key);
      const rewired = changed
        ? fields.map((f) => (f.condition?.showIf === key ? { ...f, condition: { ...f.condition, showIf: changed.key } } : f))
        : fields;
      return {
        schema: { ...s.schema, fields: rewired },
        selectedKey: changed ? changed.key : s.selectedKey,
        dirty: true,
      };
    });
  },

  moveField(from, to) {
    set((s) => {
      const fields = [...s.schema.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(to, 0, moved);
      return { schema: { ...s.schema, fields }, dirty: true };
    });
  },

  select: (key) => set({ selectedKey: key }),
  setName: (name) => set((s) => ({ schema: { ...s.schema, name }, dirty: true })),
  setConsent: (text) => set((s) => ({ schema: { ...s.schema, consentText: text }, dirty: true })),
  togglePreview: () => set((s) => ({ preview: !s.preview })),
  toggleMobile: () => set((s) => ({ previewMobile: !s.previewMobile })),
  markSaved: () => set({ dirty: false }),

  loadDraft(eventId) {
    try {
      const raw = localStorage.getItem(`${DRAFT_KEY}_${eventId}`);
      if (raw) {
        const schema = JSON.parse(raw) as FormSchema;
        set({ schema, dirty: false, selectedKey: null });
      }
    } catch {
      /* corrupt draft — keep blank */
    }
  },

  persistDraft(eventId) {
    try {
      localStorage.setItem(`${DRAFT_KEY}_${eventId}`, JSON.stringify(get().schema));
      set({ dirty: false });
    } catch {
      /* storage full */
    }
  },

  reset(eventId) {
    localStorage.removeItem(`${DRAFT_KEY}_${eventId}`);
    set({ schema: blankSchema(), selectedKey: null, dirty: false, preview: false });
  },
}));
