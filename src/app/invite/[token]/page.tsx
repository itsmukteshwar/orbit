"use client";

/**
 * /invite/[token] — P-11
 *
 * States:
 *   loading        — validating token on mount
 *   invalid        — unknown token (INVALID)
 *   expired        — token past TTL (EXPIRED)
 *   revoked        — admin cancelled (REVOKED)
 *   accepted       — already used (ACCEPTED)
 *   new-user-form  — isNewUser=true  → name + password
 *   existing-form  — isNewUser=false → password only
 *   success        — role activated, redirect to /org/dashboard
 *
 * Dev links (always rendered in dev mode, any state):
 *   invite_VALID_NEW | invite_VALID_EXISTING | invite_EXPIRED | invite_REVOKED | invite_ACCEPTED
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BadgeCheck, CheckCircle2, Clock, Loader2,
  ShieldAlert, Terminal, UserCheck, XCircle,
} from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput } from "@/components/kit/inputs";
import { PasswordStrengthMeter } from "@/components/kit/misc";
import { Button } from "@/components/kit/Button";
import { Badge } from "@/components/ui/Badge";
import { inviteService, type InvitePayload } from "@/services/invite";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const newUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const existingUserSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type NewUserValues = z.infer<typeof newUserSchema>;
type ExistingValues = z.infer<typeof existingUserSchema>;

/* ── Constants ───────────────────────────────────────────────────────────── */

const IS_DEV = process.env.NODE_ENV === "development";

const DEV_TOKENS = [
  { slug: "invite_VALID_NEW",      label: "New user (event_manager)",    note: "form" },
  { slug: "invite_VALID_EXISTING", label: "Existing user (scanner)",     note: "form" },
  { slug: "invite_EXPIRED",        label: "Expired token",               note: "error" },
  { slug: "invite_REVOKED",        label: "Revoked token",               note: "error" },
  { slug: "invite_ACCEPTED",       label: "Already accepted",            note: "error" },
] as const;

/* ── Sub-components ──────────────────────────────────────────────────────── */

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

/** Invite header shown on valid tokens — org name, role badge, invited-by. */
function InviteHeader({ payload }: { payload: InvitePayload }) {
  return (
    <div className="mb-5 rounded-lg border border-orbit-100 bg-orbit-50 p-4">
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-orbit-400">
        You&apos;ve been invited to join
      </p>
      <p className="font-display text-[17px] font-bold text-orbit-900">{payload.orgName}</p>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="primary">{ROLE_LABELS[payload.role]}</Badge>
        <span className="text-[12px] text-slate-400">· invited by {payload.invitedBy}</span>
      </div>
    </div>
  );
}

/** Amber dev panel with token quick-links. */
function DevPanel({ currentToken }: { currentToken: string }) {
  if (!IS_DEV) return null;
  return (
    <div className="mt-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
        <Terminal className="h-3.5 w-3.5" />
        DEV — test all invite states
      </p>
      <div className="space-y-1">
        {DEV_TOKENS.map(({ slug, label, note }) => (
          <Link
            key={slug}
            href={`/invite/${slug}`}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-1.5 text-[12px] transition",
              slug === currentToken
                ? "border-amber-400 bg-amber-100 font-semibold text-amber-900"
                : "border-amber-200 bg-white text-amber-800 hover:bg-amber-100",
            )}
          >
            <span>{label}</span>
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              note === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700",
            )}>
              {note}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Error card template ─────────────────────────────────────────────────── */

function ErrorCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  body,
  token,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  token: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 py-10">
      <div className="w-full max-w-sm">
        <Brand />
        <section className="rounded-xl bg-white p-6 shadow-card text-center">
          <span className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full", iconBg)}>
            <Icon className={cn("h-7 w-7", iconColor)} />
          </span>
          <h1 className="font-display text-[17px] font-semibold text-orbit-900">{title}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{body}</p>
          <p className="mt-4 text-[12px] text-slate-400">
            Please contact your administrator to request a new invite.
          </p>
        </section>
        <DevPanel currentToken={token} />
      </div>
    </div>
  );
}

/* ── New-user form ───────────────────────────────────────────────────────── */

function NewUserForm({ payload, onSuccess }: { payload: InvitePayload; onSuccess: () => void }) {
  const { token } = useParams<{ token: string }>();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewUserValues>({ resolver: zodResolver(newUserSchema), mode: "onTouched" });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(data: NewUserValues) {
    setServerError(null);
    try {
      await inviteService.acceptInvite(token, { name: data.name, password: data.password });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {serverError}
        </div>
      )}

      {/* Email (read-only, from invite) */}
      <FormField label="Work Email" htmlFor="nu-email">
        <TextInput
          id="nu-email"
          type="email"
          value={payload.email}
          readOnly
          className="cursor-default bg-slate-50 text-slate-500"
        />
      </FormField>

      <FormField label="Your Full Name" required htmlFor="nu-name" error={errors.name?.message}>
        <TextInput
          id="nu-name"
          placeholder="Priya Mehta"
          error={!!errors.name}
          autoComplete="name"
          autoFocus
          {...register("name")}
        />
      </FormField>

      <FormField label="Set a Password" required htmlFor="nu-pw" error={errors.password?.message}>
        <TextInput
          id="nu-pw"
          type="password"
          placeholder="••••••••"
          error={!!errors.password}
          autoComplete="new-password"
          {...register("password")}
        />
        <PasswordStrengthMeter password={passwordValue} />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        icon={isSubmitting ? Loader2 : UserCheck}
        className={cn("w-full justify-center", isSubmitting && "[&_svg]:animate-spin")}
      >
        {isSubmitting ? "Setting up account…" : "Accept invite & set up account"}
      </Button>
    </form>
  );
}

