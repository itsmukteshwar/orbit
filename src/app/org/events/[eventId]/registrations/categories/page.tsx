"use client";

/**
 * P-28 — Visitor Categories (/org/events/[eventId]/registrations/categories)
 * Sortable list · color dot · count/cap · meal-entitlement summary ·
 * add/edit drawer sheet · guarded delete (blocks when registrations exist).
 */

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Lightbulb,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/kit/Button";
import { Drawer } from "@/components/kit/Drawer";
import { EmptyState } from "@/components/kit/EmptyState";
import { ConfirmDialog } from "@/components/kit/ConfirmDialog";
import { FormField, TextInput, SelectInput } from "@/components/kit/inputs";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { db } from "@/services/mock/db";
import { runtimeId } from "@/services/mock/util";
import { cn, formatPaise } from "@/lib/utils";
import type { VisitorCategory } from "@/types/domain";

/* ── Palette ─────────────────────────────────────────────────────────────── */

const COLORS: { value: VisitorCategory["color"]; dot: string; label: string }[] = [
  { value: "primary", dot: "bg-orbit-500", label: "Blue" },
  { value: "secondary", dot: "bg-violet-500", label: "Violet" },
  { value: "success", dot: "bg-emerald-500", label: "Green" },
  { value: "warning", dot: "bg-amber-400", label: "Amber" },
  { value: "danger", dot: "bg-red-400", label: "Red" },
  { value: "info", dot: "bg-sky-400", label: "Sky" },
  { value: "neutral", dot: "bg-slate-400", label: "Grey" },
];

const BADGE_TEMPLATES = ["Standard Visitor", "VIP Gold", "Exhibitor Staff"];

/* ── Schema ──────────────────────────────────────────────────────────────── */

