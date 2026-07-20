/**
 * Orbit Event ERP — Domain Types
 * Matches PROJECT-CONTEXT §4 glossary. All ids are ULID-style strings with a
 * type prefix (e.g. "reg_01J8ZQ…"). Money is stored in paise. Dates are ISO
 * strings; render in the event's timezone.
 */

/* ── Roles ────────────────────────────────────────────────────────────── */

export const ROLES = [
  "owner",
  "org_admin",
  "event_manager",
  "desk",
  "scanner",
  "food_operator",
  "catering_supervisor",
  "super_admin",
] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  orgId: string | null; // null for super_admin
  avatarInitials: string;
}

/* ── Organization ─────────────────────────────────────────────────────── */

export type OrgPlan = "launchpad" | "nebula" | "galaxy";
export type OrgStatus = "active" | "trial" | "past_due" | "suspended";

export interface Org {
  id: string;
  name: string;
  legalName: string;
  gstin: string;
  city: string;
  state: string;
  plan: OrgPlan;
  status: OrgStatus;
  createdAt: string;
}

/* ── Event ────────────────────────────────────────────────────────────── */

export type EventStatus = "draft" | "published" | "live" | "completed" | "archived";
export type EventMode = "in_person" | "hybrid" | "virtual";

export interface OrbitEvent {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  status: EventStatus;
  mode: EventMode;
  category: string;
  venue: string;
  city: string;
  timezone: string; // IANA, e.g. "Asia/Kolkata"
  startDate: string; // ISO date
  endDate: string;
  dailyStart: string; // "09:00"
  dailyEnd: string; // "18:00"
  capacity: number;
  halls: Hall[];
  createdAt: string;
  /** Set by onboarding wizard when user accepts the demo event. Shows a ribbon in the UI. */
  isDemo?: boolean;
}

export interface Hall {
  id: string;
  name: string;
  capacity: number;
}

/* ── Visitor categories & registration forms ──────────────────────────── */

export interface VisitorCategory {
  id: string;
  eventId: string;
  name: string; // "Trade Visitor", "Delegate", "VIP", "Student", "Media"
  color: "primary" | "secondary" | "warning" | "info" | "danger" | "success" | "neutral";
  pricePaise: number; // 0 = free
  maxPerDay: number | null;
}

export type FieldType = "text" | "email" | "phone" | "select" | "checkbox" | "radio" | "date";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface FormVersion {
  id: string;
  eventId: string;
  version: number;
  status: "draft" | "published" | "retired";
  fields: FormField[];
  publishedAt: string | null;
}

/* ── Registrations & passes ───────────────────────────────────────────── */

export type RegistrationStatus = "pending" | "approved" | "rejected" | "revoked";
export type RegistrationSource =
  | "online"
  | "qr_self_scan"
  | "reception_desk"
  | "whatsapp"
  | "exhibitor_invite"
  | "import";

export interface Registration {
  id: string;
  eventId: string;
  formVersionId: string;
  categoryId: string;
  status: RegistrationStatus;
  source: RegistrationSource;
  firstName: string;
  lastName: string;
  phone: string; // 10-digit, no +91 prefix
  email: string | null;
  company: string | null;
  designation: string | null;
  city: string;
  state: string;
  gender: "male" | "female" | "other";
  foodPreference: "veg" | "non_veg" | "jain";
  daysAttending: number[]; // [1, 2, 3]
  amountPaise: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null; // userId
}

export type PassStatus = "active" | "revoked" | "expired";

export interface Pass {
  id: string;
  registrationId: string;
  eventId: string;
  badgeNo: string; // "MT26-0001"
  qrToken: string; // opaque scan token
  status: PassStatus;
  issuedAt: string;
}

/* ── Exhibitors ───────────────────────────────────────────────────────── */

export type ExhibitorStatus = "invited" | "confirmed" | "active" | "cancelled";

export interface Exhibitor {
  id: string;
  eventId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  stallNo: string;
  hallId: string;
  areaSqm: number;
  status: ExhibitorStatus;
  staffQuota: number;
  /** Magic-link token for the public staff-submission form (/x/[token]). */
  magicToken: string | null;
  magicExpiresAt: string | null;
}

export type ExhibitorStaffStatus = "pending" | "approved" | "rejected";

