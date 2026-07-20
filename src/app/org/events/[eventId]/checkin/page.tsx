"use client";

/**
 * P-22 — Gates & Devices panel (/org/events/[eventId]/checkin)
 * • Gates CRUD (name, direction, location)
 * • Device list with scope chip, last-seen, pending ledger, drift warning, revoke
 * • "Generate pairing code" modal — 6-digit code, 10-min countdown, copy
 * • Revoking a device sets it offline (gated by event status via useEventStore)
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ChevronDown,
  Cpu,
  DoorOpen,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  Wifi,
  WifiOff,
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
import { toastSuccess, toastError, toastInfo } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { checkinService } from "@/services/checkin";
import { useEventStore } from "@/lib/eventStore";
import { cn } from "@/lib/utils";
import type { Gate, Device } from "@/types/domain";

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const gateSchema = z.object({
  name: z.string().min(2, "Name required"),
  location: z.string().min(2, "Location required"),
  kind: z.enum(["entry", "exit", "both"] as const),
});
type GateInput = z.infer<typeof gateSchema>;

const deviceSchema = z.object({
  label: z.string().min(2, "Label required"),
  gateId: z.string().optional(),
  scope: z.enum(["gate", "counter"] as const),
});
type DeviceInput = z.infer<typeof deviceSchema>;

/* ── Kind chip ───────────────────────────────────────────────────────────── */

const KIND_LABEL: Record<Gate["kind"], string> = {
  entry: "Entry",
  exit: "Exit",
  both: "Entry + Exit",
};
const KIND_TONE: Record<Gate["kind"], "success" | "danger" | "primary"> = {
  entry: "success",
  exit: "danger",
  both: "primary",
};

/* ── Pairing code modal ──────────────────────────────────────────────────── */

