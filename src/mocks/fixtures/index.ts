/**
 * Orbit Event ERP — Mock Fixtures
 * Deterministic dataset generated from a fixed seed — identical every reload.
 *
 * Org: "Malwa Expo Co" (Indore)
 *  ├─ Event 1: Malwa Trade Expo 2026 — LIVE 3-day trade expo
 *  │    5 categories · 3 halls · 4 gates · 6 meal sessions · 4 counters
 *  │    400 registrations · 12 exhibitors + staff · 60 check-ins ·
 *  │    250 redemptions (6 duplicates) · comm messages
 *  └─ Event 2: Malwa Business Conclave 2026 — DRAFT conference
 *
 * The legacy src/data/* files remain the truth for the 6 canon pages; the
 * first 12 registrations here mirror those visitors (names/companies) so the
 * datasets agree with each other.
 */

import {
  createRng, pick, int, weighted, makeId, phone,
  FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES, COMPANIES, CITIES, DESIGNATIONS,
} from "@/mocks/seed";
import type {
  Org, OrbitEvent, User, VisitorCategory, FormVersion, Registration, Pass,
  Exhibitor, ExhibitorStaff, BadgeDesign, Gate, Device, Checkin, EventSession,
  MealSession, Redemption, Counter, CommTemplate, CommMessage,
  RegistrationStatus, RegistrationSource, ReprintRecord, BadgePrintJob,
} from "@/types/domain";

const rng = createRng(20260718);

/* ── Org ──────────────────────────────────────────────────────────────── */

export const ORG: Org = {
  id: makeId(rng, "org"),
  name: "Malwa Expo Co",
  legalName: "Malwa Expositions Private Limited",
  gstin: "23AAECM4321F1Z5",
  city: "Indore",
  state: "Madhya Pradesh",
  plan: "nebula",
  status: "active",
  createdAt: "2025-11-04T09:30:00.000Z",
};

/* ── Users (one per role) ─────────────────────────────────────────────── */