/* ── Existing-user form ──────────────────────────────────────────────────── */

function ExistingUserForm({ payload, onSuccess }: { payload: InvitePayload; onSuccess: () => void }) {
  const { token } = useParams<{ token: string }>();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExistingValues>({ resolver: zodResolver(existingUserSchema), mode: "onTouched" });

  async function onSubmit(data: ExistingValues) {
    setServerError(null);
    try {
      await inviteService.acceptInvite(token, { password: data.password });
      onSuccess();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {serverError}
        </div>
      )}

      {/* Email (read-only) */}
      <FormField label="Work Email" htmlFor="eu-email">
        <TextInput
          id="eu-email"
          type="email"
          value={payload.email}
          readOnly
          className="cursor-default bg-slate-50 text-slate-500"
        />
      </FormField>

      <FormField label="Password" required htmlFor="eu-pw" error={errors.password?.message}>
        <TextInput
          id="eu-pw"
          type="password"
          placeholder="••••••••"
          error={!!errors.password}
          autoComplete="current-password"
          autoFocus
          {...register("password")}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        icon={isSubmitting ? Loader2 : UserCheck}
        className={cn("w-full justify-center", isSubmitting && "[&_svg]:animate-spin")}
      >
        {isSubmitting ? "Accepting…" : "Sign in & accept invite"}
      </Button>
    </form>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

type PageState =
  | { kind: "loading" }
  | { kind: "invalid" | "expired" | "revoked" | "accepted" }
  | { kind: "form"; payload: InvitePayload }
  | { kind: "success"; role: string; orgName: string };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ kind: "loading" });

  useEffect(() => {
    inviteService
      .validateInvite(token)
      .then((payload) => setState({ kind: "form", payload }))
      .catch((err: Error) => {
        const msg = err.message as "EXPIRED" | "REVOKED" | "ACCEPTED" | "INVALID";
        type TerminalKind = "invalid" | "expired" | "revoked" | "accepted";
        const kindMap: Record<string, TerminalKind> = {
          EXPIRED: "expired",
          REVOKED: "revoked",
          ACCEPTED: "accepted",
        };
        const kind: TerminalKind = kindMap[msg] ?? "invalid";
        setState({ kind });
      });
  }, [token]);

  function handleSuccess() {
    if (state.kind !== "form") return;
    setState({
      kind: "success",
      role: ROLE_LABELS[state.payload.role],
      orgName: state.payload.orgName,
    });
    // Brief pause so the user sees the success state before navigation
    setTimeout(() => router.push("/org/dashboard"), 1800);
  }

  /* ── Loading ── */
  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="flex flex-col items-center rounded-xl bg-white p-8 shadow-card">
            <Loader2 className="h-8 w-8 animate-spin text-orbit-500" />
            <p className="mt-3 text-[13px] text-slate-400">Validating invite…</p>
          </section>
        </div>
      </div>
    );
  }

  /* ── Error states ── */
  if (state.kind === "expired") {
    return (
      <ErrorCard
        icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-500"
        title="Invite expired"
        body="This invite link has expired. Invite links are valid for 48 hours."
        token={token}
      />
    );
  }

  if (state.kind === "revoked") {
    return (
      <ErrorCard
        icon={XCircle} iconBg="bg-red-50" iconColor="text-red-500"
        title="Invite revoked"
        body="This invite has been cancelled by an administrator."
        token={token}
      />
    );
  }

  if (state.kind === "accepted") {
    return (
      <ErrorCard
        icon={BadgeCheck} iconBg="bg-slate-100" iconColor="text-slate-500"
        title="Already accepted"
        body="This invite has already been used. Sign in to access your workspace."
        token={token}
      />
    );
  }

  if (state.kind === "invalid") {
    return (
      <ErrorCard
        icon={ShieldAlert} iconBg="bg-red-50" iconColor="text-red-500"
        title="Invalid invite link"
        body="This invite link is invalid or doesn't exist."
        token={token}
      />
    );
  }

  /* ── Success ── */
  if (state.kind === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm">
          <Brand />
          <section className="rounded-xl bg-white p-6 shadow-card text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </span>
            <h1 className="font-display text-[17px] font-semibold text-orbit-900">
              Welcome to {state.orgName}!
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              You&apos;ve joined as{" "}
              <span className="font-medium text-orbit-900">{state.role}</span>.
              Taking you to your dashboard…
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-orbit-400" />
            </div>
          </section>
        </div>
      </div>
    );
  }

  /* ── Form (new user or existing) ── */
  if (state.kind !== "form") return null;
  const { payload } = state;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 py-10">
      <div className="w-full max-w-sm">
        <Brand />

        <section className="rounded-xl bg-white p-6 shadow-card">
          <InviteHeader payload={payload} />

          <p className="mb-4 text-[13px] text-slate-500">
            {payload.isNewUser
              ? "Create your account to accept this invite."
              : "Sign in with your existing account to accept."}
          </p>

          {payload.isNewUser ? (
            <NewUserForm payload={payload} onSuccess={handleSuccess} />
          ) : (
            <ExistingUserForm payload={payload} onSuccess={handleSuccess} />
          )}
        </section>

        <DevPanel currentToken={token} />

        <p className="mt-4 text-center text-[12px] text-slate-400">
          <Link href="/auth/login" className="font-medium text-orbit-500 hover:text-orbit-600">
            ← Sign in to an existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
