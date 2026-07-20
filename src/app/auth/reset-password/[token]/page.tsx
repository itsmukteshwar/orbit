"use client";

/**
 * /auth/reset-password/[token] — P-10
 *
 * States (all reachable via dev links on /forgot-password):
 *   loading   — validating token on mount
 *   invalid   — token not found or already used  (INVALID error)
 *   expired   — token past TTL                   (EXPIRED error)
 *   form      — valid token → new password + confirm fields
 *   success   — password changed → auto-redirects to /auth/login in 3s
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Clock, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput } from "@/components/kit/inputs";
import { PasswordStrengthMeter } from "@/components/kit/misc";
import { Button } from "@/components/kit/Button";
import { authService } from "@/services/auth";
import { cn } from "@/lib/utils";

/* ── Schema ──────────────────────────────────────────────────────────────── */

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

/* ── State machine ───────────────────────────────────────────────────────── */

type PageState = "loading" | "invalid" | "expired" | "form" | "success";

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<PageState>("loading");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(3);

  /* Validate token on mount */
  useEffect(() => {
    authService
      .validateResetToken(token)
      .then(({ email: e }) => {
        setEmail(e);
        setState("form");
      })
      .catch((err: Error) => {
        setState(err.message === "EXPIRED" ? "expired" : "invalid");
      });
  }, [token]);

  /* Auto-redirect countdown after success */
  useEffect(() => {
    if (state !== "success") return;
    const id = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(id);
          router.push("/auth/login?reset=1");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const newPasswordValue = watch("newPassword") ?? "";

  async function onSubmit(data: FormValues) {
    await authService.resetPassword(token, data.newPassword);
    setState("success");
  }

  /* ── Brand header (shared across all states) ───────────────────────────── */
  function Brand() {
    return (
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
    );
  }

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="flex flex-col items-center rounded-xl bg-white p-8 shadow-card">
            <Loader2 className="h-8 w-8 animate-spin text-orbit-500" />
            <p className="mt-3 text-[13px] text-slate-400">Validating reset link…</p>
          </section>
        </div>
      </div>
    );
  }

  /* ── Invalid ─────────────────────────────────────────────────────────── */
  if (state === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="rounded-xl bg-white p-6 shadow-card text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <ShieldAlert className="h-7 w-7 text-red-500" />
            </span>
            <h1 className="font-display text-[17px] font-semibold text-orbit-900">Invalid reset link</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              This password reset link is invalid or has already been used. Request a new one below.
            </p>
            <Link href="/auth/forgot-password">
              <Button variant="primary" className="mt-5 w-full justify-center">
                Request a new link
              </Button>
            </Link>
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

  /* ── Expired ─────────────────────────────────────────────────────────── */
  if (state === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="rounded-xl bg-white p-6 shadow-card text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-7 w-7 text-amber-500" />
            </span>
            <h1 className="font-display text-[17px] font-semibold text-orbit-900">Link expired</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              This reset link has expired. Password reset links are valid for 1 hour.
            </p>
            <Link href="/auth/forgot-password">
              <Button variant="primary" className="mt-5 w-full justify-center">
                Request a new link
              </Button>
            </Link>
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

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="rounded-xl bg-white p-6 shadow-card text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </span>
            <h1 className="font-display text-[17px] font-semibold text-orbit-900">Password updated!</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Your password has been changed. Redirecting to sign in
              {countdown > 0 && (
                <span className="ml-1 font-medium text-orbit-500">in {countdown}s…</span>
              )}
            </p>
            <Link href="/auth/login?reset=1">
              <Button variant="primary" className="mt-5 w-full justify-center">
                Sign in now
              </Button>
            </Link>
          </section>
        </div>
      </div>
    );
  }

  /* ── Form (valid token) ──────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes orbit-shake {
          0%, 100% { transform: translateX(0); }
          15%, 55% { transform: translateX(-5px); }
          35%, 75% { transform: translateX(5px); }
        }
        .orbit-shake { animation: orbit-shake 0.38s ease; }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />

          <section className="rounded-xl bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orbit-50">
                <LockKeyhole className="h-4.5 w-4.5 text-orbit-500" />
              </span>
              <div>
                <h1 className="font-display font-semibold leading-tight text-orbit-900">
                  Set a new password
                </h1>
                {email && (
                  <p className="text-[12px] text-slate-400 truncate">for {email}</p>
                )}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField
                label="New Password"
                required
                htmlFor="rp-new"
                error={errors.newPassword?.message}
              >
                <TextInput
                  id="rp-new"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.newPassword}
                  autoComplete="new-password"
                  autoFocus
                  {...register("newPassword")}
                />
                <PasswordStrengthMeter password={newPasswordValue} />
              </FormField>

              <FormField
                label="Confirm Password"
                required
                htmlFor="rp-confirm"
                error={errors.confirmPassword?.message}
              >
                <TextInput
                  id="rp-confirm"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.confirmPassword}
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={isSubmitting ? Loader2 : undefined}
                className={cn("w-full justify-center", isSubmitting && "[&_svg]:animate-spin")}
              >
                {isSubmitting ? "Updating password…" : "Update password"}
              </Button>
            </form>
          </section>

          <p className="mt-4 text-center text-[12px] text-slate-400">
            <Link href="/auth/login" className="font-medium text-orbit-500 hover:text-orbit-600">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
