/**
 * Builds a BadgeData payload from mock-db records.
 * Shared by the templates screen (P-37), print queue (P-39) and drawer flows.
 */

import { db } from "@/services/mock/db";
import { CATEGORY_HEX, type BadgeData } from "@/components/badge/templates";
import type { Registration } from "@/types/domain";

export function fmtEventDates(startDate: string, endDate: string): string {
  const f = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", opts);
  return `${f(startDate, { day: "numeric" })}–${f(endDate, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function badgeDataFor(reg: Registration, sponsorStripUrl: string | null): BadgeData {
  const cat = db.categories.find((c) => c.id === reg.categoryId);
  const pass = db.passes.find((p) => p.registrationId === reg.id);
  const event = db.events.find((e) => e.id === reg.eventId);
  return {
    name: `${reg.firstName} ${reg.lastName}`,
    company: reg.company,
    city: reg.city,
    designation: reg.designation,
    categoryName: cat?.name ?? "Visitor",
    categoryHex: CATEGORY_HEX[cat?.color ?? "primary"] ?? CATEGORY_HEX.primary,
    badgeNo: pass?.badgeNo ?? "—",
    qrToken: pass?.qrToken ?? "no-pass",
    eventName: event?.name ?? "Event",
    eventDates: event ? fmtEventDates(event.startDate, event.endDate) : "",
    sponsorStripUrl,
  };
}

/** First approved registration of a category — sample for live previews. */
export function sampleRegistrationFor(eventId: string, categoryId: string): Registration | null {
  return (
    db.registrations.find(
      (r) => r.eventId === eventId && r.categoryId === categoryId && r.status === "approved",
    ) ??
    db.registrations.find((r) => r.eventId === eventId && r.status === "approved") ??
    null
  );
}
