import Link from "next/link";
import { Compass } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/kit/EmptyState";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved. Check the address, or head back to your dashboard."
        action={
          <Link
            href="/dashboard/organizer"
            className="flex h-9 items-center gap-2 rounded-lg bg-orbit-500 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-orbit-600"
          >
            Go to dashboard
          </Link>
        }
      />
    </Card>
  );
}