function PairingCodeModal({
  open,
  onClose,
  gates,
  eventId,
}: {
  open: boolean;
  onClose: () => void;
  gates: Gate[];
  eventId: string;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(600); // 10 min in seconds
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceInput>({
    resolver: zodResolver(deviceSchema),
    defaultValues: { scope: "gate", label: "" },
  });

  useEffect(() => {
    if (!open) { setCode(null); setExpiresAt(null); setCopied(false); reset(); }
  }, [open, reset]);

  useEffect(() => {
    if (!expiresAt) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt]);

  async function onSubmit(data: DeviceInput) {
    try {
      const result = await checkinService.generatePairingCode({
        label: data.label,
        gateId: data.scope === "gate" ? (data.gateId ?? null) : null,
        counterId: null,
        eventId,
      });
      setCode(result.code);
      setExpiresAt(new Date(result.expiresAt));
      setRemaining(600);
      void qc.invalidateQueries({ queryKey: queryKeys.checkins.devices(eventId) });
    } catch {
      toastError("Failed to generate code");
    }
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); }}
      title="Generate Pairing Code"
      subtitle="Display this code on the device to pair it."
      size="md"
    >
      {code ? (
        <div className="space-y-5 text-center">
          {/* Big 6-digit code */}
          <div className="rounded-2xl bg-slate-950 py-8 px-4">
            <p className="mb-2 text-[12px] text-slate-400 uppercase tracking-widest">Pairing Code</p>
            <p className="font-mono text-6xl font-bold tracking-[0.15em] text-white">
              {code.slice(0, 3)} {code.slice(3)}
            </p>
            <p className="mt-4 text-[13px] text-slate-400">
              Expires in&nbsp;
              <span className={cn("font-semibold tabular-nums", remaining < 60 ? "text-red-400" : "text-emerald-400")}>
                {mm}:{ss}
              </span>
            </p>
          </div>

          {/* Countdown bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                remaining < 60 ? "bg-red-400" : "bg-emerald-400",
              )}
              style={{ width: `${(remaining / 600) * 100}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void copyCode()} className="flex-1">
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button variant="ghost" onClick={() => { setCode(null); reset(); }}>
              New Code
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Device label" required error={errors.label?.message}>
            <TextInput {...register("label")} placeholder="e.g. Gate 1 Scanner 3" autoFocus />
          </FormField>

          <FormField label="Scope" required>
            <SelectInput {...register("scope")}>
              <option value="gate">Gate scanner</option>
              <option value="counter">Food counter</option>
            </SelectInput>
          </FormField>

          {gates.length > 0 && (
            <FormField label="Assign to gate" error={errors.gateId?.message}>
              <SelectInput {...register("gateId")}>
                <option value="">— Unassigned —</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" icon={KeyRound} disabled={isSubmitting}>
              {isSubmitting ? "Generating…" : "Generate Code"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ── Gate form modal ─────────────────────────────────────────────────────── */

function GateModal({
  open,
  onClose,
  eventId,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  editing: Gate | null;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GateInput>({
    resolver: zodResolver(gateSchema),
    defaultValues: { kind: "entry" },
  });

  useEffect(() => {
    if (editing) reset({ name: editing.name, location: editing.location, kind: editing.kind });
    else reset({ kind: "entry", name: "", location: "" });
  }, [editing, open, reset]);

  async function onSubmit(data: GateInput) {
    try {
      if (editing) {
        await checkinService.updateGate(editing.id, data);
        toastSuccess("Gate updated");
      } else {
        await checkinService.addGate(eventId, data);
        toastSuccess("Gate added");
      }
      void qc.invalidateQueries({ queryKey: queryKeys.checkins.gates(eventId) });
      onClose();
    } catch {
      toastError("Failed to save gate");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Gate" : "Add Gate"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Gate name" required error={errors.name?.message}>
          <TextInput {...register("name")} placeholder="Gate 1 — Main Entry" autoFocus />
        </FormField>
        <FormField label="Location" required error={errors.location?.message}>
          <TextInput {...register("location")} placeholder="Hall A concourse" />
        </FormField>
        <FormField label="Direction" required>
          <SelectInput {...register("kind")}>
            <option value="entry">Entry only</option>
            <option value="exit">Exit only</option>
            <option value="both">Entry + Exit</option>
          </SelectInput>
        </FormField>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editing ? "Save Changes" : "Add Gate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function lastSeenText(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function hasDrift(device: Device): boolean {
  return device.sync === "offline" &&
    Date.now() - new Date(device.lastSeenAt).getTime() > 2 * 60 * 1000;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function CheckinPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const qc = useQueryClient();

  const eventStatus = useEventStore((s) => s.eventStatus);
  const isDraft = eventStatus === "draft";

  const [gateModal, setGateModal] = useState(false);
  const [editingGate, setEditingGate] = useState<Gate | null>(null);
  const [deleteGateTarget, setDeleteGateTarget] = useState<Gate | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null);
  const [pairingModal, setPairingModal] = useState(false);

  const { data: gates = [], isLoading: gatesLoading } = useQuery({
    queryKey: queryKeys.checkins.gates(eventId),
    queryFn: () => checkinService.gates(eventId),
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: queryKeys.checkins.devices(eventId),
    queryFn: () => checkinService.devices(eventId),
  });

  // Build lookup: gateId → gate
  const gateById = useMemo(() => new Map(gates.map((g) => [g.id, g])), [gates]);

  const deleteGateMutation = useMutation({
    mutationFn: (id: string) => checkinService.deleteGate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.checkins.gates(eventId) });
      void qc.invalidateQueries({ queryKey: queryKeys.checkins.devices(eventId) });
      toastSuccess("Gate deleted");
      setDeleteGateTarget(null);
    },
    onError: () => toastError("Failed to delete gate"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => checkinService.revokeDevice(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.checkins.devices(eventId) });
      toastSuccess("Device revoked");
      setRevokeTarget(null);
    },
    onError: () => toastError("Failed to revoke device"),
  });

  /* Gate table columns */
  const gateColumns = useMemo<ColumnDef<Gate, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Gate",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-800">{row.original.name}</p>
            <p className="text-[12px] text-slate-400">{row.original.location}</p>
          </div>
        ),
      },
      {
        id: "kind",
        header: "Direction",
        cell: ({ row }) => (
          <Badge variant={KIND_TONE[row.original.kind]}>
            {KIND_LABEL[row.original.kind]}
          </Badge>
        ),
      },
      {
        id: "devices",
        header: "Devices",
        cell: ({ row }) => {
          const count = devices.filter((d) => d.gateId === row.original.id).length;
          return <span className="text-[13px] text-slate-600">{count}</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              icon={Pencil}
              iconOnly
              aria-label="Edit gate"
              onClick={() => { setEditingGate(row.original); setGateModal(true); }}
            />
            <Button
              variant="ghost"
              icon={Trash2}
              iconOnly
              aria-label="Delete gate"
              onClick={() => setDeleteGateTarget(row.original)}
            />
          </div>
        ),
      },
    ],
    [devices],
  );

  /* Device table columns */
  const deviceColumns = useMemo<ColumnDef<Device, unknown>[]>(
    () => [
      {
        id: "label",
        header: "Device",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <Cpu className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-medium text-slate-800">{d.label}</p>
                {hasDrift(d) && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Clock drift — last sync {lastSeenText(d.lastSeenAt)}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "scope",
        header: "Scope",
        cell: ({ row }) => {
          const d = row.original;
          const gate = d.gateId ? gateById.get(d.gateId) : null;
          return gate
            ? <Badge variant="primary">{gate.name.split(" — ")[0]}</Badge>
            : <Badge variant="neutral">Unassigned</Badge>;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const d = row.original;
          return d.sync === "synced"
            ? (
              <span className="flex items-center gap-1.5 text-[13px] text-emerald-600">
                <Wifi className="h-3.5 w-3.5" /> Online
              </span>
            )
            : (
              <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                <WifiOff className="h-3.5 w-3.5" /> Offline
              </span>
            );
        },
      },
      {
        id: "lastSeen",
        header: "Last Seen",
        cell: ({ row }) => (
          <span className="text-[13px] text-slate-500">{lastSeenText(row.original.lastSeenAt)}</span>
        ),
      },
      {
        id: "queue",
        header: "Pending",
        cell: ({ row }) => {
          const q = row.original.queuedScans;
          return q > 0
            ? <Badge variant="warning">{q} queued</Badge>
            : <span className="text-[13px] text-slate-400">—</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              icon={ShieldOff}
              iconOnly
              aria-label={`Revoke ${row.original.label}`}
              onClick={() => setRevokeTarget(row.original)}
            />
          </div>
        ),
      },
    ],
    [gateById],
  );

  // Draft guard
  if (isDraft) {
    return (
      <>
        <PageHeader
          title="Gates & Devices"
          breadcrumbs={[
            { label: "Events", href: "/org/events" },
            { label: "Check-in" },
          ]}
          subtitle="Manage entry gates and paired scanner devices"
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <DoorOpen className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">Check-in is locked in Draft</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Publish the event first to configure gates and pair devices.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Gates & Devices"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Check-in" },
        ]}
        subtitle="Manage entry gates and paired scanner devices"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={KeyRound} onClick={() => setPairingModal(true)}>
              Pair Device
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => { setEditingGate(null); setGateModal(true); }}
            >
              Add Gate
            </Button>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Gates",
            value: gates.length,
            sub: `${gates.filter((g) => g.kind === "entry").length} entry · ${gates.filter((g) => g.kind === "exit").length} exit`,
          },
          {
            label: "Online Devices",
            value: devices.filter((d) => d.sync === "synced").length,
            sub: `of ${devices.length} total`,
          },
          {
            label: "Pending Scans",
            value: devices.reduce((acc, d) => acc + d.queuedScans, 0),
            sub: "awaiting sync",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-[12px] text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-[11px] text-slate-400">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Gates */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Gates"
          subtitle={`${gates.length} gate${gates.length !== 1 ? "s" : ""} configured`}
          action={
            <Button
              variant="ghost"
              icon={Plus}
              onClick={() => { setEditingGate(null); setGateModal(true); }}
            >
              Add Gate
            </Button>
          }
        />
        <DataTable
          columns={gateColumns}
          data={gates}
          loading={gatesLoading}
          getRowId={(g) => g.id}
          emptyState={
            <EmptyState
              icon={DoorOpen}
              title="No gates yet"
              description="Add entry and exit gates to configure check-in."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setGateModal(true)}>
                  Add Gate
                </Button>
              }
            />
          }
        />
      </Card>

      {/* Devices */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Devices"
          subtitle={`${devices.length} device${devices.length !== 1 ? "s" : ""} paired`}
          action={
            <Button variant="ghost" icon={KeyRound} onClick={() => setPairingModal(true)}>
              Pair New
            </Button>
          }
        />
        <DataTable
          columns={deviceColumns}
          data={devices}
          loading={devicesLoading}
          getRowId={(d) => d.id}
          emptyState={
            <EmptyState
              icon={Cpu}
              title="No devices paired"
              description="Generate a pairing code to connect your first scanner."
              action={
                <Button variant="primary" icon={KeyRound} onClick={() => setPairingModal(true)}>
                  Pair Device
                </Button>
              }
            />
          }
        />
      </Card>

      {/* Drift warning summary */}
      {devices.some(hasDrift) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-[13px] font-semibold text-amber-700">
              {devices.filter(hasDrift).length} device{devices.filter(hasDrift).length !== 1 ? "s" : ""} with clock drift detected
            </p>
            <p className="text-[12px] text-amber-600">
              Offline devices that haven't synced for 2+ minutes may have missed scans. Check device connectivity.
            </p>
          </div>
        </div>
      )}

      {/* Gate add/edit modal */}
      <GateModal
        open={gateModal}
        onClose={() => { setGateModal(false); setEditingGate(null); }}
        eventId={eventId}
        editing={editingGate}
      />

      {/* Pairing code modal */}
      <PairingCodeModal
        open={pairingModal}
        onClose={() => setPairingModal(false)}
        gates={gates}
        eventId={eventId}
      />

      {/* Delete gate confirm */}
      <ConfirmDialog
        open={!!deleteGateTarget}
        onClose={() => setDeleteGateTarget(null)}
        onConfirm={() => deleteGateMutation.mutate(deleteGateTarget!.id)}
        title="Delete Gate"
        description={
          <>
            Gate <strong>{deleteGateTarget?.name}</strong> and all its devices will be detached.
            Existing check-in logs are preserved.
          </>
        }
        confirmText={deleteGateTarget?.name ?? ""}
        actionLabel="Delete Gate"
        loading={deleteGateMutation.isPending}
      />

      {/* Revoke device confirm */}
      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => revokeMutation.mutate(revokeTarget!.id)}
        title="Revoke Device"
        description={
          <>
            <strong>{revokeTarget?.label}</strong> will lose access immediately.
            Any pending queued scans may be lost.
          </>
        }
        confirmText={revokeTarget?.label ?? ""}
        actionLabel="Revoke Device"
        loading={revokeMutation.isPending}
      />
    </>
  );
}
