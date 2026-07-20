"use client";

/**
 * P-30 + P-31 — Form Builder (/org/events/[eventId]/registrations/forms)
 * Left palette · dnd-kit canvas · right inspector · top bar.
 * Live Preview swaps canvas for the REAL FormRenderer (preview IS the renderer).
 * Mobile preview frame (375px) · validation lint panel · conditional rule editor.
 * Draft autosaves (debounced) to localStorage via the zustand store.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  AtSign,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Lock,
  Monitor,
  Paperclip,
  Phone,
  Save,
  Smartphone,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { FormField as KitField, TextInput, Textarea, SelectInput, Checkbox } from "@/components/kit/inputs";
import { toastSuccess } from "@/components/kit/toast";
import { FormRenderer } from "@/components/form/FormRenderer";
import { useBuilderStore } from "@/lib/builderStore";
import { lintSchema, FORM_FIELD_TYPES, type FormFieldType, type SchemaField } from "@/lib/formSchema";
import { cn } from "@/lib/utils";

/* ── Palette config ──────────────────────────────────────────────────────── */

const TYPE_META: Record<FormFieldType, { label: string; icon: React.ElementType }> = {
  text: { label: "Text", icon: Type },
  email: { label: "Email", icon: AtSign },
  phone: { label: "Phone", icon: Phone },
  select: { label: "Dropdown", icon: ChevronDown },
  radio: { label: "Choice", icon: CircleDot },
  checkbox: { label: "Checkbox", icon: CheckSquare },
  date: { label: "Date", icon: Calendar },
  file: { label: "File", icon: Paperclip },
};

/* ── Sortable canvas card ────────────────────────────────────────────────── */

function FieldCard({ field, selected, onSelect, onRemove }: {
  field: SchemaField;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key });
  const Icon = TYPE_META[field.type].icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 bg-white px-3.5 py-3 shadow-card transition-colors",
        selected ? "border-orbit-400 ring-2 ring-orbit-100" : "border-transparent hover:border-slate-200",
        isDragging && "opacity-60",
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${field.label}`}
        className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-slate-800">
          {field.label || <span className="italic text-red-400">empty label</span>}
          {field.required && <span className="text-red-400"> *</span>}
        </p>
        <p className="truncate font-mono text-[10px] text-slate-400">
          {field.key}
          {field.condition && ` · shows if ${field.condition.showIf} = "${field.condition.equals}"`}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Delete ${field.label}`}
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Inspector ───────────────────────────────────────────────────────────── */

