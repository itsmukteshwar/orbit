"use client";

/**
 * P-16 — Team Management (/org/team)
 * Members DataTable · Invite modal · Pending invites · Deactivate guard.
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { DataTable } from "@/components/kit/DataTable";
import { EmptyState } from "@/components/kit/EmptyState";
import { ConfirmDialog } from "@/components/kit/ConfirmDialog";
import { Modal } from "@/components/kit/Modal";
import { FormField, TextInput, SelectInput } from "@/components/kit/inputs";
import { toastError, toastSuccess, toastInfo } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { orgService } from "@/services/org";
import { ORG } from "@/mocks/fixtures";
import type { Role, User } from "@/types/domain";
import { ROLE_LABELS } from "@/lib/roles";
import { runtimeId } from "@/services/mock/util";

/* ── Role chip ───────────────────────────────────────────────────────────── */

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";

const ROLE_TONE: Record<Role, BadgeTone> = {
  owner: "neutral",
  org_admin: "primary",
  event_manager: "secondary",
  desk: "info",
  scanner: "success",
  food_operator: "warning",
  catering_supervisor: "warning",
  super_admin: "danger",
};

function RoleChip({ role }: { role: Role }) {
  return <Badge variant={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>;
}

/* ── Fake last-active per user index ─────────────────────────────────────── */

const LAST_ACTIVE = [
  "Active now",
  "2 min ago",
  "1h ago",
  "3h ago",
  "Yesterday",
  "3 days ago",
  "1 week ago",
  "2 weeks ago",
];

/* ── Invitable roles ─────────────────────────────────────────────────────── */

type InvitableRole = "org_admin" | "event_manager" | "desk" | "scanner" | "food_operator";

const INVITE_ROLES: { value: InvitableRole; label: string; description: string }[] = [
  { value: "org_admin", label: "Org Admin", description: "Full access to all events and settings" },
  { value: "event_manager", label: "Event Manager", description: "Manages assigned events end-to-end" },
  { value: "desk", label: "Registration Desk", description: "Walk-in registration and badge reprint" },
  { value: "scanner", label: "Gate Scanner", description: "QR check-in at entry / exit gates" },
  { value: "food_operator", label: "Food Operator", description: "Coupon scanning at food counters" },
];

/* ── Pending invite type ─────────────────────────────────────────────────── */

interface PendingInvite {
  id: string;
  email: string;
  role: InvitableRole;
  sentAt: string;
  revoked: boolean;
}

/* ── Invite form schema ──────────────────────────────────────────────────── */

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["org_admin", "event_manager", "desk", "scanner", "food_operator"] as const, {
    error: "Select a role",
  }),
});

type InviteInput = z.infer<typeof inviteSchema>;

/* ── Invite Modal ────────────────────────────────────────────────────────── */

