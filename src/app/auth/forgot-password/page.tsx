"use client";

/**
 * /auth/forgot-password — P-10
 *
 * States:
 *   entry  — email field, submit → calls mockAuth.forgotPassword()
 *   sent   — success confirmation + dev box with clickable reset link
 *
 * Dev box (IS_DEV) exposes:
 *   • Link to /auth/reset-password/[token]  → valid-token state
 *   • Link to /auth/reset-password/EXPIRED  → expired/invalid state
 */

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck, Terminal } from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput } from "@/components/kit/inputs";
import { Button } from "@/components/kit/Button";
import { authService } from "@/services/auth";

/* ── Schema ──────────────────────────────────────────────────────────────── */

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

/* ── Constants ───────────────────────────────────────────────────────────── */

const IS_DEV = process.env.NODE_ENV === "development";

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  async function onSubmit(data: FormValues) {
    // mockAuth always succeeds (prevents email enumeration)
    const { resetToken: tok } = await authService.forgotPassword(data.email);
    setResetToken(tok);
    setSentTo(data.email);
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

        {sentTo ? (
          /* ── Sent state ───────────────────────────────────────────────── */
          <section className="rounded-xl bg-white p-6 shadow-card">
            <div className="text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orbit-50">
                <MailCheck className="h-7 w-7 text-orbit-500" />
              </span>
              <h1 className="font-display text-[17px] font-semibold text-orbit-900">Check your inbox</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                If <span className="font-medium text-orbit-900">{sentTo}</span> is registered, you&apos;ll
                receive a password reset link shortly.
              </p>
              <button
                type="button"
                className="mt-4 text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
                onClick={() => { setSentTo(null); setResetToken(""); }}
              >
                Try a different email
              </button>
            </div>

            {/* Dev-only panel */}
            {IS_DEV && resetToken && (
              <div className="mt-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                  <Terminal className="h-3.5 w-3.5" />
                  DEV ONLY — skip the email
                </p>
                <div className="space-y-1.5">
                  <Link
                    href={`/auth/reset-password/${resetToken}`}
                    className="block rounded-md border border-amber-300 bg-white px-3 py-1.5 text-center text-[12px] font-medium text-amber-800 transition hover:bg-amber-100"
                  >
                    → Open valid reset link
                  </Link>
                  <Link
                    href="/auth/reset-password/EXPIRED_TOKEN_DEMO"
                    className="block rounded-md border border-amber-200 bg-white px-3 py-1.5 text-center text-[12px] text-amber-700 transition hover:bg-amber-100"
                  >
                    → Test invalid / expired token
                  </Link>
                </div>
                <p className="mt-1.5 break-all font-mono text-[10px] text-amber-600 opacity-70">
                  {resetToken}
                </p>
              </div>
            )}
          </section>
        ) : (
          /* ── Entry state ──────────────────────────────────────────────── */
          <section className="rounded-xl bg-white p-6 shadow-card">
            <h1 className="font-display font-semibold text-orbit-900">Reset your password</h1>
            <p className="mt-0.5 mb-5 text-[13px] text-slate-400">
              Enter your work email and we&apos;ll send you a reset link.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label="Work Email" required htmlFor="fp-email" error={errors.email?.message}>
                <TextInput
                  id="fp-email"
                  type="email"
                  placeholder="you@company.in"
                  error={!!errors.email}
                  autoComplete="email"
                  autoFocus
                  {...register("email")}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={isSubmitting ? Loader2 : undefined}
                className={`w-full justify-center${isSubmitting ? " [&_svg]:animate-spin" : ""}`}
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </section>
        )}

        <p className="mt-4 text-center text-[12px] text-slate-400">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1 font-medium text-orbit-500 hover:text-orbit-600"
          >
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
