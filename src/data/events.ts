export type EventStatus = "Live" | "Upcoming" | "Completed";

export interface EventSummary {
  name: string;
  status: EventStatus;
}

/** Events available in the event-dashboard switcher. */
export const EVENTS: EventSummary[] = [
  { name: "Green Bharat Expo V.2 2026", status: "Live" },
  { name: "Bharat Tech Expo 2026", status: "Upcoming" },
  { name: "Jaipur Handicrafts Fair", status: "Upcoming" },
  { name: "MedTech Summit South", status: "Completed" },
  { name: "Kochi Marine Expo", status: "Completed" },
];

export interface LiveEventRow {
  event: string;
  venue: string;
  organizer: string;
  checkedIn: number;
  capacity: number;
  coupons: number;
  gateLoad: number;
  status: "Live" | "Slow Gates";
}

/** Cross-tenant live events shown on the Super Admin dashboard. */
export const LIVE_EVENTS: LiveEventRow[] = [
  { event: "Bharat Tech Expo 2026", venue: "Bharat Mandapam, New Delhi", organizer: "TechFairs India", checkedIn: 12482, capacity: 15000, coupons: 8914, gateLoad: 83, status: "Live" },
  { event: "Jaipur Handicrafts Fair", venue: "JECC, Jaipur", organizer: "Rajasthan Expo Co.", checkedIn: 6910, capacity: 9000, coupons: 5120, gateLoad: 77, status: "Live" },
  { event: "MedTech Summit South", venue: "HITEX, Hyderabad", organizer: "Confluence Events", checkedIn: 2304, capacity: 3500, coupons: 1876, gateLoad: 66, status: "Live" },
  { event: "AgriBiz Trade Fair", venue: "CIDCO Centre, Nashik", organizer: "GreenField Organisers", checkedIn: 1120, capacity: 4000, coupons: 640, gateLoad: 28, status: "Slow Gates" },
  { event: "Kochi Marine Expo", venue: "CIAL Centre, Kochi", organizer: "Kerala Expo Council", checkedIn: 3864, capacity: 5000, coupons: 2410, gateLoad: 58, status: "Live" },
];
