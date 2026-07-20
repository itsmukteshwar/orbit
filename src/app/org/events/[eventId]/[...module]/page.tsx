import { PlaceholderPage } from "@/components/kit/PlaceholderPage";

const TITLES: Record<string, string> = {
  exhibitors: "Exhibitors",
  stalls: "Stall Allocation",
  leads: "Lead Retrieval",
  badges: "Badge Designs",
  "print-queue": "Print Queue",
  checkin: "Gates & Devices",
  logs: "Entry / Exit Logs",
  redemptions: "Redemption Log",
  counters: "Counters",
  communications: "Templates",
  messages: "Message Log",
  reports: "Analytics",
  exports: "Exports",
  settings: "Event Settings",
  danger: "Danger Zone",
  approvals: "Approvals",
  forms: "Form Builder",
  categories: "Visitor Categories",
  food: "Meal Windows",
};

const titleOf = (segment: string): string =>
  TITLES[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Catch-all placeholder for every not-yet-built event module route (P-06e). */
export default async function EventModulePage({
  params,
}: {
  params: Promise<{ eventId: string; module: string[] }>;
}) {
  const { eventId, module } = await params;
  const leaf = module[module.length - 1];
  const crumbs = [
    { label: "Events", href: "/org/events" },
    ...module.slice(0, -1).map((seg, i) => ({
      label: titleOf(seg),
      href: `/org/events/${eventId}/${module.slice(0, i + 1).join("/")}`,
    })),
    { label: titleOf(leaf) },
  ];

  return <PlaceholderPage title={titleOf(leaf)} breadcrumbs={crumbs} />;
}
