"use client";

/**
 * PlaceholderPage — stub for routes whose real screens land in later phases.
 * Wrapped in RouteGuard so role-based access already applies.
 */

import { Construction } from "lucide-react";
import { PageHeader, type Crumb } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/kit/EmptyState";
import { RouteGuard } from "@/components/kit/RouteGuard";

interface PlaceholderPageProps {
  title: string;
  breadcrumbs?: Crumb[];
  /** Which PATTERNS.md layout the real screen will use. */
  pattern?: "DASHBOARD" | "LIST" | "FORM" | "OPS";
  description?: string;
}

export function PlaceholderPage({ title, breadcrumbs, pattern, description }: PlaceholderPageProps) {
  return (
    <RouteGuard>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      <Card>
        <EmptyState
          icon={Construction}
          title={`${title} is coming soon`}
          description={
            description ??
            `This module is scaffolded and reachable — the full screen ships in an upcoming phase${pattern ? ` using the ${pattern} pattern` : ""}.`
          }
        />
      </Card>
    </RouteGuard>
  );
}
