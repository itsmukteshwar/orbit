"use client";

/**
 * RouteGuard — role-aware access check for guarded pages.
 * Renders a "no access" screen (Blueprint §10.1 pattern) instead of children
 * when the current mock role lacks permission.
 */

import { usePathname, useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";
import { canAccess, ROLE_LABELS, useRoleStore } from "@/lib/roles";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/kit/EmptyState";
import { Button } from "@/components/kit/Button";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRoleStore((s) => s.role);

  if (!canAccess(pathname, role)) {
    return (
      <Card>
        <EmptyState
          icon={ShieldX}
          title="You don't have access to this page"
          description={`Your current role (${ROLE_LABELS[role]}) can't view this area. Switch roles from the user menu, or ask an admin for access.`}
          action={
            <Button variant="secondary" onClick={() => router.back()}>
              Go back
            </Button>
          }
        />
      </Card>
    );
  }

  return <>{children}</>;
}
