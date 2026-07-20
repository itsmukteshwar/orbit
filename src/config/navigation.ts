import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  ScanLine,
  Store,
  Megaphone,
  IndianRupee,
  BarChart3,
  Building2,
  LifeBuoy,
  Blocks,
  BadgeCheck,
  MessageSquare,
  Settings,
  UsersRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/domain";

export type BadgeTone = "primary" | "success" | "warning" | "danger" | "secondary";

export interface NavItem {
  label: string;
  href: string;
  badge?: { text: string; tone: BadgeTone };
}

export interface NavSection {
  /** Stable identifier — used for accordion state and rail sync. */
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  items: NavItem[];
  /** Roles allowed to see this section. Omit = visible to everyone. */
  roles?: Role[];
}

/**
 * Single source of truth for the application navigation.
 * The icon rail and the text sidebar are both rendered from this list.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "dashboards",
    label: "Dashboards",
    icon: LayoutDashboard,
    category: "Main",
    items: [
      { label: "Super Admin", href: "/dashboard/super-admin" },
      { label: "Organizer", href: "/dashboard/organizer" },
      { label: "Event", href: "/dashboard/event", badge: { text: "Live", tone: "success" } },
    ],
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    category: "Event Operations",
    items: [
      { label: "All Events", href: "#" },
      { label: "Create Event", href: "#" },
      { label: "Floor Plans", href: "#" },
      { label: "Event Website", href: "#" },
    ],
  },
  {
    id: "visitors",
    label: "Visitors",
    icon: Users,
    category: "Event Operations",
    items: [
      { label: "All Visitors", href: "/visitors", badge: { text: "14.2k", tone: "primary" } },
      { label: "Register New Visitor", href: "/visitors/register" },
      { label: "Entry / Exit Logs", href: "#" },
      { label: "Visitor Categories", href: "#" },
    ],
  },
  {
    id: "registration",
    label: "Registration",
    icon: ClipboardList,
    category: "Event Operations",
    items: [
      { label: "Registrations", href: "#" },
      { label: "Form Builder", href: "#" },
      { label: "Walk-in Desk", href: "#" },
      { label: "Approvals", href: "#", badge: { text: "18", tone: "warning" } },
    ],
  },
  {
    id: "onsite-ops",
    label: "Onsite Ops",
    icon: ScanLine,
    category: "Event Operations",
    items: [
      { label: "Badges & Passes", href: "#" },
      { label: "Badge Designer", href: "#" },
      { label: "QR Check-in & Gates", href: "#", badge: { text: "Live", tone: "success" } },
      { label: "Food Coupons", href: "/onsite/food-coupons" },
    ],
  },
  {
    id: "partners",
    label: "Partners",
    icon: Store,
    category: "Network",
    items: [
      { label: "Exhibitors", href: "#", badge: { text: "312", tone: "primary" } },
      { label: "Stall Allocation", href: "#" },
      { label: "Lead Retrieval", href: "#" },
      { label: "Sponsors", href: "#" },
      { label: "Vendors", href: "#" },
      { label: "Volunteers", href: "#" },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    icon: Megaphone,
    category: "Network",
    items: [
      { label: "CRM", href: "#" },
      { label: "Marketing", href: "#" },
      { label: "Communications", href: "#" },
      { label: "Certificates", href: "#" },
      { label: "Appointments", href: "#" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: IndianRupee,
    category: "Finance & Insights",
    items: [
      { label: "Payments", href: "#" },
      { label: "GST Invoices", href: "#" },
      { label: "Settlements", href: "#" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    category: "Finance & Insights",
    items: [
      { label: "Analytics", href: "#" },
      { label: "Reports", href: "#" },
      { label: "Audit Logs", href: "#" },
    ],
  },
  {
    id: "tenants",
    label: "Tenants",
    icon: Building2,
    category: "Administration",
    roles: ["super_admin"],
    items: [
      { label: "Organizers", href: "#", badge: { text: "148", tone: "primary" } },
      { label: "Subscriptions & Billing", href: "#" },
      { label: "Plans & Pricing", href: "#" },
      { label: "Onboarding Queue", href: "#", badge: { text: "6", tone: "warning" } },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: LifeBuoy,
    category: "Administration",
    roles: ["super_admin"],
    items: [
      { label: "Support Tickets", href: "#", badge: { text: "3", tone: "danger" } },
      { label: "Announcements", href: "#" },
      { label: "System Health", href: "#" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Blocks,
    category: "System",
    items: [
      { label: "AI Assistant", href: "#", badge: { text: "Beta", tone: "secondary" } },
      { label: "Mobile Apps", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "API & Webhooks", href: "#" },
      { label: "Team & Roles", href: "#" },
      { label: "Settings", href: "#" },
    ],
  },
];

/** Returns the section that owns the given pathname, falling back to the first section. */
export function findSectionByPath(pathname: string, sections: NavSection[] = NAV_SECTIONS): NavSection {
  return (
    sections.find((section) => section.items.some((item) => item.href !== "#" && pathname.startsWith(item.href))) ??
    sections[0]
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * P-06 — Context-aware navigation (Blueprint §6)
 * Three contexts, driven by route:
 *   EVENT  /org/events/[id]/…  → the §6.3 event module sidebar
 *   ORG    /org/…              → org-level tree
 *   LEGACY everything else     → the original NAV_SECTIONS (canon pages)
 * ═══════════════════════════════════════════════════════════════════════ */

export type NavContext = "legacy" | "org" | "event";

const MANAGER_ROLES: Role[] = ["owner", "org_admin", "event_manager", "super_admin"];
const OPS_ROLES: Role[] = ["desk", "scanner", "food_operator", "catering_supervisor"];

/** Org-level tree (Blueprint §6.2): Dashboard / Events / Team / Reports / Settings. */
export const ORG_SECTIONS: NavSection[] = [
  {
    id: "org-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    category: "Organization",
    items: [{ label: "Overview", href: "/org/dashboard" }],
  },
  {
    id: "org-events",
    label: "Events",
    icon: CalendarDays,
    category: "Organization",
    items: [
      { label: "All Events", href: "/org/events" },
      { label: "Create Event", href: "/org/events/new" },
    ],
  },
  {
    id: "org-team",
    label: "Team",
    icon: UsersRound,
    category: "Organization",
    roles: ["owner", "org_admin", "super_admin"],
    items: [
      { label: "Members & Roles", href: "/org/team" },
      { label: "Invitations", href: "/org/team/invitations" },
    ],
  },
  {
    id: "org-reports",
    label: "Reports",
    icon: BarChart3,
    category: "Organization",
    items: [
      { label: "Cross-event Analytics", href: "/org/reports" },
      { label: "Exports", href: "/org/reports/exports" },
    ],
  },
  {
    id: "org-settings",
    label: "Settings",
    icon: Settings,
    category: "Organization",
    roles: ["owner", "org_admin", "super_admin"],
    items: [
      { label: "Organization Profile", href: "/org/settings" },
      { label: "Billing & Plan", href: "/org/settings/billing" },
      { label: "Integrations", href: "/org/settings/integrations" },
    ],
  },
];

/** Event module tree (Blueprint §6.3), scoped to one event id. */
export function eventSections(eventId: string): NavSection[] {
  const base = `/org/events/${eventId}`;
  return [
    {
      id: "evt-overview",
      label: "Overview",
      icon: LayoutDashboard,
      category: "Event",
      items: [{ label: "Event Dashboard", href: `${base}/overview` }],
    },
    {
      id: "evt-registrations",
      label: "Registrations",
      icon: ClipboardList,
      category: "Event",
      roles: [...MANAGER_ROLES, "desk"],
      items: [
        { label: "All Visitors", href: `${base}/registrations` },
        { label: "Register New", href: `${base}/registrations/new` },
        { label: "Approvals", href: `${base}/registrations/approvals`, badge: { text: "18", tone: "warning" } },
        { label: "Form Builder", href: `${base}/registrations/forms` },
        { label: "Categories", href: `${base}/registrations/categories` },
      ],
    },
    {
      id: "evt-exhibitors",
      label: "Exhibitors",
      icon: Store,
      category: "Event",
      roles: MANAGER_ROLES,
      items: [
        { label: "All Exhibitors", href: `${base}/exhibitors` },
        { label: "Staff Badges", href: `${base}/exhibitors/staff` },
        { label: "Stall Allocation", href: `${base}/exhibitors/stalls` },
        { label: "Lead Retrieval", href: `${base}/exhibitors/leads` },
      ],
    },
    {
      id: "evt-badges",
      label: "Badges",
      icon: BadgeCheck,
      category: "Event",
      roles: [...MANAGER_ROLES, "desk"],
      items: [
        { label: "Badge Templates", href: `${base}/badges` },
        { label: "Print Queue", href: `${base}/badges/print-queue` },
        { label: "Reprint Log", href: `${base}/badges/reprints` },
      ],
    },
    {
      id: "evt-checkin",
      label: "Check-in",
      icon: ScanLine,
      category: "Event",
      roles: [...MANAGER_ROLES, "scanner"],
      items: [
        { label: "Gates & Devices", href: `${base}/checkin` },
        { label: "Entry / Exit Logs", href: `${base}/checkin/logs` },
      ],
    },
    {
      id: "evt-food",
      label: "Food",
      icon: Utensils,
      category: "Event",
      roles: [...MANAGER_ROLES, "food_operator", "catering_supervisor"],
      items: [
        { label: "Meal Windows", href: `${base}/food` },
        { label: "Redemption Log", href: `${base}/food/redemptions` },
        { label: "Counters", href: `${base}/food/counters` },
      ],
    },
    {
      id: "evt-comm",
      label: "Communications",
      icon: MessageSquare,
      category: "Event",
      roles: MANAGER_ROLES,
      items: [
        { label: "Templates", href: `${base}/communications` },
        { label: "Message Log", href: `${base}/communications/messages` },
      ],
    },
    {
      id: "evt-reports",
      label: "Reports",
      icon: BarChart3,
      category: "Event",
      roles: MANAGER_ROLES,
      items: [
        { label: "Analytics", href: `${base}/reports` },
        { label: "Exports", href: `${base}/reports/exports` },
      ],
    },
    {
      id: "evt-settings",
      label: "Settings",
      icon: Settings,
      category: "Event",
      roles: MANAGER_ROLES,
      items: [
        { label: "Event Settings", href: `${base}/settings` },
        { label: "Danger Zone", href: `${base}/settings/danger` },
      ],
    },
  ];
}

const EVENT_PATH_RE = /^\/org\/events\/([^/]+)\//;

/** Resolves which nav tree a pathname belongs to. */
export function resolveNavContext(pathname: string): { context: NavContext; eventId?: string } {
  const eventMatch = EVENT_PATH_RE.exec(pathname + "/");
  if (eventMatch && eventMatch[1] !== "new") return { context: "event", eventId: eventMatch[1] };
  if (pathname.startsWith("/org")) return { context: "org" };
  return { context: "legacy" };
}

/** Returns the role-filtered sections for the current route. */
export function getNavSections(pathname: string, role: Role): NavSection[] {
  const { context, eventId } = resolveNavContext(pathname);
  const sections =
    context === "event" && eventId ? eventSections(eventId) : context === "org" ? ORG_SECTIONS : NAV_SECTIONS;
  const visible = sections.filter((s) => !s.roles || s.roles.includes(role));
  /* Ops roles in the legacy tree only see their operational sections. */
  if (context === "legacy" && OPS_ROLES.includes(role)) {
    const opsAllowed = new Set(["dashboards", "visitors", "registration", "onsite-ops"]);
    return visible.filter((s) => opsAllowed.has(s.id));
  }
  return visible;
}
