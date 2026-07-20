"use client";

/**
 * PlanLimitModal — P-13.
 * Shown when a user attempts an action that exceeds their trial plan limit
 * (e.g. creating a 2nd active event). Use the usePlanLimit() hook to trigger it.
 */

import { MessageCircle, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/kit/Modal";
import { Button } from "@/components/kit/Button";
import { create } from "zustand";

/* ── Local store for modal open/close + context ───────────────────────────── */

interface PlanLimitState {
  open: boolean;
  limitType: "event" | "registration" | "generic";
  show: (limitType?: PlanLimitState["limitType"]) => void;
  hide: () => void;
}

export const usePlanLimitModal = create<PlanLimitState>((set) => ({
  open: false,
  limitType: "generic",
  show: (limitType = "generic") => set({ open: true, limitType }),
  hide: () => set({ open: false }),
}));

/* ── Copy map ─────────────────────────────────────────────────────────────── */

const COPY = {
  event: {
    title: "Active event limit reached",
    body: "Your Launchpad Trial allows 1 active event at a time. Upgrade to Nebula or Galaxy to run unlimited concurrent events.",
  },
  registration: {
    title: "Registration limit reached",
    body: "Your Launchpad Trial includes up to 100 registrations. Upgrade to continue accepting registrations for this event.",
  },
  generic: {
    title: "Plan limit reached",
    body: "You've reached a limit on your Launchpad Trial. Upgrade your plan to continue.",
  },
};

const WHATSAPP_NUMBER = "919876543210";
const WHATSAPP_MSG = encodeURIComponent(
  "Hi, I'd like to upgrade my Orbit Event ERP plan from trial. Can you help?",
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

/* ── Component ────────────────────────────────────────────────────────────── */

export function PlanLimitModal() {
  const { open, limitType, hide } = usePlanLimitModal();
  const copy = COPY[limitType];

  return (
    <Modal open={open} onClose={hide} title="">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
        </span>
        <h2 className="font-display text-[17px] font-semibold text-orbit-900">{copy.title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{copy.body}</p>

        {/* Plan comparison */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {[
            { name: "Nebula", events: "5 active events", regs: "5,000 regs/event", highlight: false },
            { name: "Galaxy", events: "Unlimited", regs: "Unlimited", highlight: true },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-3 ${
                plan.highlight ? "border-orbit-200 bg-orbit-50" : "border-slate-200"
              }`}
            >
              <p className={`text-[12px] font-semibold ${plan.highlight ? "text-orbit-600" : "text-slate-700"}`}>
                {plan.name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{plan.events}</p>
              <p className="text-[11px] text-slate-500">{plan.regs}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#22c55e]"
          >
            <MessageCircle className="h-4 w-4" />
            Upgrade via WhatsApp
          </a>
          <Button variant="ghost" className="w-full justify-center" onClick={hide}>
            Continue on trial
          </Button>
        </div>
      </div>
    </Modal>
  );
}
