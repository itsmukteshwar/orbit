/**
 * StatusBadge — extends the existing Badge with domain status → tone mapping.
 * One place to keep status colours consistent across every screen.
 */

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type {
  CommMessageStatus, EventStatus, MealWindowStatus, RegistrationStatus,
} from "@/types/domain";

type KnownStatus =
  | RegistrationStatus
  | EventStatus
  | CommMessageStatus
  | MealWindowStatus
  | "active" | "revoked" | "expired" // pass
  | "synced" | "offline" // device
  | "ok" | "duplicate" | "invalid" | "not_entitled" | "window_closed"; // scan results

const STATUS_TONE: Record<KnownStatus, BadgeVariant> = {
  /* registration */
  pending: "warning",
  approved: "success",
  rejected: "danger",
  revoked: "neutral",
  /* event */
  draft: "neutral",
  published: "primary",
  live: "success",
  completed: "neutral",
  archived: "neutral",
  /* comm message */
  queued: "warning",
  sent: "primary",
  delivered: "success",
  read: "success",
  failed: "danger",
  /* meal window */
  upcoming: "primary",
  closed: "neutral",
  invite_only: "secondary",
  /* pass */
  active: "success",
  expired: "neutral",
  /* device */
  synced: "success",
  offline: "warning",
  /* scan results */
  ok: "success",
  duplicate: "danger",
  invalid: "danger",
  not_entitled: "danger",
  window_closed: "warning",
};

const LABELS: Partial<Record<KnownStatus, string>> = {
  invite_only: "Invite Only",
  not_entitled: "Not Entitled",
  window_closed: "Window Closed",
};

interface StatusBadgeProps {
  status: KnownStatus;
  /** Live-ish statuses get a dot automatically; override here. */
  dot?: boolean;
}

const DOT_STATUSES: ReadonlySet<KnownStatus> = new Set(["live", "approved", "synced", "ok", "offline"]);

export function StatusBadge({ status, dot }: StatusBadgeProps) {
  const label =
    LABELS[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={STATUS_TONE[status]} dot={dot ?? DOT_STATUSES.has(status)}>
      {label}
    </Badge>
  );
}
