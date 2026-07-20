"use client";

/**
 * P-33 — Public status check (/e/[slug]/status)
 * Phone entry → mock OTP screen → registration status + resend pass
 * with a rate-limit message after repeated resends.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";
import type { Registration } from "@/types/domain";

type Stage =
  | { kind: "phone" }
  | { kind: "otp"; phone: string }
  | { kind: "status"; reg: Registration }
  | { kind: "notfound"; phone: string };

const MOCK_OTP = "482913";

export default function PublicStatusPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const event = useMemo(() => db.events.find((e) => e.id === slug) ?? null, [slug]);

  const [stage, setStage] = useState<Stage>({ kind: "phone" });
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resent, setResent] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);

  function submitPhone() {
    if (phone.length !== 10) return;
    setStage({ kind: "otp", phone });
    setOtp("");
    setTimeout(() => otpRef.current?.focus(), 80);
  }

  function verifyOtp() {
    if (otp !== MOCK_OTP) {
      setOtpError(true);
      return;
    }
    const reg = db.registrations.find((r) => r.eventId === slug && r.phone === phone);
    setStage(reg ? { kind: "status", reg } : { kind: "notfound", phone });
  }

  function resendPass() {
    if (resendCount >= 3) return;
    setResendCount((c) => c + 1);
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  const rateLimited = resendCount >= 3;

  if (!event) {
    return (
      <Frame>
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="font-display text-2xl font-bold text-orbit-900">Event not found</h1>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orbit-400">Status Check</p>
          <h1 className="font-display text-2xl font-bold text-orbit-900">{event.name}</h1>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          {/* ── Phone entry ────────────────────────────────────────────── */}
          {stage.kind === "phone" && (
            <>
              <label htmlFor="status-phone" className="mb-3 block text-center text-[14px] font-semibold text-slate-700">
                Enter your registered mobile number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                <input
                  id="status-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitPhone(); }}
                  placeholder="98765 43210"
                  autoFocus
                  className="h-14 w-full rounded-xl border-2 border-slate-200 pl-12 pr-4 text-center font-mono text-xl font-bold tracking-widest text-slate-800 placeholder:text-slate-200 focus:border-orbit-400 focus:ring-4 focus:ring-orbit-100 focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={phone.length !== 10}
                onClick={submitPhone}
                className="mt-4 h-12 w-full rounded-xl bg-orbit-500 text-[14px] font-semibold text-white transition-colors hover:bg-orbit-600 disabled:opacity-40"
              >
                Send OTP
              </button>
            </>
          )}

          {/* ── OTP ────────────────────────────────────────────────────── */}
          {stage.kind === "otp" && (
            <>
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orbit-50">
                <ShieldCheck className="h-5 w-5 text-orbit-500" />
              </span>
              <p className="text-center text-[14px] font-semibold text-slate-700">
                OTP sent to +91 {stage.phone}
              </p>
              <p className="mt-1 text-center text-[11px] text-slate-400">
                Demo OTP: <code className="rounded bg-slate-100 px-1 font-mono">{MOCK_OTP}</code>
              </p>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") verifyOtp(); }}
                placeholder="••••••"
                className={cn(
                  "mt-4 h-14 w-full rounded-xl border-2 text-center font-mono text-2xl font-bold tracking-[0.4em] text-slate-800 placeholder:text-slate-200 focus:ring-4 focus:outline-none",
                  otpError
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-orbit-400 focus:ring-orbit-100",
                )}
              />
              {otpError && <p className="mt-2 text-center text-[12px] text-red-500">Incorrect OTP — try again</p>}
              <button
                type="button"
                disabled={otp.length !== 6}
                onClick={verifyOtp}
                className="mt-4 h-12 w-full rounded-xl bg-orbit-500 text-[14px] font-semibold text-white transition-colors hover:bg-orbit-600 disabled:opacity-40"
              >
                Verify
              </button>
              <button
                type="button"
                onClick={() => setStage({ kind: "phone" })}
                className="mx-auto mt-3 flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-3 w-3" /> Change number
              </button>
            </>
          )}

          {/* ── Status result ──────────────────────────────────────────── */}
          {stage.kind === "status" && (() => {
            const { reg } = stage;
            const cat = db.categories.find((c) => c.id === reg.categoryId);
            const pass = db.passes.find((p) => p.registrationId === reg.id);
            const statusMeta = {
              pending: { icon: Clock, tone: "text-amber-500 bg-amber-50", label: "Under Review", note: "We'll send your pass as soon as it's approved." },
              approved: { icon: CheckCircle2, tone: "text-emerald-500 bg-emerald-50", label: "Approved", note: pass ? `Badge ${pass.badgeNo} · pass sent to your WhatsApp.` : "Pass is on its way." },
              rejected: { icon: XCircle, tone: "text-red-500 bg-red-50", label: "Not Approved", note: "Contact the organiser for details." },
              revoked: { icon: XCircle, tone: "text-red-500 bg-red-50", label: "Pass Revoked", note: "This pass is no longer valid." },
            }[reg.status];
            const StatusIcon = statusMeta.icon;
            return (
              <div className="text-center">
                <span className={cn("mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full", statusMeta.tone.split(" ")[1])}>
                  <StatusIcon className={cn("h-8 w-8", statusMeta.tone.split(" ")[0])} />
                </span>
                <h2 className="font-display text-xl font-bold text-orbit-900">{statusMeta.label}</h2>
                <p className="mt-1 text-[14px] font-medium text-slate-700">
                  {reg.firstName} {reg.lastName}
                </p>
                <p className="text-[12px] text-slate-400">
                  {cat?.name ?? "—"} · +91 {reg.phone}
                </p>
                <p className="mx-auto mt-3 max-w-xs text-[13px] text-slate-500">{statusMeta.note}</p>

                {reg.status === "approved" && (
                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      disabled={rateLimited}
                      onClick={resendPass}
                      className={cn(
                        "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-colors",
                        rateLimited
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : resent
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-orbit-500 text-white hover:bg-orbit-600",
                      )}
                    >
                      {resent ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {resent ? "Pass Sent!" : "Resend Pass on WhatsApp"}
                    </button>
                    {rateLimited && (
                      <p className="flex items-center justify-center gap-1.5 text-[12px] text-amber-600">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Resend limit reached — try again in 30 minutes.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Not found ──────────────────────────────────────────────── */}
          {stage.kind === "notfound" && (
            <div className="text-center">
              <XCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="font-display text-lg font-bold text-orbit-900">No registration found</h2>
              <p className="mt-1 text-[13px] text-slate-500">
                +91 {stage.phone} isn&apos;t registered for this event.
              </p>
              <Link
                href={`/e/${slug}/register`}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-orbit-500 px-6 text-[13px] font-semibold text-white transition-colors hover:bg-orbit-600"
              >
                Register Now
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Orbit Event ERP</span>
        </p>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      {children}
    </div>
  );
}
