"use client";

/**
 * P-17 — Org Settings (/org/settings/[[...sub]])
 * 7 tab groups via SettingsTabs: Profile · Branding · Team · Plan & Usage ·
 * Security · Data & Privacy · Defaults. All backed by mock orgService + local
 * state. Tab driven by URL sub-path via useParams + useRouter.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Database,
  Download,
  FileText,
  Globe,
  Lock,
  Monitor,
  Palette,
  Pencil,
  Settings,
  Shield,
  Smartphone,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/kit/Button";
import { SettingsTabs, type SettingsTab } from "@/components/kit/SettingsTabs";
import { FormField, FormSection, FormActions } from "@/components/kit";
import { TextInput, Textarea, SelectInput } from "@/components/kit/inputs";
import { toastError, toastSuccess, toastInfo } from "@/components/kit/toast";
import { queryKeys } from "@/lib/queries";
import { usePlanStore } from "@/lib/plan";
import { orgService } from "@/services/org";
import { ORG } from "@/mocks/fixtures";
import type { Org } from "@/types/domain";

/* ── GSTIN helpers ───────────────────────────────────────────────────────── */

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function gstinChecksum(gstin: string): boolean {
  if (!GSTIN_REGEX.test(gstin)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = GSTIN_CHARS.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(val / 36) + (val % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36] === gstin[14];
}

/* ── Tab config ──────────────────────────────────────────────────────────── */

const TABS: SettingsTab[] = [
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "team", label: "Team", icon: Users },
  { id: "plan", label: "Plan & Usage", icon: Zap },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Data & Privacy", icon: Database },
  { id: "defaults", label: "Defaults", icon: Sliders },
];

/* ── Profile tab ─────────────────────────────────────────────────────────── */

const profileSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  legalName: z.string().min(2, "Required"),
  gstin: z
    .string()
    .regex(GSTIN_REGEX, "Invalid GSTIN format (15 chars, e.g. 23AAECM4321F1Z0)")
    .refine(gstinChecksum, "GSTIN checksum digit is incorrect"),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
});

type ProfileInput = z.infer<typeof profileSchema>;

function ProfileTab({ org }: { org: Org }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: org.name,
      legalName: org.legalName,
      gstin: org.gstin,
      city: org.city,
      state: org.state,
    },
  });

  const gstin = watch("gstin");
  const gstinValid = GSTIN_REGEX.test(gstin) && gstinChecksum(gstin);
  const gstinBadFormat = gstin.length > 0 && !GSTIN_REGEX.test(gstin);
  const gstinBadChecksum = GSTIN_REGEX.test(gstin) && !gstinChecksum(gstin);

  async function onSubmit(data: ProfileInput) {
    await orgService.update(org.id, data);
    toastSuccess("Profile saved");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection icon={Building2} title="Organisation Details" divider={false} columns={2}>
        <FormField label="Organisation name" required error={errors.name?.message}>
          <TextInput {...register("name")} error={!!errors.name} />
        </FormField>
        <FormField label="Legal / registered name" required error={errors.legalName?.message}>
          <TextInput {...register("legalName")} error={!!errors.legalName} />
        </FormField>
        <FormField
          label="GSTIN"
          required
          error={errors.gstin?.message}
          hint={
            gstin.length > 0
              ? gstinValid
                ? "✓ Valid GSTIN"
                : gstinBadChecksum
                  ? "Format correct, but checksum digit is wrong"
                  : gstinBadFormat
                    ? "Must be 15 chars: SS AAAAA PPPP E Z C"
                    : undefined
              : "15-character GSTIN, e.g. 29ABCDE1234F1ZV"
          }
        >
          <TextInput
            {...register("gstin")}
            placeholder="29ABCDE1234F1ZV"
            maxLength={15}
            error={!!errors.gstin}
            className="uppercase"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="City" required error={errors.city?.message}>
            <TextInput {...register("city")} error={!!errors.city} />
          </FormField>
          <FormField label="State" required error={errors.state?.message}>
            <TextInput {...register("state")} error={!!errors.state} />
          </FormField>
        </div>
      </FormSection>

      <FormActions>
        <Button variant="primary" type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        <span className="text-[12px] text-slate-400">
          Changes apply to all events in this organisation
        </span>
      </FormActions>
    </form>
  );
}

