"use client";

/**
 * TrialLockScreen — P-13.
 * Full-content-area overlay when the trial has expired (trialDaysLeft ≤ 0).
 * Mounted inside the OrgShell content column, covering main only (not sidebar/header).
 * Header and sidebar remain interactive so the user can reach support/upgrade flows.
 */

import { Lock, MessageCircle } from "lucide-react";
import { usePlanStore } from "@/lib/plan";
import { Button } from "@/components/kit/Button";

const WHATSAPP_NUMBER = "919876543210";
const WHATSAPP_MSG = encodeURIComponent(
  "Hi, my Orbit Event ERP trial has expired. I'd like to upgrade to continue. Can you help?",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

export function TrialLockScreen() {
  const expired = usePlanStore((s) => s.trialDaysLeft <= 0);
  if (!expired) return null;

  return (
    /* Absolute overlay over the main content area */
    <div
      className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]"
      aria-modal="true"
      role="alertdialog"
      aria-label="Trial expired"
    >
      {/* Tinted backdrop */}
      <div className="absolute inset-0 bg-white/80" />

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card-hover text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Lock className="h-8 w-8 text-slate-500" />
        </span>

        <h2 className="font-display text-xl font-bold text-orbit-900">Trial period ended</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
          Your 14-day Launchpad Trial has expired. Your data is safe — upgrade to
          regain full access.
        </p>

        {/* Read-only notice */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left">
          <p className="text-[12px] font-semibold text-slate-600">Read-only mode</p>
          <p className="mt-0.5 text-[12px] text-slate-400">
            You can view existing data but cannot create, edit, or export anything until you upgrade.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-[14px] font-semibold text-white transition hover:bg-[#22c55e]"
          >
            <MessageCircle className="h-4 w-4" />
            Upgrade via WhatsApp
          </a>
          <Button
            variant="ghost"
            className="w-full justify-center text-[13px]"
            onClick={() => usePlanStore.setState({ trialDaysLeft: 14 })}
          >
            Continue in read-only mode
          </Button>
        </div>
      </div>
    </div>
  );
}