function Inspector() {
  const { schema, selectedKey, updateField, published } = useBuilderStore();
  const field = schema.fields.find((f) => f.key === selectedKey);

  if (!field) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Type className="mb-2 h-6 w-6 text-slate-200" />
        <p className="text-[13px] text-slate-400">Select a field on the canvas to edit its properties</p>
      </div>
    );
  }

  const fieldIndex = schema.fields.findIndex((f) => f.key === field.key);
  const priorFields = schema.fields.slice(0, fieldIndex);
  const conditionSource = field.condition
    ? schema.fields.find((f) => f.key === field.condition!.showIf)
    : null;
  const sourceOptions = conditionSource?.options ?? [];

  return (
    <div className="space-y-4 p-4">
      <KitField label="Label">
        <TextInput
          value={field.label}
          onChange={(e) => updateField(field.key, { label: e.target.value })}
        />
      </KitField>

      <div>
        <p className="mb-1 flex items-center gap-2 text-[13px] font-medium text-slate-600">
          Key
          {published && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              <Lock className="h-2.5 w-2.5" /> Immutable
            </span>
          )}
        </p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-500">{field.key}</p>
        <p className="mt-1 text-[10px] text-slate-400">Auto-generated from label{published ? " — locked after publish" : ""}</p>
      </div>

      <KitField label="Help text">
        <TextInput
          value={field.help ?? ""}
          onChange={(e) => updateField(field.key, { help: e.target.value || undefined })}
          placeholder="Shown under the input"
        />
      </KitField>

      <KitField label="Placeholder">
        <TextInput
          value={field.placeholder ?? ""}
          onChange={(e) => updateField(field.key, { placeholder: e.target.value || undefined })}
        />
      </KitField>

      <Checkbox
        label="Required"
        checked={field.required}
        onChange={(e) => updateField(field.key, { required: e.target.checked })}
      />

      {field.type === "text" && (
        <Checkbox
          label="Validate as GSTIN"
          checked={!!field.gstin}
          onChange={(e) => updateField(field.key, { gstin: e.target.checked || undefined })}
        />
      )}

      {(field.type === "select" || field.type === "radio") && (
        <KitField label="Options (one per line)">
          <Textarea
            rows={4}
            value={(field.options ?? []).join("\n")}
            onChange={(e) =>
              updateField(field.key, { options: e.target.value.split("\n").filter((o) => o.trim()) })
            }
          />
        </KitField>
      )}

      {field.type === "file" && (
        <div className="grid grid-cols-2 gap-2">
          <KitField label="Max size (MB)">
            <TextInput
              type="number"
              min="1"
              value={String(field.file?.maxSizeMb ?? 5)}
              onChange={(e) =>
                updateField(field.key, {
                  file: { maxSizeMb: Number(e.target.value) || 5, accept: field.file?.accept ?? [] },
                })
              }
            />
          </KitField>
          <KitField label="Accept">
            <TextInput
              value={(field.file?.accept ?? []).join(",")}
              onChange={(e) =>
                updateField(field.key, {
                  file: { maxSizeMb: field.file?.maxSizeMb ?? 5, accept: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) },
                })
              }
              placeholder=".pdf,image/png"
            />
          </KitField>
        </div>
      )}

      {/* Conditional rule editor (P-31) */}
      <div className="border-t border-slate-100 pt-4">
        <p className="mb-2 text-[13px] font-semibold text-slate-700">Conditional visibility</p>
        {priorFields.length === 0 ? (
          <p className="text-[12px] text-slate-400">No prior fields to depend on — move this field down first.</p>
        ) : (
          <div className="space-y-2">
            <KitField label="Show only when">
              <SelectInput
                value={field.condition?.showIf ?? ""}
                onChange={(e) => {
                  const showIf = e.target.value;
                  updateField(field.key, {
                    condition: showIf ? { showIf, equals: field.condition?.equals ?? "" } : undefined,
                  });
                }}
              >
                <option value="">Always visible</option>
                {priorFields.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </SelectInput>
            </KitField>
            {field.condition && (
              <KitField label="equals">
                {sourceOptions.length > 0 ? (
                  <SelectInput
                    value={field.condition.equals}
                    onChange={(e) =>
                      updateField(field.key, { condition: { ...field.condition!, equals: e.target.value } })
                    }
                  >
                    <option value="">Pick a value…</option>
                    {sourceOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </SelectInput>
                ) : (
                  <TextInput
                    value={field.condition.equals}
                    onChange={(e) =>
                      updateField(field.key, { condition: { ...field.condition!, equals: e.target.value } })
                    }
                    placeholder="exact value"
                  />
                )}
              </KitField>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function FormBuilderPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();

  const {
    schema, selectedKey, preview, previewMobile, dirty,
    addField, removeField, moveField, select, setName,
    togglePreview, toggleMobile, loadDraft, persistDraft,
  } = useBuilderStore();

  /* Load draft on mount */
  useEffect(() => { loadDraft(eventId); }, [eventId, loadDraft]);

  /* Debounced autosave */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDraft(eventId), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [dirty, schema, eventId, persistDraft]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const from = schema.fields.findIndex((f) => f.key === active.id);
      const to = schema.fields.findIndex((f) => f.key === over.id);
      if (from !== -1 && to !== -1) moveField(from, to);
    },
    [schema.fields, moveField],
  );

  const issues = useMemo(() => lintSchema(schema), [schema]);
  const errorCount = issues.filter((i) => i.severity === "error").length;

  return (
    <>
      <PageHeader
        title={
          <input
            value={schema.name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Form name"
            className="w-full max-w-xs rounded-lg border border-transparent bg-transparent px-2 py-0.5 font-display text-xl font-semibold text-orbit-900 hover:border-slate-200 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
          />
        }
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Registrations", href: `/org/events/${eventId}/registrations` },
          { label: "Form Builder" },
        ]}
        subtitle={dirty ? "Saving draft…" : "Draft saved"}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">v{schema.version} draft</Badge>
            <Button variant="secondary" icon={History} onClick={() => router.push(`/org/events/${eventId}/registrations/forms/versions`)}>
              Versions
            </Button>
            <Button variant="secondary" icon={preview ? EyeOff : Eye} onClick={togglePreview}>
              {preview ? "Exit Preview" : "Preview"}
            </Button>
            <Button variant="secondary" icon={Save} onClick={() => { persistDraft(eventId); toastSuccess("Draft saved"); }}>
              Save Draft
            </Button>
            <Button
              variant="primary"
              icon={Upload}
              disabled={errorCount > 0}
              onClick={() => router.push(`/org/events/${eventId}/registrations/forms/versions?publish=1`)}
            >
              Publish
            </Button>
          </div>
        }
      />

      {preview ? (
        /* ── PREVIEW MODE — the real renderer ─────────────────────────── */
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => previewMobile && toggleMobile()}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium",
                !previewMobile ? "bg-orbit-500 text-white" : "border border-slate-200 bg-white text-slate-500",
              )}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => !previewMobile && toggleMobile()}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium",
                previewMobile ? "bg-orbit-500 text-white" : "border border-slate-200 bg-white text-slate-500",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile 375px
            </button>
          </div>

          <div className="flex justify-center">
            <div
              className={cn(
                "rounded-2xl bg-white p-6 shadow-card",
                previewMobile ? "w-[375px] border-8 border-slate-900 rounded-[2rem]" : "w-full max-w-xl",
              )}
            >
              <h2 className="mb-1 font-display text-lg font-bold text-orbit-900">{schema.name}</h2>
              <p className="mb-5 text-[12px] text-slate-400">Preview — behaves exactly like the public form</p>
              <FormRenderer
                schema={schema}
                compact={previewMobile}
                submitLabel="Register"
                onSubmit={() => { toastSuccess("Preview submit OK — validation passed"); }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── BUILD MODE — palette / canvas / inspector ────────────────── */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr_300px]">
          {/* Palette */}
          <div className="self-start rounded-xl bg-white p-3 shadow-card">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Field Types
            </p>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {FORM_FIELD_TYPES.map((type) => {
                const meta = TYPE_META[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addField(type)}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-left text-[12px] font-medium text-slate-600 transition-colors hover:border-orbit-200 hover:bg-orbit-50/50 hover:text-orbit-600"
                  >
                    <meta.icon className="h-3.5 w-3.5 text-slate-400" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <div className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={schema.fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
                {schema.fields.map((field) => (
                  <FieldCard
                    key={field.key}
                    field={field}
                    selected={selectedKey === field.key}
                    onSelect={() => select(field.key)}
                    onRemove={() => removeField(field.key)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {schema.fields.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-[13px] text-slate-400">
                Click a field type on the left to add it
              </div>
            )}

            {/* Consent (always last, not sortable) */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-slate-500">Consent checkbox — always last</p>
                <textarea
                  value={schema.consentText}
                  onChange={(e) => useBuilderStore.getState().setConsent(e.target.value)}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-600 focus:border-orbit-300 focus:ring-2 focus:ring-orbit-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Lint panel (P-31) */}
            {issues.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {issues.length} issue{issues.length !== 1 ? "s" : ""} found
                </p>
                <ul className="space-y-1">
                  {issues.map((issue, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-[12px]",
                        issue.severity === "error" ? "text-red-600" : "text-amber-600",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        issue.severity === "error" ? "bg-red-400" : "bg-amber-400",
                      )} />
                      {issue.message}
                      {issue.fieldKey && (
                        <button
                          type="button"
                          onClick={() => select(issue.fieldKey)}
                          className="font-medium underline decoration-dotted hover:no-underline"
                        >
                          fix
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Inspector */}
          <div className="self-start rounded-xl bg-white shadow-card">
            <p className="border-b border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Field Properties
            </p>
            <Inspector />
          </div>
        </div>
      )}
    </>
  );
}
