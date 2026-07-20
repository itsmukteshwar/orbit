"use client";

/**
 * P-33 — Public registration (/e/[slug]/register)
 * Category picker (public categories) → FormRenderer (published version or
 * builder draft fallback) → success with "pass sent" + add-to-calendar.
 * New submissions land as PENDING → appear in the admin approval queue.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { FormRenderer } from "@/components/form/FormRenderer";
import { registrationService } from "@/services/registration";
import { db } from "@/services/mock/db";
import { cn, formatPaise } from "@/lib/utils";
import type { FormSchema } from "@/lib/formSchema";
import type { VisitorCategory } from "@/types/domain";

/* Load published schema (from P-32 storage), else a sensible default. */
function loadPublicSchema(eventId: string): FormSchema {
  try {
    const raw = localStorage.getItem(`orbit_form_versions_${eventId}`);
    if (raw) {
      const versions = JSON.parse(raw) as { schema: FormSchema }[];
      if (versions.length) return versions[versions.length - 1].schema;
    }
  } catch { /* fall through */ }
  return {
    id: "public_default",
    name: "Visitor Registration",
    version: 1,
    consentText: "I agree to the event terms & conditions and consent to receiving my pass via WhatsApp/email.",
    fields: [
      { key: "first_name", label: "First Name", type: "text", required: true },
      { key: "last_name", label: "Last Name", type: "text", required: true },
      { key: "mobile", label: "Mobile Number", type: "phone", required: true },
      { key: "email", label: "Email", type: "email", required: false, help: "Pass will also be emailed" },
      { key: "company", label: "Company", type: "text", required: false },
    ],
  };
}

type Stage =
  | { kind: "category" }
  | { kind: "form"; category: VisitorCategory }
  | { kind: "done"; name: string; phone: string; email: string | null };

export default function PublicRegisterPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const event = useMemo(() => db.events.find((e) => e.id === slug) ?? null, [slug]);
  const categories = useMemo(
    () => (event ? db.categories.filter((c) => c.eventId === event.id) : []),
    [event],
  );
  const schema = useMemo(() => (event ? loadPublicSchema(event.id) : null), [event]);

  const [stage, setStage] = useState<Stage>(
    categories.length === 1 ? { kind: "form", category: categories[0] } : { kind: "category" },
  );
  const [submitting, setSubmitting] = useState(false);

  if (!event || !schema) {
    return (
      <Frame>
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="font-display text-2xl font-bold text-orbit-900">Event not found</h1>
        </div>
      </Frame>
    );
  }

  async function handleSubmit(values: Record<string, unknown>, category: VisitorCategory) {
    setSubmitting(true);
    const firstName = String(values.first_name ?? values.full_name ?? values.name ?? "Guest");
    const lastName = String(values.last_name ?? "");
    const phone = String(values.mobile ?? values.phone ?? "");
    const email = values.email ? String(values.email) : null;

    await registrationService.create({
      eventId: event!.id,
      formVersionId: db.formVersions.find((f) => f.eventId === event!.id)?.id ?? "",
      categoryId: category.id,
      firstName,
      lastName: lastName || "—",
      phone,
      email,
      company: values.company ? String(values.company) : null,
      designation: null,
      city: values.city ? String(values.city) : "—",
      state: "—",
      gender: "other",
      foodPreference: "veg",
      daysAttending: [1],
      amountPaise: category.pricePaise,
      source: "online",
      status: "pending",
    });
    setSubmitting(false);
    setStage({ kind: "done", name: firstName, phone, email });
  }

  function addToCalendar() {
    const dtStart = event!.startDate.replace(/-/g, "");
    const dtEnd = event!.endDate.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${event!.name}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `LOCATION:${event!.venue}, ${event!.city}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event!.name.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Frame>
      <div className="w-full max-w-lg">
        {/* Slim branded header */}
        <div className="mb-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orbit-400">Registration</p>
          <h1 className="font-display text-2xl font-bold text-orbit-900">{event.name}</h1>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          {/* ── Category picker ─────────────────────────────────────────── */}
          {stage.kind === "category" && (
            <>
              <p className="mb-4 text-center text-[14px] font-semibold text-slate-700">
                Choose your category
              </p>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setStage({ kind: "form", category: cat })}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-orbit-300 hover:bg-orbit-50/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{cat.name}</p>
                      <p className="text-[12px] text-slate-400">
                        {cat.pricePaise > 0 ? formatPaise(cat.pricePaise) : "Free entry"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Form ───────────────────────────────────────────────────── */}
          {stage.kind === "form" && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[14px] font-semibold text-slate-700">
                  {stage.category.name}
                  <span className="ml-2 text-[12px] font-normal text-slate-400">
                    {stage.category.pricePaise > 0 ? formatPaise(stage.category.pricePaise) : "Free"}
                  </span>
                </p>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setStage({ kind: "category" })}
                    className="flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-600"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change
                  </button>
                )}
              </div>
              <FormRenderer
                schema={schema}
                disabled={submitting}
                submitLabel={submitting ? "Submitting…" : "Complete Registration"}
                onSubmit={(v) => handleSubmit(v, stage.category)}
              />
            </>
          )}

          {/* ── Success ────────────────────────────────────────────────── */}
          {stage.kind === "done" && (
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </span>
              <h2 className="font-display text-xl font-bold text-orbit-900">
                You&apos;re registered, {stage.name}!
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                Your registration is being reviewed. Once approved, your entry pass will be sent to{" "}
                <strong className="text-slate-700">WhatsApp +91 {stage.phone}</strong>
                {stage.email && <> and <strong className="text-slate-700">{stage.email}</strong></>}.
              </p>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={addToCalendar}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <CalendarPlus className="h-4 w-4 text-orbit-500" /> Add to Calendar
                </button>
                <Link
                  href={`/e/${slug}/status`}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-orbit-500 text-[13px] font-semibold text-white transition-colors hover:bg-orbit-600"
                >
                  Check Status Anytime
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Orbit Event ERP</span>
        </p>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      {children}
    </div>
  );
}
