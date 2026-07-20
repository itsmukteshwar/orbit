"use client";

/**
 * P-24 — Registration Detail Drawer
 * Header: name, category chip, StatusBadge, QR thumbnail placeholder.
 * Tabs: Profile (all fields from form version) · Timeline · Actions.
 * All actions optimistic with audit toasts.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Lock,
  Mail,
  MessageSquare,
  Printer,
  QrCode,
  RefreshCw,
  Send,
  ShieldOff,
  Tag,
  Utensils,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Drawer } from "@/components/kit/Drawer";
import { Modal } from "@/components/kit/Modal";
import { Button } from "@/components/kit/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/kit/StatusBadge";
import { ConfirmDialog } from "@/components/kit/ConfirmDialog";
import { FormField as KitFormField, TextInput, SelectInput, Textarea } from "@/components/kit/inputs";
import { toastSuccess, toastError, toastInfo } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { registrationService } from "@/services/registration";
import { badgeService } from "@/services/badge";
import { db } from "@/services/mock/db";
import { cn, formatPaise } from "@/lib/utils";
import type { Registration, VisitorCategory } from "@/types/domain";

/* ── Timeline builder ────────────────────────────────────────────────────── */

interface TimelineEntry {
  icon: React.ElementType;
  label: string;
  detail?: string;
  at: string | null;
  done: boolean;
  tone: "ok" | "warn" | "muted";
}

function buildTimeline(reg: Registration): TimelineEntry[] {
  const pass = db.passes.find((p) => p.registrationId === reg.id);
  const checkins = pass
    ? db.checkins.filter((c) => c.passId === pass.id && c.result === "ok")
    : [];
  const redemptions = pass
    ? db.redemptions.filter((r) => r.passId === pass.id && r.result === "ok")
    : [];

  return [
    {
      icon: UserPlus,
      label: "Registered",
      detail: `via ${reg.source.replace(/_/g, " ")}`,
      at: reg.createdAt,
      done: true,
      tone: "ok",
    },
    {
      icon: reg.status === "rejected" ? XCircle : CheckCircle2,
      label:
        reg.status === "rejected"
          ? "Rejected"
          : reg.status === "revoked"
            ? "Approved (later revoked)"
            : "Approved",
      detail: reg.reviewedBy ? `by reviewer` : undefined,
      at: reg.reviewedAt,
      done: reg.status !== "pending",
      tone: reg.status === "rejected" ? "warn" : "ok",
    },
    {
      icon: Send,
      label: "Pass sent",
      detail: pass ? `Badge ${pass.badgeNo}` : undefined,
      at: pass?.issuedAt ?? null,
      done: !!pass,
      tone: pass?.status === "revoked" ? "warn" : "ok",
    },
    {
      icon: CalendarCheck,
      label: checkins.length > 0 ? `Checked in ×${checkins.length}` : "Checked in",
      detail: checkins[0] ? new Date(checkins[0].at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : undefined,
      at: checkins[0]?.at ?? null,
      done: checkins.length > 0,
      tone: "ok",
    },
    {
      icon: Utensils,
      label: redemptions.length > 0 ? `Meals redeemed ×${redemptions.length}` : "Meals redeemed",
      at: redemptions[0]?.at ?? null,
      done: redemptions.length > 0,
      tone: "ok",
    },
  ];
}

/* ── Reject reason modal ─────────────────────────────────────────────────── */

function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) setReason(""); }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Registration"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={loading} onClick={() => onConfirm(reason)}>
            {loading ? "Rejecting…" : "Reject"}
          </Button>
        </>
      }
    >
      <KitFormField label="Reason (sent to visitor)">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Duplicate registration / incomplete details"
          rows={3}
        />
      </KitFormField>
    </Modal>
  );
}

/* ── Resend pass modal ───────────────────────────────────────────────────── */

