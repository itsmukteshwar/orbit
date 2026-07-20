"use client";

/**
 * P-26 — Walk-in Desk (/org/events/[eventId]/registrations/new)
 * Phone search-first flow (Blueprint US-03, ≤45 s):
 *   1. Giant phone input → search on 10 digits or Enter
 *   2. Found → visitor card with [Print badge] [Resend pass]
 *   3. Not found → minimal quick form → success with [Print badge] focused
 * Entirely keyboard-driven. Session counter. Duplicate-phone soft warning.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Printer,
  Search,
  Send,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { FormField, TextInput, SelectInput } from "@/components/kit/inputs";
import { toastSuccess } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { registrationService } from "@/services/registration";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";
import type { Registration } from "@/types/domain";

/* ── Quick form schema ───────────────────────────────────────────────────── */

const quickSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile"),
  company: z.string().optional(),
  categoryId: z.string().min(1, "Pick a category"),
});
type QuickInput = z.infer<typeof quickSchema>;

type Step =
  | { kind: "search" }
  | { kind: "found"; reg: Registration }
  | { kind: "form"; phone: string }
  | { kind: "success"; reg: Registration };

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function WalkInDeskPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>({ kind: "search" });
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);

  /* Focus search input on mount + when returning to search */
  useEffect(() => {
    if (step.kind === "search") {
      setTimeout(() => searchRef.current?.focus(), 60);
    }
    if (step.kind === "success") {
      setTimeout(() => printRef.current?.focus(), 120);
    }
  }, [step.kind]);

  const doSearch = useCallback(
    async (p: string) => {
      if (p.length !== 10) return;
      setSearching(true);
      // Direct db lookup — desk needs instant results
      await new Promise((r) => setTimeout(r, 250));
      const found = db.registrations.find((r) => r.eventId === eventId && r.phone === p);
      setSearching(false);
      if (found) setStep({ kind: "found", reg: found });
      else setStep({ kind: "form", phone: p });
    },
    [eventId],
  );

  /* Auto-search when 10 digits typed */
  useEffect(() => {
    if (phone.length === 10 && step.kind === "search") void doSearch(phone);
  }, [phone, step.kind, doSearch]);

  function resetToSearch() {
    setPhone("");
    setStep({ kind: "search" });
  }

  /* ── Quick form ──────────────────────────────────────────────────────── */

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<QuickInput>({
    resolver: zodResolver(quickSchema),
    defaultValues: { categoryId: categories[0]?.id ?? "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: QuickInput) =>
      registrationService.create({
        eventId,
        formVersionId: db.formVersions.find((f) => f.eventId === eventId)?.id ?? "",
        categoryId: data.categoryId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: null,
        company: data.company || null,
        designation: null,
        city: "—",
        state: "—",
        gender: "other",
        foodPreference: "veg",
        daysAttending: [1],
        amountPaise: 0,
        source: "reception_desk",
        status: "approved", // desk registrations are instant
      }),
    onSuccess: (reg) => {
      void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
      setSessionCount((c) => c + 1);
      setStep({ kind: "success", reg });
      resetForm({ categoryId: categories[0]?.id ?? "" });
      toastSuccess(`${reg.firstName} registered at desk`);
    },
  });

  /* Duplicate soft warning for the form phone */
  const dupWarning = useMemo(() => {
    if (step.kind !== "form") return false;
    return db.registrations.some((r) => r.phone === step.phone && r.eventId !== eventId);
  }, [step, eventId]);

  return (
    <>
      <PageHeader
        title="Walk-in Desk"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Registrations", href: `/org/events/${eventId}/registrations` },
          { label: "Walk-in" },
        ]}
        subtitle="Search by phone first — register only if not found"
        actions={
          <span className="flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3.5 text-[13px] font-semibold text-emerald-600">
            <UserPlus className="h-4 w-4" />
            You registered {sessionCount} today
          </span>
        }
      />

      <div className="mx-auto w-full max-w-2xl">
        {/* ── STEP: search ──────────────────────────────────────────────── */}
        {step.kind === "search" && (
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <label htmlFor="desk-phone" className="mb-3 block text-center font-display text-lg font-semibold text-orbit-900">
              Visitor&apos;s phone number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-300" />
              <input
                ref={searchRef}
                id="desk-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") void doSearch(phone); }}
                placeholder="98765 43210"
                className="h-20 w-full rounded-2xl border-2 border-slate-200 pl-16 pr-6 text-center font-mono text-4xl font-bold tracking-[0.12em] text-slate-800 placeholder:text-slate-200 focus:border-orbit-400 focus:ring-4 focus:ring-orbit-100 focus:outline-none"
              />
            </div>
            <p className="mt-4 text-center text-[13px] text-slate-400">
              {searching
                ? "Searching…"
                : phone.length > 0
                  ? `${10 - phone.length} more digit${10 - phone.length !== 1 ? "s" : ""}`
                  : "Type 10 digits — search runs automatically"}
            </p>
          </div>
        )}

        {/* ── STEP: found ───────────────────────────────────────────────── */}
        {step.kind === "found" && (() => {
          const cat = db.categories.find((c) => c.id === step.reg.categoryId);
          const pass = db.passes.find((p) => p.registrationId === step.reg.id);
          return (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-lg font-bold text-orbit-600">
                    {step.reg.firstName[0]}{step.reg.lastName[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display text-lg font-semibold text-orbit-900">
                      {step.reg.firstName} {step.reg.lastName}
                      <StatusBadge status={step.reg.status} />
                    </p>
                    <p className="text-[13px] text-slate-500">
                      {step.reg.company ?? "No company"} · +91 {step.reg.phone}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {cat && <Badge variant={cat.color}>{cat.name}</Badge>}
                      {pass && <span className="text-[12px] text-slate-400">Badge {pass.badgeNo}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    icon={Printer}
                    className="h-14 text-[15px]"
                    onClick={() => {
                      toastSuccess(`Badge sent to printer for ${step.reg.firstName}`);
                      resetToSearch();
                    }}
                    autoFocus
                  >
                    Print Badge
                  </Button>
                  <Button
                    variant="secondary"
                    icon={Send}
                    className="h-14 text-[15px]"
                    onClick={() => {
                      toastSuccess(`Pass resent to +91 ${step.reg.phone}`);
                      resetToSearch();
                    }}
                  >
                    Resend Pass
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={resetToSearch}
                className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> New search
              </button>
            </div>
          );
        })()}

        {/* ── STEP: quick form ──────────────────────────────────────────── */}
        {step.kind === "form" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                  <Search className="h-4.5 w-4.5 text-amber-500" />
                </span>
                <div>
                  <p className="font-display font-semibold text-orbit-900">Not found — quick register</p>
                  <p className="text-[12px] text-slate-400">+91 {step.phone} has no registration for this event</p>
                </div>
              </div>

              {dupWarning && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[12px] text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This phone is registered for a different event. Double-check it&apos;s the same person before continuing.
                </div>
              )}

              <form
                onSubmit={handleSubmit((data) => createMutation.mutate({ ...data, phone: step.phone }))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="First name" required error={errors.firstName?.message}>
                    <TextInput {...register("firstName")} placeholder="Anita" autoFocus className="h-11" />
                  </FormField>
                  <FormField label="Last name" required error={errors.lastName?.message}>
                    <TextInput {...register("lastName")} placeholder="Sharma" className="h-11" />
                  </FormField>
                </div>
                <FormField label="Company" error={errors.company?.message}>
                  <TextInput {...register("company")} placeholder="Optional" className="h-11" />
                </FormField>
                <FormField label="Category" required error={errors.categoryId?.message}>
                  <SelectInput {...register("categoryId")} className="h-11">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </SelectInput>
                </FormField>
                {/* Hidden phone — pre-filled from search */}
                <input type="hidden" {...register("phone")} value={step.phone} />

                <Button
                  variant="primary"
                  type="submit"
                  icon={CheckCircle2}
                  className="h-13 w-full text-[15px]"
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {createMutation.isPending ? "Registering…" : "Register & Issue Pass"}
                </Button>
              </form>
            </div>

            <button
              type="button"
              onClick={resetToSearch}
              className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to search
            </button>
          </div>
        )}

        {/* ── STEP: success ─────────────────────────────────────────────── */}
        {step.kind === "success" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-card">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </span>
            <h2 className="font-display text-xl font-bold text-orbit-900">
              {step.reg.firstName} {step.reg.lastName} registered!
            </h2>
            <p className="mt-1 text-[13px] text-slate-400">
              Pass issued · +91 {step.reg.phone}
            </p>

            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
              <Button
                ref={printRef}
                variant="primary"
                icon={Printer}
                className="h-14 text-[15px]"
                onClick={() => {
                  toastSuccess("Badge sent to printer");
                  resetToSearch();
                }}
              >
                Print Badge
              </Button>
              <Button
                variant="secondary"
                className="h-14 text-[15px]"
                onClick={resetToSearch}
              >
                Next Visitor
              </Button>
            </div>
            <p className="mt-4 text-[11px] text-slate-300">
              Enter prints the badge · session count updated
            </p>
          </div>
        )}
      </div>
    </>
  );
}