export interface ExhibitorStaff {
  id: string;
  exhibitorId: string;
  name: string;
  phone: string;
  role: "owner" | "sales" | "support";
  designation: string | null;
  status: ExhibitorStaffStatus;
  submittedAt: string;
  passId: string | null;
  /** Set when approval creates a mock registration (Exhibitor Staff category). */
  registrationId?: string | null;
}

/* ── Badges ───────────────────────────────────────────────────────────── */

export interface BadgeDesign {
  id: string;
  eventId: string;
  name: string;
  size: "a6" | "cr80" | "custom";
  categoryIds: string[]; // which categories use this design
  updatedAt: string;
}

export type PrintJobStatus = "queued" | "printing" | "done" | "failed";

export interface BadgePrintJob {
  id: string;
  eventId: string;
  passId: string;
  designId: string;
  station: string;
  status: PrintJobStatus;
  createdAt: string;
}

/** Audit record for every badge reprint (P-40). The old QR is invalidated. */
export interface ReprintRecord {
  id: string;
  eventId: string;
  registrationId: string;
  visitorName: string;
  reason: string;
  actor: string; // user who requested the reprint
  supervisor: string; // supervisor who entered the PIN
  oldBadgeNo: string;
  newBadgeNo: string;
  at: string;
}

/* ── Gates, devices, check-ins ────────────────────────────────────────── */

export type DeviceSync = "synced" | "offline";

export interface Gate {
  id: string;
  eventId: string;
  name: string;
  location: string;
  kind: "entry" | "exit" | "both";
}

export interface Device {
  id: string;
  gateId: string | null;
  counterId: string | null;
  label: string;
  sync: DeviceSync;
  queuedScans: number;
  lastSeenAt: string;
  /** Set to true when an admin revokes the device. Revoked devices are hidden from active lists. */
  revoked?: boolean;
}

export type CheckinDirection = "in" | "out";
export type CheckinResult = "ok" | "duplicate" | "invalid" | "revoked";

export interface Checkin {
  id: string;
  eventId: string;
  passId: string;
  gateId: string;
  deviceId: string;
  direction: CheckinDirection;
  result: CheckinResult;
  day: number; // event day 1..n
  at: string; // ISO datetime
}

/* ── Conference sessions ──────────────────────────────────────────────── */

export interface EventSession {
  id: string;
  eventId: string;
  hallId: string;
  title: string;
  speaker: string;
  day: number;
  startTime: string; // "11:00"
  endTime: string;
  capacity: number | null;
}

/* ── Food: meal sessions, entitlements, redemptions, counters ─────────── */

export type MealWindowStatus = "upcoming" | "live" | "closed" | "invite_only";

export interface MealSession {
  id: string;
  eventId: string;
  name: string; // "Lunch"
  day: number;
  startTime: string;
  endTime: string;
  status: MealWindowStatus;
  categoryIds: string[]; // entitled categories
}

export interface Entitlement {
  id: string;
  mealSessionId: string;
  passId: string;
  quantity: number;
}

export type RedemptionResult = "ok" | "duplicate" | "not_entitled" | "window_closed";

export interface Redemption {
  id: string;
  mealSessionId: string;
  passId: string;
  counterId: string;
  result: RedemptionResult;
  foodPreference: "veg" | "non_veg" | "jain";
  at: string;
}

export interface Counter {
  id: string;
  eventId: string;
  name: string; // "Counter 2"
  location: string;
  active: boolean;
}

/* ── Communications ───────────────────────────────────────────────────── */

export type CommChannel = "whatsapp" | "email" | "sms";
export type CommMessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface CommTemplate {
  id: string;
  orgId: string;
  name: string;
  channel: CommChannel;
  subject: string | null; // email only
  body: string; // with {{placeholders}}
  approved: boolean;
}

export interface CommMessage {
  id: string;
  eventId: string;
  templateId: string;
  registrationId: string;
  channel: CommChannel;
  status: CommMessageStatus;
  sentAt: string | null;
  error: string | null;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Formats paise as INR with Indian digit grouping: 4860050 → "₹48,600.50" */
export function formatPaise(paise: number, opts?: { decimals?: boolean }): string {
  const rupees = paise / 100;
  const decimals = opts?.decimals ?? paise % 100 !== 0;
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    })
  );
}
