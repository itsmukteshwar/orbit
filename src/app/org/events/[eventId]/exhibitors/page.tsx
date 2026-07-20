"use client";

/**
 * P-34 — Exhibitors → Companies (/org/events/[eventId]/exhibitors)
 * DataTable (company, contact, stall, quota chip, magic-link status) ·
 * add/edit Drawer with magic-link generate/copy/revoke · compact CSV import
 * wizard reusing the P-27 pattern (upload → map → import).
 */

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Papa from "papaparse";
import {
  BadgeCheck,
  Check,
  Copy,
  FileUp,
  Link2,
  Link2Off,
  Plus,
  RefreshCw,
  Store,
  Upload,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { DataTable } from "@/components/kit/DataTable";
import { FilterBar } from "@/components/kit/FilterBar";
import { EmptyState } from "@/components/kit/EmptyState";
import { Drawer } from "@/components/kit/Drawer";
import { Modal } from "@/components/kit/Modal";
import { ConfirmDialog } from "@/components/kit/ConfirmDialog";
import { FormField, TextInput, SelectInput, PhoneInput } from "@/components/kit/inputs";
import { toastSuccess, toastError } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { exhibitorService } from "@/services/exhibitor";
import { db } from "@/services/mock/db";
import type { Exhibitor, ExhibitorStatus } from "@/types/domain";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<ExhibitorStatus, "primary" | "success" | "warning" | "neutral"> = {
  invited: "warning",
  confirmed: "primary",
  active: "success",
  cancelled: "neutral",
};

function quotaUsed(exhibitorId: string): number {
  return db.exhibitorStaff.filter((s) => s.exhibitorId === exhibitorId && s.status === "approved").length;
}

function fmtExpiry(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function QuotaChip({ used, quota }: { used: number; quota: number }) {
  const full = used >= quota;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
        full ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600",
      )}
      title={full ? "Badge quota fully used" : `${quota - used} badge slots remaining`}
    >
      <Users className="h-3 w-3" />
      {used}/{quota}
    </span>
  );
}

function MagicLinkStatus({ ex }: { ex: Exhibitor }) {
  if (!ex.magicToken) return <span className="text-[12px] text-slate-400">No link</span>;
  const expired = ex.magicExpiresAt && new Date(ex.magicExpiresAt).getTime() < Date.now();
  return expired ? (
    <Badge variant="danger">Expired</Badge>
  ) : (
    <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
      <Link2 className="h-3.5 w-3.5" />
      Active{ex.magicExpiresAt && <span className="text-slate-400">· till {fmtExpiry(ex.magicExpiresAt)}</span>}
    </span>
  );
}

/* ── Add / edit sheet ────────────────────────────────────────────────────── */

const exhibitorSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactPhone: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile starting 6-9"),
  contactEmail: z.string().email("Valid email required"),
  stallNo: z.string().min(1, "Stall number required"),
  hallId: z.string().min(1, "Select a hall"),
  areaSqm: z.coerce.number().min(4, "Min 4 sqm").max(500, "Max 500 sqm"),
  staffQuota: z.coerce.number().int().min(1, "Min 1").max(20, "Max 20"),
  status: z.enum(["invited", "confirmed", "active", "cancelled"]),
});
type ExhibitorForm = z.infer<typeof exhibitorSchema>;