function InviteModal({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: (invite: PendingInvite) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "event_manager" },
  });

  const selectedRole = watch("role");
  const roleInfo = INVITE_ROLES.find((r) => r.value === selectedRole);

  function submit(data: InviteInput) {
    const invite: PendingInvite = {
      id: runtimeId("inv"),
      email: data.email,
      role: data.role,
      sentAt: new Date().toISOString(),
      revoked: false,
    };
    onSent(invite);
    toastSuccess(`Invite sent to ${data.email}`);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Invite team member"
      subtitle="They'll receive an email with a link to join your organisation."
      size="md"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FormField label="Email address" required error={errors.email?.message}>
          <TextInput
            {...register("email")}
            type="email"
            placeholder="colleague@company.com"
            error={!!errors.email}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </FormField>

        <FormField label="Role" required error={errors.role?.message}>
          <SelectInput {...register("role")} error={!!errors.role}>
            {INVITE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </SelectInput>
          {roleInfo && (
            <p className="mt-1 text-[11px] text-slate-400">{roleInfo.description}</p>
          )}
        </FormField>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" type="button" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" icon={Mail} disabled={isSubmitting}>
            Send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Pending invites section ─────────────────────────────────────────────── */

function PendingInvitesSection({
  invites,
  onResend,
  onRevoke,
}: {
  invites: PendingInvite[];
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const active = invites.filter((i) => !i.revoked);
  if (active.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Pending Invitations"
        subtitle={`${active.length} invite${active.length !== 1 ? "s" : ""} awaiting acceptance`}
      />
      <ul className="divide-y divide-slate-100">
        {active.map((inv) => {
          const roleLabel = INVITE_ROLES.find((r) => r.value === inv.role)?.label ?? inv.role;
          const sentAgo = (() => {
            const ms = Date.now() - new Date(inv.sentAt).getTime();
            if (ms < 60_000) return "just now";
            if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
            if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
            return `${Math.floor(ms / 86_400_000)}d ago`;
          })();

          return (
            <li key={inv.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Mail className="h-4 w-4 text-slate-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800">{inv.email}</p>
                <p className="text-[11px] text-slate-400">
                  Sent {sentAgo} · {roleLabel}
                </p>
              </div>
              <Badge variant={ROLE_TONE[inv.role]}>{roleLabel}</Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  icon={RefreshCw}
                  iconOnly
                  aria-label="Resend invite"
                  onClick={() => onResend(inv.id)}
                />
                <Button
                  variant="ghost"
                  icon={Trash2}
                  iconOnly
                  aria-label="Revoke invite"
                  onClick={() => onRevoke(inv.id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function OrgTeamPage() {
  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set());
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const { data: membersData, isLoading } = useQuery({
    queryKey: queryKeys.orgs.team(ORG.id),
    queryFn: () => orgService.teamMembers(ORG.id),
  });

  // Exclude super_admin (different org) and show org members only
  const members = (membersData ?? []).filter((u) => u.orgId === ORG.id);

  const activeOwners = members.filter(
    (u) => u.role === "owner" && !deactivatedIds.has(u.id),
  );

  /* Check if deactivating this user would remove the last owner */
  function isLastOwner(user: User): boolean {
    return user.role === "owner" && activeOwners.length <= 1;
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    // Simulate async
    await new Promise((r) => setTimeout(r, 400));
    setDeactivatedIds((prev) => new Set([...prev, deactivateTarget.id]));
    toastSuccess(`${deactivateTarget.name} has been deactivated`);
    setDeactivateTarget(null);
    setDeactivating(false);
  }

  function handleResend(id: string) {
    const inv = pendingInvites.find((i) => i.id === id);
    if (inv) {
      toastSuccess(`Invite resent to ${inv.email}`);
    }
  }

  function handleRevoke(id: string) {
    setPendingInvites((prev) =>
      prev.map((i) => (i.id === id ? { ...i, revoked: true } : i)),
    );
    toastInfo("Invite revoked");
  }

  /* Table columns */
  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        id: "member",
        header: "Member",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orbit-50 text-xs font-semibold text-orbit-600">
                {u.avatarInitials}
              </span>
              <div>
                <p className="font-medium text-slate-800">{u.name}</p>
                <p className="text-[12px] text-slate-400">{u.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => <RoleChip role={row.original.role} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const active = !deactivatedIds.has(row.original.id);
          return (
            <Badge variant={active ? "success" : "neutral"} dot={active}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "lastActive",
        header: "Last Active",
        cell: ({ row }) => {
          const idx = members.indexOf(row.original);
          return (
            <span className="text-[13px] text-slate-500">
              {deactivatedIds.has(row.original.id)
                ? "—"
                : LAST_ACTIVE[idx] ?? "1 month ago"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const u = row.original;
          const inactive = deactivatedIds.has(u.id);
          if (inactive) return null;
          return (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                icon={UserX}
                iconOnly
                aria-label={`Deactivate ${u.name}`}
                onClick={() => {
                  if (isLastOwner(u)) {
                    toastError("Cannot deactivate — this is the only owner");
                    return;
                  }
                  setDeactivateTarget(u);
                }}
              />
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deactivatedIds, members],
  );

  return (
    <>
      <PageHeader
        title="Team"
        breadcrumbs={[{ label: "Organisation", href: "/org/dashboard" }, { label: "Team" }]}
        subtitle={`${members.length} member${members.length !== 1 ? "s" : ""} · ${activeOwners.length} owner${activeOwners.length !== 1 ? "s" : ""}`}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowInvite(true)}>
            Invite member
          </Button>
        }
      />

      {/* Pending invites */}
      <PendingInvitesSection
        invites={pendingInvites}
        onResend={handleResend}
        onRevoke={handleRevoke}
      />

      {/* Members table */}
      <Card className="overflow-hidden">
        <DataTable
          columns={columns}
          data={members}
          loading={isLoading}
          getRowId={(u) => u.id}
          emptyState={
            <EmptyState
              icon={Users}
              title="No team members"
              description="Invite your first team member to get started."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setShowInvite(true)}>
                  Invite member
                </Button>
              }
            />
          }
        />
      </Card>

      {/* Invite modal */}
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onSent={(inv) => setPendingInvites((prev) => [inv, ...prev])}
      />

      {/* Deactivate dialog */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate member"
        description={
          <>
            <strong>{deactivateTarget?.name}</strong> ({deactivateTarget?.email}) will lose access
            immediately. You can re-invite them at any time.
          </>
        }
        confirmText={deactivateTarget?.name ?? ""}
        actionLabel="Deactivate"
        loading={deactivating}
      />
    </>
  );
}