/* ── Branding tab ────────────────────────────────────────────────────────── */

function BrandingTab() {
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [accentColor, setAccentColor] = useState("#7C3AED");
  const [senderName, setSenderName] = useState("Malwa Expo Co");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    toastSuccess("Branding saved");
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <FormSection icon={Palette} title="Colour Palette" divider={false} columns={2}>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-600">
            Primary colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200 p-1"
            />
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Live preview
            </span>
            <span className="font-mono text-[12px] text-slate-400">{primaryColor.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-slate-600">
            Accent colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200 p-1"
            />
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              Live preview
            </span>
            <span className="font-mono text-[12px] text-slate-400">{accentColor.toUpperCase()}</span>
          </div>
        </div>
      </FormSection>

      <FormSection icon={Globe} title="Communication Identity" columns={1}>
        <FormField label="Sender name" hint="Shown in WhatsApp / email notifications to visitors">
          <TextInput
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Malwa Expo Co"
          />
        </FormField>
      </FormSection>

      <FormActions>
        <Button variant="primary" onClick={save}>
          {saved ? "Saved ✓" : "Save branding"}
        </Button>
      </FormActions>
    </div>
  );
}

/* ── Team tab ────────────────────────────────────────────────────────────── */

function TeamTab() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-[14px] text-slate-600">
          Manage team members, roles, and pending invitations from the dedicated Team page.
        </p>
        <div className="mt-4">
          <Link href="/org/team">
            <Button variant="secondary" icon={ChevronRight}>
              Go to Team management
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/* ── Plan & Usage tab ────────────────────────────────────────────────────── */

const MOCK_INVOICES = [
  { id: "inv_003", date: "2026-07-01", desc: "Nebula Plan — July 2026", amount: "₹4,999", status: "Paid" },
  { id: "inv_002", date: "2026-06-01", desc: "Nebula Plan — June 2026", amount: "₹4,999", status: "Paid" },
  { id: "inv_001", date: "2026-05-01", desc: "Nebula Plan — May 2026", amount: "₹4,999", status: "Paid" },
];

