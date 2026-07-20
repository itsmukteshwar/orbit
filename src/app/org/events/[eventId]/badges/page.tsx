"use client";

/**
 * P-37 — Badges → Templates (/org/events/[eventId]/badges)
 * Gallery of 8 fixed templates · per-category assignment grid · field mapping
 * toggles per template · sponsor strip upload · live preview with a sample
 * registration per category (switching category updates instantly).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  Image as ImageIcon,
  LayoutTemplate,
  Printer,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/kit/Button";
import { SelectInput, Checkbox } from "@/components/kit/inputs";
import { toastSuccess } from "@/components/kit/toast";
import { cn } from "@/lib/utils";
import { db } from "@/services/mock/db";
import { useBadgeStore, defaultTemplateFor } from "@/lib/badgeStore";
import {
  BADGE_TEMPLATES,
  BADGE_FIELD_LABELS,
  DEFAULT_FIELD_CONFIG,
  templateById,
  type BadgeFieldConfig,
  type BadgeTemplateId,
} from "@/components/badge/templates";
import { BadgeScaled } from "@/components/badge/BadgePrint";
import { badgeDataFor, sampleRegistrationFor } from "@/components/badge/badgeData";

export default function BadgeTemplatesPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();

  const store = useBadgeStore();
  useEffect(() => store.load(eventId), [eventId, store]);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);

  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplateId>("classic");
  const [previewCategoryId, setPreviewCategoryId] = useState<string>(categories[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  /** Effective template for a category: explicit assignment else heuristic. */
  const templateFor = (categoryId: string): BadgeTemplateId => {
    const cat = categories.find((c) => c.id === categoryId);
    return store.assignments[categoryId] ?? defaultTemplateFor(cat?.name ?? "");
  };

  const previewTemplateId = previewCategoryId ? templateFor(previewCategoryId) : "classic";
  const previewFields: BadgeFieldConfig = store.fieldConfig[previewTemplateId] ?? DEFAULT_FIELD_CONFIG;

  const previewData = useMemo(() => {
    if (!previewCategoryId) return null;
    const reg = sampleRegistrationFor(eventId, previewCategoryId);
    if (!reg) return null;
    const data = badgeDataFor(reg, store.sponsorStripUrl);
    // Force the preview category (sample reg may be from a fallback category)
    const cat = categories.find((c) => c.id === previewCategoryId);
    if (cat) {
      data.categoryName = cat.name;
      data.categoryHex =
        { primary: "#2563eb", secondary: "#7c3aed", warning: "#d97706", info: "#0284c7", danger: "#dc2626", success: "#059669", neutral: "#475569" }[cat.color] ?? "#2563eb";
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewCategoryId, eventId, store.sponsorStripUrl, categories]);

  function handleSponsorFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      store.setSponsorStrip(String(reader.result));
      toastSuccess("Sponsor strip updated — visible on templates with a strip slot");
    };
    reader.readAsDataURL(file);
  }

  const selectedDef = templateById(selectedTemplate);
  const selectedFields = store.fieldConfig[selectedTemplate] ?? DEFAULT_FIELD_CONFIG;

  return (
    <>
      <PageHeader
        title="Badge Templates"
        breadcrumbs={[{ label: "Events", href: "/org/events" }, { label: "Badges" }]}
        subtitle="Assign a template per category and configure printed fields"
        actions={
          <Button
            variant="secondary"
            icon={Printer}
            onClick={() => router.push(`/org/events/${eventId}/badges/print-queue`)}
          >
            Print Queue
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Gallery */}
          <Card>
            <CardHeader title="Template Gallery" subtitle="8 fixed layouts — click to configure fields" />
            <div className="grid grid-cols-2 gap-4 p-5 pt-2 sm:grid-cols-3 lg:grid-cols-4">
              {BADGE_TEMPLATES.map((tpl) => {
                const active = tpl.id === selectedTemplate;
                const sample = previewData ?? {
                  name: "Ananya Sharma",
                  company: "Shakti Pumps",
                  city: "Indore",
                  designation: "Sales Head",
                  categoryName: "Trade Visitor",
                  categoryHex: "#2563eb",
                  badgeNo: "MT26-0042",
                  qrToken: "sample",
                  eventName: "Malwa Trade Expo 2026",
                  eventDates: "21–23 Jul 2026",
                  sponsorStripUrl: store.sponsorStripUrl,
                };
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
                      active ? "border-orbit-400 bg-orbit-50/50 ring-2 ring-orbit-100" : "border-slate-200 hover:border-orbit-200",
                    )}
                  >
                    <BadgeScaled
                      item={{
                        data: sample,
                        templateId: tpl.id,
                        fields: store.fieldConfig[tpl.id] ?? DEFAULT_FIELD_CONFIG,
                      }}
                      format={tpl.format === "thermal" ? "thermal" : "a6"}
                      targetWidthPx={tpl.format === "thermal" ? 130 : 96}
                    />
                    <div>
                      <p className={cn("text-[12px] font-semibold", active ? "text-orbit-600" : "text-slate-700")}>
                        {tpl.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{tpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Category assignment grid */}
          <Card>
            <CardHeader title="Category Assignment" subtitle="Which template each visitor category prints with" />
            <ul className="divide-y divide-slate-100 px-5 pb-4">
              {categories.map((cat) => {
                const assigned = templateFor(cat.id);
                return (
                  <li key={cat.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            { primary: "#2563eb", secondary: "#7c3aed", warning: "#d97706", info: "#0284c7", danger: "#dc2626", success: "#059669", neutral: "#475569" }[cat.color],
                        }}
                      />
                      <span className="text-[13px] font-medium text-slate-700">{cat.name}</span>
                      {!store.assignments[cat.id] && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">auto</span>
                      )}
                    </div>
                    <SelectInput
                      value={assigned}
                      onChange={(e) => {
                        store.assign(cat.id, e.target.value as BadgeTemplateId);
                        setPreviewCategoryId(cat.id);
                      }}
                      className="w-52"
                      options={BADGE_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Field mapping + sponsor strip */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader
                title="Field Mapping"
                subtitle={`Slots printed on “${selectedDef.name}”`}
              />
              <div className="space-y-2.5 px-5 pb-5">
                {(Object.keys(BADGE_FIELD_LABELS) as (keyof BadgeFieldConfig)[]).map((field) => (
                  <Checkbox
                    key={field}
                    label={BADGE_FIELD_LABELS[field]}
                    checked={selectedFields[field]}
                    onChange={() => store.toggleField(selectedTemplate, field)}
                  />
                ))}
                <p className="pt-1 text-[11px] text-slate-400">
                  Toggles apply everywhere “{selectedDef.name}” is assigned.
                </p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Sponsor Strip" subtitle="Optional banner above the category strip" />
              <div className="px-5 pb-5">
                {store.sponsorStripUrl ? (
                  <div className="space-y-3">
                    <div className="h-14 overflow-hidden rounded-lg ring-1 ring-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={store.sponsorStripUrl} alt="Sponsor strip" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" icon={ImageIcon} onClick={() => fileRef.current?.click()}>
                        Replace
                      </Button>
                      <Button variant="ghost" icon={Trash2} onClick={() => store.setSponsorStrip(null)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 transition-colors hover:border-orbit-300 hover:text-orbit-500"
                  >
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[12px] font-medium">Upload strip image</span>
                    <span className="text-[10px]">Wide banner, e.g. 1000 × 120 px</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSponsorFile(f); }}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* ── Right column: live preview ──────────────────────────────────── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader title="Live Preview" subtitle="Sample registration from the selected category" />
            <div className="px-5 pb-5">
              <SelectInput
                value={previewCategoryId}
                onChange={(e) => setPreviewCategoryId(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                className="mb-4 w-full"
              />
              {previewData ? (
                <div className="flex flex-col items-center gap-3">
                  <BadgeScaled
                    item={{ data: previewData, templateId: previewTemplateId, fields: previewFields }}
                    format={templateById(previewTemplateId).format === "thermal" ? "thermal" : "a6"}
                    targetWidthPx={300}
                  />
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {templateById(previewTemplateId).name} · updates instantly on category switch
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-300">
                  <LayoutTemplate className="h-8 w-8" />
                  <p className="text-[12px]">No approved registration to preview</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
