"use client";

/**
 * /onboarding — P-12  (AppShell bypassed — standalone layout)
 *
 * 3-step wizard:
 *   1. Org profile  — city, state, logo upload w/ crop preview (mock storage)
 *   2. First event  — name, dates, venue   OR  skip
 *   3. Demo choice  — load sample data ribbon OR start blank
 *
 * All state lives in useOnboardingStore (zustand).
 * Completing → /org/dashboard?onboarded=1
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Building2, CalendarRange, CheckCircle2,
  Database, ImagePlus, Loader2, MapPin, Sparkles, X,
} from "lucide-react";
import { OrbitLogo } from "@/components/layout/OrbitLogo";
import { FormField, TextInput, SelectInput } from "@/components/kit/inputs";
import { Button } from "@/components/kit/Button";
import { useOnboardingStore, INDIAN_STATES } from "@/lib/onboarding";
import { db } from "@/services/mock/db";
import { cn } from "@/lib/utils";

/* ── Stepper ─────────────────────────────────────────────────────────────── */

const STEPS = [
  { n: 1, label: "Your Organisation" },
  { n: 2, label: "First Event" },
  { n: 3, label: "Sample Data" },
] as const;

function WizardStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Setup progress" className="mb-8 flex items-center gap-0">
      {STEPS.map(({ n, label }, i) => {
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-all",
                  done
                    ? "bg-orbit-500 text-white"
                    : active
                    ? "border-2 border-orbit-500 text-orbit-500"
                    : "border-2 border-slate-200 text-slate-400",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  active ? "text-orbit-600" : done ? "text-slate-500" : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px flex-1 transition-all",
                  step > n ? "bg-orbit-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ── Logo upload / crop preview ──────────────────────────────────────────── */

function LogoUpload() {
  const logoDataUrl = useOnboardingStore((s) => s.logoDataUrl);
  const setLogo = useOnboardingStore((s) => s.setLogo);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Crop preview — fixed 80×80 container shows how logo renders */}
      <div
        className={cn(
          "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 transition",
          logoDataUrl ? "border-orbit-200" : "border-dashed border-slate-300 bg-slate-50",
        )}
      >
        {logoDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              alt="Logo preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label="Remove logo"
              onClick={() => { setLogo(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <ImagePlus className="h-6 w-6 text-slate-400" />
        )}
      </div>

      <div className="flex-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[13px] font-medium text-orbit-500 hover:text-orbit-600"
        >
          {logoDataUrl ? "Change logo" : "Upload logo"}
        </button>
        <p className="mt-0.5 text-[11px] text-slate-400">
          PNG or JPEG · shown in the 80×80 preview above
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

/* ── Step 1 — Org profile ────────────────────────────────────────────────── */

const step1Schema = z.object({
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Select a state"),
});
type Step1Values = z.infer<typeof step1Schema>;

function Step1({ onNext }: { onNext: () => void }) {
  const store = useOnboardingStore();
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { city: store.city, state: store.state },
  });

  function onSubmit(data: Step1Values) {
    store.setCity(data.city);
    store.setState(data.state);
    onNext();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <LogoUpload />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="City" required htmlFor="s1-city" error={errors.city?.message}>
          <TextInput
            id="s1-city"
            placeholder="Indore"
            error={!!errors.city}
            autoFocus
            {...register("city")}
          />
        </FormField>

        <FormField label="State" required htmlFor="s1-state" error={errors.state?.message}>
          <SelectInput
            id="s1-state"
            placeholder="Select state"
            error={!!errors.state}
            options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
            {...register("state")}
          />
        </FormField>
      </div>

      <Button type="submit" variant="primary" className="w-full justify-center">
        Continue
      </Button>
    </form>
  );
}

/* ── Step 2 — Optional first event ──────────────────────────────────────── */

const step2Schema = z.object({
  eventName: z.string().min(3, "Event name is required"),
  eventStartDate: z.string().min(1, "Start date is required"),
  eventEndDate: z.string().min(1, "End date is required"),
  venue: z.string().min(2, "Venue name is required"),
}).refine((d) => !d.eventStartDate || !d.eventEndDate || d.eventEndDate >= d.eventStartDate, {
  message: "End date must be on or after start date",
  path: ["eventEndDate"],
});
type Step2Values = z.infer<typeof step2Schema>;

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const store = useOnboardingStore();
  const [mode, setMode] = useState<"create" | "skip">("create");
  const { register, handleSubmit, formState: { errors } } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      eventName: store.eventName,
      eventStartDate: store.eventStartDate,
      eventEndDate: store.eventEndDate,
      venue: store.venue,
    },
  });

  function onSkip() {
    store.setSkipEvent(true);
    onNext();
  }

  function onSubmit(data: Step2Values) {
    store.setSkipEvent(false);
    store.setEventName(data.eventName);
    store.setEventStartDate(data.eventStartDate);
    store.setEventEndDate(data.eventEndDate);
    store.setVenue(data.venue);
    onNext();
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex rounded-lg border border-slate-200 p-1">
        {[
          { key: "create", label: "Create my first event" },
          { key: "skip",   label: "Skip for now" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key as "create" | "skip")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[13px] font-medium transition",
              mode === key ? "bg-orbit-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "create" ? (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Event Name" required htmlFor="s2-name" error={errors.eventName?.message}>
            <TextInput id="s2-name" placeholder="Malwa Trade Expo 2026" error={!!errors.eventName} {...register("eventName")} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" required htmlFor="s2-start" error={errors.eventStartDate?.message}>
              <TextInput id="s2-start" type="date" error={!!errors.eventStartDate} {...register("eventStartDate")} />
            </FormField>
            <FormField label="End Date" required htmlFor="s2-end" error={errors.eventEndDate?.message}>
              <TextInput id="s2-end" type="date" error={!!errors.eventEndDate} {...register("eventEndDate")} />
            </FormField>
          </div>

          <FormField label="Venue" required htmlFor="s2-venue" error={errors.venue?.message}>
            <TextInput id="s2-venue" placeholder="Brilliant Convention Centre" error={!!errors.venue} {...register("venue")} />
          </FormField>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onBack} icon={ArrowLeft} className="w-full justify-center">
              Back
            </Button>
            <Button type="submit" variant="primary" className="w-full justify-center">
              Continue
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack} icon={ArrowLeft} className="w-full justify-center">
            Back
          </Button>
          <Button variant="primary" onClick={onSkip} className="w-full justify-center">
            Skip & continue
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Step 3 — Demo data choice ───────────────────────────────────────────── */

function Step3({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const setLoadDemo = useOnboardingStore((s) => s.setLoadDemo);
  const [loading, setLoading] = useState(false);

  function choose(demo: boolean) {
    setLoading(true);
    setLoadDemo(demo);
    // Flag the fixture demo event
    if (demo) {
      const event = db.events.find((e) => e.id === "evt_expo_01");
      if (event) event.isDemo = true;
    }
    // Brief pause so user sees the selection before redirect
    setTimeout(onComplete, 600);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Load demo */}
        <button
          type="button"
          disabled={loading}
          onClick={() => choose(true)}
          className="group flex flex-col items-start gap-3 rounded-xl border-2 border-orbit-200 bg-orbit-50 p-5 text-left transition hover:border-orbit-400 hover:bg-orbit-50 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-orbit-500 text-white group-hover:bg-orbit-600">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-orbit-900">Yes, load demo event</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Pre-filled with 400 visitors, 12 exhibitors, and live check-in data.
              Perfect for exploring the platform.
            </p>
            <span className="mt-2 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Demo — delete anytime
            </span>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-orbit-400" />}
        </button>

        {/* Start blank */}
        <button
          type="button"
          disabled={loading}
          onClick={() => choose(false)}
          className="group flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Start fresh</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Clean slate — set up your events, forms, and team your way.
            </p>
          </div>
        </button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        icon={ArrowLeft}
        className="justify-start text-[13px]"
      >
        Back
      </Button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const STEP_TITLES = [
  null, // 0-indexed padding
  { icon: Building2, title: "Set up your organisation", sub: "Add your location and logo — you can update these any time." },
  { icon: CalendarRange, title: "Create your first event", sub: "You can always add events later from the dashboard." },
  { icon: Database, title: "Load sample data?", sub: "Get started faster with a pre-filled demo event — delete it whenever you're ready." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step);
  const next = useOnboardingStore((s) => s.next);
  const back = useOnboardingStore((s) => s.back);
  const reset = useOnboardingStore((s) => s.reset);

  const meta = STEP_TITLES[step]!;
  const Icon = meta.icon;

  function handleComplete() {
    router.push("/org/dashboard?onboarded=1");
    reset();
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orbit-900">
            <OrbitLogo size={26} />
          </span>
          <div className="text-center leading-tight">
            <p className="font-display text-lg font-bold tracking-wide text-orbit-900">
              ORBIT<span className="text-orbit-500">.</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orbit-500">
              Event ERP
            </p>
          </div>
        </div>

        {/* Card */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <WizardStepper step={step} />

          {/* Step header */}
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orbit-50">
              <Icon className="h-5 w-5 text-orbit-500" />
            </span>
            <div>
              <h1 className="font-display font-semibold text-orbit-900">{meta.title}</h1>
              <p className="mt-0.5 text-[13px] text-slate-400">{meta.sub}</p>
            </div>
          </div>

          {/* Step content */}
          {step === 1 && <Step1 onNext={next} />}
          {step === 2 && <Step2 onNext={next} onBack={back} />}
          {step === 3 && <Step3 onBack={back} onComplete={handleComplete} />}
        </section>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Step {step} of 3 — you can finish setup later from{" "}
          <span className="font-medium text-slate-500">Org Settings</span>
        </p>

        {/* Quick-jump dev link */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-3 flex justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => useOnboardingStore.setState({ step: s as 1 | 2 | 3 })}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-mono transition",
                  step === s ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                step {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
