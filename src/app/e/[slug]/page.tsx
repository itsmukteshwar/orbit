"use client";

/**
 * P-33 — Public event landing (/e/[slug])
 * Landing-lite: event branding, name/dates/venue, Register CTA.
 * Closed / full states. No admin chrome (AppShell bypasses /e/).
 */

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin, Search, XCircle } from "lucide-react";
import { db } from "@/services/mock/db";

function fmtRange(start: string, end: string): string {
  const f = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", opts);
  return `${f(start, { day: "numeric" })}–${f(end, { day: "numeric", month: "long", year: "numeric" })}`;
}

export default function PublicEventPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const event = useMemo(() => db.events.find((e) => e.id === slug) ?? null, [slug]);

  const regCount = useMemo(
    () => (event ? db.registrations.filter((r) => r.eventId === event.id).length : 0),
    [event],
  );

  if (!event) {
    return (
      <PublicFrame>
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="font-display text-2xl font-bold text-orbit-900">Event not found</h1>
          <p className="mt-2 text-[14px] text-slate-500">This link may have expired or is incorrect.</p>
        </div>
      </PublicFrame>
    );
  }

  const isClosed = event.status === "completed" || event.status === "archived" || event.status === "draft";
  const isFull = event.capacity > 0 && regCount >= event.capacity;
  const canRegister = !isClosed && !isFull;

  return (
    <PublicFrame>
      <div className="w-full max-w-lg">
        {/* Branding header */}
        <div className="rounded-t-3xl bg-gradient-to-br from-orbit-600 via-orbit-500 to-violet-500 p-8 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">
            You&apos;re invited
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight">{event.name}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[13px] opacity-90">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {fmtRange(event.startDate, event.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {event.venue}, {event.city}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-b-3xl bg-white p-8 shadow-card">
          {canRegister ? (
            <>
              <Link
                href={`/e/${slug}/register`}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-orbit-500 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-orbit-600"
              >
                Register Now <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-[12px] text-slate-400">
                Free & paid categories · pass delivered on WhatsApp
              </p>
            </>
          ) : (
            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="font-semibold text-slate-700">
                {isFull ? "Registration is full" : "Registration is closed"}
              </p>
              <p className="mt-1 text-[13px] text-slate-400">
                {isFull
                  ? "This event has reached capacity. Contact the organiser for waitlist options."
                  : "This event is not currently accepting registrations."}
              </p>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <Link
              href={`/e/${slug}/status`}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
            >
              <Search className="h-3.5 w-3.5" />
              Already registered? Check status / resend pass
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Orbit Event ERP</span>
        </p>
      </div>
    </PublicFrame>
  );
}

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      {children}
    </div>
  );
}
