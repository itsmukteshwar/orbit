"use client";

/**
 * P-27 — CSV Import Wizard (/org/events/[eventId]/registrations/import)
 * Step 1 upload (drag-drop + sample link, PapaParse client-side)
 * Step 2 column mapping (auto-guess + category/status defaults)
 * Step 3 validation preview (first 20 rows, error highlighting)
 * Step 4 mock progress → summary + downloadable error report CSV
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Upload,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { Stepper } from "@/components/kit/Stepper";
import { SelectInput } from "@/components/kit/inputs";
import { toastSuccess } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { registrationService } from "@/services/registration";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";

/* ── Target fields ───────────────────────────────────────────────────────── */

const TARGET_FIELDS = [
  { key: "firstName", label: "First Name", required: true, aliases: ["first name", "firstname", "first", "fname", "name"] },
  { key: "lastName", label: "Last Name", required: true, aliases: ["last name", "lastname", "last", "lname", "surname"] },
  { key: "phone", label: "Phone", required: true, aliases: ["phone", "mobile", "phone number", "mobile number", "contact"] },
  { key: "email", label: "Email", required: false, aliases: ["email", "e-mail", "email address", "mail"] },
  { key: "company", label: "Company", required: false, aliases: ["company", "organisation", "organization", "firm"] },
  { key: "city", label: "City", required: false, aliases: ["city", "town", "location"] },
] as const;

type TargetKey = (typeof TARGET_FIELDS)[number]["key"];

interface RowError {
  rowIndex: number;
  field: string;
  reason: string;
}

interface ValidatedRow {
  index: number;
  data: Record<TargetKey, string>;
  errors: RowError[];
}

const SAMPLE_CSV = `First Name,Last Name,Phone,Email,Company,City
Asha,Patel,9876543210,asha@example.com,TechCorp,Mumbai
Vikram,Singh,9812345670,vikram@example.com,InnoLabs,Delhi`;

/* ── Validation ──────────────────────────────────────────────────────────── */

