"use client";

/**
 * P-36 — Public exhibitor staff form (/x/[token])
 * Mobile-first: exhibitors do this from phones. Shows company + quota status,
 * add staff rows up to remaining quota, submit → confirmation.
 * Expired / revoked / invalid token states.
 */

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Link2Off,
  Plus,
  Send,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exhibitorService, type StaffSubmissionInput } from "@/services/exhibitor";

interface RowDraft {
  key: number;
  name: string;
  phone: string;
  designation: string;
}

const emptyRow = (key: number): RowDraft => ({ key, name: "", phone: "", designation: "" });

const INPUT =
  "h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-[15px] text-slate-800 placeholder:text-slate-300 focus:border-orbit-400 focus:ring-4 focus:ring-orbit-100 focus:outline-none";

export default function MagicLinkPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: resolved, isLoading } = useQuery({
    queryKey: ["magic-token", token],
    queryFn: () => exhibitorService.resolveMagicToken(token),
  });

  const [rows, setRows] = useState<RowDraft[]>([emptyRow(0)]);
  const [nextKey, setNextKey] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quota = useMemo(() => {
    if (resolved?.kind !== "ok") return { used: 0, total: 0, pending: 0, remaining: 0 };
    const approved = resolved.staff.filter((s) => s.status === "approved").length;
    const pending = resolved.staff.filter((s) => s.status === "pending").length;
    return {
      used: approved,
      total: resolved.exhibitor.staffQuota,
      pending,
      remaining: Math.max(0, resolved.exhibitor.staffQuota - approved - pending),
    };
  }, [resolved]);

  const validRows = rows.filter((r) => r.name.trim().length >= 2 && /^[6-9]\d{9}$/.test(r.phone));
  const canAddRow = rows.length < quota.remaining;
  const canSubmit = validRows.length > 0 && validRows.length === rows.length && !submitting;

  function updateRow(key: number, patch: Partial<RowDraft>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function submit() {
    if (resolved?.kind !== "ok") return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: StaffSubmissionInput[] = validRows.map((r) => ({
        name: r.name.trim(),
        phone: r.phone,
        designation: r.designation.trim() || null,
      }));
      await exhibitorService.submitStaff(token, payload);
      setDone(payload.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed — try again");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Frame states ──────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <Frame>
        <div className="w-full max-w-md animate-pulse space-y-3">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      </Frame>
    );
  }

  if (!resolved || resolved.kind === "invalid") {
    return (
      <Frame>
        <StateCard
          icon={Link2Off}
          tone="slate"
          title="Link not valid"
          body="This staff-submission link has been revoked or never existed. Ask the event organiser for a fresh link."
        />
      </Frame>
    );
  }

  if (resolved.kind === "expired") {
    return (
      <Frame>
        <StateCard
          icon={Clock}
          tone="amber"
          title="Link expired"
          body={`This link for ${resolved.exhibitor.companyName} has expired. Ask the organiser to regenerate it — links are valid for 72 hours.`}
        />
      </Frame>
    );
  }

  const { exhibitor } = resolved;

  if (done !== null) {
    return (
      <Frame>
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </span>
          <h1 className="font-display text-xl font-bold text-orbit-900">
            {done} staff submitted
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-slate-500">
            The organiser will review your submissions. Approved staff get their badge at the
            exhibitor desk — carry a photo ID.
          </p>
          <p className="mt-4 text-[12px] text-slate-400">
            {exhibitor.companyName} · Stall {exhibitor.stallNo}
          </p>
        </div>
      </Frame>
    );
  }

  const quotaExhausted = quota.remaining === 0;

  return (
    <Frame>
      <div className="w-full max-w-md">
        {/* Company header */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orbit-50">
              <Store className="h-5 w-5 text-orbit-500" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold text-orbit-900">
                {exhibitor.companyName}
              </h1>
              <p className="text-[12px] text-slate-400">Stall {exhibitor.stallNo} · Staff badges</p>
            </div>
          </div>

          {/* Quota bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1 text-slate-500">
                <Users className="h-3.5 w-3.5" /> Badge quota
              </span>
              <span className="font-mono font-semibold text-slate-700">
                {quota.used + quota.pending}/{quota.total}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full">
                <div className="bg-emerald-400" style={{ width: `${(quota.used / quota.total) * 100}%` }} />
                <div className="bg-amber-300" style={{ width: `${(quota.pending / quota.total) * 100}%` }} />
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {quota.used} approved · {quota.pending} under review ·{" "}
              <strong className={cn(quota.remaining === 0 ? "text-amber-600" : "text-slate-600")}>
                {quota.remaining} slots left
              </strong>
            </p>
          </div>
        </div>

        {/* Form / exhausted state */}
        {quotaExhausted ? (
          <StateCard
            icon={AlertTriangle}
            tone="amber"
            title="Quota fully used"
            body="All badge slots are approved or under review. Contact the organiser if you need more staff badges."
          />
        ) : (
          <div className="rounded-3xl bg-white p-5 shadow-card">
            <p className="mb-3 text-[14px] font-semibold text-slate-700">Add your staff</p>

            <div className="space-y-4">
              {rows.map((r, i) => (
                <div key={r.key} className="rounded-2xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Staff {i + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      className={INPUT}
                      placeholder="Full name"
                      value={r.name}
                      onChange={(e) => updateRow(r.key, { name: e.target.value })}
                      autoComplete="name"
                    />
                    <input
                      className={INPUT}
                      placeholder="Mobile number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={r.phone}
                      onChange={(e) => updateRow(r.key, { phone: e.target.value.replace(/\D/g, "") })}
                    />
                    <input
                      className={INPUT}
                      placeholder="Designation (optional)"
                      value={r.designation}
                      onChange={(e) => updateRow(r.key, { designation: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {canAddRow && (
              <button
                type="button"
                onClick={() => { setRows((rs) => [...rs, emptyRow(nextKey)]); setNextKey((k) => k + 1); }}
                className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-[13px] font-medium text-slate-400 transition-colors hover:border-orbit-300 hover:text-orbit-500"
              >
                <Plus className="h-4 w-4" /> Add another ({quota.remaining - rows.length} left)
              </button>
            )}

            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-red-500">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </p>
            )}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-orbit-500 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-orbit-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting…" : `Submit ${validRows.length || ""} Staff`}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Names go to the organiser for approval — badges are printed on-site.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Orbit Event ERP</span>
        </p>
      </div>
    </Frame>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 px-4 py-8 sm:items-center">
      {children}
    </div>
  );
}

function StateCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: React.ElementType;
  tone: "amber" | "slate";
  title: string;
  body: string;
}) {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
      <span
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
          tone === "amber" ? "bg-amber-50" : "bg-slate-100",
        )}
      >
        <Icon className={cn("h-7 w-7", tone === "amber" ? "text-amber-500" : "text-slate-400")} />
      </span>
      <h1 className="font-display text-xl font-bold text-orbit-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
