"use client";

/**
 * Mock role context (zustand). The Header user-menu switcher writes here;
 * nav filtering and route guards read from it. Session-scoped by design.
 */

import { create } from "zustand";
import type { Role } from "@/types/domain";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  org_admin: "Org Admin",
  event_manager: "Event Manager",
  desk: "Registration Desk",
  scanner: "Gate Scanner",
  food_operator: "Food Operator",
  catering_supervisor: "Catering Supervisor",
  super_admin: "Super Admin",
};

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  role: "org_admin",
  setRole: (role) => set({ role }),
}));

/* ── Route access map (prefix → allowed roles) ────────────────────────── */

const MANAGERS: Role[] = ["owner", "org_admin", "event_manager", "super_admin"];
const ALL: Role[] = ["owner", "org_admin", "event_manager", "desk", "scanner", "food_operator", "catering_supervisor", "super_admin"];

/** First matching prefix wins — order from most to least specific. */
const ROUTE_ACCESS: Array<[prefix: string, roles: Role[]]> = [
  ["/dashboard/super-admin", ["super_admin"]],
  ["/org/settings", ["owner", "org_admin", "super_admin"]],
  ["/org/team", ["owner", "org_admin", "super_admin"]],
  ["/org/events", MANAGERS.concat()], // event tree gates below
  ["/org", MANAGERS.concat()],
  ["/visitors/register", ["owner", "org_admin", "event_manager", "desk", "super_admin"]],
  ["/visitors", MANAGERS.concat("desk")],
  ["/onsite/food-coupons", ["owner", "org_admin", "event_manager", "food_operator", "catering_supervisor", "super_admin"]],
  ["/dashboard", MANAGERS.concat()],
  ["/styleguide", ALL],
];

export function canAccess(pathname: string, role: Role): boolean {
  const match = ROUTE_ACCESS.find(([prefix]) => pathname.startsWith(prefix));
  if (!match) return true; // unknown routes are open (placeholders, auth, 404)
  return match[1].includes(role);
}
