"use client";

/**
 * TrialBanner — P-13.
 * Renders inside OrgShell below the sticky header when trialDaysLeft ≤ 13.
 * Zero visual impact when trial has ≥ 14 days remaining (renders null).
 */

import { MessageCircle, X, Zap } from "lucide-react";
import { usePlanStore, shouldShowTrialBanner } from "@/lib/plan";

const WHATSAPP_NUMBER = "919876543210"; // placeholder
const WHATSAPP_MSG = encodeURIComponent(
  "Hi, I'd like to upgrade my Orbit Event ERP plan from trial. Can you help?",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

export function TrialBanner() {
  const plan = usePlanStore();
  const show = shouldShowTrialBanner(plan);

  if (!show) return null;

  const urgent = plan.trialDaysLeft <= 3;
  const daysText = plan.trialDaysLeft === 1 ? "1 day" : `${plan.trialDaysLeft} days`;
  const usagePct = Math.round((plan.registrationsUsed / plan.registrationLimit) * 100);

  return (
    <div
      role="banner"
      className={`flex items-center gap-3 px-4 py-2.5 text-[13px] sm:px-6 ${
        urgent
          ? "border-b border-red-200 bg-red-50 text-red-800"
          : "border-b border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <Zap className={`h-4 w-4 shrink-0 ${urgent ? "text-red-500" : "text-amber-500"}`} />

      <span className="flex-1 leading-snug">
        <strong>{daysText} left</strong> on your Launchpad Trial
        {" · "}
        <span className="text-[12px] opacity-80">
          {plan.registrationsUsed}/{plan.registrationLimit} registrations used ({usagePct}%)
          {" · "}
          {plan.activeEventsUsed}/{plan.activeEventLimit} active event
        </span>
      </span>

      {/* WhatsApp upgrade CTA */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-[12px] font-semibold transition ${
          urgent
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Upgrade via WhatsApp
      </a>

      <button
        type="button"
        aria-label="Dismiss trial banner"
        onClick={() => usePlanStore.setState({ trialDaysLeft: 14 })}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