function ResendModal({
  open,
  onClose,
  email,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  email: string | null;
  phone: string;
}) {
  const [channel, setChannel] = useState<"email" | "whatsapp" | "sms">("whatsapp");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resend Pass"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={() => {
              toastSuccess(`Pass resent via ${channel === "email" ? `email to ${email}` : `${channel} to ${phone}`}`);
              onClose();
            }}
          >
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {[
          { value: "whatsapp" as const, label: "WhatsApp", icon: MessageSquare, to: `+91 ${phone}` },
          { value: "sms" as const, label: "SMS", icon: MessageSquare, to: `+91 ${phone}` },
          { value: "email" as const, label: "Email", icon: Mail, to: email ?? "no email on file", disabled: !email },
        ].map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
              channel === opt.value ? "border-orbit-300 bg-orbit-50/50" : "border-slate-200 hover:bg-slate-50",
              opt.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name="channel"
              value={opt.value}
              checked={channel === opt.value}
              disabled={opt.disabled}
              onChange={() => setChannel(opt.value)}
              className="accent-orbit-500"
            />
            <opt.icon className="h-4 w-4 text-slate-400" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-700">{opt.label}</p>
              <p className="text-[11px] text-slate-400">{opt.to}</p>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
}

/* ── Supervisor PIN modal (reprint badge) ────────────────────────────────── */

function PinModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the reprint reason; the PIN identifies the supervisor. */
  onConfirm: (reason: string) => void;
  loading?: boolean;
}) {
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) { setPin(""); setReason(""); } }, [open]);
  const valid = pin === "1234" && reason.trim().length >= 4; // mock supervisor PIN
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500" /> Supervisor Approval
        </span>
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Printer}
            disabled={!valid || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading ? "Reprinting…" : "Reprint Badge"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-slate-600">
          Badge reprints require a supervisor PIN. The old QR is invalidated and every reprint is
          logged for audit.
        </p>
        <KitFormField label="Reason" hint="e.g. badge lost, name misspelt">
          <TextInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is a reprint needed?"
            autoFocus
          />
        </KitFormField>
        <KitFormField label="Supervisor PIN" hint="Demo PIN: 1234">
          <TextInput
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="text-center font-mono text-lg tracking-[0.5em]"
          />
        </KitFormField>
      </div>
    </Modal>
  );
}

/* ── Change category modal ───────────────────────────────────────────────── */