function validateRow(index: number, data: Record<TargetKey, string>): RowError[] {
  const errors: RowError[] = [];
  if (!data.firstName?.trim()) errors.push({ rowIndex: index, field: "firstName", reason: "First name missing" });
  if (!data.lastName?.trim()) errors.push({ rowIndex: index, field: "lastName", reason: "Last name missing" });
  const phone = data.phone?.replace(/\D/g, "") ?? "";
  if (!/^[6-9]\d{9}$/.test(phone)) errors.push({ rowIndex: index, field: "phone", reason: `Invalid phone "${data.phone ?? ""}"` });
  if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    errors.push({ rowIndex: index, field: "email", reason: `Invalid email "${data.email}"` });
  }
  return errors;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ImportWizardPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const router = useRouter();
  const qc = useQueryClient();

  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({} as Record<TargetKey, string>);
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [defaultStatus, setDefaultStatus] = useState<"pending" | "approved">("pending");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => db.categories.filter((c) => c.eventId === eventId), [eventId]);

  /* ── Step 1: parse file ──────────────────────────────────────────────── */

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRawRows(res.data);
        // Auto-guess mapping
        const guessed = {} as Record<TargetKey, string>;
        for (const target of TARGET_FIELDS) {
          const match = hdrs.find((h) => (target.aliases as string[]).includes(h.trim().toLowerCase()));
          if (match) guessed[target.key] = match;
        }
        setMapping(guessed);
        setDefaultCategoryId(categories[0]?.id ?? "");
        setStepIndex(1);
      },
    });
  }, [categories]);

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orbit-import-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Step 3: validation ──────────────────────────────────────────────── */

  const validated = useMemo((): ValidatedRow[] => {
    if (stepIndex < 2) return [];
    return rawRows.map((raw, i) => {
      const data = {} as Record<TargetKey, string>;
      for (const t of TARGET_FIELDS) {
        data[t.key] = mapping[t.key] ? (raw[mapping[t.key]] ?? "").trim() : "";
      }
      return { index: i, data, errors: validateRow(i, data) };
    });
  }, [stepIndex, rawRows, mapping]);

  const errorRows = validated.filter((r) => r.errors.length > 0);
  const validRows = validated.filter((r) => r.errors.length === 0);

  /* ── Step 4: mock processing ─────────────────────────────────────────── */

  async function runImport() {
    setProcessing(true);
    setStepIndex(3);
    let ok = 0;
    const batch = validRows;
    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      try {
        await registrationService.create({
          eventId,
          formVersionId: db.formVersions.find((f) => f.eventId === eventId)?.id ?? "",
          categoryId: defaultCategoryId,
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          phone: row.data.phone.replace(/\D/g, ""),
          email: row.data.email || null,
          company: row.data.company || null,
          designation: null,
          city: row.data.city || "—",
          state: "—",
          gender: "other",
          foodPreference: "veg",
          daysAttending: [1],
          amountPaise: 0,
          source: "import",
          status: defaultStatus,
        });
        ok++;
      } catch {
        /* counted as failed */
      }
      setProgress(Math.round(((i + 1) / batch.length) * 100));
    }
    void qc.invalidateQueries({ queryKey: queryKeys.registrations.all() });
    setResult({ ok, failed: batch.length - ok + errorRows.length });
    setProcessing(false);
    toastSuccess(`Import finished — ${ok} imported`);
  }

  function downloadErrorReport() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Row #", "Field", "Reason", ...TARGET_FIELDS.map((t) => t.label)].map(esc).join(",");
    const lines = errorRows.flatMap((r) =>
      r.errors.map((e) =>
        [String(r.index + 2), e.field, e.reason, ...TARGET_FIELDS.map((t) => r.data[t.key] ?? "")].map(esc).join(","),
      ),
    );
    const csv = "﻿" + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${fileName.replace(/\.csv$/i, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const STEPS = [
    { id: "upload", label: "Upload" },
    { id: "map", label: "Map Columns" },
    { id: "validate", label: "Validate" },
    { id: "import", label: "Import" },
  ];

  const requiredMapped = TARGET_FIELDS.filter((t) => t.required).every((t) => mapping[t.key]);

  return (
    <>
      <PageHeader
        title="Import Registrations"
        breadcrumbs={[
          { label: "Events", href: "/org/events" },
          { label: "Registrations", href: `/org/events/${eventId}/registrations` },
          { label: "Import" },
        ]}
        subtitle="Bulk-import visitors from a CSV file"
      />

      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Stepper steps={STEPS} current={stepIndex} />

        {/* ── STEP 1: upload ────────────────────────────────────────────── */}
        {stepIndex === 0 && (
          <Card className="p-6">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter") fileRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center transition-colors",
                dragOver ? "border-orbit-400 bg-orbit-50/50" : "border-slate-200 hover:border-orbit-300 hover:bg-slate-50/50",
              )}
            >
              <FileUp className={cn("mb-3 h-10 w-10", dragOver ? "text-orbit-500" : "text-slate-300")} />
              <p className="font-semibold text-slate-700">Drop your CSV here or click to browse</p>
              <p className="mt-1 text-[12px] text-slate-400">.csv up to 5 MB · headers in first row</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={downloadSample}
                className="flex items-center gap-1.5 text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Download sample file
              </button>
            </div>
          </Card>
        )}

        {/* ── STEP 2: mapping ───────────────────────────────────────────── */}
        {stepIndex === 1 && (
          <Card className="p-6">
            <p className="mb-1 font-display font-semibold text-orbit-900">Map your columns</p>
            <p className="mb-5 text-[13px] text-slate-400">
              {fileName} · {rawRows.length} rows · auto-guessed where possible
            </p>

            <div className="space-y-3">
              {TARGET_FIELDS.map((t) => (
                <div key={t.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-[13px] font-medium text-slate-600">
                    {t.label}
                    {t.required && <span className="text-red-400"> *</span>}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <SelectInput
                    value={mapping[t.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [t.key]: e.target.value }))}
                    className="flex-1"
                    aria-label={`Map ${t.label}`}
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </SelectInput>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-600">Default category</label>
                <SelectInput value={defaultCategoryId} onChange={(e) => setDefaultCategoryId(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SelectInput>
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-slate-600">Import as</label>
                <SelectInput value={defaultStatus} onChange={(e) => setDefaultStatus(e.target.value as "pending" | "approved")}>
                  <option value="pending">Pending (needs approval)</option>
                  <option value="approved">Approved (issue passes)</option>
                </SelectInput>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStepIndex(0)}>Back</Button>
              <Button variant="primary" disabled={!requiredMapped} onClick={() => setStepIndex(2)}>
                Validate {rawRows.length} Rows
              </Button>
            </div>
          </Card>
        )}

        {/* ── STEP 3: validation preview ────────────────────────────────── */}
        {stepIndex === 2 && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <p className="font-display font-semibold text-orbit-900">Validation preview</p>
                <p className="text-[13px] text-slate-400">First 20 rows shown · errors highlighted</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="success">{validRows.length} valid</Badge>
                {errorRows.length > 0 && <Badge variant="danger">{errorRows.length} errors</Badge>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5">#</th>
                    {TARGET_FIELDS.map((t) => (
                      <th key={t.key} className="px-4 py-2.5">{t.label}</th>
                    ))}
                    <th className="px-5 py-2.5">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validated.slice(0, 20).map((row) => (
                    <tr key={row.index} className={cn(row.errors.length > 0 && "bg-red-50/50")}>
                      <td className="px-5 py-2.5 text-[12px] text-slate-400">{row.index + 2}</td>
                      {TARGET_FIELDS.map((t) => {
                        const hasErr = row.errors.some((e) => e.field === t.key);
                        return (
                          <td
                            key={t.key}
                            className={cn(
                              "px-4 py-2.5 text-[13px]",
                              hasErr ? "font-medium text-red-600" : "text-slate-600",
                            )}
                          >
                            {row.data[t.key] || <span className="text-slate-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-5 py-2.5">
                        {row.errors.length > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            {row.errors.map((e) => e.reason).join("; ")}
                          </span>
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between border-t border-slate-100 p-5">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStepIndex(1)}>Back</Button>
              <div className="flex gap-2">
                {errorRows.length > 0 && (
                  <Button variant="secondary" icon={Download} onClick={downloadErrorReport}>
                    Error Report
                  </Button>
                )}
                <Button variant="primary" icon={Upload} disabled={validRows.length === 0} onClick={() => void runImport()}>
                  Import {validRows.length} Valid Rows
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 4: progress + summary ────────────────────────────────── */}
        {stepIndex === 3 && (
          <Card className="p-8 text-center">
            {processing ? (
              <>
                <p className="mb-4 font-display text-lg font-semibold text-orbit-900">Importing…</p>
                <div className="mx-auto h-2 max-w-md rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-orbit-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-[13px] tabular-nums text-slate-400">{progress}%</p>
              </>
            ) : result ? (
              <>
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </span>
                <h2 className="font-display text-xl font-bold text-orbit-900">Import complete</h2>
                <div className="mx-auto mt-5 flex max-w-xs justify-center gap-8">
                  <div>
                    <p className="text-3xl font-bold text-emerald-600">{result.ok}</p>
                    <p className="text-[12px] text-slate-400">imported</p>
                  </div>
                  <div>
                    <p className={cn("text-3xl font-bold", result.failed > 0 ? "text-red-500" : "text-slate-300")}>
                      {result.failed}
                    </p>
                    <p className="text-[12px] text-slate-400">failed / skipped</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  {errorRows.length > 0 && (
                    <Button variant="secondary" icon={Download} onClick={downloadErrorReport}>
                      Download Error Report
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/org/events/${eventId}/registrations`)}
                  >
                    View Registrations
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        )}
      </div>
    </>
  );
}