function ExhibitorSheet({
  open,
  onClose,
  eventId,
  exhibitor,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  exhibitor: Exhibitor | null;
  onSaved: () => void;
}) {
  const halls = db.events.find((e) => e.id === eventId)?.halls ?? [];
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExhibitorForm>({
    resolver: zodResolver(exhibitorSchema),
    values: exhibitor
      ? {
          companyName: exhibitor.companyName,
          contactName: exhibitor.contactName,
          contactPhone: exhibitor.contactPhone,
          contactEmail: exhibitor.contactEmail,
          stallNo: exhibitor.stallNo,
          hallId: exhibitor.hallId,
          areaSqm: exhibitor.areaSqm,
          staffQuota: exhibitor.staffQuota,
          status: exhibitor.status,
        }
      : {
          companyName: "",
          contactName: "",
          contactPhone: "",
          contactEmail: "",
          stallNo: "",
          hallId: halls[0]?.id ?? "",
          areaSqm: 9,
          staffQuota: 4,
          status: "invited",
        },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.exhibitors.all() });

  const generateLink = useMutation({
    mutationFn: () => exhibitorService.generateMagicLink(exhibitor!.id),
    onSuccess: () => {
      invalidate();
      toastSuccess("Magic link generated — valid for 72 hours");
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Failed to generate link"),
  });

  const revokeLink = useMutation({
    mutationFn: () => exhibitorService.revokeMagicLink(exhibitor!.id),
    onSuccess: () => {
      invalidate();
      setConfirmRevoke(false);
      toastSuccess("Magic link revoked — the form URL no longer works");
    },
    onError: (e) => toastError(e instanceof Error ? e.message : "Failed to revoke link"),
  });

  async function onSubmit(values: ExhibitorForm) {
    try {
      if (exhibitor) {
        await exhibitorService.update(exhibitor.id, values);
        toastSuccess(`${values.companyName} updated`);
      } else {
        await exhibitorService.create({ ...values, eventId, magicToken: null, magicExpiresAt: null });
        toastSuccess(`${values.companyName} added`);
      }
      invalidate();
      onSaved();
      onClose();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const linkUrl =
    exhibitor?.magicToken && typeof window !== "undefined"
      ? `${window.location.origin}/x/${exhibitor.magicToken}`
      : null;
  const linkExpired =
    !!exhibitor?.magicExpiresAt && new Date(exhibitor.magicExpiresAt).getTime() < Date.now();

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={exhibitor ? exhibitor.companyName : "Add Exhibitor"}
        subtitle={exhibitor ? `Stall ${exhibitor.stallNo}` : "New exhibiting company"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {exhibitor ? "Save Changes" : "Add Exhibitor"}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Company name" required error={errors.companyName?.message}>
            <TextInput {...register("companyName")} error={!!errors.companyName} placeholder="Shakti Pumps" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact person" required error={errors.contactName?.message}>
              <TextInput {...register("contactName")} error={!!errors.contactName} />
            </FormField>
            <FormField label="Mobile" required error={errors.contactPhone?.message}>
              <PhoneInput {...register("contactPhone")} error={!!errors.contactPhone} />
            </FormField>
          </div>
          <FormField label="Email" required error={errors.contactEmail?.message}>
            <TextInput type="email" {...register("contactEmail")} error={!!errors.contactEmail} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Stall no." required error={errors.stallNo?.message}>
              <TextInput {...register("stallNo")} error={!!errors.stallNo} placeholder="A-12" />
            </FormField>
            <FormField label="Hall" required error={errors.hallId?.message}>
              <SelectInput
                {...register("hallId")}
                error={!!errors.hallId}
                options={halls.map((h) => ({ value: h.id, label: h.name }))}
              />
            </FormField>
            <FormField label="Area (sqm)" required error={errors.areaSqm?.message}>
              <TextInput type="number" {...register("areaSqm")} error={!!errors.areaSqm} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Staff badge quota"
              required
              error={errors.staffQuota?.message}
              hint="Max staff badges this company can request"
            >
              <TextInput type="number" {...register("staffQuota")} error={!!errors.staffQuota} />
            </FormField>
            <FormField label="Status" required>
              <SelectInput
                {...register("status")}
                options={["invited", "confirmed", "active", "cancelled"]}
              />
            </FormField>
          </div>
        </form>

        {/* ── Magic link section (edit mode only) ── */}
        {exhibitor && (
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-700">Staff submission link</p>
              <MagicLinkStatus ex={exhibitor} />
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              Share this link with the exhibitor — their team submits staff names from a phone.
              Links expire after 72 hours.
            </p>

            {linkUrl && !linkExpired && (
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600">
                  {linkUrl}
                </code>
                <Button
                  variant="secondary"
                  icon={copied ? Check : Copy}
                  iconOnly
                  aria-label="Copy link"
                  onClick={async () => {
                    await navigator.clipboard.writeText(linkUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }}
                />
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                icon={exhibitor.magicToken ? RefreshCw : Link2}
                onClick={() => generateLink.mutate()}
                disabled={generateLink.isPending}
              >
                {exhibitor.magicToken ? (linkExpired ? "Regenerate (expired)" : "Regenerate") : "Generate Link"}
              </Button>
              {exhibitor.magicToken && (
                <Button
                  variant="ghost"
                  icon={Link2Off}
                  onClick={() => setConfirmRevoke(true)}
                  disabled={revokeLink.isPending}
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={() => revokeLink.mutate()}
        title="Revoke magic link?"
        description={
          <>
            The current staff-submission URL for{" "}
            <strong>{exhibitor?.companyName}</strong> will stop working immediately. Pending
            submissions already made are not affected.
          </>
        }
        confirmText="REVOKE"
        actionLabel="Revoke link"
        loading={revokeLink.isPending}
      />
    </>
  );
}

/* ── CSV import (compact P-27 pattern: upload → map → import) ────────────── */

interface CsvTarget {
  key: "companyName" | "contactName" | "contactPhone" | "contactEmail" | "stallNo" | "staffQuota";
  label: string;
  required: boolean;
  aliases: string[];
}

const CSV_TARGETS: CsvTarget[] = [
  { key: "companyName", label: "Company", required: true, aliases: ["company", "company name", "name", "exhibitor"] },
  { key: "contactName", label: "Contact person", required: true, aliases: ["contact", "contact name", "person"] },
  { key: "contactPhone", label: "Phone", required: true, aliases: ["phone", "mobile", "contact phone"] },
  { key: "contactEmail", label: "Email", required: false, aliases: ["email", "mail", "contact email"] },
  { key: "stallNo", label: "Stall no.", required: false, aliases: ["stall", "stall no", "booth", "booth no"] },
  { key: "staffQuota", label: "Staff quota", required: false, aliases: ["quota", "staff quota", "badges"] },
];

function ImportModal({
  open,
  onClose,
  eventId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<CsvTarget["key"], string>>({} as Record<CsvTarget["key"], string>);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const halls = db.events.find((e) => e.id === eventId)?.halls ?? [];

  function reset() {
    setStep(0);
    setRows([]);
    setHeaders([]);
    setMapping({} as Record<CsvTarget["key"], string>);
    setProgress(0);
    setResult(null);
  }

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data);
        // Auto-guess mapping from aliases
        const guess = {} as Record<CsvTarget["key"], string>;
        for (const t of CSV_TARGETS) {
          const hit = hdrs.find((h) => t.aliases.includes(h.trim().toLowerCase()) || h.trim().toLowerCase() === t.key.toLowerCase());
          if (hit) guess[t.key] = hit;
        }
        setMapping(guess);
        setStep(1);
      },
      error: () => toastError("Could not parse that file — is it a valid CSV?"),
    });
  }

  const mappingValid = CSV_TARGETS.filter((t) => t.required).every((t) => mapping[t.key]);

  async function runImport() {
    setStep(2);
    let ok = 0;
    let failed = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const get = (k: CsvTarget["key"]) => (mapping[k] ? (r[mapping[k]] ?? "").trim() : "");
      try {
        const phone = get("contactPhone").replace(/\D/g, "").slice(-10);
        if (!get("companyName") || !/^[6-9]\d{9}$/.test(phone)) throw new Error("invalid row");
        await exhibitorService.create({
          eventId,
          companyName: get("companyName"),
          contactName: get("contactName") || "—",
          contactPhone: phone,
          contactEmail: get("contactEmail") || `info@${get("companyName").toLowerCase().replace(/[^a-z]/g, "")}.in`,
          stallNo: get("stallNo") || "TBD",
          hallId: halls[0]?.id ?? "",
          areaSqm: 9,
          status: "invited",
          staffQuota: Number(get("staffQuota")) || 4,
          magicToken: null,
          magicExpiresAt: null,
        });
        ok++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setResult({ ok, failed });
    onDone();
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Import Exhibitors"
      subtitle="CSV with one company per row"
      size="lg"
      footer={
        step === 1 ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>Back</Button>
            <Button variant="primary" icon={Upload} disabled={!mappingValid} onClick={runImport}>
              Import {rows.length} Companies
            </Button>
          </div>
        ) : result ? (
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        ) : undefined
      }
    >
      {step === 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-12 text-slate-400 transition-colors hover:border-orbit-300 hover:text-orbit-500"
        >
          <FileUp className="h-8 w-8" />
          <span className="text-[13px] font-medium">Click to choose a CSV file</span>
          <span className="text-[11px]">Columns: Company, Contact, Phone, Email, Stall, Quota</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </button>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-[13px] text-slate-500">
            <strong className="text-slate-700">{rows.length}</strong> rows detected — map your CSV columns:
          </p>
          {CSV_TARGETS.map((t) => (
            <div key={t.key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-[13px] text-slate-600">
                {t.label}
                {t.required && <span className="text-red-400"> *</span>}
              </span>
              <SelectInput
                value={mapping[t.key] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [t.key]: e.target.value }))}
                className="flex-1"
              >
                <option value="">— skip —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </SelectInput>
            </div>
          ))}
          {!mappingValid && (
            <p className="text-[12px] text-amber-600">Map all required (*) fields to continue.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="py-6 text-center">
          {result ? (
            <>
              <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
              <p className="font-semibold text-slate-700">
                {result.ok} imported{result.failed > 0 && <span className="text-red-500"> · {result.failed} failed</span>}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">Failed rows had a missing company or invalid phone.</p>
            </>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-slate-500">Importing… {progress}%</p>
              <div className="mx-auto h-1.5 w-64 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-orbit-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ExhibitorsPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Exhibitor | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const qc = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: queryKeys.exhibitors.list({ filters: { eventId, status: status || undefined }, q: search }),
    queryFn: () =>
      exhibitorService.list({
        q: search || undefined,
        filters: { eventId, ...(status && { status: status as ExhibitorStatus }) },
      }),
  });

  const exhibitors = useMemo(() => page?.items ?? [], [page]);
  const halls = db.events.find((e) => e.id === eventId)?.halls ?? [];
  const hallName = (id: string) => halls.find((h) => h.id === id)?.name ?? "—";

  const columns = useMemo<ColumnDef<Exhibitor, unknown>[]>(
    () => [
      {
        id: "company",
        header: "Company",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-800">{row.original.companyName}</p>
            <p className="text-[11px] text-slate-400">{row.original.contactName}</p>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="text-[12px] text-slate-500">
            <p className="font-mono">{row.original.contactPhone}</p>
            <p className="truncate text-[11px] text-slate-400">{row.original.contactEmail}</p>
          </div>
        ),
      },
      {
        id: "stall",
        header: "Stall",
        cell: ({ row }) => (
          <div className="text-[12px]">
            <span className="font-mono font-semibold text-slate-700">{row.original.stallNo}</span>
            <span className="ml-1.5 text-slate-400">{hallName(row.original.hallId)} · {row.original.areaSqm} sqm</span>
          </div>
        ),
      },
      {
        id: "quota",
        header: "Badge Quota",
        cell: ({ row }) => <QuotaChip used={quotaUsed(row.original.id)} quota={row.original.staffQuota} />,
      },
      {
        id: "magic",
        header: "Staff Link",
        cell: ({ row }) => <MagicLinkStatus ex={row.original} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_TONE[row.original.status]}>{row.original.status}</Badge>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [halls],
  );

  const pendingCount = useMemo(
    () =>
      db.exhibitorStaff.filter(
        (s) => s.status === "pending" && db.exhibitors.some((e) => e.id === s.exhibitorId && e.eventId === eventId),
      ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId, exhibitors],
  );

  return (
    <>
      <PageHeader
        title="Exhibitors"
        breadcrumbs={[{ label: "Events", href: "/org/events" }, { label: "Exhibitors" }]}
        subtitle="Companies, stalls and staff badge quotas"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={Users}
              onClick={() => router.push(`/org/events/${eventId}/exhibitors/staff`)}
            >
              Staff Approvals
              {pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button variant="secondary" icon={FileUp} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setSheetOpen(true); }}>
              Add Exhibitor
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar
          summary={
            <span className="text-[13px]">
              <strong className="text-slate-700">{page?.total ?? 0}</strong> exhibiting companies
            </span>
          }
          selects={[
            {
              id: "status",
              label: "All Statuses",
              options: ["invited", "confirmed", "active", "cancelled"],
              value: status,
              onChange: setStatus,
            },
          ]}
          search={{ value: search, onChange: setSearch, placeholder: "Search company, contact, stall…" }}
          chips={status ? [{ id: "status", label: `Status: ${status}`, onRemove: () => setStatus("") }] : []}
          onClearAll={status || search ? () => { setStatus(""); setSearch(""); } : undefined}
        />

        <DataTable
          columns={columns}
          data={exhibitors}
          loading={isLoading}
          getRowId={(r) => r.id}
          onRowClick={(r) => { setEditing(r); setSheetOpen(true); }}
          emptyState={
            <EmptyState
              icon={Store}
              title="No exhibitors yet"
              description="Add companies one by one or import a CSV from your sales sheet."
              action={
                <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setSheetOpen(true); }}>
                  Add Exhibitor
                </Button>
              }
            />
          }
        />
      </Card>

      <ExhibitorSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        eventId={eventId}
        exhibitor={editing}
        onSaved={() => void qc.invalidateQueries({ queryKey: queryKeys.exhibitors.all() })}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        eventId={eventId}
        onDone={() => void qc.invalidateQueries({ queryKey: queryKeys.exhibitors.all() })}
      />
    </>
  );
}
