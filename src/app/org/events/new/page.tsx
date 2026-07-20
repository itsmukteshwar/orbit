"use client";

import { PlaceholderPage } from "@/components/kit/PlaceholderPage";

export default function CreateEventPage() {
  return (
    <PlaceholderPage
      title="Create Event"
      pattern="FORM"
      breadcrumbs={[
        { label: "Organization", href: "/org/dashboard" },
        { label: "Events", href: "/org/events" },
        { label: "Create" },
      ]}
    />
  );
}
