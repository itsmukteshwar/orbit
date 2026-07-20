"use client";

/**
 * /auth/login — P-09
 *
 * Features:
 *   - react-hook-form + zod validation (inline errors, onTouched mode)
 *   - Error shake animation on failed submit (CSS keyframe, scoped <style>)
 *   - Lockout message after 5 consecutive mock failures
 *   - "?verified=1" query param → success banner (coming from verify-email)
 *   - EMAIL_UNVERIFIED error → resend-verification prompt
 *   - Session written to localStorage via mockAuth on success
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput } from "@/components/kit/inputs";
import { Button } from "@/components/kit/Button";
import { authService } from "@/services/auth";
import { cn } from "@/lib/utils";

/* ── Schema ──────────────────────────────────────────────────────────────── */

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

/* ── Inner component (needs useSearchParams inside Suspense boundary) ─────── */

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  /** Incremented on each auth failure to re-trigger the shake CSS animation */
  const [shakeKey, setShakeKey] = useState(0);
  const failEmailRef = useRef("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { email: "ananya.rao@malwaexpo.in", password: "" },
  });

  useEffect(() => {
    // If arriving from verify-email, clear the pending email storage
    if (searchParams.get("verified") === "1") {
      localStorage.removeItem("orbit_pending_email");
    }
  }, [searchParams]);

  async function onSubmit(data: FormValues) {
    setServerError(null);
    setNeedsVerification(false);
    try {
      await authService.login(data.email, data.password);
      router.push("/org/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "LOGIN_FAILED";
      setShakeKey((k) => k + 1);

      if (msg === "LOCKED") {
        setIsLocked(true);
        return;
      }

      if (msg === "EMAIL_UNVERIFIED") {
        failEmailRef.current = data.email;
        setNeedsVerification(true);
        setServerError("Your email address hasn't been verified yet.");
        return;
      }

      if (msg.startsWith("INVALID_CREDENTIALS:")) {
        const remaining = Number(msg.split(":")[1]);
        setServerError(
          `Incorrect email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`,
        );
        return;
      }

      setServerError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      {/* Scoped shake keyframe — avoids touching globals.css */}
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

          {/* Post-action banners */}
          {justVerified && (
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              Email verified — sign in to continue.
            </div>
          )}
          {justReset && (
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              Password updated — sign in with your new password.
            </div>
          )}

          {/* Lockout card */}
          {isLocked ? (
            <section className="rounded-xl bg-white p-6 shadow-card text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <ShieldAlert className="h-7 w-7 text-red-500" />
              </span>
              <h1 className="font-display text-[16px] font-semibold text-orbit-900">
                Account temporarily locked
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Too many failed sign-in attempts. Please contact your administrator or try again later.
              </p>
              <button
                type="button"
                className="mt-5 text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
                onClick={() => { setIsLocked(false); setServerError(null); }}
              >
                Try again
              </button>
            </section>
          ) : (
            /* ── Main sign-in card ─────────────────────────────────────── */
            <section
              key={shakeKey}
              className={cn(
                "rounded-xl bg-white p-6 shadow-card",
                shakeKey > 0 && serverError ? "orbit-shake" : "",
              )}
            >
              <h1 className="font-display font-semibold text-orbit-900">Sign in to your workspace</h1>
              <p className="mt-0.5 mb-5 text-[13px] text-slate-400">
                Manage events, registrations and onsite operations.
              </p>

              {/* Server / auth error */}
              {serverError && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                  {serverError}
                  {needsVerification && (
                    <button
                      type="button"
                      className="mt-1.5 block font-medium text-orbit-500 hover:text-orbit-600"
                      onClick={async () => {
                        try {
                          const { verificationToken } = await authService.resendVerification(
                            failEmailRef.current,
                          );
                          localStorage.setItem("orbit_pending_email", failEmailRef.current);
                          localStorage.setItem("orbit_pending_token", verificationToken);
                          router.push("/auth/verify-email");
                        } catch {
                          /* ignore — user can retry */
                        }
                      }}
                    >
                      Resend verification email →
                    </button>
                  )}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField
                  label="Work Email"
                  required
                  htmlFor="l-email"
                  error={errors.email?.message}
                >
                  <TextInput
                    id="l-email"
                    type="email"
                    placeholder="you@company.in"
                    error={!!errors.email}
                    autoComplete="email"
                    {...register("email")}
                  />
                </FormField>

                <FormField
                  label="Password"
                  required
                  htmlFor="l-password"
                  error={errors.password?.message}
                >
                  <TextInput
                    id="l-password"
                    type="password"
                    placeholder="••••••••"
                    error={!!errors.password}
                    autoComplete="current-password"
                    {...register("password")}
                  />
                </FormField>

                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  icon={isSubmitting ? Loader2 : LogIn}
                  className={cn("w-full justify-center", isSubmitting && "[&_svg]:animate-spin")}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </section>
          )}

          <p className="mt-4 text-center text-[12px] text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-orbit-500 hover:text-orbit-600">
              Create workspace
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Page export — wraps LoginForm in Suspense for useSearchParams ───────── */

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