const catSchema = z.object({
  name: z.string().min(2, "Name required"),
  color: z.enum(["primary", "secondary", "success", "warning", "danger", "info", "neutral"] as const),
  badgeTemplate: z.string(),
  approvalMode: z.enum(["auto", "manual"] as const),
  maxPerDay: z.string().optional(),
  priceRupees: z.string().optional(),
});
type CatInput = z.infer<typeof catSchema>;

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function CategoriesPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const qc = useQueryClient();

  const [version, setVersion] = useState(0); // bump to re-read db
  const [sortAlpha, setSortAlpha] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<VisitorCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VisitorCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const categories = useMemo(() => {
    const list = db.categories.filter((c) => c.eventId === eventId);
    return sortAlpha ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
  }, [eventId, sortAlpha, version]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    db.registrations.forEach((r) => {
      if (r.eventId === eventId) map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + 1);
    });
    return map;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [eventId, version]);

  const mealEntitlements = useMemo(() => {
    const map = new Map<string, string[]>();
    db.mealSessions
      .filter((ms) => ms.eventId === eventId)
      .forEach((ms) => {
        ms.categoryIds.forEach((catId) => {
          const arr = map.get(catId) ?? [];
          if (!arr.includes(ms.name)) arr.push(ms.name);
          map.set(catId, arr);
        });
      });
    return map;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [eventId, version]);

  /* ── Form ────────────────────────────────────────────────────────────── */

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CatInput>({
    resolver: zodResolver(catSchema),
    defaultValues: { color: "primary", badgeTemplate: BADGE_TEMPLATES[0], approvalMode: "manual" },
  });

  const selectedColor = watch("color");

  function openAdd() {
    setEditing(null);
    reset({ name: "", color: "primary", badgeTemplate: BADGE_TEMPLATES[0], approvalMode: "manual", maxPerDay: "", priceRupees: "" });
    setSheetOpen(true);
  }

  function openEdit(cat: VisitorCategory) {
    setEditing(cat);
    reset({
      name: cat.name,
      color: cat.color,
      badgeTemplate: BADGE_TEMPLATES[0],
      approvalMode: "manual",
      maxPerDay: cat.maxPerDay ? String(cat.maxPerDay) : "",
      priceRupees: cat.pricePaise ? String(cat.pricePaise / 100) : "",
    });
    setSheetOpen(true);
  }

  async function onSubmit(data: CatInput) {
    await new Promise((r) => setTimeout(r, 300));
    const pricePaise = data.priceRupees ? Math.round(Number(data.priceRupees) * 100) : 0;
    const maxPerDay = data.maxPerDay ? Number(data.maxPerDay) : null;

    if (editing) {
      Object.assign(editing, { name: data.name, color: data.color, pricePaise, maxPerDay });
      toastSuccess(`Category "${data.name}" updated`);
    } else {
      db.categories.push({
        id: runtimeId("cat"),
        eventId,
        name: data.name,
        color: data.color,
        pricePaise,
        maxPerDay,
      });
      toastSuccess(`Category "${data.name}" created`);
    }
    // Invalidate registration list so chips refresh instantly
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
    void qc.invalidateQueries({ queryKey: queryKeys.events.categories(eventId) });
    setVersion((v) => v + 1);
    setSheetOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 300));
    const idx = db.categories.findIndex((c) => c.id === deleteTarget.id);
    if (idx !== -1) db.categories.splice(idx, 1);
    setDeleting(false);
    setDeleteTarget(null);
    setVersion((v) => v + 1);
    toastSuccess(`Category "${deleteTarget.name}" deleted`);
  }

  const isNewEvent = categories.length === 0;

  return (
    <>
      <PageHeader
        title="Visitor Categories"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Registrations", href: `/org/events/${eventId}/registrations` },
          { label: "Categories" },
        ]}
        subtitle="Categories drive badges, pricing and meal entitlements"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={sortAlpha ? ArrowDownAZ : ArrowUpDown}
              onClick={() => setSortAlpha((s) => !s)}
            >
              {sortAlpha ? "A–Z" : "Default"}
            </Button>
            <Button variant="primary" icon={Plus} onClick={openAdd}>
              Add Category
            </Button>
          </div>
        }
      />

      {/* Seed hint for new events */}
      {isNewEvent && (
        <div className="flex items-start gap-3 rounded-xl border border-orbit-100 bg-orbit-50/60 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orbit-500" />
          <div>
            <p className="text-[13px] font-semibold text-orbit-700">Start with the standard set</p>
            <p className="text-[12px] text-orbit-600/80">
              Most exhibitions use: Trade Visitor · Delegate · VIP · Student · Media. Add them one by one, or
              customise for your event.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {isNewEvent ? (
        <Card className="p-10">
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Add your first visitor category to enable registration."
            action={<Button variant="primary" icon={Plus} onClick={openAdd}>Add Category</Button>}
          />
        </Card>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => {
            const count = counts.get(cat.id) ?? 0;
            const cap = cat.maxPerDay;
            const meals = mealEntitlements.get(cat.id) ?? [];
            const colorDot = COLORS.find((c) => c.value === cat.color)?.dot ?? "bg-slate-400";
            const capPct = cap ? Math.min(Math.round((count / cap) * 100), 100) : null;
            return (
              <li key={cat.id}>
                <div className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-card">
                  {/* Color + name */}
                  <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full", colorDot)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <Badge variant={cat.color}>{cat.name}</Badge>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
                      <span>Badge: {BADGE_TEMPLATES[0]}</span>
                      <span>{cat.pricePaise > 0 ? formatPaise(cat.pricePaise) : "Free"}</span>
                      <span className="flex items-center gap-1">
                        <Utensils className="h-3 w-3" />
                        {meals.length > 0 ? meals.join(", ") : "No meals"}
                      </span>
                    </p>
                  </div>

                  {/* Count / cap */}
                  <div className="hidden w-40 shrink-0 sm:block">
                    <p className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="h-3 w-3" /> {count.toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-400">{cap ? `cap ${cap}/day` : "no cap"}</span>
                    </p>
                    {capPct !== null ? (
                      <ProgressBar
                        value={capPct}
                        label={`${cat.name} ${capPct}% of daily cap`}
                        tone={capPct >= 90 ? "danger" : capPct >= 70 ? "warning" : "primary"}
                      />
                    ) : (
                      <div className="h-1.5 rounded-full bg-slate-50" />
                    )}
                  </div>

                  {/* Approval mode */}
                  <Badge variant={count > 0 ? "success" : "neutral"} className="hidden md:inline-flex">
                    Manual approval
                  </Badge>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" icon={Pencil} iconOnly aria-label={`Edit ${cat.name}`} onClick={() => openEdit(cat)} />
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      iconOnly
                      aria-label={`Delete ${cat.name}`}
                      onClick={() => {
                        if (count > 0) {
                          toastError(`Cannot delete — ${count} registrations use "${cat.name}". Reassign them first.`);
                          return;
                        }
                        setDeleteTarget(cat);
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add/Edit sheet */}
      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add Category"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Category name" required error={errors.name?.message}>
            <TextInput {...register("name")} placeholder="e.g. Trade Visitor" autoFocus />
          </FormField>

          <FormField label="Color" required>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setValue("color", c.value, { shouldValidate: true })}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all",
                    selectedColor === c.value ? "border-orbit-400 ring-2 ring-orbit-100" : "border-transparent hover:border-slate-200",
                  )}
                >
                  <span className={cn("h-5 w-5 rounded-full", c.dot)} />
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Badge template">
            <SelectInput {...register("badgeTemplate")}>
              {BADGE_TEMPLATES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Approval mode" hint="Manual: staff reviews each registration. Auto: instant approval + pass.">
            <SelectInput {...register("approvalMode")}>
              <option value="manual">Manual review</option>
              <option value="auto">Auto-approve</option>
            </SelectInput>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max per day" hint="Blank = unlimited">
              <TextInput {...register("maxPerDay")} type="number" min="0" placeholder="∞" />
            </FormField>
            <FormField label="Price (₹)" hint="Blank = free">
              <TextInput {...register("priceRupees")} type="number" min="0" placeholder="0" />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" type="button" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editing ? "Save Changes" : "Add Category"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description={
          <>
            <strong>{deleteTarget?.name}</strong> will be removed. This is only possible because no
            registrations currently use it.
          </>
        }
        confirmText={deleteTarget?.name ?? ""}
        actionLabel="Delete Category"
        loading={deleting}
      />
    </>
  );
}
