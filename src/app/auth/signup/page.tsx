"use client";

/**
 * /auth/signup — Organisation + user registration (P-08).
 * AuthLayout: AppShell renders bare for /auth/* routes.
 * Stack: react-hook-form + zod + token-only styling.
 * Flow: valid submit → mockAuth.signup() → /auth/verify-email.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput, PhoneInput, Checkbox } from "@/components/kit/inputs";
import { PasswordStrengthMeter } from "@/components/kit/misc";
import { Button } from "@/components/kit/Button";
import { authService } from "@/services/auth";
import { cn } from "@/lib/utils";

/* ── Zod schema ──────────────────────────────────────────────────────────── */

const schema = z.object({
  orgName: z
    .string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(80, "Keep it under 80 characters"),
  name: z
    .string()
    .min(2, "Your name must be at least 2 characters")
    .max(60, "Keep it under 60 characters"),
  email: z.string().email("Enter a valid work email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  terms: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the terms to continue" }),
});

type FormValues = z.infer<typeof schema>;

/* ── Captcha placeholder ─────────────────────────────────────────────────── */

function CaptchaPlaceholder() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-slate-300 bg-white">
        <div className="h-3 w-3 rounded-sm border border-slate-200 bg-slate-100" />
      </div>
      <span className="flex-1 text-[13px] text-slate-500">I&apos;m not a robot</span>
      <div className="flex flex-col items-center gap-0.5">
        <ShieldCheck className="h-7 w-7 text-orbit-500" />
        <span className="text-[8px] font-semibold tracking-wide text-slate-400 uppercase">reCAPTCHA</span>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const { verificationToken } = await authService.signup({
        orgName: data.orgName,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      // Persist for verify-email page (email display + dev simulate button)
      localStorage.setItem("orbit_pending_email", data.email);
      localStorage.setItem("orbit_pending_token", verificationToken);
      router.push("/auth/verify-email");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 py-10">
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
          <h1 className="font-display font-semibold text-orbit-900">Create your workspace</h1>
          <p className="mt-0.5 mb-5 text-[13px] text-slate-400">
            Set up your organisation and start managing events in minutes.
          </p>

          {/* Server-level error */}
          {serverError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
              {serverError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Section: Organisation */}
            <div>
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <Building2 className="h-3.5 w-3.5" /> Organisation
              </p>
              <FormField
                label="Organisation Name"
                required
                htmlFor="s-orgName"
                error={errors.orgName?.message}
              >
                <TextInput
                  id="s-orgName"
                  placeholder="Malwa Expo Co."
                  error={!!errors.orgName}
                  autoComplete="organization"
                  {...register("orgName")}
                />
              </FormField>
            </div>

            {/* Section: Your details */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <UserRound className="h-3.5 w-3.5" /> Your Details
              </p>

              <FormField
                label="Full Name"
                required
                htmlFor="s-name"
                error={errors.name?.message}
              >
                <TextInput
                  id="s-name"
                  placeholder="Ananya Rao"
                  error={!!errors.name}
                  autoComplete="name"
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Work Email"
                required
                htmlFor="s-email"
                error={errors.email?.message}
              >
                <TextInput
                  id="s-email"
                  type="email"
                  placeholder="you@company.in"
                  error={!!errors.email}
                  autoComplete="email"
                  {...register("email")}
                />
              </FormField>

              <FormField
                label="Mobile Number"
                required
                htmlFor="s-phone"
                error={errors.phone?.message}
                hint="10-digit Indian mobile number"
              >
                <PhoneInput
                  id="s-phone"
                  placeholder="98765 43210"
                  error={!!errors.phone}
                  autoComplete="tel-national"
                  {...register("phone")}
                />
              </FormField>

              <FormField
                label="Password"
                required
                htmlFor="s-password"
                error={errors.password?.message}
              >
                <TextInput
                  id="s-password"
                  type="password"
                  placeholder="••••••••"
                  error={!!errors.password}
                  autoComplete="new-password"
                  {...register("password")}
                />
                <PasswordStrengthMeter password={passwordValue} />
              </FormField>
            </div>

            {/* Captcha placeholder */}
            <CaptchaPlaceholder />

            {/* Terms */}
            <div>
              <Checkbox
                label={
                  <span className="text-[13px] text-slate-600">
                    I agree to the{" "}
                    <Link href="#" className="font-medium text-orbit-500 hover:text-orbit-600">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="font-medium text-orbit-500 hover:text-orbit-600">
                      Privacy Policy
                    </Link>
                  </span>
                }
                {...register("terms")}
              />
              {errors.terms && (
                <p role="alert" className="mt-1 text-[12px] text-red-500">
                  {errors.terms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : undefined}
              className={cn("w-full justify-center", isSubmitting && "[&_svg]:animate-spin")}
            >
              {isSubmitting ? "Creating workspace…" : "Create workspace"}
            </Button>
          </form>
        </section>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-orbit-500 hover:text-orbit-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
