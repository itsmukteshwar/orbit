"use client";

/**
 * Global error boundary — Blueprint §10.1: show cached data where possible,
 * otherwise a calm retry screen. Mock failures (window.__mockErrors) land here
 * when a page-level query throws.
 */

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/kit/EmptyState";
import { Button } from "@/components/kit/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[orbit] route error:", error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={
          error.message.startsWith("Mock failure")
            ? "The mock error toggle (window.__mockErrors) tripped this request. Your cached data is safe — retry to continue."
            : "An unexpected error occurred while loading this page. Recently loaded data is still cached — retrying usually fixes it."
        }
        action={
          <Button variant="primary" icon={RefreshCw} onClick={reset}>
            Retry
          </Button>
        }
      />
    </Card>
  );
}