function PlanTab() {
  const plan = usePlanStore();
  const regPct = Math.round((plan.registrationsUsed / plan.registrationLimit) * 100);
  const eventPct = Math.round((plan.activeEventsUsed / plan.activeEventLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Current plan
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold text-orbit-900">Nebula</p>
            <p className="text-[13px] text-slate-500">₹4,999/month · renews 1 Aug 2026</p>
          </div>
          <Badge variant="success" dot>Active</Badge>
        </div>
      </Card>

      {/* Usage meters */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-semibold text-slate-700">Usage this period</h3>

        <div className="rounded-xl border border-slate-200 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-600">Active events</span>
            <span className="font-semibold text-slate-800">
              {plan.activeEventsUsed} / {plan.activeEventLimit}
            </span>
          </div>
          <ProgressBar
            value={eventPct}
            label={`${plan.activeEventsUsed} of ${plan.activeEventLimit} active events`}
            tone={eventPct >= 100 ? "danger" : eventPct >= 80 ? "warning" : "success"}
          />
          <p className="text-[11px] text-slate-400">{eventPct}% used</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-600">Registrations</span>
            <span className="font-semibold text-slate-800">
              {plan.registrationsUsed.toLocaleString("en-IN")} / {plan.registrationLimit.toLocaleString("en-IN")}
            </span>
          </div>
          <ProgressBar
            value={regPct}
            label={`${plan.registrationsUsed} of ${plan.registrationLimit} registrations`}
            tone={regPct >= 100 ? "danger" : regPct >= 80 ? "warning" : "success"}
          />
          <p className="text-[11px] text-slate-400">{regPct}% used</p>
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h3 className="mb-3 text-[13px] font-semibold text-slate-700">Billing history</h3>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-2.5">Invoice</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Date</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 text-[13px] text-slate-700">{inv.desc}</td>
                  <td className="hidden px-4 py-3 text-[13px] text-slate-500 sm:table-cell">
                    {new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-slate-800">
                    {inv.amount}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Badge variant="success">{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ── Security tab ────────────────────────────────────────────────────────── */

const MOCK_SESSIONS = [
  {
    id: "ses_01",
    device: "Chrome on macOS",
    icon: Monitor,
    location: "Mumbai, IN",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "ses_02",
    device: "Safari on iPhone 15",
    icon: Smartphone,
    location: "Indore, IN",
    lastActive: "2h ago",
    current: false,
  },
  {
    id: "ses_03",
    device: "Edge on Windows 11",
    icon: Monitor,
    location: "Indore, IN",
    lastActive: "3 days ago",
    current: false,
  },
];

function SecurityTab() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [revokedSessions, setRevokedSessions] = useState<Set<string>>(new Set());

  function revokeSession(id: string) {
    setRevokedSessions((prev) => new Set([...prev, id]));
    toastSuccess("Session revoked");
  }

  return (
    <div className="space-y-6">
      {/* 2FA */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-orbit-500" />
            <div>
              <p className="font-medium text-slate-800">Two-factor authentication</p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Add an extra layer of security. Uses an authenticator app (TOTP).
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
            onClick={() => {
              setTwoFaEnabled((v) => !v);
              toastSuccess(twoFaEnabled ? "2FA disabled" : "2FA enabled (mock — no actual TOTP set up)");
            }}
            className="shrink-0"
          >
            {twoFaEnabled ? (
              <ToggleRight className="h-8 w-8 text-orbit-500" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-slate-300" />
            )}
          </button>
        </div>
      </Card>

      {/* Active sessions */}
      <div>
        <h3 className="mb-3 text-[13px] font-semibold text-slate-700">Active sessions</h3>
        <Card className="divide-y divide-slate-100">
          {MOCK_SESSIONS.filter((s) => !revokedSessions.has(s.id)).map((ses) => {
            const Icon = ses.icon;
            return (
              <div key={ses.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-slate-800">{ses.device}</p>
                  <p className="text-[11px] text-slate-400">
                    {ses.location} · {ses.lastActive}
                  </p>
                </div>
                {ses.current ? (
                  <Badge variant="success" dot>This device</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    icon={XCircle}
                    iconOnly
                    aria-label={`Revoke ${ses.device} session`}
                    onClick={() => revokeSession(ses.id)}
                  />
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

/* ── Data & Privacy tab ──────────────────────────────────────────────────── */

function PrivacyTab() {
  const [retention, setRetention] = useState("24");
  const [consentText, setConsentText] = useState(
    "By registering, you consent to the collection and use of your personal information for event management purposes. Your data will not be shared with third parties without your consent.",
  );
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleExport() {
    setExporting(true);
    toastInfo("Export started — you'll be notified when ready");
    await new Promise((r) => setTimeout(r, 2000));
    setExporting(false);
    toastSuccess("Export ready — check your email for the download link (mock)");
  }

  return (
    <div className="space-y-6">
      <FormSection icon={Clock} title="Data Retention" divider={false} columns={1}>
        <FormField
          label="Retain visitor data for"
          hint="After this period, personal data is anonymised. Aggregate statistics are kept permanently."
        >
          <SelectInput value={retention} onChange={(e) => setRetention(e.target.value)}>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months (recommended)</option>
            <option value="36">36 months</option>
          </SelectInput>
        </FormField>
      </FormSection>

      <FormSection icon={FileText} title="Registration Consent" columns={1}>
        <FormField
          label="Consent text shown to registrants"
          hint="Displayed on all registration forms. Keep it clear and plain-language."
        >
          <Textarea
            value={consentText}
            onChange={(e) => setConsentText(e.target.value)}
            rows={5}
          />
        </FormField>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Preview (as shown to visitors)
          </p>
          <p className="text-[12px] leading-relaxed text-slate-600">{consentText}</p>
        </div>
      </FormSection>

      <FormSection icon={Archive} title="Export All Data" columns={1}>
        <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
          <Download className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-slate-800">Request full data export</p>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Exports all visitor registrations, check-ins, and food redemptions as CSV. Sent to
              your registered email within 24h.
            </p>
            <Button
              variant="secondary"
              icon={Download}
              className="mt-3"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exporting…" : "Request export"}
            </Button>
          </div>
        </div>
      </FormSection>

      <FormActions>
        <Button
          variant="primary"
          onClick={() => {
            setSaved(true);
            toastSuccess("Privacy settings saved");
            setTimeout(() => setSaved(false), 3000);
          }}
        >
          {saved ? "Saved ✓" : "Save settings"}
        </Button>
      </FormActions>
    </div>
  );
}

/* ── Defaults tab ────────────────────────────────────────────────────────── */

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST — Asia/Kolkata (+05:30)" },
  { value: "Asia/Dubai", label: "GST — Asia/Dubai (+04:00)" },
  { value: "UTC", label: "UTC (+00:00)" },
];

const DEFAULT_CATEGORIES = `Trade Visitor (free)
Delegate (₹1,499)
VIP (complimentary)
Student (₹99)
Media (complimentary)`;

function DefaultsTab() {
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <FormSection icon={Globe} title="Timezone" divider={false} columns={1}>
        <FormField
          label="Default event timezone"
          hint="New events use this timezone by default. Each event can override it."
        >
          <SelectInput value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {TIMEZONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectInput>
        </FormField>
      </FormSection>

      <FormSection icon={Settings} title="Default Visitor Categories" columns={1}>
        <FormField
          label="Category template"
          hint="One category per line: Name (price). New events are pre-populated with these categories."
        >
          <Textarea
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            rows={7}
            placeholder="Trade Visitor (free)&#10;Delegate (₹1,499)"
          />
        </FormField>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Preview
          </p>
          <ul className="space-y-1">
            {categories
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orbit-400" />
                  {line}
                </li>
              ))}
          </ul>
        </div>
      </FormSection>

      <FormActions>
        <Button
          variant="primary"
          onClick={() => {
            setSaved(true);
            toastSuccess("Default settings saved");
            setTimeout(() => setSaved(false), 3000);
          }}
        >
          {saved ? "Saved ✓" : "Save defaults"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setTimezone("Asia/Kolkata");
            setCategories(DEFAULT_CATEGORIES);
            toastInfo("Reset to defaults");
          }}
        >
          Reset to defaults
        </Button>
      </FormActions>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function OrgSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const activeTab = (params.sub as string[] | undefined)?.[0] ?? "profile";

  const { data: org } = useQuery({
    queryKey: queryKeys.orgs.detail(ORG.id),
    queryFn: () => orgService.get(ORG.id),
  });

  function setTab(id: string) {
    router.push(id === "profile" ? "/org/settings" : `/org/settings/${id}`);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumbs={[{ label: "Organisation", href: "/org/dashboard" }, { label: "Settings" }]}
        subtitle="Manage your organisation profile, branding, and preferences"
      />

      <Card className="p-5 sm:p-6">
        <SettingsTabs tabs={TABS} value={activeTab} onChange={setTab}>
          {activeTab === "profile" && org && <ProfileTab org={org} />}
          {activeTab === "branding" && <BrandingTab />}
          {activeTab === "team" && <TeamTab />}
          {activeTab === "plan" && <PlanTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "privacy" && <PrivacyTab />}
          {activeTab === "defaults" && <DefaultsTab />}
        </SettingsTabs>
      </Card>
    </>
  );
}
