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
  type LucideIcon,
} from "lucide-react";

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
export function findSectionByPath(pathname: string): NavSection {
  return (
    NAV_SECTIONS.find((section) => section.items.some((item) => item.href !== "#" && pathname.startsWith(item.href))) ??
    NAV_SECTIONS[0]
  );
}
