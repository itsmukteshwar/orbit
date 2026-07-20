"use client";

/**
 * /auth/verify-email — P-09
 *
 * States:
 *   waiting   — show email, resend with 30s cooldown, dev "simulate click" button
 *   verified  — success banner, continue to sign in
 *   error     — inline error + retry
 *
 * Dev-only "Simulate click" button calls mockAuth.verifyEmail(token) directly,
 * replicating what the link in the email would do.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MailCheck, RefreshCw, Terminal } from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { Button } from "@/components/kit/Button";
import { authService } from "@/services/auth";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 30; // seconds
const IS_DEV = process.env.NODE_ENV === "development";

type PageState = "waiting" | "verifying" | "verified" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pageState, setPageState] = useState<PageState>("waiting");
  const [errorMsg, setErrorMsg] = useState("");

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read localStorage on mount (client-only)
  useEffect(() => {
    setEmail(localStorage.getItem("orbit_pending_email") ?? "");
    setToken(localStorage.getItem("orbit_pending_token") ?? "");
  }, []);

  // Start resend cooldown
  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // Resend handler
  async function handleResend() {
    if (!email || resendCooldown > 0) return;
    try {
      const { verificationToken } = await authService.resendVerification(email);
      localStorage.setItem("orbit_pending_token", verificationToken);
      setToken(verificationToken);
      startCooldown();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to resend. Try again.");
    }
  }

  // Dev-only simulate click
  async function handleSimulateClick() {
    if (!token) {
      setErrorMsg("No token found — complete signup first.");
      return;
    }
    setPageState("verifying");
    setErrorMsg("");
    try {
      await authService.verifyEmail(token);
      setPageState("verified");
      localStorage.removeItem("orbit_pending_token");
    } catch (err) {
      setPageState("error");
      setErrorMsg(err instanceof Error ? err.message : "Verification failed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orbit-900">
            <OrbitLogo size={26} />
          </span>
          <div className="text-center leading-tight">
            <p className="font-display text-lg font-bold tracking-wide text-orbit-900">
              ORBIT<span className="text-orbit-500">.</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orbit-500">Event ERP</p>
          </div>
        </div>

        {/* Card */}
        <section className="rounded-xl bg-white p-6 shadow-card">
          {pageState === "verified" ? (
            /* ── Verified state ───────────────────────────────────────── */
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </span>
              <h1 className="font-display text-[17px] font-semibold text-orbit-900">Email verified!</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Your account is ready. Sign in to access your Orbit workspace.
              </p>
              <Button
                variant="primary"
                className="mt-5 w-full justify-center"
                onClick={() => router.push("/auth/login?verified=1")}
              >
                Continue to sign in
              </Button>
            </div>
          ) : (
            /* ── Waiting / error state ────────────────────────────────── */
            <>
              <div className="text-center">
                <span
                  className={cn(
                    "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
                    pageState === "error" ? "bg-red-50" : "bg-orbit-50",
                  )}
                >
                  {pageState === "verifying" ? (
                    <Loader2 className="h-7 w-7 animate-spin text-orbit-500" />
                  ) : (
                    <MailCheck
                      className={cn(
                        "h-7 w-7",
                        pageState === "error" ? "text-red-400" : "text-orbit-500",
                      )}
                    />
                  )}
                </span>

                <h1 className="font-display text-[17px] font-semibold text-orbit-900">Check your inbox</h1>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                  We sent a verification link to{" "}
                  {email ? (
                    <span className="font-medium text-orbit-900">{email}</span>
                  ) : (
                    "your email address"
                  )}
                  . Click it to activate your workspace.
                </p>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                  {errorMsg}
                </div>
              )}

              {/* Resend */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-[13px] font-medium transition",
                    resendCooldown > 0
                      ? "cursor-not-allowed text-slate-400"
                      : "text-slate-600 hover:border-orbit-300 hover:text-orbit-600",
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
                </button>
              </div>

              {/* Dev-only simulate button */}
              {IS_DEV && (
                <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <Terminal className="h-3.5 w-3.5" />
                    DEV ONLY — simulates clicking the email link
                  </p>
                  <button
                    type="button"
                    disabled={pageState === "verifying" || !token}
                    onClick={handleSimulateClick}
                    className="w-full rounded-md border border-amber-300 bg-white py-1.5 text-[12px] font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    {pageState === "verifying" ? "Verifying…" : "Simulate email link click"}
                  </button>
                  {token && (
                    <p className="mt-1.5 break-all font-mono text-[10px] text-amber-600 opacity-70">
                      token: {token}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          <Link href="/auth/login" className="font-medium text-orbit-500 hover:text-orbit-600">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