function ChangeCategoryModal({
  open,
  onClose,
  categories,
  currentId,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  categories: VisitorCategory[];
  currentId: string;
  onConfirm: (categoryId: string) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState(currentId);
  useEffect(() => { if (open) setSelected(currentId); }, [open, currentId]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Category"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={selected === currentId || loading}
            onClick={() => onConfirm(selected)}
          >
            {loading ? "Changing…" : "Change Category"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <KitFormField label="New category">
          <SelectInput value={selected} onChange={(e) => setSelected(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.pricePaise > 0 ? ` — ${formatPaise(c.pricePaise)}` : " — Free"}
              </option>
            ))}
          </SelectInput>
        </KitFormField>
        {selected !== currentId && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[12px] text-amber-700">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Changing category will <strong>force a badge reprint</strong> and{" "}
            <strong>re-entitle meals</strong> based on the new category.
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Main drawer ─────────────────────────────────────────────────────────── */

export function RegistrationDrawer({
  registrationId,
  eventId,
  onClose,
}: {
  registrationId: string | null;
  eventId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"profile" | "timeline" | "actions">("profile");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => { setTab("profile"); }, [registrationId]);

  const { data: reg } = useQuery({
    queryKey: queryKeys.registrations.detail(registrationId ?? ""),
    queryFn: () => registrationService.get(registrationId!),
    enabled: !!registrationId,
  });

  const category = useMemo(
    () => (reg ? db.categories.find((c) => c.id === reg.categoryId) : null),
    [reg],
  );
  const categories = useMemo(
    () => db.categories.filter((c) => c.eventId === eventId),
    [eventId],
  );
  const formVersion = useMemo(
    () => (reg ? db.formVersions.find((f) => f.id === reg.formVersionId) : null),
    [reg],
  );
  const timeline = useMemo(() => (reg ? buildTimeline(reg) : []), [reg]);

  function invalidate() {
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.detail(registrationId ?? "") });
  }

  const approveMutation = useMutation({
    mutationFn: () => registrationService.approve(registrationId!, "usr_admin"),
    onSuccess: ({ pass }) => {
      invalidate();
      toastSuccess(`Approved — pass ${pass.badgeNo} issued · audit logged`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Approve failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: (_reason: string) => registrationService.reject(registrationId!, "usr_admin"),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      toastSuccess("Registration rejected · audit logged");
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Reject failed"),
  });

  /* P-40: reprint rotates the QR, logs a ReprintRecord, queues a print job. */
  const reprintMutation = useMutation({
    mutationFn: (reason: string) =>
      badgeService.reprint({
        registrationId: registrationId!,
        reason,
        actor: "Priya Deshmukh",
        supervisor: "Mukteshwar Rathore",
      }),
    onSuccess: (record) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.badges.all() });
      setPinOpen(false);
      toastSuccess(`Badge ${record.oldBadgeNo} voided → ${record.newBadgeNo} queued · reprint logged`);
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Reprint failed"),
  });

  const revokeMutation = useMutation({
    mutationFn: () => registrationService.revoke(registrationId!, "usr_admin"),
    onSuccess: () => {
      invalidate();
      setRevokeOpen(false);
      toastSuccess("Pass revoked — QR is now invalid · audit logged");
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Revoke failed"),
  });

  const changeCatMutation = useMutation({
    mutationFn: (categoryId: string) => registrationService.update(registrationId!, { categoryId }),
    onSuccess: () => {
      invalidate();
      setCatOpen(false);
      toastSuccess("Category changed — badge queued for reprint, meals re-entitled · audit logged");
    },
    onError: () => toastError("Category change failed"),
  });

  if (!registrationId) return null;

  const fullName = reg ? `${reg.firstName} ${reg.lastName}` : "";
  const maskedPhone = reg ? `${reg.phone.slice(0, 2)}•••••${reg.phone.slice(-3)}` : "";

  const TABS = [
    { id: "profile" as const, label: "Profile" },
    { id: "timeline" as const, label: "Timeline" },
    { id: "actions" as const, label: "Actions" },
  ];

  return (
    <>
      <Drawer
        open={!!registrationId}
        onClose={onClose}
        size="xl"
        title={
          reg ? (
            <span className="flex items-center gap-2">
              {fullName}
              <StatusBadge status={reg.status} />
            </span>
          ) : "Loading…"
        }
        subtitle={reg ? `${category?.name ?? "—"} · ${reg.company ?? "No company"}` : undefined}
      >
        {reg && (
          <div className="space-y-4">
            {/* Header card: QR + summary */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4">
              {/* QR placeholder */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white">
                <QrCode className="h-9 w-9 text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {category && <Badge variant={category.color}>{category.name}</Badge>}
                  <StatusBadge status={reg.status} />
                </div>
                <p className="mt-1.5 text-[13px] text-slate-600">{maskedPhone} · {reg.email ?? "no email"}</p>
                <p className="text-[12px] text-slate-400">
                  {reg.city}, {reg.state} · Registered {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-100">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
                    tab === t.id
                      ? "border-orbit-500 text-orbit-600"
                      : "border-transparent text-slate-400 hover:text-slate-600",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Profile tab */}
            {tab === "profile" && (
              <dl className="space-y-3">
                {[
                  { label: "First name", value: reg.firstName },
                  { label: "Last name", value: reg.lastName },
                  { label: "Phone", value: `+91 ${reg.phone}` },
                  { label: "Email", value: reg.email ?? "—" },
                  { label: "Company", value: reg.company ?? "—" },
                  { label: "Designation", value: reg.designation ?? "—" },
                  { label: "City / State", value: `${reg.city}, ${reg.state}` },
                  { label: "Gender", value: reg.gender },
                  { label: "Food preference", value: reg.foodPreference.replace("_", "-") },
                  { label: "Days attending", value: reg.daysAttending.map((d) => `Day ${d}`).join(", ") },
                  { label: "Amount", value: reg.amountPaise > 0 ? formatPaise(reg.amountPaise) : "Free" },
                  { label: "Source", value: reg.source.replace(/_/g, " ") },
                  { label: "Form version", value: formVersion ? `v${formVersion.version} (${formVersion.status})` : "—" },
                ].map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-slate-50 pb-2">
                    <dt className="text-[12px] text-slate-400">{row.label}</dt>
                    <dd className="text-right text-[13px] font-medium capitalize text-slate-700">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Timeline tab */}
            {tab === "timeline" && (
              <ol className="relative space-y-5 pl-6">
                <div className="absolute bottom-1 left-[9px] top-1 w-px bg-slate-100" />
                {timeline.map((entry) => (
                  <li key={entry.label} className="relative">
                    <span
                      className={cn(
                        "absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full",
                        entry.done
                          ? entry.tone === "warn"
                            ? "bg-red-100 text-red-500"
                            : "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-300",
                      )}
                    >
                      <entry.icon className="h-3 w-3" />
                    </span>
                    <p className={cn(
                      "text-[13px] font-medium",
                      entry.done ? "text-slate-800" : "text-slate-300",
                    )}>
                      {entry.label}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {entry.at
                        ? new Date(entry.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : entry.done ? "" : "Not yet"}
                      {entry.detail ? ` · ${entry.detail}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {/* Actions tab */}
            {tab === "actions" && (
              <div className="space-y-2">
                {reg.status === "pending" && (
                  <>
                    <ActionRow
                      icon={CheckCircle2}
                      label="Approve"
                      description="Issues a pass and sends it to the visitor"
                      tone="ok"
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    />
                    <ActionRow
                      icon={XCircle}
                      label="Reject"
                      description="Declines with an optional reason"
                      tone="danger"
                      onClick={() => setRejectOpen(true)}
                    />
                  </>
                )}
                {reg.status === "approved" && (
                  <>
                    <ActionRow
                      icon={Send}
                      label="Resend pass"
                      description="Send the QR pass again via WhatsApp / SMS / email"
                      tone="neutral"
                      onClick={() => setResendOpen(true)}
                    />
                    <ActionRow
                      icon={Printer}
                      label="Reprint badge"
                      description="Requires supervisor PIN — logged for audit"
                      tone="neutral"
                      onClick={() => setPinOpen(true)}
                    />
                    <ActionRow
                      icon={Tag}
                      label="Change category"
                      description="Forces badge reprint + meal re-entitlement"
                      tone="neutral"
                      onClick={() => setCatOpen(true)}
                    />
                    <ActionRow
                      icon={ShieldOff}
                      label="Revoke pass"
                      description="Invalidates the QR — typed confirmation required"
                      tone="danger"
                      onClick={() => setRevokeOpen(true)}
                    />
                  </>
                )}
                {(reg.status === "rejected" || reg.status === "revoked") && (
                  <div className="rounded-lg bg-slate-50 p-4 text-center text-[13px] text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                    No actions available for {reg.status} registrations.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modals */}
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        loading={rejectMutation.isPending}
      />
      <ResendModal
        open={resendOpen}
        onClose={() => setResendOpen(false)}
        email={reg?.email ?? null}
        phone={reg?.phone ?? ""}
      />
      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={(reason) => reprintMutation.mutate(reason)}
        loading={reprintMutation.isPending}
      />
      <ChangeCategoryModal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        categories={categories}
        currentId={reg?.categoryId ?? ""}
        onConfirm={(id) => changeCatMutation.mutate(id)}
        loading={changeCatMutation.isPending}
      />
      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => revokeMutation.mutate()}
        title="Revoke Pass"
        description={
          <>
            <strong>{fullName}</strong>&apos;s QR pass will stop working immediately at all gates
            and food counters.
          </>
        }
        confirmText={fullName}
        actionLabel="Revoke Pass"
        loading={revokeMutation.isPending}
      />
    </>
  );
}

/* ── Action row ──────────────────────────────────────────────────────────── */

function ActionRow({
  icon: Icon,
  label,
  description,
  tone,
  onClick,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  tone: "ok" | "danger" | "neutral";
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
        tone === "danger"
          ? "border-red-100 hover:border-red-200 hover:bg-red-50/50"
          : tone === "ok"
            ? "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/50"
            : "border-slate-200 hover:bg-slate-50",
        loading && "opacity-60",
      )}
    >
      <span className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        tone === "danger" ? "bg-red-50 text-red-500" : tone === "ok" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-slate-800">
          {loading ? "Working…" : label}
        </span>
        <span className="block text-[12px] text-slate-400">{description}</span>
      </span>
    </button>
  );
}