const mkUser = (name: string, role: User["role"], orgId: string | null): User => {
  const [f, l] = name.split(" ");
  return {
    id: makeId(rng, "usr"),
    name,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@malwaexpo.in`,
    phone: phone(rng),
    role,
    orgId,
    avatarInitials: `${f[0]}${l[0]}`,
  };
};

export const USERS: User[] = [
  mkUser("Mukteshwar Rathore", "owner", ORG.id),
  mkUser("Ananya Rao", "org_admin", ORG.id),
  mkUser("Kunal Deshpande", "event_manager", ORG.id),
  mkUser("Ritika Jain", "desk", ORG.id),
  mkUser("Sanjay Pawar", "scanner", ORG.id),
  mkUser("Farhan Sheikh", "food_operator", ORG.id),
  mkUser("Lata Kulkarni", "catering_supervisor", ORG.id),
  mkUser("Orbit Admin", "super_admin", null),
];

/* ── Events ───────────────────────────────────────────────────────────── */

const expoHalls = [
  { id: makeId(rng, "hall"), name: "Hall A — Machinery", capacity: 6000 },
  { id: makeId(rng, "hall"), name: "Hall B — Consumer Goods", capacity: 4500 },
  { id: makeId(rng, "hall"), name: "Hall C — Agri & Food", capacity: 3500 },
];

export const EVENT_EXPO: OrbitEvent = {
  id: makeId(rng, "evt"),
  orgId: ORG.id,
  name: "Malwa Trade Expo 2026",
  slug: "malwa-trade-expo-2026",
  status: "live",
  mode: "in_person",
  category: "Trade / B2B Exhibition",
  venue: "Labhganga Exhibition Centre",
  city: "Indore",
  timezone: "Asia/Kolkata",
  startDate: "2026-07-17",
  endDate: "2026-07-19",
  dailyStart: "09:00",
  dailyEnd: "18:00",
  capacity: 14000,
  halls: expoHalls,
  createdAt: "2026-02-10T06:00:00.000Z",
};

export const EVENT_CONCLAVE: OrbitEvent = {
  id: makeId(rng, "evt"),
  orgId: ORG.id,
  name: "Malwa Business Conclave 2026",
  slug: "malwa-business-conclave-2026",
  status: "draft",
  mode: "in_person",
  category: "Conference",
  venue: "Brilliant Convention Centre",
  city: "Indore",
  timezone: "Asia/Kolkata",
  startDate: "2026-11-21",
  endDate: "2026-11-22",
  dailyStart: "09:30",
  dailyEnd: "17:30",
  capacity: 800,
  halls: [{ id: makeId(rng, "hall"), name: "Main Auditorium", capacity: 800 }],
  createdAt: "2026-06-28T10:15:00.000Z",
};

export const EVENTS: OrbitEvent[] = [EVENT_EXPO, EVENT_CONCLAVE];

/* ── Visitor categories (Event 1) ─────────────────────────────────────── */

const cat = (name: string, color: VisitorCategory["color"], pricePaise: number): VisitorCategory => ({
  id: makeId(rng, "cat"),
  eventId: EVENT_EXPO.id,
  name,
  color,
  pricePaise,
  maxPerDay: null,
});

export const CATEGORIES: VisitorCategory[] = [
  cat("Trade Visitor", "primary", 0),
  cat("Delegate", "secondary", 149900),
  cat("VIP", "warning", 0),
  cat("Student", "info", 9900),
  cat("Media", "danger", 0),
];

/* ── Form version ─────────────────────────────────────────────────────── */

export const FORM_VERSIONS: FormVersion[] = [
  {
    id: makeId(rng, "frm"),
    eventId: EVENT_EXPO.id,
    version: 2,
    status: "published",
    publishedAt: "2026-05-02T08:00:00.000Z",
    fields: [
      { id: makeId(rng, "fld"), label: "First Name", type: "text", required: true },
      { id: makeId(rng, "fld"), label: "Last Name", type: "text", required: true },
      { id: makeId(rng, "fld"), label: "Mobile Number", type: "phone", required: true },
      { id: makeId(rng, "fld"), label: "Email", type: "email", required: false },
      { id: makeId(rng, "fld"), label: "City", type: "text", required: true },
      { id: makeId(rng, "fld"), label: "Company / Organisation", type: "text", required: false },
      { id: makeId(rng, "fld"), label: "Visitor Category", type: "select", required: true, options: CATEGORIES.map((c) => c.name) },
      { id: makeId(rng, "fld"), label: "Food Preference", type: "radio", required: true, options: ["Veg", "Non-Veg", "Jain"] },
    ],
  },
  {
    id: makeId(rng, "frm"),
    eventId: EVENT_EXPO.id,
    version: 1,
    status: "retired",
    publishedAt: "2026-03-14T08:00:00.000Z",
    fields: [],
  },
];

/* ── Gates & devices (Event 1) ────────────────────────────────────────── */

const gate = (name: string, location: string, kind: Gate["kind"]): Gate => ({
  id: makeId(rng, "gat"), eventId: EVENT_EXPO.id, name, location, kind,
});

export const GATES: Gate[] = [
  gate("Gate 1 — Main Entry", "Hall A concourse", "entry"),
  gate("Gate 2 — VIP & Delegates", "North lobby", "entry"),
  gate("Gate 3 — Hall B", "East wing", "both"),
  gate("Gate 4 — Exit Plaza", "South exit", "exit"),
];

export const COUNTERS: Counter[] = [1, 2, 3, 4].map((n) => ({
  id: makeId(rng, "ctr"),
  eventId: EVENT_EXPO.id,
  name: `Counter ${n}`,
  location: "Central food plaza",
  active: n <= 3,
}));

export const DEVICES: Device[] = [
  ...GATES.flatMap((g, gi) =>
    Array.from({ length: gi === 0 ? 4 : 2 }, (_, i): Device => ({
      id: makeId(rng, "dev"),
      gateId: g.id,
      counterId: null,
      label: `${g.name.split(" — ")[0]} Scanner ${i + 1}`,
      sync: g.name.includes("Gate 3") && i === 0 ? "offline" : "synced",
      queuedScans: g.name.includes("Gate 3") && i === 0 ? 42 : 0,
      lastSeenAt: "2026-07-18T12:38:00.000Z",
    })),
  ),
  ...COUNTERS.map((c, i): Device => ({
    id: makeId(rng, "dev"),
    gateId: null,
    counterId: c.id,
    label: `${c.name} Scanner`,
    sync: "synced",
    queuedScans: 0,
    lastSeenAt: "2026-07-18T12:41:00.000Z",
  })),
];

/* ── Meal sessions (6 across 3 days) ──────────────────────────────────── */

const meal = (name: string, day: number, startTime: string, endTime: string, status: MealSession["status"], categoryIds: string[]): MealSession => ({
  id: makeId(rng, "mls"), eventId: EVENT_EXPO.id, name, day, startTime, endTime, status, categoryIds,
});

const ALL_CATS = CATEGORIES.map((c) => c.id);
const VIP_ONLY = [CATEGORIES[2].id, CATEGORIES[1].id];

export const MEAL_SESSIONS: MealSession[] = [
  meal("Lunch", 1, "12:00", "15:00", "closed", ALL_CATS),
  meal("Evening Snacks", 1, "16:00", "17:30", "closed", ALL_CATS),
  meal("Breakfast", 2, "08:00", "10:00", "closed", ALL_CATS),
  meal("Lunch", 2, "12:00", "15:00", "live", ALL_CATS),
  meal("VIP Dinner", 2, "19:30", "21:30", "invite_only", VIP_ONLY),
  meal("Lunch", 3, "12:00", "15:00", "upcoming", ALL_CATS),
];

/* ── Registrations (400) + passes ─────────────────────────────────────── */

/** First 12 mirror the canon visitors from src/data/visitors.ts. */
const CANON_SEED: Array<[string, string, "male" | "female", string, string, string]> = [
  ["Arjun", "Kumar", "male", "Tata Elxsi", "Bengaluru", "Karnataka"],
  ["Priya", "Nair", "female", "Freshworks", "Chennai", "Tamil Nadu"],
  ["Rohit", "Sharma", "male", "Self-employed", "New Delhi", "Delhi"],
  ["Sneha", "Desai", "female", "IIT Delhi", "New Delhi", "Delhi"],
  ["Nisha", "Deshmukh", "female", "Persistent Systems", "Pune", "Maharashtra"],
  ["Sapna", "Bansal", "female", "Dainik Bhaskar", "Jaipur", "Rajasthan"],
  ["Akash", "Gowda", "male", "Bosch India", "Bengaluru", "Karnataka"],
  ["Savita", "Bose", "female", "Wipro", "Kolkata", "West Bengal"],
  ["Seema", "Saini", "female", "NIC (Govt. of India)", "New Delhi", "Delhi"],
  ["Sachin", "Roy", "male", "Adani Group", "Ahmedabad", "Gujarat"],
  ["Rohit", "Chandra", "male", "Infosys", "Hyderabad", "Telangana"],
  ["Vijay", "Gowda", "male", "Mahindra & Mahindra", "Mumbai", "Maharashtra"],
];

const STATUS_WEIGHTS: readonly (readonly [RegistrationStatus, number])[] = [
  ["approved", 74], ["pending", 14], ["rejected", 8], ["revoked", 4],
];
const SOURCE_WEIGHTS: readonly (readonly [RegistrationSource, number])[] = [
  ["online", 46], ["qr_self_scan", 14], ["reception_desk", 16], ["whatsapp", 12], ["exhibitor_invite", 8], ["import", 4],
];
const CATEGORY_WEIGHTS = [59, 23, 6, 8, 4]; // trade, delegate, vip, student, media

function registrationAt(i: number): Registration {
  const canon = i < CANON_SEED.length ? CANON_SEED[i] : null;
  const gender: "male" | "female" = canon ? canon[2] : rng() < 0.62 ? "male" : "female";
  const firstName = canon ? canon[0] : pick(rng, gender === "male" ? FIRST_NAMES_M : FIRST_NAMES_F);
  const lastName = canon ? canon[1] : pick(rng, LAST_NAMES);
  const [city, state] = canon ? [canon[4], canon[5]] : pick(rng, CITIES);
  const company = canon ? canon[3] : rng() < 0.86 ? pick(rng, COMPANIES) : null;

  const catIdx = weighted(rng, CATEGORIES.map((c, idx) => [idx, CATEGORY_WEIGHTS[idx]] as const));
  const category = CATEGORIES[catIdx];
  const status = i < 8 ? "approved" : weighted(rng, STATUS_WEIGHTS);
  const source = weighted(rng, SOURCE_WEIGHTS);
  const createdDay = int(rng, -40, 1); // days relative to event start
  const createdAt = new Date(Date.UTC(2026, 6, 17 + Math.min(createdDay, 1), int(rng, 3, 12), int(rng, 0, 59))).toISOString();

  return {
    id: makeId(rng, "reg"),
    eventId: EVENT_EXPO.id,
    formVersionId: FORM_VERSIONS[0].id,
    categoryId: category.id,
    status,
    source,
    firstName,
    lastName,
    phone: phone(rng),
    email: rng() < 0.7 ? `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}@example.in` : null,
    company,
    designation: company ? pick(rng, DESIGNATIONS) : null,
    city,
    state,
    gender,
    foodPreference: weighted(rng, [["veg", 65], ["non_veg", 28], ["jain", 7]] as const),
    daysAttending: pick(rng, [[1], [2], [3], [1, 2], [2, 3], [1, 2, 3]] as const).slice(),
    amountPaise: category.pricePaise,
    createdAt,
    reviewedAt: status === "pending" ? null : createdAt,
    reviewedBy: status === "pending" ? null : USERS[1].id,
  };
}

export const REGISTRATIONS: Registration[] = Array.from({ length: 400 }, (_, i) => registrationAt(i));

export const PASSES: Pass[] = REGISTRATIONS.filter((r) => r.status === "approved").map((r, i) => ({
  id: makeId(rng, "pas"),
  registrationId: r.id,
  eventId: EVENT_EXPO.id,
  badgeNo: `MT26-${String(i + 1).padStart(4, "0")}`,
  qrToken: makeId(rng, "qr"),
  status: r.status === "approved" ? "active" : "revoked",
  issuedAt: r.reviewedAt ?? r.createdAt,
}));

const passByRegistration = new Map(PASSES.map((p) => [p.registrationId, p]));

/* ── Exhibitors + staff ───────────────────────────────────────────────── */

const EXHIBITOR_COMPANIES = [
  "Pratibha Syntex", "Malwa Agro Implements", "Shakti Pumps", "Vikram Cements", "Symbiotec Pharma",
  "Indore Steel Traders", "Choksi Packaging", "RRCAT Instruments", "Om Solar Solutions",
  "Krishna Dairy Equipment", "Avantika Textiles", "Dewas Metal Works",
] as const;

export const EXHIBITORS: Exhibitor[] = EXHIBITOR_COMPANIES.map((companyName, i) => {
  const gender = rng() < 0.7 ? "m" : "f";
  const contact = `${pick(rng, gender === "m" ? FIRST_NAMES_M : FIRST_NAMES_F)} ${pick(rng, LAST_NAMES)}`;
  // First 8 exhibitors have an active magic link; #8 (index 7) is expired.
  const hasLink = i < 8;
  const expired = i === 7;
  return {
    id: makeId(rng, "exh"),
    eventId: EVENT_EXPO.id,
    companyName,
    contactName: contact,
    contactPhone: phone(rng),
    contactEmail: `info@${companyName.toLowerCase().replace(/[^a-z]/g, "")}.in`,
    stallNo: `${pick(rng, ["A", "B", "C"] as const)}-${String(int(rng, 1, 48)).padStart(2, "0")}`,
    hallId: pick(rng, expoHalls).id,
    areaSqm: pick(rng, [9, 12, 18, 24, 36] as const),
    status: i < 10 ? "active" : "confirmed",
    staffQuota: i === 0 ? 3 : 4, // first company runs at full quota → amber chip demo
    magicToken: hasLink ? makeId(rng, "mgk") : null,
    magicExpiresAt: hasLink
      ? expired
        ? "2026-07-10T18:30:00.000Z" // in the past
        : "2026-07-24T18:30:00.000Z"
      : null,
  };
});

export const EXHIBITOR_STAFF: ExhibitorStaff[] = EXHIBITORS.flatMap((ex, exIdx) =>
  Array.from({ length: exIdx === 0 ? 4 : int(rng, 2, 4) }, (_, j): ExhibitorStaff => {
    const gender = rng() < 0.75 ? "m" : "f";
    // Mix: most seeded staff approved; exhibitors 1-5 also carry pending
    // submissions (magic-link flow demo). Exhibitor 0: 3 approved (= quota,
    // amber chip) + 1 pending (over-quota block demo in P-35).
    const status: ExhibitorStaff["status"] =
      exIdx === 0 ? (j < 3 ? "approved" : "pending") : exIdx < 6 && j >= 1 ? "pending" : "approved";
    return {
      id: makeId(rng, "exs"),
      exhibitorId: ex.id,
      name: `${pick(rng, gender === "m" ? FIRST_NAMES_M : FIRST_NAMES_F)} ${pick(rng, LAST_NAMES)}`,
      phone: phone(rng),
      role: weighted(rng, [["owner", 1], ["sales", 3], ["support", 2]] as const),
      designation: pick(rng, DESIGNATIONS),
      status,
      submittedAt: `2026-07-${String(int(rng, 12, 18)).padStart(2, "0")}T${String(int(rng, 9, 18)).padStart(2, "0")}:${String(int(rng, 0, 59)).padStart(2, "0")}:00.000Z`,
      passId: null,
      registrationId: null,
    };
  }),
);

/* ── Badge designs ────────────────────────────────────────────────────── */

export const BADGE_DESIGNS: BadgeDesign[] = [
  {
    id: makeId(rng, "bdg"),
    eventId: EVENT_EXPO.id,
    name: "Standard A6 Visitor",
    size: "a6",
    categoryIds: [CATEGORIES[0].id, CATEGORIES[3].id, CATEGORIES[4].id],
    updatedAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: makeId(rng, "bdg"),
    eventId: EVENT_EXPO.id,
    name: "VIP & Delegate Lanyard",
    size: "cr80",
    categoryIds: [CATEGORIES[1].id, CATEGORIES[2].id],
    updatedAt: "2026-07-03T14:20:00.000Z",
  },
];

/* ── Check-ins (60) ───────────────────────────────────────────────────── */

const entryGates = GATES.filter((g) => g.kind !== "exit");

export const CHECKINS: Checkin[] = Array.from({ length: 60 }, (): Checkin => {
  const pass = pick(rng, PASSES);
  const g = pick(rng, entryGates);
  const dev = DEVICES.find((d) => d.gateId === g.id) ?? DEVICES[0];
  const day = weighted(rng, [[1, 40], [2, 60]] as const);
  return {
    id: makeId(rng, "chk"),
    eventId: EVENT_EXPO.id,
    passId: pass.id,
    gateId: g.id,
    deviceId: dev.id,
    direction: "in",
    result: weighted(rng, [["ok", 94], ["duplicate", 4], ["invalid", 2]] as const),
    day,
    at: new Date(Date.UTC(2026, 6, 16 + day, int(rng, 3, 11), int(rng, 0, 59))).toISOString(),
  };
});

/* ── Sessions (conference programme, Event 1 Hall C) ──────────────────── */

export const EVENT_SESSIONS: EventSession[] = [
  { id: makeId(rng, "ses"), eventId: EVENT_EXPO.id, hallId: expoHalls[2].id, title: "MSME Export Readiness", speaker: "Dr. Meera Kulkarni", day: 2, startTime: "11:00", endTime: "12:00", capacity: 200 },
  { id: makeId(rng, "ses"), eventId: EVENT_EXPO.id, hallId: expoHalls[2].id, title: "Agri-tech Financing Panel", speaker: "Rajeev Bansal", day: 2, startTime: "15:30", endTime: "16:30", capacity: 200 },
  { id: makeId(rng, "ses"), eventId: EVENT_EXPO.id, hallId: expoHalls[2].id, title: "Solar for Industry", speaker: "Kavita Reddy", day: 3, startTime: "11:00", endTime: "12:00", capacity: 150 },
];

/* ── Redemptions (250, incl. 6 flagged duplicates) ────────────────────── */

const liveLunch = MEAL_SESSIONS[3];
const day1Lunch = MEAL_SESSIONS[0];

export const REDEMPTIONS: Redemption[] = Array.from({ length: 250 }, (_, i): Redemption => {
  const pass = pick(rng, PASSES);
  const isDuplicate = i >= 244; // exactly 6 flagged duplicates
  const session = i % 2 === 0 ? liveLunch : day1Lunch;
  return {
    id: makeId(rng, "rdm"),
    mealSessionId: session.id,
    passId: pass.id,
    counterId: pick(rng, COUNTERS.filter((c) => c.active)).id,
    result: isDuplicate ? "duplicate" : "ok",
    foodPreference: weighted(rng, [["veg", 65], ["non_veg", 28], ["jain", 7]] as const),
    at: new Date(Date.UTC(2026, 6, session === liveLunch ? 18 : 17, int(rng, 6, 9), int(rng, 0, 59))).toISOString(),
  };
});

/* ── Communications ───────────────────────────────────────────────────── */

export const COMM_TEMPLATES: CommTemplate[] = [
  {
    id: makeId(rng, "tpl"),
    orgId: ORG.id,
    name: "Registration Confirmed + QR Pass",
    channel: "whatsapp",
    subject: null,
    body: "Namaste {{firstName}}! Your pass for {{eventName}} is confirmed. Show this QR at the gate: {{passLink}}",
    approved: true,
  },
  {
    id: makeId(rng, "tpl"),
    orgId: ORG.id,
    name: "Day Reminder",
    channel: "whatsapp",
    subject: null,
    body: "Reminder: {{eventName}} opens {{dailyStart}} tomorrow at {{venue}}. Gates close {{dailyEnd}}.",
    approved: true,
  },
  {
    id: makeId(rng, "tpl"),
    orgId: ORG.id,
    name: "Registration Confirmation (Email)",
    channel: "email",
    subject: "Your {{eventName}} pass is confirmed",
    body: "Dear {{firstName}},\n\nYour registration is approved. Your QR pass is attached.\n\nMalwa Expo Co",
    approved: true,
  },
];

export const COMM_MESSAGES: CommMessage[] = Array.from({ length: 36 }, (): CommMessage => {
  const r = pick(rng, REGISTRATIONS.filter((x) => x.status === "approved"));
  const t = pick(rng, COMM_TEMPLATES);
  const status = weighted(rng, [["delivered", 62], ["read", 22], ["sent", 8], ["queued", 3], ["failed", 5]] as const);
  return {
    id: makeId(rng, "msg"),
    eventId: EVENT_EXPO.id,
    templateId: t.id,
    registrationId: r.id,
    channel: t.channel,
    status,
    sentAt: status === "queued" ? null : "2026-07-17T05:30:00.000Z",
    error: status === "failed" ? "WhatsApp BSP error 131049 (re-engagement window expired)" : null,
  };
});

/* ── Badge print jobs (P-39 seed) ─────────────────────────────────────── */
/* Most already-approved badges were printed at the desk on day 1; the last
 * 24 active passes remain unprinted so the queue has realistic content.    */

export const BADGE_PRINT_JOBS: BadgePrintJob[] = PASSES.filter((p) => p.status === "active")
  .slice(0, -24)
  .map((p) => ({
    id: makeId(rng, "prt"),
    eventId: EVENT_EXPO.id,
    passId: p.id,
    designId: BADGE_DESIGNS[0].id,
    station: pick(rng, ["desk-1", "desk-2", "desk-3"] as const),
    status: "done" as const,
    createdAt: "2026-07-16T04:30:00.000Z",
  }));

/* ── Reprint log (P-40 seed) ──────────────────────────────────────────── */

export const REPRINTS: ReprintRecord[] = (() => {
  const approved = REGISTRATIONS.filter((r) => r.status === "approved").slice(4, 6);
  return approved.map((r, i) => ({
    id: makeId(rng, "rpr"),
    eventId: EVENT_EXPO.id,
    registrationId: r.id,
    visitorName: `${r.firstName} ${r.lastName}`,
    reason: i === 0 ? "Badge lost on venue floor" : "Name misspelt on printed badge",
    actor: "Priya Deshmukh",
    supervisor: "Mukteshwar Rathore",
    oldBadgeNo: passByRegistration.get(r.id)?.badgeNo ?? "MT26-0000",
    newBadgeNo: `MT26-R${String(i + 1).padStart(3, "0")}`,
    at: i === 0 ? "2026-07-17T06:40:00.000Z" : "2026-07-17T09:15:00.000Z",
  }));
})();

/* ── Lookup helpers ───────────────────────────────────────────────────── */

export const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));
export const gateById = new Map(GATES.map((g) => [g.id, g]));
export const counterById = new Map(COUNTERS.map((c) => [c.id, c]));
export const passById = new Map(PASSES.map((p) => [p.id, p]));
export const registrationById = new Map(REGISTRATIONS.map((r) => [r.id, r]));
export { passByRegistration };

/** Counts snapshot used by /api/mock-status. */
export function fixtureCounts() {
  return {
    orgs: 1,
    users: USERS.length,
    events: EVENTS.length,
    categories: CATEGORIES.length,
    formVersions: FORM_VERSIONS.length,
    registrations: REGISTRATIONS.length,
    registrationsByStatus: REGISTRATIONS.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {}),
    passes: PASSES.length,
    exhibitors: EXHIBITORS.length,
    exhibitorStaff: EXHIBITOR_STAFF.length,
    badgeDesigns: BADGE_DESIGNS.length,
    gates: GATES.length,
    devices: DEVICES.length,
    checkins: CHECKINS.length,
    sessions: EVENT_SESSIONS.length,
    mealSessions: MEAL_SESSIONS.length,
    counters: COUNTERS.length,
    redemptions: REDEMPTIONS.length,
    duplicateRedemptions: REDEMPTIONS.filter((r) => r.result === "duplicate").length,
    commTemplates: COMM_TEMPLATES.length,
    commMessages: COMM_MESSAGES.length,
  };
}
